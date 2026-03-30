export const MOCK_DATA = [
  // ── Support Tickets ──────────────────────────────────────────────────────
  {
    id: 1,
    source: 'Support Ticket',
    text: 'I cancelled my subscription in July but was charged again in August and September. The app shows "cancellation pending" but the cancel button is grayed out and won\'t let me complete it. I need a full refund of $59.98.',
  },
  {
    id: 2,
    source: 'Support Ticket',
    text: 'Gate at 220 W Illinois Chicago wouldn\'t open on exit. I drove in, it recognized my plate, charged me $28, but the exit gate was stuck closed. Had to wait 20 minutes for an attendant to let me out manually.',
  },
  {
    id: 3,
    source: 'Support Ticket',
    text: 'Got a collections notice for a parking session I already paid for through the app. The notice looks like an official government citation with seal graphics and threatening language about DMV registration holds. This is deceptive. I have my receipt.',
  },
  {
    id: 4,
    source: 'Support Ticket',
    text: 'App keeps logging me out every time I close it. I have to re-enter my email and password every single time. Running iOS 17.4 on iPhone 15. This started after the last app update.',
  },
  {
    id: 5,
    source: 'Support Ticket',
    text: 'I parked at a Metropolis lot near Nashville airport. Was charged $47 at checkout but the signage at the entrance clearly says $25 max daily rate. This is a billing error and I want the difference refunded.',
  },
  {
    id: 6,
    source: 'Support Ticket',
    text: 'Tried to cancel my Metropolis membership three separate times this month. Each time the app says "cancellation request submitted" and I receive a confirmation email, but I keep getting charged. $89 in unauthorized charges so far. Filing a credit card dispute.',
  },
  {
    id: 7,
    source: 'Support Ticket',
    text: 'My vehicle was flagged by Orion for non-payment even though I have a receipt for that session. The Orion notice threatens $145 in fees and mentions DMV reporting. I have screenshot proof of payment from your own app.',
  },
  {
    id: 8,
    source: 'Support Ticket',
    text: 'The validation QR code from my employer (Salesforce Tower, San Francisco) isn\'t being applied to my parking sessions. I scan it at the gate and it says "validated" but I\'m still being charged full rate. This has happened 4 times this week.',
  },
  {
    id: 9,
    source: 'Support Ticket',
    text: 'Visit history won\'t load in the app — just shows a spinner indefinitely. I need my receipts for expense reporting. I park here daily and have 3 weeks of missing receipts. iPhone 14, iOS 17.3.',
  },
  {
    id: 10,
    source: 'Support Ticket',
    text: 'Was double-charged for the same parking session at Houston Galleria. I left and came back within 90 minutes and it treated it as two separate sessions — $18 each. The lot signage says returns within 2 hours are free. Need $18 refund.',
  },

  // ── Field Ops Reports ─────────────────────────────────────────────────────
  {
    id: 11,
    source: 'Field Ops Report',
    text: 'Location 4821 (Seattle Pioneer Square): Camera unit 2 has been intermittently offline since Monday. Estimated 12–15 vehicles missed per day. IT ticket submitted 3 days ago, no response. Manual attendant coverage added but that\'s not sustainable. Escalating.',
  },
  {
    id: 12,
    source: 'Field Ops Report',
    text: 'Nashville downtown cluster (locations 2891, 2892, 2894): Getting multiple operator calls about Orion notices being sent to customers who paid via app. Happening approximately 8x/day across 3 locations. Possible sync issue between payment confirmation and Orion trigger event.',
  },
  {
    id: 13,
    source: 'Field Ops Report',
    text: 'New fueling pilot location, Austin Domain: Operators confused about how to configure add-on pricing for EV charging inside the valet app. Training documentation references a "Configure Add-ons" button that doesn\'t exist in the current version. 4 support calls this week on this alone.',
  },
  {
    id: 14,
    source: 'Field Ops Report',
    text: 'LAX Garage B: Exit gate opening delay averaging 8–12 seconds after CV recognition. Normal is under 1 second. Causing honking, congestion, and customer complaints. Unclear if hardware (gate motor) or software (API latency) issue. Need engineering to diagnose.',
  },
  {
    id: 15,
    source: 'Field Ops Report',
    text: 'Chicago Fulton Market (Location 2203): Three cameras showing calibration errors after Tuesday\'s firmware update v2.4.1. License plate read accuracy dropped to ~71% (normally 96%+). Significant revenue at risk from missed sessions. Rollback attempted but firmware won\'t revert.',
  },
  {
    id: 16,
    source: 'Field Ops Report',
    text: 'Portland OR cluster: NOI dashboard showing $0 for yesterday across all 4 locations even though lots were fully operational. Operators are alarmed. Likely a data pipeline delay but we need confirmation from engineering — operators are threatening to call the property owners.',
  },
  {
    id: 17,
    source: 'Field Ops Report',
    text: 'Miami Brickell (Location 3301): Pedestrian door unlock (access control feature) has been non-functional for 2 days. Members who are parked cannot use it to access the adjoining building. No engineering bug filed yet — logging here as formal escalation.',
  },
  {
    id: 18,
    source: 'Field Ops Report',
    text: 'Dallas Deep Ellum new location onboarding: Took 11 days vs. SLA of 5 days. Operator very frustrated and mentioned competitor outreach. Root cause: unclear handoff between hardware install team and software activation team. No single owner for onboarding end-to-end.',
  },

  // ── App Store Reviews ────────────────────────────────────────────────────
  {
    id: 19,
    source: 'App Review',
    text: '★★ — Works great when it works but the subscription cancellation is a nightmare. I\'ve tried to cancel 4 times over 2 months and keep getting charged $29.99/month. Had to dispute charges with my credit card. Fix your cancellation flow.',
  },
  {
    id: 20,
    source: 'App Review',
    text: '★★★★★ — Honestly impressed. Drove into the garage, parked, drove out, and got a receipt in seconds. No ticket, no booth, no fumbling for cash. This is how parking should work everywhere. 10/10.',
  },
  {
    id: 21,
    source: 'App Review',
    text: '★★ — Received an intimidating letter in the mail with what looks like a government seal demanding $89 for a session I have a receipt for. The letter implies DMV action. Researched it and found a class action lawsuit. Very concerning. Deleting the app.',
  },
  {
    id: 22,
    source: 'App Review',
    text: '★★★ — App works fine but it keeps logging me out every time I close it. Minor annoyance but getting old — I park daily and re-entering my password every morning is frustrating.',
  },
  {
    id: 23,
    source: 'App Review',
    text: '★★★★ — Love the employer validation QR feature. Saves me $15/day. Wish the nearby restaurant partnerships extended to more blocks — the map shows a lot of gaps in my area.',
  },
  {
    id: 24,
    source: 'App Review',
    text: '★★ — Charged me twice for the same parking session. Support took 12 days to respond. Eventually refunded but the back-and-forth was exhausting. Reliability issues are a real problem if you park here regularly.',
  },

  // ── Internal Escalations ─────────────────────────────────────────────────
  {
    id: 25,
    source: 'Internal Escalation',
    text: '[Customer Success → Product] Orion false positive spike in Nashville — we\'re getting overwhelmed with refund requests, roughly 40 tickets/day on this issue alone. CS team suspects the payment confirmation webhook is firing after Orion trigger, not before. Can engineering look at webhook ordering ASAP? Customers are angry.',
  },
  {
    id: 26,
    source: 'Internal Escalation',
    text: '[Sales → Product] Chicago Fulton Market property owner (renewal meeting last Thursday) asked why their NOI dashboard doesn\'t include EV charging revenue in the totals. It\'s a known data gap but nobody told them. They\'re 60 days from renewal. This could cost us the contract.',
  },
  {
    id: 27,
    source: 'Internal Escalation',
    text: '[Ops → Product] Three location managers in the Austin fueling pilot called this week about the valet app EV charging add-on configuration. The training doc references a "Configure Add-ons" button that was removed in v3.1. Either the docs need to be updated or the feature needs to be restored. Pilot is at risk.',
  },
  {
    id: 28,
    source: 'Internal Escalation',
    text: '[Engineering → Product] Flagging for P0 awareness: Orion trigger events are up 340% over the past 5 days, concentrated in Nashville. Root cause trace shows payment confirmation webhook p99 latency is at 4.2 seconds (SLA: <500ms). Orion is firing before payment is confirmed. This is generating false positives at scale and legal/CS exposure.',
  },
  {
    id: 29,
    source: 'Internal Escalation',
    text: '[Customer Success → Product] Subscription cancellation failure rate hit 34% this week, up from 8% last week. Onset correlates exactly with v4.2.1 app release on Tuesday. We\'re logging ~60 cases/day. Users have to call in to cancel manually. NPS from this cohort is cratering. Need a hotfix or rollback decision this week.',
  },
  {
    id: 30,
    source: 'Internal Escalation',
    text: '[Sales → Product] Large enterprise prospect (Fortune 500 healthcare company, 2,000 employees, Dallas campus) is asking about bulk employer validation — they need all employees auto-validated without individual QR scans. Current product doesn\'t support this. It\'s blocking a $180K ARR deal. Is this on the roadmap? Can we expedite?',
  },
  {
    id: 31,
    source: 'Internal Escalation',
    text: '[Ops → Product] Hospitality pilot update — the hotel valet team at the Austin Marriott location is asking about tipping functionality in the valet app. Guests are asking how to tip and there\'s no UI for it. Valet operators say this is standard in competitor apps. Could be blocking hospitality vertical expansion.',
  },
]
