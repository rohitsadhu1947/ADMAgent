# ADM Feedback Intelligence Workflow — Detailed Swimlane Design

## Executive Summary

When an ADM collects feedback from a dormant/inactive agent about why they stopped selling, that feedback enters a digital channel (Telegram/WhatsApp). An AI model classifies the reason into one of 5 departmental buckets, triggers an SLA-bound workflow to the responsible department, collects their response, generates an ADM-ready communication script, and pushes it back to the ADM via the same channel — closing the loop.

---

## The 5 Departmental Buckets

| # | Bucket | Dept Owner | Description | Example Reasons |
|---|--------|-----------|-------------|-----------------|
| 1 | **Underwriting** | UW Team | Risk selection, policy rejections, pricing, medical requirements | "Too many policy rejections in my district", "Price is too high for customers", "Medical underwriting too strict", "NRI cases not getting cleared", "Proposals stuck in UW for weeks" |
| 2 | **Finance** | Finance Team | Commissions, payouts, incentive discrepancies | "Commission not paid on time", "Commission of 2.5L stuck for 3 years", "Persistency clawback unfair", "Contest prize not received despite meeting criteria", "Low commission on small ticket policies" |
| 3 | **Contest & Engagement** | Contest/Marketing Team | Contests, recognition, engagement programs, motivational initiatives | "Not enough contests", "Met all contest criteria but didn't get prize", "No recognition for consistent performers", "Contest rules changed midway", "No engagement programs for part-time agents" |
| 4 | **Operations** | Ops/IT Team | Systems, policy issuance, payment gateways, app issues, process friction | "Policy generation failures", "Payment failures at PG level", "App/system not working", "Cumbersome digital journey", "Document upload issues", "Login problems", "Payout processing delays" |
| 5 | **Product** | Product Team | Product complexity, competitiveness, gaps, customer objections on product design | "Products too complex to explain", "Competitor products are better/cheaper", "No monthly installment option", "No low ticket size products", "Customers prefer online purchase", "No term plans for young customers" |

---

## Comprehensive Reason Taxonomy

Derived from the client's sample data (171 responses from 111 agents) + expanded reasoning:

### Bucket 1: UNDERWRITING
| Reason Code | Reason | Sub-reasons / Variants |
|-------------|--------|----------------------|
| UW-01 | High policy rejection rate | District-specific rejections, rural area rejections, specific age-group rejections |
| UW-02 | Premium pricing too high | Customers find premiums unaffordable, 1-year installment too large, no monthly option |
| UW-03 | Medical underwriting too strict | Excessive medical tests, age-based restrictions, pre-existing condition rejections |
| UW-04 | NRI/special case processing | NRI cases stuck, tax benefit issues for NRI customers, documentation overload |
| UW-05 | Proposal stuck in UW queue | Long processing times, no status updates, proposals pending for weeks |
| UW-06 | Eligibility criteria too narrow | Income proof requirements too strict, occupation restrictions, rural customer exclusion |
| UW-07 | Counter-offer dissatisfaction | Sum assured reduced, riders removed, premium loaded without explanation |

### Bucket 2: FINANCE
| Reason Code | Reason | Sub-reasons / Variants |
|-------------|--------|----------------------|
| FIN-01 | Commission not paid on time | Delayed payout, pending for months, no clarity on timeline |
| FIN-02 | Commission amount disputed | Lower than expected, calculation unclear, deductions unexplained |
| FIN-03 | Commission stuck/blocked | Large amounts stuck for years (e.g., 2.5L stuck for 3 years), no resolution |
| FIN-04 | Persistency clawback | Commission reversed due to customer lapse, unfair recovery |
| FIN-05 | Low commission rates | Small ticket policies give negligible commission, not worth the effort |
| FIN-06 | Contest prize not received | Met criteria but no payout, delayed prize distribution |
| FIN-07 | Incentive structure unclear | Don't understand how commission is calculated, no transparency |
| FIN-08 | Tax deduction issues | TDS too high, no proper tax documentation provided |

### Bucket 3: CONTEST & ENGAGEMENT
| Reason Code | Reason | Sub-reasons / Variants |
|-------------|--------|----------------------|
| CON-01 | Insufficient contests | Not enough motivation programs, only for top performers |
| CON-02 | Contest criteria unfair | Rules changed midway, criteria too high for part-time agents |
| CON-03 | Contest prize not honoured | Did everything required but didn't receive the prize |
| CON-04 | No recognition program | No appreciation for consistent small performers, only big cases celebrated |
| CON-05 | Engagement gap with office | No regular contact, office doesn't reach out, feel disconnected |
| CON-06 | No re-engagement programs | No specific programs to bring back inactive agents |
| CON-07 | Training schedule mismatch | Training only in morning, need evening/weekend options, online preferred |
| CON-08 | No marketing material | No brochures, no digital material to share with prospects |

### Bucket 4: OPERATIONS
| Reason Code | Reason | Sub-reasons / Variants |
|-------------|--------|----------------------|
| OPS-01 | Policy issuance failures | Policy generation errors, stuck in processing |
| OPS-02 | Payment gateway failures | Customer payment fails, retry issues, UPI/card failures |
| OPS-03 | App/system not working | Login issues, app crashes, slow performance |
| OPS-04 | Cumbersome digital journey | Too many steps, not mobile-friendly, document upload issues |
| OPS-05 | Payout processing delays | System delays in processing agent payouts |
| OPS-06 | Customer portal issues | Customers can't access policy details, premium payment issues |
| OPS-07 | Surrender/modification issues | Policy surrender process complicated, modification requests stuck |
| OPS-08 | Communication system failures | SMS/email notifications not reaching customers or agents |

### Bucket 5: PRODUCT
| Reason Code | Reason | Sub-reasons / Variants |
|-------------|--------|----------------------|
| PRD-01 | Products too complex | Hard to explain to customers, too many riders/options |
| PRD-02 | Competitor products better | Other companies offer better returns, lower premiums, simpler products |
| PRD-03 | No low ticket size products | Customers want monthly ₹500-1000 products, minimum premium too high |
| PRD-04 | Customers prefer online | Customers research online, buy direct, agent feels disintermediated |
| PRD-05 | Limited product range | No health insurance, no short-term plans, no micro-insurance |
| PRD-06 | Product-market mismatch | Rural customers need different products, agriculture-income customers underserved |
| PRD-07 | Maturity/returns complaints | Customers unhappy with maturity value, expected higher returns |
| PRD-08 | Mis-selling legacy issues | Past mis-sold policies eroding trust, agents blamed for company product issues |

### Cross-cutting reasons (NOT routed to departments — handled by ADM/Branch)
These are non-actionable by departments but important to track:
- Agent health issues / family problems
- Agent changed job / occupation / city
- Agent retired / no longer working
- Agent's natural market exhausted (needs lead generation support — routed to Contest & Engagement)
- ADM change / no ADM mapped (routed to Contest & Engagement as engagement gap)
- Agent hired as wrong profile (student, not interested in LI)

---

## Swimlane Workflow Diagram

```
┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│     ADM      │  │   AI MODEL   │  │  DEPARTMENT   │  │  AI MODEL    │  │     ADM      │
│  (Channel)   │  │  (Classifier │  │  (UW/FIN/CON/ │  │  (Script     │  │  (Channel)   │
│              │  │   + Router)  │  │   OPS/PRD)    │  │   Generator) │  │              │
├─────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│             │  │              │  │              │  │              │  │              │
│ ① ADM submits│  │              │  │              │  │              │  │              │
│ feedback via │──┤►             │  │              │  │              │  │              │
│ Telegram/WA  │  │              │  │              │  │              │  │              │
│             │  │ ② Parse &    │  │              │  │              │  │              │
│ Includes:    │  │ extract:     │  │              │  │              │  │              │
│ - Agent name │  │ - Core reason│  │              │  │              │  │              │
│ - Reason     │  │ - Sentiment  │  │              │  │              │  │              │
│ - Context    │  │ - Urgency    │  │              │  │              │  │              │
│ - District   │  │              │  │              │  │              │  │              │
│             │  │ ③ Classify   │  │              │  │              │  │              │
│             │  │ into bucket: │  │              │  │              │  │              │
│             │  │ UW/FIN/CON/  │  │              │  │              │  │              │
│             │  │ OPS/PRD      │  │              │  │              │  │              │
│             │  │              │  │              │  │              │  │              │
│             │  │ ④ Assign     │  │              │  │              │  │              │
│             │  │ reason code  │  │              │  │              │  │              │
│             │  │ (UW-01, etc) │  │              │  │              │  │              │
│             │  │              │  │              │  │              │  │              │
│             │  │ ⑤ Generate   │  │              │  │              │  │              │
│             │  │ dept ticket  │──┤►             │  │              │  │              │
│             │  │ with SLA     │  │              │  │              │  │              │
│             │  │              │  │ ⑥ Dept sees  │  │              │  │              │
│ ⑤a ADM gets │◄├──────────────│  │ ticket in    │  │              │  │              │
│ confirmation │  │ "Feedback    │  │ their queue  │  │              │  │              │
│ "Your feedback│  │  received,   │  │              │  │              │  │              │
│ has been sent│  │  routed to   │  │ Includes:    │  │              │  │              │
│ to [Dept].   │  │  [Dept].     │  │ - Reason     │  │              │  │              │
│ Expected     │  │  SLA: 48hrs" │  │ - Agent info │  │              │  │              │
│ response in  │  │              │  │ - District   │  │              │  │              │
│ 48 hours"    │  │              │  │ - Context    │  │              │  │              │
│             │  │              │  │ - Suggested  │  │              │  │              │
│             │  │              │  │   data points│  │              │  │              │
│             │  │              │  │ - SLA timer  │  │              │  │              │
│             │  │              │  │              │  │              │  │              │
│             │  │              │  │ ⑦ Dept       │  │              │  │              │
│             │  │              │  │ responds:    │  │              │  │              │
│             │  │              │  │ - Resolution │──┤►             │  │              │
│             │  │              │  │ - Action     │  │              │  │              │
│             │  │              │  │ - Evidence   │  │              │  │              │
│             │  │              │  │ - Alt options│  │              │  │              │
│             │  │              │  │              │  │ ⑧ Analyze    │  │              │
│             │  │              │  │              │  │ dept response│  │              │
│             │  │              │  │              │  │              │  │              │
│             │  │              │  │              │  │ ⑨ Generate   │  │              │
│             │  │              │  │              │  │ ADM script:  │  │              │
│             │  │              │  │              │  │ - Empathetic │  │              │
│             │  │              │  │              │  │   opening    │  │              │
│             │  │              │  │              │  │ - Core msg   │  │              │
│             │  │              │  │              │  │ - Objection  │  │              │
│             │  │              │  │              │  │   handling   │──┤►             │
│             │  │              │  │              │  │ - Alt options│  │              │
│             │  │              │  │              │  │ - Next steps │  │ ⑩ ADM       │
│             │  │              │  │              │  │              │  │ receives    │
│             │  │              │  │              │  │              │  │ script on   │
│             │  │              │  │              │  │              │  │ Telegram/WA │
│             │  │              │  │              │  │              │  │             │
│             │  │              │  │              │  │              │  │ References: │
│             │  │              │  │              │  │              │  │ - Agent name│
│             │  │              │  │              │  │              │  │ - Original  │
│             │  │              │  │              │  │              │  │   query     │
│             │  │              │  │              │  │              │  │ - Script to │
│             │  │              │  │              │  │              │  │   use with  │
│             │  │              │  │              │  │              │  │   agent     │
└─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Detailed Step-by-Step Flow

### PHASE 1: Feedback Collection (ADM → System)

**Step ① — ADM Submits Feedback via Digital Channel**

The ADM interacts with the Telegram/WhatsApp bot after meeting with or calling a dormant agent.

```
Bot: "You've logged a call with Agent Ramesh Kumar.
      What reason did the agent give for being inactive?"

ADM types: "He says too many of his proposals are getting
            rejected in Hardoi district. His customers are
            mostly agriculture-based and the UW team keeps
            declining them. He's frustrated and thinking of
            joining LIC instead."
```

**Data captured:**
| Field | Value | Source |
|-------|-------|--------|
| ADM ID | 7 | Session (logged in ADM) |
| Agent ID | 234 | Selected from ADM's agent list |
| Agent Name | Ramesh Kumar | From DB |
| District | Hardoi | From agent record + extracted from text |
| Raw Feedback Text | "He says too many of his proposals..." | ADM's free-text input |
| Channel | Telegram | System |
| Timestamp | 2026-02-20 14:30 IST | System |
| Interaction Type | Feedback | System |

---

### PHASE 2: AI Classification & Routing (System)

**Step ② — Parse & Extract**

The AI model (Claude) processes the raw text:

```json
{
  "parsed": {
    "core_issue": "High proposal rejection rate for agriculture-based customers in Hardoi district",
    "sentiment": "frustrated",
    "urgency": "high",
    "churn_risk": "high — mentions joining competitor (LIC)",
    "district": "Hardoi",
    "customer_segment": "agriculture-based",
    "keywords": ["proposal rejection", "agriculture", "UW declining", "Hardoi"]
  }
}
```

**Step ③ — Classify into Bucket**

AI determines: **UNDERWRITING** (confidence: 0.94)

Reasoning: "Proposal rejections due to underwriting risk appetite for agriculture-based customers in a specific district is clearly an underwriting policy/risk selection issue."

**Step ④ — Assign Reason Code**

Primary: `UW-01` (High policy rejection rate)
Secondary: `UW-06` (Eligibility criteria too narrow — agriculture income)

**Step ⑤ — Generate Department Ticket**

```json
{
  "ticket_id": "FB-2026-00847",
  "bucket": "UNDERWRITING",
  "reason_code": "UW-01",
  "priority": "HIGH",
  "sla_hours": 48,
  "sla_deadline": "2026-02-22T14:30:00+05:30",
  "subject": "High proposal rejection rate — Hardoi district, agriculture segment",
  "body": {
    "summary": "ADM reports agent Ramesh Kumar (Hardoi) is inactive due to high proposal rejection rate for agriculture-based customers. Agent is considering joining LIC. Multiple agents in Hardoi may be affected.",
    "agent_details": {
      "name": "Ramesh Kumar",
      "id": 234,
      "district": "Hardoi",
      "vintage": "3-4 years",
      "historical_nop": 8,
      "current_status": "dormant",
      "last_policy_date": "2025-06-15"
    },
    "data_points": {
      "rejection_rate_hardoi": "34% (vs 18% national avg)",
      "agriculture_segment_rejection": "52%",
      "affected_agents_hardoi": 4
    },
    "adm_name": "Rohit Sadhu",
    "original_feedback": "He says too many of his proposals are getting rejected..."
  }
}
```

**Step ⑤a — Confirm to ADM**

```
Bot → ADM (Telegram):
"✅ Feedback received for Agent Ramesh Kumar.

📋 Issue classified as: Underwriting — High rejection rate
🏷️ Ticket: FB-2026-00847
📨 Routed to: Underwriting Team
⏰ Expected response: Within 48 hours

I'll notify you as soon as the team responds."
```

---

### PHASE 3: Department Action (Department)

**Step ⑥ — Department Reviews Ticket**

The Underwriting team sees the ticket in their department dashboard (web interface or email notification):

- Ticket with all context, data points, and the original feedback
- SLA timer visible (48 hours counting down)
- Can see aggregated data: "This is the 4th feedback about Hardoi rejections this month"

**Step ⑦ — Department Responds**

The UW team responds via the department dashboard:

```
Response Type: Detailed Resolution
Status: Acknowledged — Action Being Taken

Response: "We've reviewed the Hardoi district rejection data.
The rejection rate for agriculture-segment proposals was 34%
due to our risk model flagging inconsistent income documentation.
We are implementing the following:
1. Revised income proof guidelines for agriculture-based customers
   (will accept crop receipts and mandi records) — effective March 1
2. Dedicated UW desk for rural districts including Hardoi
3. Agent can resubmit rejected proposals after March 1 under new guidelines

For existing rejected proposals: Agent should collect latest
crop receipts (Kharif 2025) and we will re-evaluate on priority.

Alternative: For customers who cannot provide crop documentation,
suggest Axis Max Life Smart Wealth Plan which has simpler UW norms."
```

---

### PHASE 4: AI Script Generation (System)

**Step ⑧ — Analyze Department Response**

AI analyzes the response:
- **Resolution type**: Positive — concrete action with timeline
- **Complexity**: Medium — has specific steps for the agent
- **Alternatives provided**: Yes — simpler product option
- **Evidence/data**: Yes — specific guidelines and dates
- **Tone calibration**: Encouraging — there IS a solution

**Step ⑨ — Generate ADM Communication Script**

AI creates a script the ADM can use when speaking to the agent:

```
🗣️ COMMUNICATION SCRIPT FOR ADM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Reference: Feedback for Agent Ramesh Kumar
📌 Original Issue: Proposal rejections in Hardoi (agriculture segment)
📌 Ticket: FB-2026-00847

OPENING (Empathetic + Acknowledgment):
"Ramesh ji, I spoke to you last week about the proposal rejections
you've been facing. I want you to know I took this up directly with
our underwriting team, and I have some really positive news."

CORE MESSAGE (Resolution):
"The team reviewed the data and found that 34% of proposals from
Hardoi were getting rejected because of income documentation rules
that weren't practical for agriculture-based customers. They've now
made specific changes:

1. From March 1st, they will accept crop receipts and mandi records
   as valid income proof — which your customers will have.
2. They're setting up a dedicated team just for rural districts
   like ours, so proposals will get faster, more informed decisions.
3. For those proposals that were already rejected — if you collect
   the latest Kharif 2025 crop receipts, they'll re-evaluate them
   on priority."

ALTERNATIVE OPTION:
"Also, for customers who may not have crop documentation readily
available, there's the Smart Wealth Plan which has simpler
requirements. I can walk you through it if you'd like."

OBJECTION HANDLING:
If agent says "I've already started talking to LIC":
→ "I completely understand, Ramesh ji. But consider this — the
   issues you faced were specific to documentation rules that are
   now being fixed. LIC will have their own processes. Here, you
   already have relationships, pending proposals that can be
   revived, and I'm personally ensuring your cases get attention."

If agent says "How do I trust this won't happen again?":
→ "Fair question. The new guidelines are already published
   internally. I'll share the simplified checklist with you so
   you know exactly what to collect before submitting. And I'm
   here to pre-check every proposal before it goes to UW."

NEXT STEPS:
1. "Can we meet on [date] so I can show you the new documentation
   checklist?"
2. "Bring the crop receipts for your previously rejected customers
   — let's resubmit those first."
3. "I'll also brief you on the Smart Wealth Plan as a backup option."

CLOSING:
"Ramesh ji, your experience matters to us. This change happened
because you spoke up. Let's get those proposals moving."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### PHASE 5: Delivery to ADM (System → ADM)

**Step ⑩ — Push Script to ADM via Channel**

```
Bot → ADM (Telegram):
"📬 Response received for your feedback!

Agent: Ramesh Kumar
Issue: Proposal rejections in Hardoi
Ticket: FB-2026-00847

🏢 Underwriting Team Response:
They've acknowledged the issue and are making changes
effective March 1st — revised income proof guidelines
for agriculture customers, dedicated rural UW desk,
and priority re-evaluation of rejected proposals.

🗣️ Here's your communication script to discuss this
with Ramesh Kumar:

[Full script as above]

Would you like me to:
1️⃣ Schedule a follow-up call with this agent?
2️⃣ Get more details from the UW team?
3️⃣ See similar resolved cases for reference?"
```

---

## SLA Framework

| Bucket | Priority HIGH | Priority MEDIUM | Priority LOW |
|--------|-------------|----------------|-------------|
| **Underwriting** | 24 hours | 48 hours | 72 hours |
| **Finance** | 24 hours | 48 hours | 72 hours |
| **Contest** | 48 hours | 72 hours | 5 business days |
| **Operations** | 4 hours (system down) / 24 hours (other) | 48 hours | 72 hours |
| **Product** | 48 hours | 72 hours | 5 business days |

**Priority determination (by AI):**
- **HIGH**: Agent mentions joining competitor, multiple agents affected, revenue impact > ₹5L, system outage
- **MEDIUM**: Single agent frustrated, recurring issue (3+ similar feedbacks), moderate churn risk
- **LOW**: Informational query, one-off issue, agent still somewhat engaged

**SLA Escalation:**
- 75% of SLA elapsed → Reminder to department
- SLA breached → Escalate to department head + notify ADM of delay
- 2x SLA breached → Escalate to CXO level + generate interim response for ADM

---

## Department Response Types

The AI handles different response qualities:

| Response Type | AI Action |
|--------------|-----------|
| **Detailed resolution with action plan** | Generate full script with specifics, alternatives, and next steps |
| **Simple "Yes, we'll fix it"** | Generate script that acknowledges, sets expectations with agent on timeline, and suggests interim alternatives |
| **"No, this cannot be changed"** | Generate empathetic script with evidence/reasoning, provide alternative approaches, suggest what ADM can do instead |
| **"We need more information"** | Ask ADM for specific additional details, keep ticket open |
| **Partial response** | Generate interim script, keep ticket open for full resolution |
| **No response (SLA breach)** | Generate interim script ("We've escalated this, expected resolution by X"), trigger escalation |

### Example: "NO" Response Script Generation

If Finance team responds: *"Commission rates for small ticket policies are set by IRDAI guidelines. We cannot increase them."*

```
AI generates:

OPENING:
"Ramesh ji, I followed up on the commission concern you raised.
I want to be transparent with you about what I found."

CORE MESSAGE:
"The commission rates on smaller policies are actually regulated
by IRDAI — they set the maximum, and all companies follow the
same structure. So this isn't something Max Life can change
independently."

PIVOT TO ALTERNATIVE:
"However, here's what I was thinking — instead of focusing on
small individual policies, what if we look at this differently:
1. Group policies from your agriculture contacts — these have
   higher commission rates and you already have the network
2. The Smart Wealth Plan has a higher ticket size but we can
   position it as a savings+protection tool
3. There's a volume bonus program — if you close 5+ policies
   in a quarter, there's an additional 2% bonus"

EVIDENCE:
"I checked — agents who shifted to this approach are earning
30-40% more per quarter. I can show you the numbers."
```

---

## Edge Cases & Special Handling

### Multi-bucket Feedback
When feedback spans multiple departments:
```
ADM: "Agent says proposals are rejected AND commission is delayed
      AND the app keeps crashing"
```
→ AI creates **3 separate tickets** (UW-01, FIN-01, OPS-03)
→ ADM receives one consolidated acknowledgment
→ Responses come back individually but final script is consolidated

### Non-departmental Issues
Issues like "agent changed job", "health issues", "natural market exhausted":
→ NOT routed to any department
→ AI generates an immediate playbook for the ADM:
  - For health issues: "Check in periodically, no pressure, maintain relationship"
  - For job change: "Position LI as side income, flexible hours, share success stories"
  - For natural market exhausted: Route to Contest & Engagement for lead generation programs

### Repeat Feedback
If same agent/issue is raised multiple times:
→ AI detects duplicate, references previous ticket
→ If unresolved: escalates priority
→ If resolved: asks ADM if previous resolution didn't work

### Aggregation Alerts
When AI detects pattern across multiple feedbacks:
```
"⚠️ PATTERN ALERT: 12 agents across 4 ADMs in Bihar region
have reported UW rejections for agriculture customers in the
last 30 days. This may indicate a systemic issue."
```
→ Auto-generates an aggregate report for department head

---

## Data Model Summary

### New Entities Needed

```
FeedbackTicket
├── ticket_id (FB-YYYY-NNNNN)
├── agent_id (FK → Agent)
├── adm_id (FK → ADM)
├── channel (telegram/whatsapp)
├── raw_feedback_text
├── parsed_summary
├── bucket (underwriting/finance/contest/operations/product)
├── reason_code (UW-01, FIN-03, etc.)
├── priority (high/medium/low)
├── urgency_score (0-10)
├── churn_risk (high/medium/low)
├── sentiment (frustrated/neutral/positive)
├── sla_hours
├── sla_deadline
├── status (received/classified/routed/pending_dept/responded/script_sent/closed)
├── department_response_text
├── department_responded_at
├── generated_script
├── script_sent_at
├── adm_feedback_on_script (helpful/not_helpful)
├── created_at
├── updated_at
├── related_tickets[] (for multi-bucket or repeat cases)

DepartmentQueue
├── department (underwriting/finance/contest/operations/product)
├── ticket_id (FK → FeedbackTicket)
├── assigned_to (department user)
├── status (open/in_progress/responded/escalated)
├── sla_status (on_track/warning/breached)
├── escalation_level (0/1/2)

ReasonTaxonomy
├── code (UW-01, FIN-03, etc.)
├── bucket
├── reason_name
├── description
├── keywords[] (for AI classification training)
├── suggested_data_points[] (what data to pull for this reason)
├── typical_sla_hours

AggregationAlert
├── pattern_type (district/reason/bucket)
├── description
├── affected_agents_count
├── affected_adms_count
├── region
├── tickets[] (FK → FeedbackTicket)
├── auto_escalated (boolean)
├── created_at
```

---

## Flow Summary (One-liner per step)

```
① ADM submits agent feedback via Telegram/WhatsApp
② AI parses text → extracts core issue, sentiment, urgency, district
③ AI classifies into bucket (UW/FIN/CON/OPS/PRD) with confidence score
④ AI assigns specific reason code (UW-01, FIN-03, etc.)
⑤ System generates SLA-bound ticket → routes to department queue
⑤a ADM gets instant confirmation with ticket ID and expected timeline
⑥ Department team sees ticket with full context + data enrichment
⑦ Department responds with resolution/action/evidence/alternatives
⑧ AI analyzes response quality and type (yes/no/partial/detailed)
⑨ AI generates tailored ADM communication script with objection handling
⑩ System pushes script to ADM via same channel, referencing original query
```

**Total touchpoints for ADM: 2** (submit feedback → receive script)
**Total touchpoints for Department: 1** (respond to ticket)
**Everything else is automated by AI.**
