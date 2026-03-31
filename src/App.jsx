import { useState, useCallback, useRef, useEffect } from 'react'
import { MOCK_DATA, DEMO_DIGEST } from './mockData'

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_TYPES = ['Support Ticket', 'Field Ops Report', 'App Review', 'Internal Escalation']

const SOURCE_COLORS = {
  'Support Ticket':      { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400'   },
  'Field Ops Report':    { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-400' },
  'App Review':          { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400'  },
  'Internal Escalation': { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400'   },
}

const SEVERITY_CONFIG = {
  P0: { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    bar: 'bg-red-500',    glow: 'shadow-red-100'    },
  P1: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', bar: 'bg-orange-500', glow: 'shadow-orange-100' },
  P2: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300',  bar: 'bg-amber-400',  glow: ''                  },
  P3: { bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200',  bar: 'bg-slate-400',  glow: ''                  },
}

const TYPE_CONFIG = {
  'Product Bug':  { icon: '🐛', bg: 'bg-red-50',    text: 'text-red-700'    },
  'Ops Issue':    { icon: '⚙️', bg: 'bg-sky-50',    text: 'text-sky-700'    },
  'UX Friction':  { icon: '🎨', bg: 'bg-purple-50', text: 'text-purple-700' },
  'Unknown':      { icon: '❓', bg: 'bg-gray-50',   text: 'text-gray-600'   },
}

// ─── Demo Tour Steps ──────────────────────────────────────────────────────────

const DEMO_STEPS = [
  {
    id: 'welcome',
    title: 'Metropolis VoC Synthesizer',
    body: "What you're looking at turns 500 pieces of raw feedback — support tickets, ops reports, app reviews, internal escalations — into a structured weekly product brief in under 10 seconds.\n\nThis demo walks through exactly how it works. Click Start to begin.",
    target: null,
    cta: '▶  Start Demo',
    isModal: true,
  },
  {
    id: 'sources',
    title: '① Four Feedback Sources',
    body: 'The tool ingests from four channels: Support Tickets, Field Ops Reports, App Store Reviews, and Internal Escalations (Slack/email threads from Sales, CS, and Ops).\n\nEach input is tagged by source type so you always know where a signal came from.',
    target: 'tour-source-pills',
    cta: 'Next →',
  },
  {
    id: 'queue',
    title: '② 31 Real Inputs Loaded',
    body: "We've pre-loaded 31 realistic inputs spanning all four source types — covering an Orion false positive spike in Nashville, a subscription cancellation regression, gate hardware failures, billing overcharges, and new vertical onboarding friction.\n\nThis is a realistic week's worth of feedback for a mid-size market cluster.",
    target: 'tour-queue',
    cta: 'Next →',
    action: 'loadDemo',
  },
  {
    id: 'synthesize',
    title: '③ One Click to Synthesize',
    body: 'The VoC tool reads all 31 inputs, groups them into themes, assigns severity (P0–P3) and issue type (Bug / Ops / UX), maps each theme to a product area owner, and generates a digest.\n\nClick the button below to run the synthesis now.',
    target: 'tour-synthesize',
    cta: 'Synthesize 31 inputs →',
    action: 'synthesize',
  },
  {
    id: 'summary',
    title: '④ Executive Summary',
    body: "Claude leads with a 3–4 sentence narrative: the week's dominant themes, what's improving, and what needs immediate attention.\n\nThis is the section you paste into your Monday standup doc or send to the VP of Product.",
    target: 'tour-summary',
    cta: 'Next →',
  },
  {
    id: 'p0alert',
    title: '⑤ P0 Issues Surface Automatically',
    body: "Critical issues — active revenue loss, legal risk, safety — are flagged at the top and color-coded red. No manual triage required.\n\nThis week: two P0s. The Nashville Orion webhook bug alone is generating ~40 false-positive refund requests per day.",
    target: 'tour-p0',
    cta: 'Next →',
  },
  {
    id: 'themes',
    title: '⑥ Themes with Severity, Type & Owner',
    body: "Every cluster of feedback becomes a theme card showing:\n• Severity (P0–P3)  • Issue type (Bug / Ops / UX)\n• Product area owner  • A verbatim quote\n• A suggested action\n\nNo more spending half a day manually reading and tagging tickets.",
    target: 'tour-themes',
    cta: 'Next →',
  },
  {
    id: 'breakdown',
    title: '⑦ Breakdown by Product Area',
    body: "See which product areas are generating the most noise and how severity distributes across them. Orion and Member App are the hotspots this week — this table directly informs where to focus your sprint planning conversation.",
    target: 'tour-breakdown',
    cta: 'Next →',
  },
  {
    id: 'split',
    title: '⑧ Bug vs. Ops vs. UX Split',
    body: "65% of this week's issues are product bugs — engineering needs to be in the room. But 19% are ops execution problems solvable with training, no code change needed.\n\nThis split changes your escalation path and prevents teams from filing unnecessary engineering tickets.",
    target: 'tour-split',
    cta: 'Next →',
  },
  {
    id: 'actions',
    title: '⑨ Monday Morning Action List',
    body: "The digest closes with 4–5 specific, prioritized actions with suggested owners. Not vague recommendations — actual next steps.\n\nYour team opens this Monday morning and knows exactly what to do before standup.",
    target: 'tour-actions',
    cta: 'Next →',
  },
  {
    id: 'close',
    title: 'Half a day of work. Done in 10 seconds.',
    body: "At Metropolis's scale — 4,200+ locations, 23,000+ employees — this feedback volume is unmanageable manually.\n\nThis is one example of how the Director of Product Operations role can function as a force multiplier: building systems that make the team faster, not just coordinating between them.",
    target: null,
    cta: '✓  Explore freely',
    isModal: true,
  },
]

// ─── Small reusable components ────────────────────────────────────────────────

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

// ─── Demo Tour ────────────────────────────────────────────────────────────────

function DemoTour({ step, stepIndex, totalSteps, onNext, onSkip }) {
  // Highlight target element and scroll it into view
  useEffect(() => {
    document.querySelectorAll('.tour-highlighted').forEach(el => el.classList.remove('tour-highlighted'))
    if (step.target) {
      const el = document.getElementById(step.target)
      if (el) {
        el.classList.add('tour-highlighted')
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
      }
    }
    return () => {
      document.querySelectorAll('.tour-highlighted').forEach(el => el.classList.remove('tour-highlighted'))
    }
  }, [step])

  const progress = ((stepIndex) / (totalSteps - 1)) * 100

  // Full-screen modal for welcome / close steps
  if (step.isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl">
                📊
              </div>
              <span className="text-xs font-mono text-indigo-300 uppercase tracking-widest">Product Operations Tool</span>
            </div>
            <h2 className="font-display font-bold text-white text-2xl leading-tight">{step.title}</h2>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{step.body}</p>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 flex items-center justify-between">
            {stepIndex > 0 ? (
              <button onClick={onSkip} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Exit demo
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-mono">{totalSteps - 1} steps · ~2 min</span>
            )}
            <button
              onClick={onNext}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              {step.cta}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Floating card for non-modal steps
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5">
          {/* Step counter + title */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-indigo-500 font-semibold">{stepIndex} / {totalSteps - 1}</span>
              <h3 className="font-display font-bold text-slate-900 text-base">{step.title}</h3>
            </div>
            <button
              onClick={onSkip}
              className="shrink-0 text-xs text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
            >
              Skip
            </button>
          </div>

          {/* Body */}
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mb-4">{step.body}</p>

          {/* CTA */}
          <button
            onClick={onNext}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-indigo-200"
          >
            {step.cta}
          </button>
        </div>
      </div>
    </div>
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
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display font-semibold text-sm text-slate-900 leading-snug">{theme.name}</h4>
        <SeverityBadge severity={theme.severity} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={theme.type} />
        <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono">
          {theme.product_area}
        </span>
        <span className="text-xs text-slate-500 ml-auto font-mono">{theme.volume} {theme.volume === 1 ? 'input' : 'inputs'}</span>
      </div>
      <blockquote className="text-xs text-slate-600 italic bg-slate-50 border-l-2 border-slate-300 pl-3 py-1.5 rounded-r leading-relaxed">
        "{theme.representative_quote}"
      </blockquote>
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
  if (!rows.length) return null
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
          {rows.map(([area, c], i) => (
            <tr key={area} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors`}>
              <td className="py-2.5 pr-4 font-medium text-slate-800">{area}</td>
              <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-900">{c.count}</td>
              <td className="py-2.5 px-2 text-center font-mono">{c.p0 > 0 ? <span className="text-red-600 font-bold">{c.p0}</span> : <span className="text-slate-300">—</span>}</td>
              <td className="py-2.5 px-2 text-center font-mono">{c.p1 > 0 ? <span className="text-orange-500 font-semibold">{c.p1}</span> : <span className="text-slate-300">—</span>}</td>
              <td className="py-2.5 px-2 text-center font-mono">{c.p2 > 0 ? <span className="text-amber-500">{c.p2}</span> : <span className="text-slate-300">—</span>}</td>
              <td className="py-2.5 px-2 text-center font-mono">{c.p3 > 0 ? <span className="text-slate-500">{c.p3}</span> : <span className="text-slate-300">—</span>}</td>
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
  if (!total) return null
  const bars = [
    { label: 'Product Bug', value: split.bug || 0, color: 'bg-red-400',    textColor: 'text-red-700',    icon: '🐛' },
    { label: 'Ops Issue',   value: split.ops || 0, color: 'bg-sky-400',    textColor: 'text-sky-700',    icon: '⚙️' },
    { label: 'UX Friction', value: split.ux  || 0, color: 'bg-violet-400', textColor: 'text-violet-700', icon: '🎨' },
    { label: 'Unknown',     value: split.unknown || 0, color: 'bg-slate-300', textColor: 'text-slate-500', icon: '❓' },
  ].filter(b => b.value > 0)
  const dominant = [...bars].sort((a, b) => b.value - a.value)[0]
  const pct = Math.round((dominant.value / total) * 100)
  const insight = dominant.label === 'Product Bug' && pct > 60
    ? `⚠️ ${pct}% are product bugs — loop in engineering this week.`
    : dominant.label === 'Ops Issue' && pct > 40
    ? `✅ ${pct}% are ops issues — training fixes, no engineering tickets needed.`
    : `${dominant.icon} ${dominant.label} is the dominant category (${pct}%) this week.`
  return (
    <div className="space-y-3">
      <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
        {bars.map(b => (
          <div key={b.label} className={`${b.color} transition-all duration-700`}
            style={{ width: `${(b.value / total) * 100}%` }}
            title={`${b.label}: ${b.value} (${Math.round((b.value / total) * 100)}%)`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {bars.map(b => (
          <div key={b.label} className="flex items-center gap-2 text-xs">
            <span className={`w-2.5 h-2.5 rounded-sm ${b.color}`} />
            <span className="text-slate-600">{b.icon} {b.label}</span>
            <span className={`font-mono font-semibold ${b.textColor}`}>{b.value} ({Math.round((b.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">{insight}</p>
    </div>
  )
}

// ─── Recommended Actions ──────────────────────────────────────────────────────

function RecommendedActions({ actions }) {
  if (!actions?.length) return null
  return (
    <ol className="space-y-2.5">
      {actions.map((action, i) => {
        const match = action.match(/^\[(P[0-3])\]\s*(.+)/)
        const sev = match?.[1]; const text = match ? match[2] : action
        const cfg = sev ? SEVERITY_CONFIG[sev] : null
        return (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-mono text-white mt-0.5 ${cfg ? cfg.bar : 'bg-indigo-500'}`}>{i + 1}</span>
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
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700">
        <span className="flex items-center gap-2">
          <span className="text-slate-400">📋</span>
          Raw Input Log
          <span className="text-xs font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{inputs.length} items</span>
        </span>
        <span className="text-slate-400 text-xs">{open ? '▲ collapse' : '▼ expand'}</span>
      </button>
      {open && (
        <div className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
          {inputs.map((item, i) => (
            <div key={item.id || i} className="px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono text-slate-400">#{(i + 1).toString().padStart(2, '0')}</span>
                <SourceBadge source={item.source} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ id, title, icon, count, children, highlight = false }) {
  return (
    <div id={id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${highlight ? 'border-indigo-200' : 'border-slate-200'}`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${highlight ? 'border-indigo-100 bg-indigo-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
        <span className="text-base">{icon}</span>
        <h3 className={`font-display font-semibold text-sm ${highlight ? 'text-indigo-900' : 'text-slate-800'}`}>{title}</h3>
        {count != null && <span className="ml-auto text-xs font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── Digest Panel ─────────────────────────────────────────────────────────────

function DigestPanel({ digest, loading, error, inputQueue, weekLabel }) {
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
      .catch(() => alert('Copy failed — try selecting manually'))
  }, [digest, weekLabel])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-6 min-h-[400px] p-8">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse-dot" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
        <div className="text-center">
          <p className="font-display font-semibold text-slate-800 text-lg">Analyzing {inputQueue.length} inputs…</p>
          <p className="text-sm text-slate-500 mt-1">Claude is synthesizing your feedback batch</p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          {['Grouping by theme', 'Assigning severity & type', 'Building product area breakdown', 'Generating recommendations'].map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse-dot" style={{ animationDelay: `${(i + 1) * 400}ms` }} />
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-slate-900 text-xl">Weekly VoC Digest</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{weekLabel} · {digest.total_inputs} inputs analyzed</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button onClick={copyDigest} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            📋 Copy
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            🖨️ Print / PDF
          </button>
        </div>
      </div>

      {p0Count > 0 && (
        <div id="tour-p0" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-slide-up">
          <span className="text-red-500 text-lg shrink-0">🚨</span>
          <div>
            <p className="text-sm font-semibold text-red-800">{p0Count} P0 Critical {p0Count === 1 ? 'issue' : 'issues'} require immediate escalation</p>
            <p className="text-xs text-red-600 mt-0.5">Review the P0 theme cards below and action before EOD.</p>
          </div>
        </div>
      )}

      <div id="tour-summary">
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-xl p-5 text-white shadow-lg">
          <p className="text-xs font-mono font-semibold text-indigo-300 uppercase tracking-widest mb-3">Executive Summary</p>
          <p className="text-sm leading-relaxed text-slate-200">{digest.executive_summary}</p>
        </div>
      </div>

      <SectionCard id="tour-themes" title="Top Issues by Theme" icon="🔥" count={digest.themes.length}>
        <div className="grid grid-cols-1 gap-3">
          {[...digest.themes]
            .sort((a, b) => ({ P0: 0, P1: 1, P2: 2, P3: 3 }[a.severity] ?? 4) - ({ P0: 0, P1: 1, P2: 2, P3: 3 }[b.severity] ?? 4))
            .map((theme, i) => <ThemeCard key={i} theme={theme} index={i} />)}
        </div>
      </SectionCard>

      <SectionCard id="tour-breakdown" title="Breakdown by Product Area" icon="🗺️">
        <ProductAreaTable breakdown={digest.product_area_breakdown} />
      </SectionCard>

      <SectionCard id="tour-split" title="Issue Type Distribution" icon="📐">
        <BugOpsUxChart split={digest.bug_ops_ux_split} />
      </SectionCard>

      <SectionCard id="tour-actions" title="Recommended Actions This Week" icon="✅" highlight>
        <RecommendedActions actions={digest.recommended_actions} />
      </SectionCard>

      <RawInputLog inputs={inputQueue} />
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

  const countBySource = SOURCE_TYPES.reduce((acc, s) => {
    acc[s] = inputQueue.filter(i => i.source === s).length
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      {/* Add feedback */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-base">📥</span>
          <h3 className="font-display font-semibold text-sm text-slate-800">Add Feedback</h3>
          <span className="text-xs text-slate-400 ml-1">⌘+Enter to add</span>
        </div>
        <div className="p-4 space-y-3">
          <div id="tour-source-pills" className="flex flex-wrap gap-1.5">
            {SOURCE_TYPES.map(s => {
              const cfg = SOURCE_COLORS[s]; const active = sourceType === s
              return (
                <button key={s} onClick={() => setSourceType(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                  {s}
                </button>
              )
            })}
          </div>
          <textarea ref={textareaRef} value={inputText} onChange={e => setInputText(e.target.value)}
            onKeyDown={e => (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) && addInput()}
            placeholder={`Paste a ${sourceType.toLowerCase()} here…`} rows={4}
            className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder-slate-400 transition-all" />
          <button onClick={addInput} disabled={!inputText.trim()}
            className="w-full py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
            + Add {sourceType}
          </button>
        </div>
      </div>

      {/* Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="font-display font-semibold text-sm text-slate-800">Input Queue</h3>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${inputQueue.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
              {inputQueue.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setInputQueue(MOCK_DATA)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              Load Demo
            </button>
            {inputQueue.length > 0 && (
              <button onClick={() => setInputQueue([])} className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors">
                Clear All
              </button>
            )}
          </div>
        </div>

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

        <div id="tour-queue">
          {inputQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-6">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl mb-3">📭</div>
              <p className="text-sm text-slate-500">No inputs yet.</p>
              <button onClick={() => setInputQueue(MOCK_DATA)} className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 transition-colors">
                Load 31 demo inputs →
              </button>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
              {inputQueue.map((item, i) => (
                <div key={item.id} className="group flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-mono text-slate-400 mt-0.5 shrink-0">{(i + 1).toString().padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <SourceBadge source={item.source} />
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{item.text}</p>
                  </div>
                  <button onClick={() => setInputQueue(prev => prev.filter(x => x.id !== item.id))}
                    className="shrink-0 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm mt-0.5">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button id="tour-synthesize" onClick={onSynthesize} disabled={loading || inputQueue.length === 0}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
              inputQueue.length > 0 && !loading
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}>
            {loading ? (
              <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyzing…</>
            ) : (
              <>Synthesize {inputQueue.length > 0 ? `${inputQueue.length} inputs` : ''} →</>
            )}
          </button>
          {inputQueue.length > 0 && !loading && (
            <p className="text-center text-xs text-slate-400 mt-2">~5 seconds · powered by Claude</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ inputCount, weekLabel, onRestartDemo }) {
  return (
    <header className="bg-[#0F172A] border-b border-slate-800 no-print relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-lg leading-none">📊</div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-tight tracking-tight">VoC Synthesizer</p>
              <p className="text-xs text-slate-500 font-mono leading-none">Product Operations Tool</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-700" />
          <p className="hidden sm:block text-xs text-slate-400 font-mono">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {inputCount > 0 && (
            <div className="flex items-center gap-1.5 bg-indigo-900/60 border border-indigo-700/50 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-indigo-300 font-medium">{inputCount} inputs</span>
            </div>
          )}
          <button onClick={onRestartDemo}
            className="text-xs text-slate-500 hover:text-indigo-400 font-mono transition-colors hidden sm:block">
            ▶ replay demo
          </button>
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
  const [tourStep, setTourStep] = useState(0)   // 0 = welcome modal
  const [tourActive, setTourActive] = useState(true)

  const weekLabel = (() => {
    const now = new Date()
    const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1)
    const end = new Date(start); end.setDate(start.getDate() + 6)
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `Week of ${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`
  })()

  // Fake synthesis — no API call needed for demo
  const synthesize = useCallback(async () => {
    if (inputQueue.length === 0) return
    setLoading(true); setError(null); setDigest(null)
    await new Promise(r => setTimeout(r, 2200))
    setDigest(DEMO_DIGEST)
    setLoading(false)
  }, [inputQueue])

  const advanceTour = useCallback(async () => {
    const step = DEMO_STEPS[tourStep]

    // Run the step's action before advancing
    if (step.action === 'loadDemo') {
      setInputQueue(MOCK_DATA)
    } else if (step.action === 'synthesize') {
      setTourActive(false) // hide card during synthesis
      await synthesize()
      setTourActive(true)
      setTourStep(s => s + 1)
      return
    }

    const next = tourStep + 1
    if (next >= DEMO_STEPS.length) {
      setTourActive(false)
    } else {
      setTourStep(next)
    }
  }, [tourStep, synthesize])

  const skipTour = useCallback(() => {
    setTourActive(false)
    document.querySelectorAll('.tour-highlighted').forEach(el => el.classList.remove('tour-highlighted'))
  }, [])

  const restartDemo = useCallback(() => {
    setInputQueue([])
    setDigest(null)
    setError(null)
    setTourStep(0)
    setTourActive(true)
  }, [])

  const currentTourStep = DEMO_STEPS[tourStep]

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Header inputCount={inputQueue.length} weekLabel={weekLabel} onRestartDemo={restartDemo} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          <div className="no-print">
            <InputPanel inputQueue={inputQueue} setInputQueue={setInputQueue} onSynthesize={synthesize} loading={loading} />
          </div>
          <div className="print-full">
            <DigestPanel digest={digest} loading={loading} error={error} inputQueue={inputQueue} weekLabel={weekLabel} />
          </div>
        </div>
      </main>

      <footer className="mt-12 pb-6 text-center no-print">
        <p className="text-xs text-slate-400 font-mono">
          VoC Synthesizer · Built for Director of Product Operations
        </p>
      </footer>

      {/* Tour overlay */}
      {tourActive && currentTourStep && (
        <DemoTour
          step={currentTourStep}
          stepIndex={tourStep}
          totalSteps={DEMO_STEPS.length}
          onNext={advanceTour}
          onSkip={skipTour}
        />
      )}
    </div>
  )
}
