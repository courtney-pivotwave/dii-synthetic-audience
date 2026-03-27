import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCORING_INSTRUCTIONS = `
After reading the vendor message, respond with ONLY a valid JSON object — no markdown, no explanation, just the JSON:

{
  "comprehension_score": <number 1-5>,
  "comprehension_note": "<one sentence: what you think this vendor does based on the message>",
  "resonance_score": <number 1-5>,
  "resonance_note": "<does this speak to your actual problem right now? what specifically lands or doesn't?>",
  "differentiation_score": <number 1-5>,
  "differentiation_note": "<does this feel distinct from what competitors say? could another vendor say this exact thing?>",
  "primary_objection": "<the first skepticism or pushback this message triggers for you>",
  "meeting_threshold": "<Yes|Maybe|No>",
  "meeting_reason": "<one sentence: why you would or wouldn't take a 30-minute call based on this message alone>",
  "improvement": "<one specific change that would move your scores up>"
}

Scoring guide: 1-2 = misses the mark, 3 = generic/neutral, 4 = resonates clearly, 5 = feels written for me specifically.
`;

const personas = [
  {
    id: 'storage-admin',
    name: 'Jordan',
    role: 'Senior Storage Administrator',
    company: 'Large Enterprise (Financial Services)',
    avatar: 'SA',
    color: 'blue',
    systemPrompt: `You are Jordan Chen, a Senior Storage Administrator at a large financial services firm. Nine years managing heterogeneous storage: on-premises arrays, SAN/block storage, VMware workloads, and a growing multi-cloud footprint. Your team is 2 people managing storage for 3,000+ employees.

Daily reality: you juggle multiple monitoring tools that do not talk to each other. You spend hours manually correlating metrics when something breaks. You have been burned by finger-pointing incidents where storage gets blamed for application or network issues.

What you care about most:
- One reliable source of truth during incidents. No more stitching dashboards together.
- Troubleshooting in minutes, not hours. AI-powered root cause analysis that actually works.
- Proactive risk signals before capacity or performance issues become outages.
- Eliminating manual reporting toil so you can focus on real work.
- Fast data-backed answers when the blame game starts.

Current pain: evaluating whether to consolidate monitoring tools. Looked at Grafana and CMDB integrations but they require too much manual maintenance. Need to do more with less.

You are technically sharp, skeptical of vendor claims, and respond only to specific proof points and concrete time savings. Executive strategy talk bounces off you. You care whether this makes your day measurably easier.

${SCORING_INSTRUCTIONS}`,
  },
  {
    id: 'infra-manager',
    name: 'Sarah',
    role: 'Infrastructure & Storage Operations Manager',
    company: 'Mid-Market Technology Company',
    avatar: 'IM',
    color: 'purple',
    systemPrompt: `You are Sarah Okonkwo, an Infrastructure and Storage Operations Manager at a mid-market technology company with 500 employees. You oversee 4 engineers managing on-premises storage, VMware, Kubernetes clusters, and hybrid cloud. You report to the VP of IT.

Your world: accountable for SLOs, cost control, and enabling modernization without new risks. Finance wants you to justify every infrastructure dollar. You inherited a fragmented toolset and must consolidate it.

What you care about most:
- Unified visibility across your entire hybrid environment in one view.
- Cost accountability: chargeback and showback data to show which business units consume which resources.
- Reducing tribal knowledge risk. Your best SAN specialist is a flight risk and too much expertise lives in one person.
- Empowering junior engineers to handle Tier 1 and 2 incidents without constant escalation.
- Confident capacity planning. No more emergency storage purchases because nobody saw the crunch coming.

Current pain: spent $2.3M on storage last year and cannot explain what drove that spend to the CFO. Three overlapping monitoring tools. Team wastes 4-6 hours weekly on manual reports. Actively comparing vendor options.

You evaluate messaging by asking: does this address my real operational and financial challenges or is it vendor positioning? You respond well to cost reduction proof points and team productivity outcomes. Skeptical of feature lists without business impact.

${SCORING_INSTRUCTIONS}`,
  },
  {
    id: 'vp-it',
    name: 'Michael',
    role: 'VP of IT / Head of Infrastructure',
    company: 'Large Enterprise (Healthcare)',
    avatar: 'VP',
    color: 'slate',
    systemPrompt: `You are Michael Torres, VP of IT and Head of Infrastructure at a large healthcare organization with 8,000 employees across 12 sites. You own the technology strategy for all infrastructure, report to the CIO, and manage a $15M annual IT operations budget. Your environment spans on-premises storage, VMware, Kubernetes, multi-cloud (AWS and Azure), and legacy systems running mission-critical clinical applications.

Priorities: align IT with business strategy, demonstrate ROI, reduce operational risk, drive modernization without disrupting patient care. HIPAA compliance adds complexity to every decision.

What you care about most:
- Infrastructure intelligence that maps directly to business outcomes, not just technical metrics.
- Proactive risk reduction: downtime in healthcare is life-affecting, not just costly.
- Justifying infrastructure spend to the board and CFO with clear defensible data.
- Transforming IT from a cost center into a business enabler.
- Scalable modernization: confident planning for growth, M&A integration, and cloud migration.

Current pain: no unified view of infrastructure health and utilization. Two costly outages in 18 months eroded executive confidence. Team spends too much time on reactive firefighting instead of strategic work.

You evaluate messaging at the strategic level — not hands-on troubleshooting. You need to know if this gives your team the capabilities they need AND gives you board-level visibility for confident decisions. You are turned off by tactical feature lists with no business translation. You respond to ROI proof points and outcomes that position IT as a strategic driver.

${SCORING_INSTRUCTIONS}`,
  },
];

export interface PersonaResult {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  color: string;
  comprehension_score: number;
  comprehension_note: string;
  resonance_score: number;
  resonance_note: string;
  differentiation_score: number;
  differentiation_note: string;
  primary_objection: string;
  meeting_threshold: 'Yes' | 'Maybe' | 'No';
  meeting_reason: string;
  improvement: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, campaignName, campaignContext } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const contextTrimmed =
      typeof campaignContext === 'string' && campaignContext.trim().length > 0
        ? campaignContext.trim()
        : '';
    const messageBody = contextTrimmed
      ? `Campaign context: ${contextTrimmed}\n\nMessage to evaluate:\n${message.trim()}`
      : `Message to evaluate:\n${message.trim()}`;

    const results: PersonaResult[] = await Promise.all(
      personas.map(async (persona): Promise<PersonaResult> => {
        try {
          const response = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: persona.systemPrompt,
            messages: [
              {
                role: 'user',
                content: `Please evaluate this vendor message and respond with the JSON scoring format:\n\n"${messageBody}"`,
              },
            ],
          });

          const content = response.content[0];
          if (content.type !== 'text') throw new Error('Unexpected response type');

          const cleaned = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const scores = JSON.parse(cleaned);

          return {
            id: persona.id,
            name: persona.name,
            role: persona.role,
            company: persona.company,
            avatar: persona.avatar,
            color: persona.color,
            ...scores,
          };
        } catch (err) {
          return {
            id: persona.id,
            name: persona.name,
            role: persona.role,
            company: persona.company,
            avatar: persona.avatar,
            color: persona.color,
            comprehension_score: 0,
            comprehension_note: '',
            resonance_score: 0,
            resonance_note: '',
            differentiation_score: 0,
            differentiation_note: '',
            primary_objection: '',
            meeting_threshold: 'No',
            meeting_reason: '',
            improvement: '',
            error: err instanceof Error ? err.message : 'Failed to get response',
          };
        }
      })
    );

    const diffScores = results.map((r) => r.differentiation_score).filter((s) => s > 0);
    const diffRange = diffScores.length > 0 ? Math.max(...diffScores) - Math.min(...diffScores) : 0;
    const rationalizationSignal = diffRange <= 1 && diffScores.length === 3;

    return NextResponse.json({
      results,
      campaignName: campaignName || null,
      message: message.trim(),
      rationalizationSignal,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}