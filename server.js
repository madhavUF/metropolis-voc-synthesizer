/**
 * server.js — Express server for self-hosting on the Lenovo ThinkCenter.
 *
 * Two modes:
 *   Development:  `npm run server`  — only serves the /api/synthesize proxy
 *                                     (Vite dev server handles the frontend on port 5173)
 *   Production:   `npm start`       — serves the built frontend from /dist AND the API proxy
 *
 * Setup:
 *   1. Copy .env.example → .env and fill in your ANTHROPIC_API_KEY
 *   2. npm run build        (build the React app)
 *   3. npm start            (serve everything on PORT, default 3001)
 */

import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

app.use(express.json({ limit: '1mb' }))

// CORS for local Vite dev server
if (!IS_PROD) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
  })
}

// ── /api/synthesize ──────────────────────────────────────────────────────────

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
  "executive_summary": "string (3-4 sentences)",
  "themes": [
    {
      "name": "string",
      "volume": number,
      "severity": "P0|P1|P2|P3",
      "type": "Product Bug|Ops Issue|UX Friction|Unknown",
      "product_area": "string",
      "representative_quote": "string (under 120 chars)",
      "suggested_action": "string"
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
  "recommended_actions": ["string"],
  "total_inputs": number
}

P0=revenue loss/legal/safety, P1=significant user failure, P2=degraded with workaround, P3=minor.
Product Bug=engineering fix, Ops Issue=training/process, UX Friction=design/copy, Unknown=unclear.
Return ONLY valid JSON. No markdown, no preamble.`

app.post('/api/synthesize', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' })
  }

  const { inputs } = req.body
  if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
    return res.status(400).json({ error: 'inputs array is required' })
  }

  const userContent = inputs
    .map((item, i) => `[${String(i + 1).padStart(2, '0')}] SOURCE: ${item.source}\n${item.text}`)
    .join('\n\n---\n\n')

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
    })

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}))
      return res.status(upstream.status).json({ error: err?.error?.message || `Upstream ${upstream.status}` })
    }

    const data = await upstream.json()
    const rawText = data.content?.[0]?.text || ''
    const cleaned = rawText.replace(/^```json\n?/i, '').replace(/\n?```$/, '').trim()
    const digest = JSON.parse(cleaned)
    return res.status(200).json(digest)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ── Static file serving (production only) ────────────────────────────────────

if (IS_PROD) {
  const distPath = join(__dirname, 'dist')
  app.use(express.static(distPath))
  // SPA fallback — send index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

// ── Start ─────────────────────────────────────────────────────────────────────

createServer(app).listen(PORT, () => {
  console.log(`\n  ✅  Metropolis VoC Synthesizer`)
  console.log(`  🌐  ${IS_PROD ? `http://localhost:${PORT}` : `API proxy on port ${PORT} (frontend: http://localhost:5173)`}`)
  console.log(`  🔑  API key: ${process.env.ANTHROPIC_API_KEY ? 'set ✓' : 'NOT SET ✗ — add to .env'}\n`)
})
