// API Route: /api/ai
// Handles AI content generation requests
//
// Supports: OpenAI (GPT-4), Anthropic (Claude), or Google Vertex AI
//
// Set one of these environment variables:
// - OPENAI_API_KEY for OpenAI
// - ANTHROPIC_API_KEY for Anthropic Claude
// - GOOGLE_VERTEX_PROJECT_ID for Google Vertex AI
//
// All AI features route through this endpoint:
// - Content rewriting (without plagiarism)
// - Headline generation
// - Meta description generation
// - Auto-tagging
// - Social post generation
// - Newsletter summaries
// - SEO optimization
// - Image alt-text generation

import { NextResponse } from 'next/server';

const SYSTEM_PROMPTS = {
  rewrite: `You are a professional news editor. Rewrite the following article in a completely fresh voice. 
Preserve ALL facts, names, numbers, quotes, and dates exactly. Change ALL sentence structures and word choices. 
The output must be original prose that cannot be matched to any existing source. 
Do not copy any phrases of 5+ words from the original. Write in AP style.`,

  headline: `You are an SEO-savvy news editor. Generate 7 headline variants for this article.
Each headline should be:
- Under 70 characters for SEO
- Include the primary keyword naturally
- Use active voice
- Be clear and specific (no clickbait)
Number each headline 1-7. Vary between straight news, question, and impact-focused styles.`,

  social: `You are a social media editor for a news organization. Create platform-specific posts for this article.
Write separate posts for:
- Facebook (2-3 sentences, conversational, include a question to drive engagement)
- X/Twitter (under 280 characters, punchy, include key stat)
- Instagram (caption with emoji, call-to-action for comments)
- TikTok (short caption, relevant hashtags)
Label each platform clearly.`,

  newsletter: `You are a newsletter editor. Write a 2-3 sentence summary of this article suitable for a morning news digest email.
Be concise but informative. Include the most important fact. Write in a slightly warmer tone than hard news.`,

  seo: `You are an SEO specialist for a news website. Rewrite this article to naturally incorporate the target keyword.
Rules:
- Include the keyword in the first paragraph
- Use the keyword 3-5 times total (never forced)
- Use related terms and synonyms throughout
- Keep the article natural and readable
- Do not stuff keywords`,

  simplify: `You are an editor who specializes in clear, accessible writing. Rewrite this article at a 6th-8th grade reading level.
- Use shorter sentences (under 20 words each)
- Replace complex vocabulary with simpler alternatives
- Break up long paragraphs
- Keep all facts and quotes intact
- Maintain a professional news tone`,
};

export async function POST(request) {
  const { mode, content, targetKeyword, tone } = await request.json();

  if (!content) {
    return NextResponse.json({ error: 'No content provided' }, { status: 400 });
  }

  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.rewrite;

  // ─── OpenAI Implementation ───
  // if (process.env.OPENAI_API_KEY) {
  //   const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //     method: 'POST',
  //     headers: {
  //       'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       model: 'gpt-4o',
  //       messages: [
  //         { role: 'system', content: systemPrompt },
  //         { role: 'user', content: `${targetKeyword ? `Target keyword: "${targetKeyword}"\n\n` : ''}Article:\n${content}` },
  //       ],
  //       temperature: 0.7,
  //       max_tokens: 2000,
  //     }),
  //   });
  //   const data = await response.json();
  //   return NextResponse.json({
  //     output: data.choices[0].message.content,
  //     model: 'gpt-4o',
  //     tokens: data.usage.total_tokens,
  //   });
  // }

  // ─── Anthropic Implementation ───
  // if (process.env.ANTHROPIC_API_KEY) {
  //   const response = await fetch('https://api.anthropic.com/v1/messages', {
  //     method: 'POST',
  //     headers: {
  //       'x-api-key': process.env.ANTHROPIC_API_KEY,
  //       'Content-Type': 'application/json',
  //       'anthropic-version': '2023-06-01',
  //     },
  //     body: JSON.stringify({
  //       model: 'claude-sonnet-4-20250514',
  //       max_tokens: 2000,
  //       system: systemPrompt,
  //       messages: [{ role: 'user', content: content }],
  //     }),
  //   });
  //   const data = await response.json();
  //   return NextResponse.json({
  //     output: data.content[0].text,
  //     model: 'claude-sonnet',
  //   });
  // }

  // Mock response for demo
  return NextResponse.json({
    status: 'demo_mode',
    message: 'Set OPENAI_API_KEY or ANTHROPIC_API_KEY in Vercel env vars to enable real AI rewriting.',
    output: 'This is a placeholder. Connect an AI provider to see real rewritten content.',
    model: 'none',
  });
}
