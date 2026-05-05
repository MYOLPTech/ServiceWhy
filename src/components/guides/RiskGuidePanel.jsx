import React, { useState } from 'react';
import { X, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    title: '1. Identifying and Defining the Risk',
    content: `Every risk entry must clearly describe a specific threat scenario, not a vague concern.

• **Risk statement format:** "There is a risk that [threat] will [action], resulting in [impact]." Be specific and avoid combining multiple risks in one statement.
• **Risk categories in scope:**
  - Technical: Vulnerabilities, misconfigurations, software flaws, cryptographic failures
  - Operational: Process failures, human error, inadequate procedures
  - Organisational: Governance gaps, skill shortages, cultural issues
  - Legal/Regulatory: Non-compliance with Australian law (Privacy Act, SOCI Act, APRA standards, Corporations Act)
  - Third Party: Supply chain, vendor, and subservice organisation risks
  - Physical: Physical access, environmental hazards, equipment failure
• **Threat intelligence:** Use Australian-specific threat intelligence from the Australian Signals Directorate (ASD) Annual Cyber Threat Report, ACSC advisories, and the MITRE ATT&CK framework to ensure your risk register reflects realistic and current threats.
• **Asset linkage:** Every risk should be linked to one or more specific assets (system, process, data type). Reference your asset register.
• **Regulatory context:** Consider whether the risk relates to obligations under: Privacy Act 1988 (NDB scheme), APRA CPS 234, Security of Critical Infrastructure Act 2018, ASX Corporate Governance Principles, or sector-specific regulation.`
  },
  {
    title: '2. Likelihood Assessment (1–5 Scale)',
    content: `Likelihood measures how probable the risk event is to occur within the assessment period (typically 12 months).

**Rating Scale:**
• **5 – Almost Certain:** Expected to occur in most circumstances. Evidence of recent occurrence in similar Australian organisations. ASD/ACSC has issued active advisories on this threat.
• **4 – Likely:** Will probably occur in most circumstances. The threat actor has demonstrated capability and intent. Common in Australian industry (e.g., BEC fraud, ransomware against SMEs).
• **3 – Possible:** Might occur at some time. Threat exists but requires specific circumstances. Seen occasionally in Australian organisations.
• **2 – Unlikely:** Could occur at some time, but uncommon. Requires sophisticated threat actor or unlikely alignment of circumstances.
• **1 – Rare:** May only occur in exceptional circumstances. Highly unlikely given current threat environment and existing controls.

**Factors to consider for Australian context:**
• Australian organisations are frequently targeted by state-sponsored actors (ACSC has documented targeting by state actors).
• BEC (Business Email Compromise) is one of the most common and costly cyber crimes against Australian businesses (ACSC data).
• Ransomware attacks on Australian critical infrastructure and healthcare are increasing.
• Physical location: organisations in major Australian cities face different physical threat profiles than regional locations.
• Consider existing controls that reduce likelihood — document why a rating is adjusted down due to controls.`
  },
  {
    title: '3. Impact Assessment (1–5 Scale)',
    content: `Impact measures the consequence to the organisation if the risk event occurs.

**Rating Scale:**
• **5 – Catastrophic:** Organisation-wide, existential impact. Major regulatory enforcement action (e.g., OAIC determination with significant penalties under the Privacy Act). Class action litigation. Loss of operating licence. Data breach affecting millions of Australians.
• **4 – Major:** Significant financial loss, significant service disruption, or reportable notifiable data breach. APRA supervisory intervention. Material ASX disclosure. Multiple regulators involved.
• **3 – Moderate:** Meaningful operational disruption. Regulatory inquiry or formal investigation. Financial loss manageable but significant. Limited customer impact.
• **2 – Minor:** Short-term disruption with rapid recovery. Low financial impact. Minimal regulatory exposure. Contained to a small number of individuals.
• **1 – Negligible:** No material operational impact. Handled within normal operations. No regulatory or reputational consequence.

**Australian-specific impact considerations:**
• Privacy Act penalties: Up to $50M for serious or repeated privacy breaches (post-2022 reform).
• APRA enforcement: Can result in licence conditions, enforceable undertakings, or disqualification of responsible persons.
• NDB reporting cost: Regulatory investigation, mandatory notification letters, credit monitoring for affected individuals, potential OAIC determinations.
• Reputational: Australian consumers have high expectations of data handling following major Australian breach incidents (Optus, Medibank, Latitude).`
  },
  {
    title: '4. Risk Scoring and Rating',
    content: `Calculate the risk score and apply the rating to prioritise treatment.

**Formula:** Risk Score = Likelihood × Impact

**Rating Matrix:**
• **Score 20–25 (Critical):** Immediate treatment required. Escalate to Board and CEO. Report to regulator if applicable. Implement compensating controls immediately. Weekly status updates to executive.
• **Score 12–19 (High):** Treatment plan required within 30 days. Executive notification. Monthly progress reporting. Consider interim controls while permanent treatment is implemented.
• **Score 6–11 (Medium):** Treatment plan required within 90 days. Regular monitoring. Report to CISO monthly.
• **Score 1–5 (Low):** Monitor. Accept or treat as resources allow. Annual review sufficient.

**Inherent vs Residual Risk:**
• Always document both the inherent risk (before controls) and the residual risk (after controls are applied).
• The gap between inherent and residual risk demonstrates the value of your controls — important for ASAE 3150 and ISO 27001 auditors.
• Ensure residual risk ratings fall within the organisation's documented risk appetite.

**Risk Appetite Statement:**
• Document the organisation's risk appetite for each category. In APRA-regulated entities, CPS 234 requires a documented risk appetite for information security. ISO 27001 clause 6.1.2 requires risk acceptance criteria.`
  },
  {
    title: '5. Selecting and Designing Risk Treatment',
    content: `Choose the most appropriate treatment strategy and design the specific controls.

**Treatment Options:**
• **Mitigate:** Implement controls to reduce likelihood or impact. This is the most common treatment. Refer to ISO 27001 Annex A controls, the ASD Essential Eight, or SOC 2 Trust Services Criteria for control selection.
• **Accept:** Accept the residual risk within appetite. Must be formally documented and approved by the CISO and relevant executive. Include a review date. Risk acceptance is not "ignoring" — it is a deliberate, documented decision.
• **Transfer:** Transfer financial consequence via cyber insurance (Australian market: check APRA-regulated insurer, AIG, Chubb, etc.), or via contractual liability allocation to vendors. Note: transfer does not remove the risk, only the financial consequence.
• **Avoid:** Discontinue the business activity that creates the risk. Rarely used but appropriate for extreme risks where treatment is not cost-effective.

**ASD Essential Eight alignment:**
For technical risks, map your mitigation to the ASD Essential Eight:
1. Patch Applications — 2. Patch Operating Systems — 3. Multi-Factor Authentication — 4. Restrict Administrative Privileges — 5. Application Control — 6. Restrict Microsoft Office Macros — 7. User Application Hardening — 8. Regular Backups.
The Australian Government mandates Essential Eight compliance for government entities. Industry is strongly encouraged to adopt it.`
  },
  {
    title: '6. Documenting the Treatment Plan',
    content: `A good treatment plan is specific, owned, and time-bound.

• **What:** Describe the specific control(s) or actions to be implemented. Reference the control ID in the control register where applicable.
• **Who:** Assign a named owner responsible for implementing the treatment. The owner should have the authority and capability to execute the plan.
• **When:** Set a realistic but appropriate target date. Align to:
  - Patch SLAs (Critical: 24hr, High: 7d, Medium: 30d, Low: 90d — per ACSC guidance)
  - Regulatory timelines (if applicable — APRA may set specific remediation timelines)
  - Audit timelines (don't plan treatment to complete after the audit period starts)
• **Cost:** Estimate the cost of treatment. This allows management to make informed risk vs cost decisions.
• **Compensating controls:** If full treatment takes time, what interim controls reduce the risk now?
• **Acceptance criteria:** How will you know the treatment is complete and effective? What evidence will prove it?
• **Residual risk after treatment:** Estimate the new risk score after treatment is complete. Confirm it falls within risk appetite.`
  },
  {
    title: '7. Ongoing Risk Monitoring',
    content: `Risks change over time. The risk register must be a living document.

• **Review frequency:**
  - Critical and High risks: Monthly review of treatment progress
  - Medium risks: Quarterly review
  - Low risks: Annual review
  - Full risk register: Annual formal review (ISO 27001 requirement; ASAE 3150 best practice)
  - Triggered review: After any significant incident, major system change, or change in threat landscape

• **Australian threat intelligence monitoring:**
  - Subscribe to ACSC alerts (cyber.gov.au) — free and authoritative
  - Monitor ASD advisories for specific threats affecting Australian organisations
  - Join the Australian Cyber Security Centre's Partnership Programme if eligible
  - Monitor APRA, ASIC, and OAIC guidance for regulatory risk changes

• **Management reporting:**
  - Report risk register status to executive leadership and Board at least quarterly
  - Report emerging or escalating risks immediately
  - For APRA-regulated entities, ensure risk reporting meets CPS 234 board reporting requirements

• **Risk register update triggers:**
  - New system or process deployed
  - Significant security incident
  - New regulatory requirement identified
  - Major vendor/supply chain change
  - Merger, acquisition, or restructure
  - New threat intelligence specific to your industry or region`
  },
  {
    title: '8. Regulatory Obligations and Reporting',
    content: `Australian organisations have specific legal and regulatory risk reporting obligations.

• **Privacy Act 1988 (Cth) — Notifiable Data Breaches (NDB) Scheme:**
  - If a data breach is likely to result in serious harm to individuals, you must notify the OAIC and affected individuals as soon as practicable.
  - For risks involving personal information, ensure the risk register captures NDB reporting obligations.
  - Engage legal counsel early for any potential NDB.

• **Security of Critical Infrastructure Act 2018 (SOCI Act):**
  - If your organisation operates or is a critical asset under the SOCI Act (communications, data storage, energy, finance, food, health, higher education, space, transport, water), you have mandatory incident reporting obligations to the ASD.
  - Risks to assets covered by the SOCI Act must be specifically flagged in the risk register.
  - Consider positive security obligations and enhanced cyber security obligations under the SOCI Act.

• **APRA Prudential Standard CPS 234:**
  - Applies to APRA-regulated entities (banks, insurance, superannuation).
  - Requires Board accountability, defined information security capability, policy framework, information asset classification, third-party management controls, and mandatory incident notification to APRA.
  - Risk register must align with CPS 234 information security risk management requirements.

• **Corporations Act 2001 and ASX Listing Rules:**
  - Material cyber risks may constitute material information requiring continuous ASX disclosure for listed companies.
  - Directors have obligations under the Corporations Act to manage foreseeable risks.`
  }
];

function Section({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-foreground">{section.title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-muted/10">
          <div className="text-sm text-muted-foreground leading-relaxed">
            {section.content.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="mt-3 font-bold text-foreground">{line.replace(/\*\*/g, '')}</p>;
              }
              if (line.startsWith('• **')) {
                const match = line.match(/^• \*\*(.+?)\*\*:? ?(.*)/);
                if (match) return <p key={i} className="mt-2"><span className="font-semibold text-foreground">{match[1]}:</span> {match[2]}</p>;
              }
              if (line.startsWith('• ') || line.startsWith('  - ')) {
                return <p key={i} className="mt-1 pl-3 border-l-2 border-primary/30">{line.replace(/^• |^  - /, '')}</p>;
              }
              if (line.trim() === '') return <div key={i} className="mt-2" />;
              return <p key={i} className="mt-2">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiskGuidePanel({ risk, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-card w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-border rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Risk Management Guide</span>
            </div>
            <h2 className="text-base font-bold text-foreground">{risk?.title || 'Risk Guide'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Category: {risk?.category?.replace('_', ' ') || 'General'} · Australia-specific guidance</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Guidance reflects <strong>Privacy Act 1988</strong>, <strong>SOCI Act 2018</strong>, <strong>APRA CPS 234</strong>, <strong>ASD Essential Eight</strong>, and <strong>ISO/IEC 27001:2022</strong> as adopted in Australia.
          </p>
          {SECTIONS.map((s, i) => <Section key={i} section={s} />)}
        </div>
      </div>
    </div>
  );
}