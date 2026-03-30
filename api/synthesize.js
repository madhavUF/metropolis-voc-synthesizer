// Edge Runtime — avoids Node.js module quirks, has native fetch
export const config = { runtime: 'edge' }

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

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export default async function handler(req) {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY is not set in Vercel environment variables.' }, 500)

    const body = await req.json()
    const { inputs } = body
    if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
      return json({ error: 'inputs array is required and must not be empty.' }, 400)
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

    const upstreamText = await upstream.text()

    if (!upstream.ok) {
      let errMsg = `Anthropic API error ${upstream.status}`
      try { errMsg = JSON.parse(upstreamText)?.error?.message || errMsg } catch (_) {}
      return json({ error: errMsg }, upstream.status)
    }

    const data = JSON.parse(upstreamText)
    const rawText = data.content?.[0]?.text || ''
    const cleaned = rawText.replace(/^```json\n?/i, '').replace(/\n?```$/, '').trim()
    const digest = JSON.parse(cleaned)

    return json(digest)
  } catch (err) {
    return json({ error: err.message || 'Internal server error' }, 500)
  }
}
