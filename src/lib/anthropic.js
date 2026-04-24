// Shared Anthropic client. Singleton so we don't spin up a new TLS pool on
// every API call. Reads ANTHROPIC_API_KEY from env (set in Vercel + .env.local).

import Anthropic from '@anthropic-ai/sdk';

let _client = null;

export function getClient() {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

// Default model for SEO tasks — cheap, fast, good writing quality.
// Upgrade to claude-sonnet-4-6 for nuanced work (headline variants, voice matching).
export const DEFAULT_MODEL = 'claude-haiku-4-5';

// Converts editor HTML body to plain text for prompt context. Keeps paragraph
// breaks but strips tags so token count stays sane.
export function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
