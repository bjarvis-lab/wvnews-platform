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
import { getRecentStoriesForContext } from '@/lib/stories-db';

// Sonnet for full-draft writing (needs better quality + longer context).
// Haiku is fine for SEO side-tasks and topic brainstorming.
const DRAFT_MODEL = 'claude-sonnet-4-6';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // generateFullStory on Sonnet can take 15–30s

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

async function callClaude({ system, user, json = false, maxTokens = 800, model = DEFAULT_MODEL }) {
  const client = getClient();
  const res = await client.messages.create({
    model,
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

// ---------- Story idea actions ----------

// suggestTopics — scans recent coverage and proposes local follow-up angles.
// No story context needed from the caller; we read recent published stories
// from Firestore directly.
async function suggestTopics() {
  let context = [];
  try {
    context = await getRecentStoriesForContext({ limit: 25 });
  } catch {
    context = [];
  }
  const coverage = context.length
    ? context.map(s => `- ${s.headline}${s.deck ? ` (${s.deck})` : ''}`).join('\n')
    : '(no recent stories available — suggest timely West Virginia angles)';

  const { data } = await callClaude({
    system: `You are a newsroom story-ideas editor at a West Virginia newspaper group (WV News). You know Appalachian civic life: county commissions, school boards, WVU, energy and coal regulation, infrastructure, courts, high-school sports, community events, small-business openings, state politics. Return strict JSON. Each idea must be specific (include a named county, city, agency, or event), actionable (a reporter can pursue it today), and distinct from the recent coverage listed.`,
    user: `Here's what WV News has covered recently:\n\n${coverage}\n\nPropose 8 fresh local story ideas we should pursue. Return JSON in this exact shape:\n{"ideas": [{"angle": "short headline-style pitch", "why": "one-sentence rationale", "beat": "news|sports|business|politics|community|education|crime|lifestyle"}]}`,
    json: true,
    maxTokens: 900,
  });
  return { ideas: data?.ideas || [] };
}

// generateFullStory — accepts a reporter's brief plus optional structured
// facts (word target, quotes to include, sources, must-mention items, tone)
// and returns a complete draft. Uses Sonnet for quality.
//
// The prompt explicitly targets a word count and forbids one-paragraph
// cop-outs, while still refusing to invent facts. When the reporter hands
// in rich structured inputs (quotes, numbers, named sources), Claude has
// more material to work with and the draft reflects that.
async function generateFullStory({
  brief,
  section,
  wordLimit,
  quotes = [],
  sources = [],
  mustInclude = [],
  tone = 'hard news',
}) {
  const target = Number.isFinite(wordLimit) && wordLimit > 50 ? Math.min(wordLimit, 1500) : 600;
  const lower = Math.max(target - 100, 200);
  const upper = target + 100;

  // Build a structured input block. Empty sections are omitted so the prompt
  // stays focused.
  const parts = [];
  parts.push(`BRIEF:\n${brief}`);
  if (quotes.length) {
    parts.push(`DIRECT QUOTES TO USE (use each verbatim inside quotation marks, attribute to the given speaker):\n${quotes.map(q => typeof q === 'string' ? `- ${q}` : `- "${q.quote}" — ${q.speaker || 'speaker unspecified'}`).join('\n')}`);
  }
  if (sources.length) {
    parts.push(`NAMED SOURCES TO CITE:\n${sources.map(s => `- ${s}`).join('\n')}`);
  }
  if (mustInclude.length) {
    parts.push(`FACTS THAT MUST APPEAR:\n${mustInclude.map(s => `- ${s}`).join('\n')}`);
  }
  if (section) parts.push(`PRIMARY SECTION: ${section}`);
  parts.push(`TONE: ${tone}`);
  parts.push(`LENGTH TARGET: approximately ${target} words (acceptable range: ${lower}–${upper}). Do NOT return a single paragraph or bullet outline. Write complete paragraphs and cover the story fully.`);

  const { data } = await callClaude({
    model: DRAFT_MODEL,
    system: `You are a seasoned newspaper reporter writing for WV News (West Virginia). AP style: clear, specific, active voice, attribution, third-person. The lede answers what/where/when/who up top. Paragraphs are short (1–3 sentences each). Use proper HTML tags in the body field (<p>, <h2>, <blockquote>, <ul>, <li>) — no markdown.

FACT DISCIPLINE (hard rules):
- Never invent direct quotes, specific numbers, dates, or named sources the brief doesn't supply.
- If a fact is missing, hedge naturally ("according to officials", "a spokesperson said") rather than fabricating a name.
- If the brief gives you a quote or stat, use it verbatim.

LENGTH DISCIPLINE (also hard):
- Hit the length target. Don't return one-sentence summaries or outlines.
- If the brief is thin, write what can be factually written and then add contextual paragraphs (background, significance, what's next) WITHOUT inventing facts.
- Never stop after one paragraph unless explicitly asked to.

Return strict JSON.`,
    user: `Write a full news article draft. Follow the length target precisely.\n\n${parts.join('\n\n')}\n\nReturn JSON in this exact shape. The body must be complete multi-paragraph HTML:\n{\n  "headline": "concrete, specific, under 80 chars",\n  "seoHeadline": "SEO-friendly version of headline",\n  "deck": "one-sentence subheadline, 20-30 words",\n  "body": "<p>First paragraph (the lede).</p><p>Second paragraph (context / nut graf).</p><p>Additional paragraphs continuing the story. Multiple paragraphs. Quotes if provided.</p><p>Closing with what's next or where to learn more.</p>",\n  "wordCount": number_of_words_in_body,\n  "tags": ["tag1", "tag2", ...],\n  "section": "news|sports|business|politics|community|education|crime|lifestyle",\n  "aiDisclaimer": "one-line note for the reporter — flag any facts that may need verification"\n}`,
    json: true,
    maxTokens: 4000,
  });
  if (!data) return { error: 'Draft generation returned no valid JSON' };
  return {
    headline: data.headline || '',
    seoHeadline: data.seoHeadline || '',
    deck: data.deck || '',
    body: data.body || '',
    wordCount: data.wordCount || 0,
    tags: data.tags || [],
    section: data.section || 'news',
    aiDisclaimer: data.aiDisclaimer || 'AI-drafted — verify facts, quotes, and numbers before publishing.',
  };
}

// ---------- Version-specific rewriters ----------

// optimizeSeo — rewrite the web body for SEO + AI-search without touching
// facts. Hard constraint: don't change anything inside quotation marks, any
// number, any date, any proper noun. Claude restructures + tightens around
// those preserved anchors.
async function optimizeSeo(story) {
  const body = htmlToPlainText(story.body || '').slice(0, MAX_BODY_CHARS);
  if (!body) return { optimizedBody: '' };

  const { text } = await callClaude({
    model: DRAFT_MODEL, // Sonnet for faithful rewrites
    system: `You are an SEO + AI-search (AISEO) editor for a West Virginia news site. You rewrite news-article body text for better search visibility (Google + Perplexity + ChatGPT + Google AI Overviews) without altering facts.

HARD RULES — do not break:
- Do NOT change anything inside quotation marks. Quotes are sacred.
- Do NOT change any number, percentage, dollar amount, or date.
- Do NOT change any proper noun (people, places, agencies, companies).
- Do NOT add facts, quotes, sources, or stats not in the original.
- Do NOT remove facts from the original.

WHAT YOU CAN IMPROVE:
- Lede clarity: answer who/what/where/when up top.
- Short paragraphs (1–3 sentences) with <p> tags.
- Use <h2> for major section breaks (2–4 max).
- Tighten transition sentences and filler.
- Replace vague phrases with specific ones (keeping proper nouns intact).
- Natural topic-keyword placement, no keyword stuffing.
- Entity-rich first paragraph (full names, org, location).

OUTPUT: return the rewritten body as clean HTML. Use only <p>, <h2>, <h3>, <blockquote>, <ul>, <li>, <a>. No markdown. No preamble. No explanation. Just the HTML.`,
    user: `Rewrite the following article body for SEO and AI search, preserving every quote, number, date, and proper noun.\n\nHeadline (for context, do not include in output): ${story.headline || '(none)'}\n\nORIGINAL BODY:\n${body}`,
    maxTokens: 2500,
  });
  return { optimizedBody: text };
}

// expandForPrint — take the web version (often a running-update ledger-style
// story) and produce a longer, polished, print-ready version. Unlike the SEO
// rewriter, this one CAN add connective tissue, context, and narrative
// structure — but still cannot invent quotes/sources/numbers.
async function expandForPrint(story) {
  const body = htmlToPlainText(story.body || '').slice(0, MAX_BODY_CHARS);
  if (!body) return { printBody: '' };

  const { text } = await callClaude({
    model: DRAFT_MODEL,
    system: `You are a newspaper editor converting a running web article into a polished print-ready version for next-day publication.

WHAT YOU CAN DO:
- Expand transitions and narrative flow.
- Add context paragraphs that tie facts together.
- Reorder sections for print coherence (print readers see the whole story at once, not in real-time updates).
- Remove live-update timestamps (e.g. "11:45 AM UPDATE:") and consolidate facts into a unified timeline.
- Write a stronger opening paragraph for print (print readers are often casual).
- Suggest a 2–3 sentence "nut graf" after the lede explaining why this matters.

HARD RULES:
- Do NOT change any direct quote, number, date, or proper noun from the original.
- Do NOT invent new quotes, sources, or facts.
- Do NOT shorten if the web version is already terse.

OUTPUT: return the print body as clean HTML. Use only <p>, <h2>, <h3>, <blockquote>, <ul>, <li>. No markdown, preamble, or explanation.`,
    user: `Convert this web-updated article into a polished print version. Preserve every fact, quote, number, date, and proper noun.\n\nHeadline: ${story.headline || '(none)'}\n\nWEB VERSION:\n${body}`,
    maxTokens: 3000,
  });
  return { printBody: text };
}

// ---------- Dispatcher ----------

const HANDLERS = {
  summary, headlines, meta, tags, alt, social, links,
  suggestTopics, generateFullStory,
  optimizeSeo, expandForPrint,
};

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { action, story, brief, section, wordLimit, quotes, sources, mustInclude, tone } = body;

    const handler = HANDLERS[action];
    if (!handler) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Per-action arg shape. Story-based actions need { headline | body };
    // idea-generation actions take different payloads.
    let result;
    if (action === 'suggestTopics') {
      result = await handler();
    } else if (action === 'generateFullStory') {
      if (!brief || brief.trim().length < 10) {
        return NextResponse.json({ error: 'Brief is too short — describe your story in a sentence or more' }, { status: 400 });
      }
      result = await handler({ brief, section, wordLimit, quotes, sources, mustInclude, tone });
    } else {
      if (!story || (!story.headline && !story.body)) {
        return NextResponse.json({ error: 'Story needs at least a headline or body' }, { status: 400 });
      }
      result = await handler(story);
    }
    return NextResponse.json({ ok: true, action, ...result });
  } catch (err) {
    console.error('/api/ai error:', err);
    return NextResponse.json(
      { error: err.message || 'AI request failed' },
      { status: err.status || 500 }
    );
  }
}
