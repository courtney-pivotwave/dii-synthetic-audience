import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results, message, campaignName, mode: rawMode } = body as {
      results: unknown[];
      message: string;
      campaignName?: string | null;
      mode?: string;
    };

    const mode = rawMode === 'direction' ? 'direction' : 'score';

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'No persona results to synthesize' }, { status: 400 });
    }

    if (mode === 'direction') {
      const personaDirections = (
        results as { name: string; role: string; direction?: string }[]
      ).map(
        (r) => `
PERSONA: ${r.name} (${r.role})
Advisory:
${typeof r.direction === 'string' ? r.direction : '(no response)'}
`
      );

      const synthesis = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are a senior B2B messaging strategist. Synthesize the three persona advisories below into a single strategic brief for the marketing team.

${campaignName ? `Campaign: ${campaignName}\n` : ''}Situation / brief:
"${message}"

PERSONA ADVISORIES:
${personaDirections.join('\n---\n')}

Respond in this exact JSON structure — nothing else:

{
  "dominant_messaging_angle": "<2-4 sentences: the dominant or converging messaging angle across the three personas — what theme or promise would land best if you had to pick one headline direction>",
  "key_proof_point": "<2-4 sentences: the one proof point, credential, or concrete evidence all three personas would need to see or hear before they would move forward — be specific>",
  "thing_to_avoid": "<2-4 sentences: the single most important message, tone, or claim to avoid — what would alienate or feel wrong to this buyer set>"
}

Rules:
- Ground every claim in what the personas actually said; do not invent market facts.
- Be directive and specific. No hedging ("might", "consider").
- Do not repeat the full persona text — synthesize patterns.`,
          },
        ],
      });

      const content = synthesis.content[0];
      if (content.type !== 'text') throw new Error('Unexpected response type');

      const cleaned = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as {
        dominant_messaging_angle?: string;
        key_proof_point?: string;
        thing_to_avoid?: string;
      };

      return NextResponse.json({
        mode: 'direction' as const,
        dominant_messaging_angle: parsed.dominant_messaging_angle ?? '',
        key_proof_point: parsed.key_proof_point ?? '',
        thing_to_avoid: parsed.thing_to_avoid ?? '',
      });
    }

    const personaSummaries = (
      results as {
        name: string;
        role: string;
        comprehension_score: number;
        comprehension_note: string;
        resonance_score: number;
        resonance_note: string;
        differentiation_score: number;
        differentiation_note: string;
        primary_objection: string;
        meeting_threshold: string;
        meeting_reason: string;
        improvement: string;
      }[]
    )
      .map(
        (r) => `
PERSONA: ${r.name} (${r.role})
Comprehension: ${r.comprehension_score}/5 — "${r.comprehension_note}"
Resonance: ${r.resonance_score}/5 — "${r.resonance_note}"
Differentiation: ${r.differentiation_score}/5 — "${r.differentiation_note}"
Primary Objection: "${r.primary_objection}"
Would take a meeting: ${r.meeting_threshold} — "${r.meeting_reason}"
What would make it stronger: "${r.improvement}"
`
      )
      .join('\n---\n');

    const synthesis = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a senior B2B copywriter turning message test results into a copy brief. Your output goes directly to the person rewriting the asset — not to a strategy committee. Be directive. Use the language of a copy editor, not a consultant.

${campaignName ? `Campaign: ${campaignName}` : ''}
Message tested: "${message}"

PERSONA RESULTS:
${personaSummaries}

Respond in this exact JSON structure — nothing else:

{
  "whats_landing": [
    "Keep [specific element] — [one sentence on why it works, citing persona evidence]"
  ],
  "whats_falling_flat": [
    "Fix [specific element] — [one sentence on why it fails, citing persona evidence]"
  ],
  "rewrite_brief": [
    {
      "priority": 1,
      "instruction": "A single directive sentence: what to cut, rewrite, add, or sharpen — specific enough to act on without further clarification",
      "example": "Optional: a concrete one-sentence rewrite demonstrating the change. Only include if the rewrite makes the instruction meaningfully clearer."
    }
  ]
}

Rules:
- whats_landing: 2-3 items. Only include elements with genuine signal — things that actually moved scores or prevented objections. Phrase as "Keep [X]" so the writer knows what not to touch.
- whats_falling_flat: 2-3 items. Be specific about what's not working and why. Phrase as "Fix [X]" so the writer has a clear target.
- rewrite_brief: Exactly 3 items, ranked by impact. Each instruction must be specific enough that a copywriter can execute it today without asking a follow-up question. No vague directives like "be more specific" — tell them what to be specific about.
- example field: Only add this when a rewrite example genuinely clarifies the instruction. Skip it when the instruction is already clear on its own.
- Do not hedge. Do not say "consider" or "might." Give directives.`,
        },
      ],
    });

    const content = synthesis.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const cleaned = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ mode: 'score' as const, ...parsed });
  } catch (err) {
    console.error('Synthesis error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Synthesis failed' },
      { status: 500 }
    );
  }
}
