'use client';

import { useState, useRef } from 'react';

type SourceType = 'text' | 'url' | 'pdf' | 'image';
type AppMode = 'score' | 'direction';

interface PersonaDirectionResult {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  direction?: string;
  error?: string;
}

interface PersonaScoreResult {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
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

type PersonaResult = PersonaScoreResult | PersonaDirectionResult;

interface TestResult {
  mode?: AppMode;
  results: PersonaResult[];
  campaignName: string | null;
  message: string;
  rationalizationSignal: boolean;
  timestamp: string;
}

interface RewriteItem {
  priority: number;
  instruction: string;
  example?: string;
}

interface SynthesisScoreResult {
  mode: 'score';
  whats_landing: string[];
  whats_falling_flat: string[];
  rewrite_brief: RewriteItem[];
}

interface SynthesisDirectionResult {
  mode: 'direction';
  dominant_messaging_angle: string;
  key_proof_point: string;
  thing_to_avoid: string;
}

type SynthesisResult = SynthesisScoreResult | SynthesisDirectionResult;

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 4
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : score === 3
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : score > 0
      ? 'bg-red-500/15 text-red-400 border-red-500/30'
      : 'bg-gray-800 text-gray-500 border-gray-700';

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${color}`}>
      <span className="font-medium">{label}</span>
      <span className="text-base font-bold tabular-nums">{score > 0 ? `${score}/5` : '—'}</span>
    </div>
  );
}

function MeetingBadge({ threshold }: { threshold: 'Yes' | 'Maybe' | 'No' }) {
  const styles = {
    Yes: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    Maybe: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    No: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };
  const icons = { Yes: '✓', Maybe: '~', No: '✕' };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[threshold]}`}>
      {icons[threshold]} {threshold}
    </span>
  );
}

function PersonaDirectionCard({ result }: { result: PersonaDirectionResult }) {
  const avatarColors: Record<string, string> = {
    SA: 'bg-blue-500',
    IM: 'bg-violet-500',
    VP: 'bg-slate-500',
  };
  const avatarColor = avatarColors[result.avatar] || 'bg-gray-600';

  if (result.error) {
    return (
      <div className="bg-gray-900 rounded-xl border border-red-500/30 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {result.avatar}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{result.name}</div>
            <div className="text-xs text-gray-400">{result.role}</div>
          </div>
        </div>
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">Error: {result.error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {result.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white text-sm">{result.name}</div>
          <div className="text-xs text-gray-400">{result.role}</div>
        </div>
      </div>
      {result.direction && (
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap border-t border-gray-800 pt-4">
          {result.direction}
        </div>
      )}
    </div>
  );
}

function PersonaCard({ result }: { result: PersonaScoreResult }) {
  const avatarColors: Record<string, string> = {
    SA: 'bg-blue-500',
    IM: 'bg-violet-500',
    VP: 'bg-slate-500',
  };
  const avatarColor = avatarColors[result.avatar] || 'bg-gray-600';

  if (result.error) {
    return (
      <div className="bg-gray-900 rounded-xl border border-red-500/30 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {result.avatar}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{result.name}</div>
            <div className="text-xs text-gray-400">{result.role}</div>
          </div>
        </div>
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">Error: {result.error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {result.avatar}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{result.name}</div>
            <div className="text-xs text-gray-400">{result.role}</div>
            <div className="text-xs text-gray-600">{result.company}</div>
          </div>
        </div>
        <MeetingBadge threshold={result.meeting_threshold} />
      </div>

      <div className="flex flex-col gap-1.5">
        <ScoreBadge score={result.comprehension_score} label="Comprehension" />
        <ScoreBadge score={result.resonance_score} label="Resonance" />
        <ScoreBadge score={result.differentiation_score} label="Differentiation" />
      </div>

      <div className="flex flex-col gap-3 text-sm">
        {result.comprehension_note && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">What they heard</div>
            <p className="text-gray-300 leading-relaxed text-xs">"{result.comprehension_note}"</p>
          </div>
        )}
        {result.resonance_note && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Resonance</div>
            <p className="text-gray-300 leading-relaxed text-xs">"{result.resonance_note}"</p>
          </div>
        )}
        {result.differentiation_note && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Differentiation</div>
            <p className="text-gray-300 leading-relaxed text-xs">"{result.differentiation_note}"</p>
          </div>
        )}
      </div>

      {result.primary_objection && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">Primary Objection</div>
          <p className="text-xs text-orange-200">"{result.primary_objection}"</p>
        </div>
      )}

      {result.meeting_reason && (
        <p className="text-xs text-gray-500 italic">"{result.meeting_reason}"</p>
      )}

      {result.improvement && (
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3">
          <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">What would make it stronger</div>
          <p className="text-xs text-teal-200">{result.improvement}</p>
        </div>
      )}
    </div>
  );
}

function LoadingCard({ name, role, avatar }: { name: string; role: string; avatar: string }) {
  const avatarColors: Record<string, string> = {
    SA: 'bg-blue-500',
    IM: 'bg-violet-500',
    VP: 'bg-slate-500',
  };
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full ${avatarColors[avatar] || 'bg-gray-600'} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {avatar}
        </div>
        <div>
          <div className="font-semibold text-white text-sm">{name}</div>
          <div className="text-xs text-gray-400">{role}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {['Comprehension', 'Resonance', 'Differentiation'].map((label) => (
          <div key={label} className="h-9 bg-gray-800 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-2.5 bg-gray-800 rounded w-3/4" />
        <div className="h-2.5 bg-gray-800 rounded w-full" />
        <div className="h-2.5 bg-gray-800 rounded w-5/6" />
      </div>
      <div className="h-14 bg-orange-500/5 border border-orange-500/10 rounded-lg" />
    </div>
  );
}

function DirectionLoadingCard({ name, role, avatar }: { name: string; role: string; avatar: string }) {
  const avatarColors: Record<string, string> = {
    SA: 'bg-blue-500',
    IM: 'bg-violet-500',
    VP: 'bg-slate-500',
  };
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full ${avatarColors[avatar] || 'bg-gray-600'} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {avatar}
        </div>
        <div>
          <div className="font-semibold text-white text-sm">{name}</div>
          <div className="text-xs text-gray-400">{role}</div>
        </div>
      </div>
      <div className="space-y-2 pt-2 border-t border-gray-800">
        <div className="h-2.5 bg-gray-800 rounded w-full" />
        <div className="h-2.5 bg-gray-800 rounded w-5/6" />
        <div className="h-2.5 bg-gray-800 rounded w-4/5" />
        <div className="h-2.5 bg-gray-800 rounded w-full" />
        <div className="h-2.5 bg-gray-800 rounded w-3/4" />
      </div>
    </div>
  );
}

const PLACEHOLDER_PERSONAS = [
  { name: 'Jordan', role: 'Senior Storage Administrator', avatar: 'SA' },
  { name: 'Sarah', role: 'Infrastructure & Storage Operations Manager', avatar: 'IM' },
  { name: 'Michael', role: 'VP of IT / Head of Infrastructure', avatar: 'VP' },
];

function StatCard({ label, value }: { label: string; value: string }) {
  const numVal = parseFloat(value);
  const color = isNaN(numVal)
    ? 'text-gray-400'
    : numVal >= 4
    ? 'text-emerald-400'
    : numVal >= 3
    ? 'text-amber-400'
    : 'text-red-400';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 flex flex-col gap-0.5">
      <div className="text-xs text-gray-500 whitespace-nowrap">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

export default function Home() {
  const [appMode, setAppMode] = useState<AppMode>('score');
  const [sourceType, setSourceType] = useState<SourceType>('text');
  const [campaignName, setCampaignName] = useState('');
  const [campaignContext, setCampaignContext] = useState('');
  const [message, setMessage] = useState('');
  const [brief, setBrief] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [extractedFrom, setExtractedFrom] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<AppMode>('score');
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleExtractUrl = async () => {
    if (!urlInput.trim()) return;
    setExtracting(true);
    setExtractError(null);
    setExtractedFrom(null);
    try {
      const res = await fetch('/api/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');
      setMessage(data.message);
      setExtractedFrom(urlInput.trim());
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Could not extract from URL');
    } finally {
      setExtracting(false);
    }
  };

  const handleImageSelect = async (file: File) => {
    setExtracting(true);
    setExtractError(null);
    setExtractedFrom(null);
    setImagePreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/extract-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image extraction failed');
      setMessage(data.message);
      setExtractedFrom(file.name);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Could not extract from image');
      setImagePreview(null);
    } finally {
      setExtracting(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setExtracting(true);
    setExtractError(null);
    setExtractedFrom(null);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PDF extraction failed');
      setMessage(data.message);
      setExtractedFrom(file.name);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Could not extract from PDF');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (appMode === 'score' && !message.trim()) return;
    if (appMode === 'direction' && !brief.trim()) return;
    setLoadingMode(appMode);
    setLoading(true);
    setResult(null);
    setError(null);
    setSynthesis(null);
    try {
      const body =
        appMode === 'direction'
          ? {
              mode: 'direction' as const,
              brief: brief.trim(),
              campaignName: campaignName.trim() || null,
              campaignContext: campaignContext.trim(),
            }
          : {
              mode: 'score' as const,
              message: message.trim(),
              campaignName: campaignName.trim() || null,
              campaignContext: campaignContext.trim(),
            };

      const res = await fetch('/api/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Request failed');
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resultMode: AppMode = result?.mode ?? 'score';

  const avgScore = (key: keyof PersonaScoreResult) => {
    if (!result || resultMode === 'direction') return '—';
    const scores = result.results
      .filter((r): r is PersonaScoreResult => 'comprehension_score' in r)
      .map((r) => r[key] as number)
      .filter((s) => s > 0);
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
  };

  const handleSynthesize = async () => {
    if (!result) return;
    setSynthesizing(true);
    setSynthesisError(null);
    try {
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: result.results,
          message: result.message,
          campaignName: result.campaignName,
          mode: resultMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Synthesis failed');
      if (data.mode === 'direction') {
        setSynthesis({
          mode: 'direction',
          dominant_messaging_angle: data.dominant_messaging_angle ?? '',
          key_proof_point: data.key_proof_point ?? '',
          thing_to_avoid: data.thing_to_avoid ?? '',
        });
      } else {
        setSynthesis({
          mode: 'score',
          whats_landing: data.whats_landing ?? [],
          whats_falling_flat: data.whats_falling_flat ?? [],
          rewrite_brief: data.rewrite_brief ?? [],
        });
      }
    } catch (err) {
      setSynthesisError(err instanceof Error ? err.message : 'Synthesis failed');
    } finally {
      setSynthesizing(false);
    }
  };

  const resetAll = () => {
    setResult(null);
    setSynthesis(null);
    setSynthesisError(null);
    setMessage('');
    setBrief('');
    setCampaignName('');
    setCampaignContext('');
    setExtractedFrom(null);
    setUrlInput('');
    setExtractError(null);
    setImagePreview(null);
  };

  const sourceLabels = {
    text: 'Paste Text',
    url: 'From URL',
    pdf: 'Upload PDF',
    image: 'Image / Ad',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">Synthetic Audience Tester</h1>
              <p className="text-xs text-gray-500">Test DII messaging before spending a dollar on media</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs text-gray-500">DII Buyer Personas</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mode</label>
              <div className="flex gap-1.5 p-1 bg-gray-950 rounded-lg border border-gray-800 w-fit">
                <button
                  type="button"
                  onClick={() => { setAppMode('score'); setError(null); }}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    appMode === 'score'
                      ? 'bg-teal-500 text-gray-950 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  Test a Message
                </button>
                <button
                  type="button"
                  onClick={() => { setAppMode('direction'); setError(null); }}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    appMode === 'direction'
                      ? 'bg-teal-500 text-gray-950 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  Get Direction
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="campaign" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Campaign Name <span className="text-gray-600 normal-case font-normal">(optional)</span>
              </label>
              <input
                id="campaign"
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Storage Cost Accountability — Q3 FY26"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="campaign-context" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Campaign Context <span className="text-gray-600 normal-case font-normal">(optional)</span>
              </label>
              <textarea
                id="campaign-context"
                value={campaignContext}
                onChange={(e) => setCampaignContext(e.target.value)}
                placeholder="e.g. NetApp is launching the Cost Optimization campaign in Q3, targeting IT infrastructure directors who are under pressure to justify storage spend to finance and need defensible chargeback reporting."
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none transition-colors"
              />
            </div>

            {appMode === 'score' && (
            <>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Message Source</label>
              <div className="flex gap-1.5 p-1 bg-gray-950 rounded-lg border border-gray-800 w-fit">
                {(['text', 'url', 'pdf', 'image'] as SourceType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setSourceType(type); setExtractError(null); }}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      sourceType === type
                        ? 'bg-teal-500 text-gray-950 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    {sourceLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            {sourceType === 'url' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Page URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/product-page"
                    className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleExtractUrl(); } }}
                  />
                  <button
                    type="button"
                    onClick={handleExtractUrl}
                    disabled={extracting || !urlInput.trim()}
                    className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:bg-gray-800 disabled:text-gray-600 text-gray-950 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    {extracting ? 'Extracting...' : 'Extract →'}
                  </button>
                </div>
                {extractError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{extractError}</p>}
              </div>
            )}

            {sourceType === 'pdf' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PDF File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                  className="border-2 border-dashed border-gray-700 hover:border-teal-500/50 bg-gray-950 rounded-lg p-6 text-center cursor-pointer transition-colors"
                >
                  {extracting ? (
                    <div className="flex flex-col items-center gap-2 text-teal-400">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Extracting message from PDF...</span>
                    </div>
                  ) : extractedFrom ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-emerald-400 text-xl">✓</span>
                      <span className="text-sm font-medium text-gray-300">{extractedFrom}</span>
                      <span className="text-xs text-gray-600">Click to upload a different file</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-400">Drop a PDF here or click to browse</span>
                      <span className="text-xs text-gray-600">Campaign briefs, one-pagers, landing page copy</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                {extractError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{extractError}</p>}
              </div>
            )}

            {sourceType === 'image' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Banner Ad or Marketing Image</label>
                <div
                  onClick={() => imageInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageSelect(f); }}
                  className="border-2 border-dashed border-gray-700 hover:border-teal-500/50 bg-gray-950 rounded-lg p-4 text-center cursor-pointer transition-colors"
                >
                  {extracting ? (
                    <div className="flex flex-col items-center gap-2 text-teal-400 py-4">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Reading ad copy from image...</span>
                    </div>
                  ) : imagePreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={imagePreview} alt="Uploaded ad" className="max-h-40 max-w-full rounded-lg object-contain" />
                      <span className="text-xs text-gray-600">Click to upload a different image</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500 py-4">
                      <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-400">Drop a banner ad or click to browse</span>
                      <span className="text-xs text-gray-600">JPG, PNG, GIF, WebP — Claude reads the copy directly</span>
                    </div>
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
                {extractError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{extractError}</p>}
              </div>
            )}
            </>
            )}

            {appMode === 'score' ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="message" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {extractedFrom ? 'Extracted Message' : 'Message to Test'} <span className="text-red-500">*</span>
                </label>
                {extractedFrom && (
                  <span className="text-xs text-teal-500 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                    From: {extractedFrom.length > 40 ? '...' + extractedFrom.slice(-40) : extractedFrom}
                  </span>
                )}
              </div>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  sourceType === 'url' ? 'Extract a URL above, or paste your message here directly...'
                  : sourceType === 'pdf' ? 'Upload a PDF above, or paste your message here directly...'
                  : sourceType === 'image' ? 'Upload an image above — extracted copy will appear here for review...'
                  : 'Paste your headline, value proposition, email opening, or ad copy here...'
                }
                rows={5}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none transition-colors"
                required
              />
              <p className="text-xs text-gray-600">{message.length} characters</p>
            </div>
            ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="campaign-brief" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Campaign Brief <span className="text-red-500">*</span>
              </label>
              <textarea
                id="campaign-brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe the situation — what are you trying to accomplish, who is the competitor or context, and what makes this moment urgent for your buyer?"
                rows={5}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none transition-colors"
                required
              />
              <p className="text-xs text-gray-600">{brief.length} characters</p>
            </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || (appMode === 'score' ? !message.trim() : !brief.trim())}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-950 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Running 3 personas in parallel...
                  </>
                ) : appMode === 'direction' ? (
                  'Get Direction →'
                ) : (
                  'Run Message Test →'
                )}
              </button>
              {result && !loading && (
                <button type="button" onClick={resetAll} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  ← Start over
                </button>
              )}
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin h-4 w-4 text-teal-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Consulting three buyer personas simultaneously...
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLACEHOLDER_PERSONAS.map((p) =>
                loadingMode === 'direction' ? (
                  <DirectionLoadingCard key={p.name} {...p} />
                ) : (
                  <LoadingCard key={p.name} {...p} />
                )
              )}
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {result.campaignName ? result.campaignName : resultMode === 'direction' ? 'Direction' : 'Test Results'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  "{result.message.length > 100 ? result.message.slice(0, 100) + '...' : result.message}"
                </p>
              </div>
              {resultMode === 'score' && (
              <div className="flex gap-3">
                <StatCard label="Comprehension" value={avgScore('comprehension_score')} />
                <StatCard label="Resonance" value={avgScore('resonance_score')} />
                <StatCard label="Differentiation" value={avgScore('differentiation_score')} />
              </div>
              )}
            </div>

            {resultMode === 'score' && result.rationalizationSignal && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
                <span className="text-amber-400 text-lg shrink-0">⚠</span>
                <div>
                  <div className="font-semibold text-amber-400 text-sm">Rationalization Signal Detected</div>
                  <p className="text-xs text-amber-200/70 mt-0.5 leading-relaxed">
                    All three personas scored this message within 1 point of each other on Differentiation — a signal that
                    campaigns targeting these personas may be competing with each other rather than the market.
                  </p>
                </div>
              </div>
            )}

            {resultMode === 'score' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-6 flex-wrap">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Would take a meeting?</div>
              {result.results
                .filter((r): r is PersonaScoreResult => 'meeting_threshold' in r)
                .map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      r.avatar === 'SA' ? 'bg-blue-500' : r.avatar === 'IM' ? 'bg-violet-500' : 'bg-slate-500'
                    }`}>{r.avatar}</div>
                    <span className="text-xs text-gray-400">{r.name}</span>
                  </div>
                  <MeetingBadge threshold={r.meeting_threshold} />
                </div>
              ))}
            </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resultMode === 'direction'
                ? result.results.map((r) => (
                    <PersonaDirectionCard key={r.id} result={r as PersonaDirectionResult} />
                  ))
                : result.results.map((r) => (
                    <PersonaCard key={r.id} result={r as PersonaScoreResult} />
                  ))}
            </div>

            {!synthesis && !synthesizing && (
              <div className="flex flex-col items-center gap-2 py-2">
                <button
                  onClick={handleSynthesize}
                  className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-teal-500/40 hover:border-teal-500/70 text-teal-400 font-semibold px-6 py-3 rounded-xl text-sm transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {resultMode === 'direction' ? 'Generate Strategic Brief' : 'Generate Copy Brief'}
                </button>
                <p className="text-xs text-gray-600">
                  {resultMode === 'direction'
                    ? 'Dominant angle, shared proof point, and what to avoid — synthesized across all three personas'
                    : "What's landing, what's not, and exactly what to rewrite"}
                </p>
              </div>
            )}

            {synthesizing && (
              <div className="bg-gray-900 border border-teal-500/20 rounded-xl p-5 flex items-center gap-3">
                <svg className="animate-spin h-4 w-4 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-teal-400">
                  {resultMode === 'direction' ? 'Generating strategic brief...' : 'Generating copy brief...'}
                </span>
              </div>
            )}

            {synthesisError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
                <strong>Synthesis error:</strong> {synthesisError}
              </div>
            )}

            {synthesis && synthesis.mode === 'direction' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-800" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Strategic Brief</h3>
                  <div className="h-px flex-1 bg-gray-800" />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800 bg-teal-500/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">Dominant messaging angle</div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed px-5 py-4">{synthesis.dominant_messaging_angle}</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800 bg-emerald-500/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Key proof point (all three)</div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed px-5 py-4">{synthesis.key_proof_point}</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800 bg-red-500/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <div className="text-xs font-bold text-red-400 uppercase tracking-wider">Thing to avoid</div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed px-5 py-4">{synthesis.thing_to_avoid}</p>
                  </div>
                </div>
              </div>
            )}

            {synthesis && synthesis.mode === 'score' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-800" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Copy Brief</h3>
                  <div className="h-px flex-1 bg-gray-800" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {synthesis.whats_landing?.length > 0 && (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800 bg-emerald-500/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">What's Landing — Keep This</div>
                      </div>
                      <ul className="flex flex-col divide-y divide-gray-800">
                        {synthesis.whats_landing.map((item, i) => (
                          <li key={i} className="flex gap-3 px-5 py-3.5">
                            <span className="text-emerald-400 font-bold shrink-0 mt-0.5 text-sm">✓</span>
                            <span className="text-sm text-gray-300 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {synthesis.whats_falling_flat?.length > 0 && (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800 bg-red-500/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <div className="text-xs font-bold text-red-400 uppercase tracking-wider">What's Falling Flat — Fix This</div>
                      </div>
                      <ul className="flex flex-col divide-y divide-gray-800">
                        {synthesis.whats_falling_flat.map((item, i) => (
                          <li key={i} className="flex gap-3 px-5 py-3.5">
                            <span className="text-red-400 font-bold shrink-0 mt-0.5 text-sm">✕</span>
                            <span className="text-sm text-gray-300 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {synthesis.rewrite_brief?.length > 0 && (
                  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800 bg-teal-500/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">Rewrite Brief — In Priority Order</div>
                    </div>
                    <div className="flex flex-col divide-y divide-gray-800">
                      {synthesis.rewrite_brief.map((item) => (
                        <div key={item.priority} className="flex gap-4 px-5 py-4">
                          <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {item.priority}
                          </div>
                          <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium text-gray-200 leading-snug">{item.instruction}</p>
                            {item.example && (
                              <p className="text-xs text-teal-300 bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-2 italic">
                                "{item.example}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-center text-xs text-gray-700">
        Synthetic audience personas are AI-generated approximations of your DII ICP. Results are directional signals, not market research.
      </footer>
    </div>
  );
}