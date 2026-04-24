// GET /api/health/anthropic — verifies the Claude API key is present,
// well-formed, and actually works. Issues a tiny test call to claude-haiku-4-5
// (roughly $0.00002 per check — essentially free).
// Never returns the key — only a fingerprint (first 12 chars + length).

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  const result = {
    envSeen: !!key,
    keyLength: key?.length || 0,
    keyPrefix: key ? `${key.slice(0, 12)}…` : null,
    looksValid: !!key && key.startsWith('sk-ant-'),
  };

  if (!key) {
    return NextResponse.json({ ...result, error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "pong" and nothing else.' }],
    });
    const text = res.content?.[0]?.text || '';
    return NextResponse.json({
      ...result,
      ok: true,
      model: res.model,
      reply: text.trim(),
      usage: res.usage,
    });
  } catch (err) {
    return NextResponse.json({
      ...result,
      ok: false,
      error: err.message || 'Anthropic call failed',
      status: err.status,
    }, { status: 500 });
  }
}
