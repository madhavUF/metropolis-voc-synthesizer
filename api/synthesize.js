// Vercel Serverless Function — proxies Claude API so the key stays server-side
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable is not set.' })
  }

  try {
    const { inputs } = req.body
    if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
      return res.status(400).json({ error: 'inputs array is required and must not be empty.' })
    }

    const userContent = inputs
      .map((item, i) => `[${String(i + 1).padStart(2, '0')}] SOURCE: ${item.source}\n${item.text}`)
      .join('\n\n---\n\n')

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
      return res.status(upstream.status).json({ error: err?.error?.message || `Upstream error ${upstream.status}` })
    }

    const data = await upstream.json()
    const rawText = data.content?.[0]?.text || ''
    const cleaned = rawText.replace(/^```json\n?/i, '').replace(/\n?```$/, '').trim()
    const digest = JSON.parse(cleaned)

    return res.status(200).json(digest)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
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

Severity: P0=active revenue loss/legal/safety, P1=significant user-facing failure, P2=degraded UX with workaround, P3=minor friction.
Type: Product Bug=needs engineering fix, Ops Issue=training/process fix, UX Friction=design/copy improvement, Unknown=unclear.
Return ONLY valid JSON. No markdown, no preamble.`
