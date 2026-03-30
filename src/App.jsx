import { useState, useCallback, useRef } from 'react'
import { MOCK_DATA } from './mockData'

// ─── Constants ──────────────────────────────────────────────────────────────

const SOURCE_TYPES = [
  'Support Ticket',
  'Field Ops Report',
  'App Review',
  'Internal Escalation',
]

const SOURCE_COLORS = {
  'Support Ticket':      { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400'   },
  'Field Ops Report':    { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-400' },
  'App Review':          { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400'  },
  'Internal Escalation': { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400'   },
}

const SEVERITY_CONFIG = {
  P0: { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    bar: 'bg-red-500',    label: 'P0 Critical', glow: 'shadow-red-100' },
  P1: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', bar: 'bg-orange-500', label: 'P1 High',     glow: 'shadow-orange-100' },
  P2: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300',  bar: 'bg-amber-400',  label: 'P2 Medium',  glow: 'shadow-amber-100' },
  P3: { bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200',  bar: 'bg-slate-400',  label: 'P3 Low',     glow: '' },
}

const TYPE_CONFIG = {
  'Product Bug':  { icon: '🐛', bg: 'bg-red-50',    text: 'text-red-700'    },
  'Ops Issue':    { icon: '⚙️', bg: 'bg-sky-50',    text: 'text-sky-700'    },
  'UX Friction':  { icon: '🎨', bg: 'bg-purple-50', text: 'text-purple-700' },
  'Unknown':      { icon: '❓', bg: 'bg-gray-50',   text: 'text-gray-600'   },
}

const SYSTEM_PROMPT = `You are a Product Operations analyst for Metropolis Technologies, the largest AI-powered parking platform in the US (4,200+ locations, 21M members).

Metropolis's product areas are:
- Member App (iOS/Android consumer app)
- Billing & Payment (auto-charge, receipts, subscriptions, refunds)
- CV Platform (license plate recognition, vehicle fingerprinting)
- Operator Dashboard (analytics, pricing, NOI reporting)
- Orion (automated collections for non-paying vehicles)
- Gate & Hardware (entry/exit gates, cameras, connectivity)
- Valet Product (valet operator app)
- New Verticals (fueling, hospitality, retail — in rollout)

You will receive a batch of raw feedback items from multiple sources.
Each item has a source type: Support Ticket | Field Ops Report | App Review | Internal Escalation.

Your job is to analyze all inputs and return a structured JSON digest with these fields:

{
  "executive_summary": "string (3-4 sentences summarizing the week's feedback, dominant themes, and most urgent issues)",
  "themes": [
    {
      "name": "string (concise theme name, e.g. 'Subscription Cancellation Failures')",
      "volume": number,
      "severity": "P0|P1|P2|P3",
      "type": "Product Bug|Ops Issue|UX Friction|Unknown",
      "product_area": "string (one of the 8 product areas above)",
      "representative_quote": "string (verbatim excerpt from one input — keep it short, under 120 chars)",
      "suggested_action": "string (specific, actionable next step with owner suggestion)"
    }
  ],
  "product_area_breakdown": {
    "Member App": { "count": number, "p0": number, "p1": number, "p2": number, "p3": number },
    "Billing & Payment": { "count": number, "p0": number, "p1": number, "p2": number, "p3": number },
    "CV Platform": { "count": number, "p0": number, "p1": number, "p2": number, "p3": number },
    "Operator Dashboard": { "count": number, "p0": number, "p1": number, "p2": number, "p3": number },
    "Orion": { "count": number, "p0": number, "p1": number, "p2": number, "p3": number },
    "Gate & Hardware": { "count": number, "p0": number, "p1": number, "p2": number, "p3": number },
    "Valet Product": { "count": number, "p0": number, "p1": number, "p2": number, "p3": number },
    "New Verticals": { "count": number, "p0": number, "p1": number, "p2": number, "p3": number }
  },
  "bug_ops_ux_split": { "bug": number, "ops": number, "ux": number, "unknown": number },
  "recommended_actions": ["string (format: '[P0/P1/P2] Action description — assign to Owner']"],
  "total_inputs": number
}

Severity definitions:
- P0: Active revenue loss, data integrity issue, legal/safety concern — immediate escalation required
- P1: Significant user-facing failure affecting multiple customers — fix this week
- P2: Degraded experience, workaround exists — add to sprint
- P3: Minor friction, cosmetic, low-frequency — add to backlog

Type definitions:
- Product Bug: Software/system failure requiring an engineering fix
- Ops Issue: Execution/process/training problem solvable without a code change
- UX Friction: Feature works but is confusing or hard to use — needs design/copy improvement
- Unknown: Insufficient information to categorize

Return ONLY valid JSON. No markdown fences, no preamble, no trailing text.`

// ─── Small reusable components ───────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.P3
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bar}`} />
      {severity}
    </span>
  )
}

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Unknown
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span>{cfg.icon}</span>
      {type}
    </span>
  )
}

function SourceBadge({ source }) {
  const cfg = SOURCE_COLORS[source] || SOURCE_COLORS['Support Ticket']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {source}
    </span>
  )
}

// ─── Theme Card ───────────────────────────────────────────────────────────────

function ThemeCard({ theme, index }) {
  const sev = SEVERITY_CONFIG[theme.severity] || SEVERITY_CONFIG.P3
  const isPriority = theme.severity === 'P0' || theme.severity === 'P1'
  return (
    <div
      className={`bg-white rounded-xl border p-4 flex flex-col gap-3 animate-slide-up shadow-sm hover:shadow-md transition-shadow ${sev.border} ${isPriority ? `shadow-sm ${sev.glow}` : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display font-semibold text-sm text-slate-900 leading-snug">{theme.name}</h4>
        <div className="flex items-center gap-1 shrink-0">
          <SeverityBadge severity={theme.severity} />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={theme.type} />
        <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono">
          {theme.product_area}
        </span>
        <span className="text-xs text-slate-500 ml-auto font-mono">
          {theme.volume} {theme.volume === 1 ? 'input' : 'inputs'}
        </span>
      </div>

      {/* Quote */}
      <blockquote className="text-xs text-slate-600 italic bg-slate-50 border-l-2 border-slate-300 pl-3 py-1.5 rounded-r leading-relaxed">
        "{theme.representative_quote}"
      </blockquote>

      {/* Action */}
      <div className="flex items-start gap-2 text-xs">
        <span className="text-indigo-500 mt-0.5 shrink-0">→</span>
        <span className="text-slate-700">{theme.suggested_action}</span>
      </div>
    </div>
  )
}

// ─── Product Area Table ───────────────────────────────────────────────────────

function ProductAreaTable({ breakdown }) {
  const rows = Object.entries(breakdown)
    .filter(([, v]) => v.count > 0)
    .sort((a, b) => b[1].count - a[1].count)

  if (rows.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 pr-4 font-semibold text-slate-500 uppercase tracking-wider">Product Area</th>
            <th className="text-center py-2 px-2 font-semibold text-slate-500 uppercase tracking-wider">Total</th>
            <th className="text-center py-2 px-2 font-semibold text-red-400 uppercase tracking-wider">P0</th>
            <th className="text-center py-2 px-2 font-semibold text-orange-400 uppercase tracking-wider">P1</th>
            <th className="text-center py-2 px-2 font-semibold text-amber-400 uppercase tracking-wider">P2</th>
            <th className="text-center py-2 px-2 font-semibold text-slate-400 uppercase tracking-wider">P3</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([area, counts], i) => (
            <tr key={area} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors`}>
              <td className="py-2.5 pr-4 font-medium text-slate-800">{area}</td>
              <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-900">{counts.count}</td>
              <td className="py-2.5 px-2 text-center font-mono">
                {counts.p0 > 0 ? <span className="text-red-600 font-bold">{counts.p0}</span> : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-2.5 px-2 text-center font-mono">
                {counts.p1 > 0 ? <span className="text-orange-500 font-semibold">{counts.p1}</span> : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-2.5 px-2 text-center font-mono">
                {counts.p2 > 0 ? <span className="text-amber-500">{counts.p2}</span> : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-2.5 px-2 text-center font-mono">
                {counts.p3 > 0 ? <span className="text-slate-500">{counts.p3}</span> : <span className="text-slate-300">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Bug / Ops / UX Chart ─────────────────────────────────────────────────────

function BugOpsUxChart({ split }) {
  const total = (split.bug || 0) + (split.ops || 0) + (split.ux || 0) + (split.unknown || 0)
  if (total === 0) return null

  const bars = [
    { label: 'Product Bug', value: split.bug || 0, color: 'bg-red-400', textColor: 'text-red-700', icon: '🐛' },
    { label: 'Ops Issue',   value: split.ops || 0, color: 'bg-sky-400',  textColor: 'text-sky-700',  icon: '⚙️' },
    { label: 'UX Friction', value: split.ux  || 0, color: 'bg-violet-400', textColor: 'text-violet-700', icon: '🎨' },
    { label: 'Unknown',     value: split.unknown || 0, color: 'bg-slate-300', textColor: 'text-slate-500', icon: '❓' },
  ].filter(b => b.value > 0)

  const dominant = bars.sort((a, b) => b.value - a.value)[0]
  const insight = dominant.label === 'Product Bug' && (dominant.value / total) > 0.6
    ? '⚠️ >60% are product bugs — loop in engineering this week.'
    : dominant.label === 'Ops Issue' && (dominant.value / total) > 0.6
    ? '✅ >60% are ops issues — no engineering tickets needed. Focus on training.'
    : `${dominant.label} is the dominant category this week.`

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
        {bars.map(b => (
          <div
            key={b.label}
            className={`${b.color} transition-all duration-700 ease-out`}
            style={{ width: `${(b.value / total) * 100}%` }}
            title={`${b.label}: ${b.value} (${Math.round((b.value / total) * 100)}%)`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {bars.map(b => (
          <div key={b.label} className="flex items-center gap-2 text-xs">
            <span className={`w-2.5 h-2.5 rounded-sm ${b.color}`} />
            <span className="text-slate-600">{b.icon} {b.label}</span>
            <span className={`font-mono font-semibold ${b.textColor}`}>
              {b.value} ({Math.round((b.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>

      {/* Insight callout */}
      <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
        {insight}
      </p>
    </div>
  )
}

// ─── Recommended Actions ──────────────────────────────────────────────────────

function RecommendedActions({ actions }) {
  if (!actions || actions.length === 0) return null
  return (
    <ol className="space-y-2.5">
      {actions.map((action, i) => {
        // Try to extract severity tag like [P0], [P1] from the action string
        const match = action.match(/^\[(P[0-3])\]\s*(.+)/)
        const sev = match ? match[1] : null
        const text = match ? match[2] : action
        const cfg = sev ? SEVERITY_CONFIG[sev] : null
        return (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-mono text-white mt-0.5 ${cfg ? cfg.bar : 'bg-indigo-500'}`}>
              {i + 1}
            </span>
            <div className="flex flex-col gap-1 flex-1">
              {sev && <SeverityBadge severity={sev} />}
              <span className="text-slate-700 leading-snug">{text}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ─── Raw Input Log ────────────────────────────────────────────────────────────

function RawInputLog({ inputs }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
      >
        <span className="flex items-center gap-2">
          <span className="text-slate-400">📋</span>
          Raw Input Log
          <span className="text-xs font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{inputs.length} items</span>
        </span>
        <span className="text-slate-400 text-xs">{open ? '▲ collapse' : '▼ expand'}</span>
      </button>
      {open && (
        <div className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
          {inputs.map((item, i) => {
            const cfg = SOURCE_COLORS[item.source] || SOURCE_COLORS['Support Ticket']
            return (
              <div key={item.id || i} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono text-slate-400">#{(i + 1).toString().padStart(2, '0')}</span>
                  <SourceBadge source={item.source} />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{item.text}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Digest Panel ─────────────────────────────────────────────────────────────

function DigestPanel({ digest, loading, error, inputQueue, weekLabel }) {
  const digestRef = useRef(null)

  const copyDigest = useCallback(() => {
    if (!digest) return
    const text = [
      `METROPOLIS VOC DIGEST — ${weekLabel}`,
      '═'.repeat(50),
      '',
      'EXECUTIVE SUMMARY',
      digest.executive_summary,
      '',
      'TOP THEMES',
      ...digest.themes.map((t, i) =>
        `${i + 1}. [${t.severity}] ${t.name} — ${t.product_area} — ${t.type}\n   "${t.representative_quote}"\n   → ${t.suggested_action}`
      ),
      '',
      'RECOMMENDED ACTIONS',
      ...digest.recommended_actions.map((a, i) => `${i + 1}. ${a}`),
    ].join('\n')
    navigator.clipboard.writeText(text)
      .then(() => alert('Digest copied to clipboard!'))
      .catch(() => alert('Copy failed — try selecting text manually'))
  }, [digest, weekLabel])

  const exportPDF = useCallback(() => {
    window.print()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-6 min-h-[400px] p-8">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse-dot"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
        <div className="text-center">
          <p className="font-display font-semibold text-slate-800 text-lg">Analyzing {inputQueue.length} inputs…</p>
          <p className="text-sm text-slate-500 mt-1">Claude is synthesizing your feedback batch</p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          {['Grouping by theme', 'Assigning severity & type', 'Building product area breakdown', 'Generating recommendations'].map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-xs text-slate-500">
              <span
                className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse-dot"
                style={{ animationDelay: `${(i + 1) * 400}ms` }}
              />
              {step}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 min-h-[200px] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-lg">⚠️</div>
        <div className="text-center">
          <p className="font-display font-semibold text-slate-800">Synthesis failed</p>
          <p className="text-sm text-red-600 mt-1 max-w-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!digest) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 min-h-[400px] p-8 text-center">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">📊</div>
        <div>
          <p className="font-display font-semibold text-slate-700 text-lg">Your digest will appear here</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs leading-relaxed">
            Add inputs in the left panel and hit <strong>Synthesize</strong> to generate your weekly VoC brief.
          </p>
        </div>
      </div>
    )
  }

  const p0Count = digest.themes.filter(t => t.severity === 'P0').length

  return (
    <div ref={digestRef} className="space-y-4 animate-fade-in">
      {/* Digest header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-slate-900 text-xl">Weekly VoC Digest</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{weekLabel} · {digest.total_inputs} inputs analyzed</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={copyDigest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            📋 Copy
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            🖨️ Print / PDF
          </button>
        </div>
      </div>

      {/* P0 alert banner */}
      {p0Count > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-slide-up">
          <span className="text-red-500 text-lg shrink-0">🚨</span>
          <div>
            <p className="text-sm font-semibold text-red-800">
              {p0Count} P0 Critical {p0Count === 1 ? 'issue' : 'issues'} require immediate escalation
            </p>
            <p className="text-xs text-red-600 mt-0.5">Review the P0 theme cards below and action before EOD.</p>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono font-semibold text-indigo-300 uppercase tracking-widest">Executive Summary</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-200">{digest.executive_summary}</p>
      </div>

      {/* Top Issues by Theme */}
      <SectionCard title="Top Issues by Theme" icon="🔥" count={digest.themes.length}>
        <div className="grid grid-cols-1 gap-3">
          {digest.themes
            .sort((a, b) => {
              const order = { P0: 0, P1: 1, P2: 2, P3: 3 }
              return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
            })
            .map((theme, i) => <ThemeCard key={i} theme={theme} index={i} />)}
        </div>
      </SectionCard>

      {/* Product Area Breakdown */}
      <SectionCard title="Breakdown by Product Area" icon="🗺️">
        <ProductAreaTable breakdown={digest.product_area_breakdown} />
      </SectionCard>

      {/* Bug / Ops / UX Split */}
      <SectionCard title="Issue Type Distribution" icon="📐">
        <BugOpsUxChart split={digest.bug_ops_ux_split} />
      </SectionCard>

      {/* Recommended Actions */}
      <SectionCard title="Recommended Actions This Week" icon="✅" highlight>
        <RecommendedActions actions={digest.recommended_actions} />
      </SectionCard>

      {/* Raw Input Log */}
      <RawInputLog inputs={inputQueue} />
    </div>
  )
}

function SectionCard({ title, icon, count, children, highlight = false }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${highlight ? 'border-indigo-200' : 'border-slate-200'}`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${highlight ? 'border-indigo-100 bg-indigo-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
        <span className="text-base">{icon}</span>
        <h3 className={`font-display font-semibold text-sm ${highlight ? 'text-indigo-900' : 'text-slate-800'}`}>{title}</h3>
        {count != null && (
          <span className="ml-auto text-xs font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── Input Panel ──────────────────────────────────────────────────────────────

function InputPanel({ inputQueue, setInputQueue, onSynthesize, loading }) {
  const [inputText, setInputText] = useState('')
  const [sourceType, setSourceType] = useState('Support Ticket')
  const textareaRef = useRef(null)

  const addInput = useCallback(() => {
    const trimmed = inputText.trim()
    if (!trimmed) return
    setInputQueue(prev => [...prev, { id: Date.now() + Math.random(), source: sourceType, text: trimmed }])
    setInputText('')
    textareaRef.current?.focus()
  }, [inputText, sourceType, setInputQueue])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addInput()
  }

  const loadDemoData = () => setInputQueue(MOCK_DATA)
  const clearAll = () => setInputQueue([])
  const removeItem = (id) => setInputQueue(prev => prev.filter(i => i.id !== id))

  const countBySource = SOURCE_TYPES.reduce((acc, s) => {
    acc[s] = inputQueue.filter(i => i.source === s).length
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      {/* Source type selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-base">📥</span>
          <h3 className="font-display font-semibold text-sm text-slate-800">Add Feedback</h3>
          <span className="text-xs text-slate-400 ml-1">⌘+Enter to add</span>
        </div>
        <div className="p-4 space-y-3">
          {/* Source pills */}
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_TYPES.map(s => {
              const cfg = SOURCE_COLORS[s]
              const active = sourceType === s
              return (
                <button
                  key={s}
                  onClick={() => setSourceType(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Paste a ${sourceType.toLowerCase()} here…`}
            rows={4}
            className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder-slate-400 transition-all"
          />

          {/* Add button */}
          <button
            onClick={addInput}
            disabled={!inputText.trim()}
            className="w-full py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            + Add {sourceType}
          </button>
        </div>
      </div>

      {/* Input queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="font-display font-semibold text-sm text-slate-800">Input Queue</h3>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${
              inputQueue.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {inputQueue.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadDemoData}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Load Demo
            </button>
            {inputQueue.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Source counts */}
        {inputQueue.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pt-3 pb-2 border-b border-slate-100">
            {SOURCE_TYPES.filter(s => countBySource[s] > 0).map(s => {
              const cfg = SOURCE_COLORS[s]
              return (
                <div key={s} className="flex items-center gap-1.5 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className="text-slate-500">{s}</span>
                  <span className={`font-mono font-semibold ${cfg.text}`}>{countBySource[s]}</span>
                </div>
              )
            })}
          </div>
        )}

        {inputQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-6">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl mb-3">📭</div>
            <p className="text-sm text-slate-500">No inputs yet.</p>
            <button
              onClick={loadDemoData}
              className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 transition-colors"
            >
              Load 31 demo inputs →
            </button>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
            {inputQueue.map((item, i) => {
              const cfg = SOURCE_COLORS[item.source] || SOURCE_COLORS['Support Ticket']
              return (
                <div key={item.id} className="group flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-mono text-slate-400 mt-0.5 shrink-0">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <SourceBadge source={item.source} />
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{item.text}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm mt-0.5"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Synthesize CTA */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onSynthesize}
            disabled={loading || inputQueue.length === 0}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
              inputQueue.length > 0 && !loading
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                Synthesize {inputQueue.length > 0 ? `${inputQueue.length} inputs` : ''} →
              </>
            )}
          </button>
          {inputQueue.length > 0 && !loading && (
            <p className="text-center text-xs text-slate-400 mt-2">
              ~5 seconds · powered by Claude
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ApiKeyGate removed — API key is now server-side (see server.js / api/synthesize.js)

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ inputCount, weekLabel }) {
  return (
    <header className="bg-[#0F172A] border-b border-slate-800 no-print">
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        {/* Logo + title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-display font-black text-white text-lg leading-none tracking-tighter">
              M↑
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-tight tracking-tight">
                VoC Synthesizer
              </p>
              <p className="text-xs text-slate-500 font-mono leading-none">Metropolis Technologies</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-700" />
          <p className="hidden sm:block text-xs text-slate-400 font-mono">{weekLabel}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {inputCount > 0 && (
            <div className="flex items-center gap-1.5 bg-indigo-900/60 border border-indigo-700/50 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-indigo-300 font-medium">{inputCount} inputs</span>
            </div>
          )}
          <div className="text-xs text-slate-600 hidden sm:block font-mono">
            Turn 500 pieces of feedback into a 5-min brief.
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [inputQueue, setInputQueue] = useState([])
  const [digest, setDigest] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const weekLabel = (() => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay() + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `Week of ${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`
  })()

  const synthesize = useCallback(async () => {
    if (inputQueue.length === 0) { setError('Please add at least one input.'); return }

    setLoading(true)
    setError(null)
    setDigest(null)

    try {
      // Calls our server-side proxy — API key never touches the browser
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: inputQueue }),
      })

      const text = await response.text()
      if (!text) throw new Error('Server returned an empty response. Check that ANTHROPIC_API_KEY is set in Vercel → Settings → Environment Variables, then redeploy.')
      const data = JSON.parse(text)
      if (!response.ok) throw new Error(data.error || `Server error ${response.status}`)
      setDigest(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [inputQueue])

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Header inputCount={inputQueue.length} weekLabel={weekLabel} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          {/* Left: Input panel */}
          <div className="no-print">
            <InputPanel
              inputQueue={inputQueue}
              setInputQueue={setInputQueue}
              onSynthesize={synthesize}
              loading={loading}
            />
          </div>

          {/* Right: Digest output */}
          <div className="print-full">
            <DigestPanel
              digest={digest}
              loading={loading}
              error={error}
              inputQueue={inputQueue}
              weekLabel={weekLabel}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-6 text-center no-print">
        <p className="text-xs text-slate-400 font-mono">
          Metropolis VoC Synthesizer · Powered by Claude · Built for Director of Product Operations
        </p>
      </footer>
    </div>
  )
}
