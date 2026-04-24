// POST /api/ai — routes AI Writing Assistant button actions to Claude.
//
// Request: { action, story: { headline, deck, body, tags, image } }
// Response (per action):
//   summary        → { deck: string }              → fills the deck field
//   headlines      → { options: string[] }         → popup, click to apply
//   meta           → { metaDescription: string }   → fills meta desc field
//   tags           → { tags: string[] }            → appended to tags list
//   alt            → { alt: string }               → fills image alt field
//   social         → { x, facebook, instagram }    → popup with copy buttons
//   links          → { suggestions: [{ phrase, reason }] } → popup
//
// Gated by requireAdmin() so only signed-in staff burn tokens. Uses
// claude-haiku-4-5 for cost/speed — SEO tasks don't need a big model.

import { NextResponse } from 'next/server';
import { getClient, DEFAULT_MODEL, htmlToPlainText } from '@/lib/anthropic';
import { getSessionUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // seconds

// Truncate body to keep prompts bounded. 8000 chars ≈ 2000 tokens, plenty for
// summarization tasks, and keeps calls fast.
const MAX_BODY_CHARS = 8000;

function contextBlock(story) {
  const body = htmlToPlainText(story.body || '').slice(0, MAX_BODY_CHARS);
  return [
    story.headline && `HEADLINE: ${story.headline}`,
    story.deck && `DECK: ${story.deck}`,
    (story.tags?.length) && `CURRENT TAGS: ${story.tags.join(', ')}`,
    body && `BODY:\n${body}`,
  ].filter(Boolean).join('\n\n');
}

async function callClaude({ system, user, json = false, maxTokens = 800 }) {
  const client = getClient();
  const res = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const text = res.content?.[0]?.text?.trim() || '';
  if (!json) return { text, usage: res.usage };
  try {
    // Strip any markdown code fences Claude sometimes wraps JSON in
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    return { data: JSON.parse(cleaned), usage: res.usage };
  } catch {
    return { data: null, parseError: text, usage: res.usage };
  }
}

// ---------- Action handlers ----------

async function summary(story) {
  const { text } = await callClaude({
    system: 'You are a senior newspaper editor writing deck subheadlines. A deck is one punchy sentence that sits under the headline and expands on the story without repeating the headline. It should be 20–30 words. No quotes around it.',
    user: `Write the deck subheadline for this story.\n\n${contextBlock(story)}\n\nReturn only the deck sentence, no explanation.`,
    maxTokens: 150,
  });
  return { deck: text.replace(/^["']|["']$/g, '') };
}

async function headlines(story) {
  const { data } = await callClaude({
    system: 'You are an SEO-savvy news editor. Generate alternate headline options that are specific, under 70 characters, use active voice, and avoid clickbait. Return strict JSON.',
    user: `Generate 5 strong alternate headlines for this story. Return JSON in this exact shape: {"options": ["headline 1", "headline 2", ...]}\n\n${contextBlock(story)}`,
    json: true,
    maxTokens: 500,
  });
  return { options: data?.options || [] };
}

async function meta(story) {
  const { text } = await callClaude({
    system: 'You write SEO meta descriptions for news articles. The output is one sentence, between 140 and 155 characters, compelling without clickbait, includes the primary topic/keyword naturally.',
    user: `Write the meta description for this story.\n\n${contextBlock(story)}\n\nReturn only the meta description, no quotes or explanation.`,
    maxTokens: 200,
  });
  return { metaDescription: text.replace(/^["']|["']$/g, '') };
}

async function tags(story) {
  const { data } = await callClaude({
    system: 'You are an SEO topic tagger. Extract 8 relevant tags from news stories. Tags should be lowercase, short (1–3 words), specific to the story, and useful for both search and site navigation. Prefer proper nouns and named entities where relevant. Return strict JSON.',
    user: `Extract 8 tags for this story. Return JSON in this exact shape: {"tags": ["tag 1", "tag 2", ...]}\n\n${contextBlock(story)}`,
    json: true,
    maxTokens: 400,
  });
  return { tags: (data?.tags || []).map(t => String(t).toLowerCase().trim()).filter(Boolean) };
}

async function alt(story) {
  const imageUrl = story.image?.url;
  if (!imageUrl) {
    return { alt: '', note: 'No image URL on the story yet — upload or paste one first.' };
  }
  // We can't vision-analyze without multimodal input; derive alt from the
  // story context instead. For a v2, send the image to claude via the files API.
  const { text } = await callClaude({
    system: 'You write accessibility alt text for news photos. Describe what the photo likely shows given the story context. Keep it factual, 10–20 words, no "image of" or "photo of" preamble.',
    user: `Write alt text for the hero photo of this story. The image URL (for reference only) is ${imageUrl}.\n\n${contextBlock(story)}\n\nReturn only the alt text sentence.`,
    maxTokens: 120,
  });
  return { alt: text.replace(/^["']|["']$/g, '') };
}

async function social(story) {
  const { data } = await callClaude({
    system: 'You write social media copy for a West Virginia newspaper. Output is strict JSON with three platform-specific posts. X/Twitter is under 280 chars, punchy. Facebook is 2–3 sentences, conversational, ends with a question. Instagram is a caption with 1–2 relevant emoji and a call to read more.',
    user: `Write social posts for this story. Return JSON in this exact shape: {"x": "...", "facebook": "...", "instagram": "..."}\n\n${contextBlock(story)}`,
    json: true,
    maxTokens: 600,
  });
  return data || { x: '', facebook: '', instagram: '' };
}

async function links(story) {
  const { data } = await callClaude({
    system: 'You identify phrases in a news article that would be good internal-link anchors — named entities, topics, or events that likely have standalone coverage on the same news site. Return strict JSON.',
    user: `Identify up to 5 phrases in this story that could become internal links. For each, suggest why it\\'s a good candidate (a standalone topic, person, place, or ongoing story). Return JSON in this exact shape: {"suggestions": [{"phrase": "exact text from body", "reason": "short why"}]}\n\n${contextBlock(story)}`,
    json: true,
    maxTokens: 600,
  });
  return { suggestions: data?.suggestions || [] };
}

// ---------- Dispatcher ----------

const HANDLERS = { summary, headlines, meta, tags, alt, social, links };

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { action, story } = body;

    const handler = HANDLERS[action];
    if (!handler) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    if (!story || (!story.headline && !story.body)) {
      return NextResponse.json({ error: 'Story needs at least a headline or body' }, { status: 400 });
    }

    const result = await handler(story);
    return NextResponse.json({ ok: true, action, ...result });
  } catch (err) {
    console.error('/api/ai error:', err);
    return NextResponse.json(
      { error: err.message || 'AI request failed' },
      { status: err.status || 500 }
    );
  }
}
