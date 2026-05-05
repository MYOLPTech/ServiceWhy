import React, { useState } from 'react';
import { X, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FRAMEWORK_SECTIONS = {
  SOC2: [
    {
      title: '1. Understanding SOC 2 Controls',
      content: `SOC 2 is a US-origin standard (AICPA) that has become the de facto assurance framework for technology service providers globally, including many Australian organisations serving US or global clients.

• **Trust Services Criteria (TSC):** SOC 2 controls are organised into five categories:
  - **Security (CC):** The foundational category — required in all SOC 2 reports. Covers access controls, logical and physical security, change management, risk mitigation, monitoring, and incident response.
  - **Availability (A):** System availability for operation and use as committed.
  - **Processing Integrity (PI):** System processing is complete, valid, accurate, timely, and authorised.
  - **Confidentiality (C):** Information designated as confidential is protected.
  - **Privacy (P):** Personal information is collected, used, retained, disclosed, and disposed of in accordance with commitments.
• **Type I vs Type II:** Type I tests design at a point in time. Type II tests both design and operating effectiveness over a period (typically 12 months). Australian service organisations typically seek Type II reports.
• **Audit standard:** In Australia, SOC 2 audits are performed under AT-C Section 205 (AICPA) or equivalent, conducted by an accredited accounting/assurance firm. The AUASB does not directly govern SOC 2 but ASAE 3000 principles apply.`
    },
    {
      title: '2. Implementing a SOC 2 Control',
      content: `Follow these steps to implement a control that will satisfy SOC 2 auditors.

**Step 1 – Map the criterion:**
Identify the specific TSC criterion this control addresses (e.g., CC6.1 – Logical access security, CC6.3 – Role-based access). Read the criterion verbatim from the AICPA TSC document.

**Step 2 – Design the control:**
• Write a control description that maps directly to the criterion language.
• Define the control type: preventive, detective, or corrective.
• Define the control frequency: continuous, daily, weekly, monthly, quarterly, annual, or event-driven.
• Define the control operator: who executes the control? (Named role, not individual.)
• Define how the control will be evidenced. For SOC 2, the evidence must be system-generated where possible and must be from the production environment.

**Step 3 – Implement and test:**
• Implement the control per the design.
• Conduct a walkthrough: can you walk an auditor through exactly how the control operates?
• Test with a sample of transactions/events to confirm the control is working.
• Correct any deficiencies found.

**Step 4 – Evidence collection:**
• Collect evidence from Day 1 of the audit period. Don't wait.
• Evidence must cover the full period (typically 12 months).
• Common SOC 2 evidence types: user access review sign-offs, change management approvals, vulnerability scan reports, security awareness training completions, incident log, MFA configuration screenshots, background check records, vendor assessment reports.`
    },
    {
      title: '3. SOC 2 Evidence Standards',
      content: `SOC 2 auditors are experienced and rigorous. Your evidence must be high quality.

**Characteristics of good SOC 2 evidence:**
• **System-generated:** Pulled directly from the system (not recreated or reconstructed). Screenshots from the actual production system, not a staging environment.
• **Timestamped:** The date must be visible in the evidence. System log timestamps, screenshot timestamps, or metadata.
• **Complete:** For quarterly access reviews, you need all four quarters. For monthly vulnerability scans, you need all 12 months. Missing one is a finding.
• **Independently verifiable:** The auditor should be able to trace the evidence back to its source system.
• **Aligned to the audit period:** Evidence must be dated within the period under audit.

**Common SOC 2 exceptions (avoid these):**
• Access review conducted but not documented or the documentation is lost.
• MFA enabled for most users but a handful of service accounts or contractors excluded.
• Vulnerability scan results not retained.
• Change management: changes deployed to production without a corresponding approved change ticket.
• Offboarding: a former employee's access not revoked within the policy-required timeframe.
• Training: one or two staff members who didn't complete annual training, with no documented follow-up.

**Complementary User Entity Controls (CUECs):**
• If your SOC 2 report will be used by customers, identify the CUECs your customers must implement for the system to achieve its objectives. Document them in the report.`
    },
    {
      title: '4. SOC 2 in the Australian Context',
      content: `Australian organisations pursuing SOC 2 need to consider local regulatory alignment.

• **Privacy:** The AICPA Privacy TSC is based on the GAPP (Generally Accepted Privacy Principles). In Australia, you must also comply with the Privacy Act 1988 and the 13 Australian Privacy Principles (APPs). The two frameworks are complementary but the APPs are legally binding Australian law.
• **Auditor selection:** Ensure your SOC 2 auditor is an accredited CPA firm with demonstrated SOC 2 experience in Australia. CAANZ and CPA Australia members can conduct these engagements.
• **Subservice organisations:** If you use Australian-domiciled cloud providers (AWS Sydney, Azure Australia, etc.) or other subservice organisations, you should obtain their SOC 2 reports and document your complementary controls.
• **ASD Essential Eight:** While not a SOC 2 requirement, many Australian enterprise customers will ask about ASD Essential Eight maturity. Aligning your SOC 2 controls with the Essential Eight demonstrates alignment with ASD guidance and strengthens your security posture.`
    }
  ],
  ASAE3150: [
    {
      title: '1. Understanding ASAE 3150',
      content: `ASAE 3150 is an Australian Auditing and Assurance Standards Board (AUASB) standard governing assurance engagements on controls at service organisations.

• **Full name:** ASAE 3150 – Assurance Engagements on Controls at a Service Organisation
• **Governing body:** AUASB (auasb.gov.au) — an independent statutory body under the Australian Securities and Investments Commission Act 2001.
• **Purpose:** Provides a framework for a service organisation to have an independent assurance practitioner report on the effectiveness of its internal controls relevant to user entities.
• **Relationship to ASAE 3000:** ASAE 3150 is a subject-matter-specific standard that builds on the overarching ASAE 3000 (Assurance Engagements Other Than Audits or Reviews of Historical Financial Information).
• **Who uses it:** Australian financial services firms (especially those subject to APRA oversight), managed service providers, cloud platforms, outsourcing providers — anywhere user entities rely on a service organisation's controls.
• **Types of engagements:**
  - **Type 1:** Assurance on the design and implementation of controls at a specific date.
  - **Type 2:** Assurance on the design, implementation, and operating effectiveness over a period (typically 6–12 months). This is the most common and valuable form.`
    },
    {
      title: '2. The System Description',
      content: `The system description is the foundation of every ASAE 3150 engagement. It must be accurate and complete.

**What the system description must cover (per ASAE 3150):**
• **Infrastructure:** Hardware, networks, cloud platforms, data centres. Include whether Australian data sovereignty requirements are met (data hosted in Australia vs overseas).
• **Software:** Applications, middleware, operating systems, SaaS tools used to deliver the service.
• **People:** Roles and responsibilities of staff involved in operating the system. Organisational structure.
• **Procedures:** Manual and automated procedures used to deliver the service, including error-correction, change management, incident response.
• **Data:** Types of data processed, stored, or transmitted. Classification levels. Data flows.

**System boundaries:**
• Clearly define what is IN scope and what is OUT of scope. Be precise.
• Identify subservice organisations — third-party providers that are part of the system. State whether the report uses the carve-out or inclusive method.
• Identify complementary user entity controls (CUECs) — controls that user entities must implement for the system to achieve its objectives.

**Fair presentation:**
• Management is responsible for ensuring the system description fairly presents the system. This is the management assertion.
• The ASAE 3150 practitioner will test whether the description fairly presents the actual system.
• Any material inaccuracy in the system description can result in a qualified or adverse opinion.`
    },
    {
      title: '3. Control Objectives and Controls',
      content: `Controls in an ASAE 3150 engagement are structured around control objectives.

**Control objectives:**
• A control objective states what the controls are designed to achieve. E.g., "Controls provide reasonable assurance that logical access to the system is restricted to authorised users."
• Each control objective should be clearly linked to the service commitments and system requirements.
• Control objectives must be relevant, complete, and clearly worded. Auditors will test every control objective.

**Designing controls that satisfy the practitioner:**
• **Precise control descriptions:** "User access is reviewed by the system owner on a quarterly basis using the Access Review Report from [System Name]. Any access not aligned to the user's current role is removed within 5 business days and documented in the access review log."
• **Testable controls:** Every control must be testable. The practitioner will select a sample and ask for evidence.
• **Control attributes:** Specify the control frequency, operator role, evidence produced, and system used.
• **Risk-to-control mapping:** Show how each control mitigates a specific risk to the system. This is the control objective linkage.

**Operating effectiveness:**
• For Type 2 engagements, controls must operate continuously throughout the period, not just at the point of assessment.
• Design controls that generate evidence automatically (system logs, automated reports) to reduce the evidence collection burden.
• Review all controls quarterly during the audit period to catch and fix any operating failures before the final practitioner assessment.`
    },
    {
      title: '4. Management Assertion',
      content: `The management assertion is a unique and critical feature of ASAE 3150.

**What is the management assertion?**
Management (typically the CEO and/or CFO) must provide a written assertion to the effect that:
• The system description fairly presents the service organisation's system;
• The controls stated in the description were suitably designed to achieve the control objectives throughout the period; and
• For Type 2 — the controls operated effectively throughout the period.

**Preparing the assertion:**
• The assertion must be prepared by management, not the practitioner or auditor.
• Legal counsel and the CISO should review the assertion before it is signed.
• The assertion must be supported by evidence that management has actually conducted oversight — board minutes, risk committee minutes, internal audit reports, management sign-off records.
• If management cannot honestly make one of the assertions (e.g., a control was not operating for part of the period), the practitioner must be informed. A qualified assertion is better than a false one.

**Director liability in Australia:**
• Under the Corporations Act 2001, directors have obligations of care and diligence. Signing a materially false management assertion could expose directors to personal liability.
• Ensure any executive signing the assertion has genuinely reviewed and understands the underlying evidence.`
    },
    {
      title: '5. Engaging with the ASAE 3150 Practitioner',
      content: `How to work effectively with your assurance practitioner.

• **Practitioner selection:** Choose an AUASB-registered assurance practitioner with specific ASAE 3150 experience. Large accounting firms (Big 4 and second tier) and specialist advisory firms offer this service in Australia.
• **Engagement letter:** Ensure the engagement letter clearly defines: scope, period, subservice organisation treatment (carve-out vs inclusive), reporting timeline, and deliverables.
• **Planning meeting:** Hold a detailed planning meeting to discuss the control objectives, system description, evidence expectations, and timeline. Resolve ambiguities early.
• **Evidence requests:** The practitioner will issue formal evidence requests (IDRs — Information and Document Requests). Respond promptly and completely. Late or incomplete responses extend the engagement and increase cost.
• **Interim procedures:** For Type 2 engagements, practitioner testing typically occurs during and after the period. Consider requesting interim testing (e.g., at the 6-month mark) to identify and fix issues before year-end.
• **Findings management:** If the practitioner identifies a potential exception, engage immediately. Understand whether the exception is a design failure or an operating failure. Provide additional evidence if available. Implement corrective action if a genuine exception exists.
• **Report issuance:** Review the draft report carefully before final issuance. Ensure the system description, management assertion, and practitioner's report are all consistent and accurate.`
    }
  ],
  ISO27001: [
    {
      title: '1. Understanding ISO 27001 in Australia',
      content: `ISO/IEC 27001:2022 has been adopted in Australia as AS/NZS ISO/IEC 27001:2023 (published by Standards Australia).

• **Certification body (CB):** Certification is issued by an accredited CB — JAS-ANZ (Joint Accreditation System of Australia and New Zealand) accredits certification bodies. Common accredited CBs in Australia include BSI, Bureau Veritas, SAI Global, SGS, and TÜV SÜD.
• **Accreditation:** Ensure your chosen CB is JAS-ANZ accredited for ISO 27001 certification. Check the JAS-ANZ register at jas-anz.org.
• **Audit stages:**
  - **Stage 1 (Documentation Review):** Remote or on-site review of your ISMS documentation. Auditor confirms the ISMS is ready for Stage 2.
  - **Stage 2 (Certification Audit):** On-site testing of implementation and effectiveness. Results in certification if passed.
  - **Surveillance Audits:** Annual, typically 2 per 3-year certification cycle.
  - **Recertification Audit:** Full audit every 3 years.
• **2022 revision changes:** ISO 27001:2022 restructured Annex A from 14 domains and 114 controls to 4 themes and 93 controls. New controls include Threat Intelligence (A.5.7), ICT Readiness for Business Continuity (A.5.30), Web Filtering (A.8.23), Secure Coding (A.8.28), and Data Masking (A.8.11).`
    },
    {
      title: '2. Clause-by-Clause Implementation',
      content: `ISO 27001 clauses 4–10 are mandatory. Annex A controls are selected based on risk.

**Clause 4 – Context of the Organisation:**
• Document internal and external issues relevant to information security (PESTLE analysis + threat landscape).
• Identify interested parties (customers, regulators, OAIC, APRA, ASD, employees, investors) and their requirements.
• Define the ISMS scope clearly — which systems, processes, locations, and organisational units are included?

**Clause 5 – Leadership:**
• Obtain and document Board/executive commitment to information security. Board minutes and signed policy approvals are the evidence.
• Assign the ISMS role to a named individual (typically CISO or equivalent).
• Communicate the Information Security Policy to all staff. Retain communication records.

**Clause 6 – Planning:**
• Complete the risk assessment (Annex A standard risk methodology or your own). Document risks, treatments, and residual risks.
• Produce the Statement of Applicability (SoA): a mandatory document listing all 93 Annex A controls, whether each is included or excluded, and the justification. Every included control must be implemented. Every excluded control must have a documented, defensible justification.
• Set measurable information security objectives (e.g., 100% patch compliance within SLA, <5% phishing click rate).

**Clause 7 – Support:**
• Maintain documented information (policies, procedures, records) per the standard's requirements.
• Ensure staff competence — training records are key evidence here.
• Communicate ISMS requirements to all relevant parties.

**Clause 8 – Operation:**
• Execute the risk treatment plan. Implement all selected Annex A controls.
• Run the ISMS operational processes.

**Clause 9 – Performance Evaluation:**
• Monitor, measure, analyse and evaluate ISMS performance against objectives.
• Conduct internal audits at planned intervals (at least annually).
• Management review: document formal management review of ISMS performance (at least annually). Board minutes or management review meeting minutes serve as evidence.

**Clause 10 – Improvement:**
• Address nonconformities when found — root cause analysis, corrective action, verification of effectiveness. Document all of this.
• Continual improvement: demonstrate the ISMS is improving over time.`
    },
    {
      title: '3. Statement of Applicability (SoA)',
      content: `The SoA is one of the most important and auditor-scrutinised documents in ISO 27001.

**Structure of the SoA:**
• List all 93 controls from ISO 27001:2022 Annex A (organised by 4 themes: Organisational, People, Physical, Technological).
• For each control: Applicable (Yes/No), Justification, Implementation status, Evidence reference.

**Selecting controls:**
• Controls are selected based on risk assessment results — which controls are needed to treat identified risks.
• Do not select controls arbitrarily. The selection must be justified by the risk register.
• Legal, regulatory, and contractual requirements also drive control selection. In Australia:
  - Privacy Act → select Privacy controls (A.5.34), consent management
  - APRA CPS 234 → select controls aligned to CPS 234 requirements
  - SOCI Act → select controls aligned to SOCI positive security obligations

**Exclusions:**
• A control may be excluded only if it is not applicable given the scope. E.g., a cloud-native organisation may exclude physical media controls if they use no physical media.
• Every exclusion must be justified. "Not applicable because we are cloud-based" is a valid justification. "Too expensive" is not.
• Auditors scrutinise exclusions carefully. An excluded control that should have been included is a major nonconformity.

**Maintaining the SoA:**
• The SoA must be kept current. When new controls are implemented or scope changes, update the SoA.
• Version-control the SoA and retain prior versions for audit history.`
    },
    {
      title: '4. Annex A Control Implementation',
      content: `Practical guidance for implementing ISO 27001:2022 Annex A controls.

**Theme A.5 – Organisational Controls (37 controls):**
Key controls include:
• A.5.1 Information Security Policies — Document, approve, communicate, and annually review the policy suite.
• A.5.7 Threat Intelligence — Subscribe to ACSC, ASD, and MITRE ATT&CK. Document how threat intelligence informs risk assessment.
• A.5.15 Access Control — Implement RBAC. Quarterly access reviews. Documented access provisioning/deprovisioning process.
• A.5.19–A.5.22 Supplier Security — Third-party risk assessments, contractual security requirements, monitoring, right to audit.
• A.5.24–A.5.28 Incident Management — Documented IRP, tested, with lessons learned process.
• A.5.29–A.5.30 Business Continuity — BCP and DRP documented and tested annually. ICT readiness for business continuity.

**Theme A.6 – People Controls (8 controls):**
• A.6.1 Screening — Pre-employment background checks appropriate to role risk.
• A.6.3 Security Awareness — Annual mandatory training, phishing simulations, role-based training.
• A.6.5 Responsibilities after Termination — Access revocation on or before last day. Offboarding checklist.

**Theme A.7 – Physical Controls (14 controls):**
• A.7.1–A.7.3 Physical Security Perimeters — Access-controlled server rooms and sensitive areas. Visitor registers.
• A.7.9 Security of Assets Off-Premises — Laptop encryption, MDM, device policies for remote workers.
• A.7.14 Secure Disposal — NIST 800-88 compliant data destruction. Certificates of destruction.

**Theme A.8 – Technological Controls (34 controls):**
• A.8.2 Privileged Access Rights — PAM solution, just-in-time access, session recording.
• A.8.5 Secure Authentication — MFA mandatory. Password policy. FIDO2/passkeys preferred.
• A.8.8 Vulnerability Management — Weekly scanning, patch SLAs, exception process.
• A.8.24 Cryptography — Approved algorithm list (AES-256, TLS 1.3, no deprecated ciphers).
• A.8.25–A.8.29 Secure Development — Threat modelling, secure coding standards, SAST/DAST in CI/CD.`
    },
    {
      title: '5. Internal Audit Programme',
      content: `ISO 27001 requires a programme of internal audits. These are distinct from the certification audit.

**Planning the internal audit programme:**
• Internal audits must cover the entire ISMS — all clauses, all in-scope controls — over the audit programme period (typically one certification cycle).
• Risk-based approach: audit higher-risk areas more frequently.
• Plan the programme for the year: which areas will be audited when, by whom.
• Auditors must be independent: they cannot audit their own work or areas they are responsible for.

**Conducting internal audits:**
• Prepare an audit plan for each audit specifying: scope, objectives, criteria, audit team, schedule.
• Evidence-based auditing: request and review evidence. Conduct interviews. Observe processes.
• Classify findings: Nonconformity (major or minor) vs Opportunity for Improvement (OFI).
• A major nonconformity = total absence of a required control or systematic failure. This must be resolved before certification can be maintained.
• A minor nonconformity = isolated failure or partial implementation. Must be remediated within an agreed timeframe.
• Issue a formal audit report within a defined timeframe (e.g., 10 business days).

**Following up nonconformities:**
• Each nonconformity requires a root cause analysis and documented corrective action plan.
• Track corrective actions to closure. Verify effectiveness.
• This is clause 10.1 – Nonconformity and Corrective Action. Evidence of this process is critical for the certification body audit.

**Internal audit evidence for the CB:**
• The certification body (CB) will review your internal audit programme, audit reports, and corrective action records. This demonstrates continual improvement — a core ISO 27001 requirement.`
    },
    {
      title: '6. Management Review',
      content: `The management review is a mandatory clause 9.3 requirement and a key governance touchpoint.

**Frequency:** At least annually. Many organisations conduct it more frequently (e.g., quarterly).

**Inputs to the management review (required by the standard):**
• Status of actions from previous management reviews
• Changes in external and internal issues relevant to the ISMS
• Feedback on ISMS performance (audit results, nonconformities, monitoring metrics, objective achievement)
• Feedback from interested parties (customer complaints, regulator feedback, audit findings)
• Results of risk assessment and status of risk treatment plan
• Opportunities for continual improvement

**Outputs of the management review (must be documented):**
• Decisions on continual improvement opportunities
• Changes to the ISMS if needed (scope changes, policy updates, control additions)
• Resource decisions (additional budget, headcount, tooling)
• Any revisions to the risk appetite or risk treatment strategy

**Evidence for the CB:**
• Retain the management review agenda, attendee list, minutes, and action items as evidence.
• The CB will review these records to confirm management is genuinely engaged with the ISMS — not just rubber-stamping.
• In Australian organisations, the management review should ideally be a standing item on the Board or Risk Committee agenda to demonstrate governance-level oversight.`
    }
  ]
};

const GENERIC_SECTIONS = [
  {
    title: '1. Understanding the Control Requirement',
    content: `Before implementing any control, ensure you fully understand what it requires.

• Read the control description from the authoritative source (SOC 2 TSC, ISO 27001 Annex A, ASAE 3150 control objectives).
• Understand what the control is trying to achieve — the control objective.
• Identify whether this is a preventive, detective, or corrective control.
• Determine the control frequency: is this a continuous control, an event-triggered control, or a periodic control (monthly, quarterly, annually)?
• Document your understanding before designing the implementation.`
  },
  {
    title: '2. Designing the Control',
    content: `A well-designed control is specific, testable, and evidence-generating.

• Write a precise control description: "What" happens, "Who" does it, "How often," "What evidence is produced."
• Test your description: could an auditor independently verify this control operated based on the evidence you plan to collect?
• Consider Australian regulatory alignment: does the control also address Privacy Act, APRA, SOCI, or ASD Essential Eight requirements?
• Document the design before building.`
  },
  {
    title: '3. Implementing and Testing',
    content: `Implement controls in a controlled, documented manner.

• Test in a non-production environment first where possible.
• Follow the organisation's change management process.
• Test the control post-implementation: does it operate as designed?
• Collect implementation evidence: configuration screenshots, test results, approval records.
• Update the control register to reflect implementation.`
  },
  {
    title: '4. Evidence Collection',
    content: `Evidence is what proves the control exists and works. Treat it as a first-class deliverable.

• Define the evidence type(s) for each control before the audit period starts.
• Collect evidence continuously throughout the period — not at the last minute.
• Name files consistently: [ControlID]_[EvidenceType]_[Date].
• Store evidence in the Evidence module linked to this control.
• Quality-check evidence: is it system-generated? Timestamped? From production? Covers the full period?`
  },
  {
    title: '5. Ongoing Monitoring',
    content: `Controls must continue operating effectively over time.

• Assign an owner and a review schedule to every control.
• Set up automated monitoring and alerting where possible.
• Conduct periodic control testing (at minimum, annually; quarterly for high-risk controls).
• Document and remediate any control failures promptly.
• Update control documentation whenever the control changes.`
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
              if (line.startsWith('• **') || line.startsWith('  • **')) {
                const match = line.match(/^\s*• \*\*(.+?)\*\*:? ?(.*)/);
                if (match) return <p key={i} className="mt-2 pl-2"><span className="font-semibold text-foreground">{match[1]}:</span> {match[2]}</p>;
              }
              if (line.startsWith('• ') || line.startsWith('  - ') || line.startsWith('  • ')) {
                return <p key={i} className="mt-1 pl-3 border-l-2 border-primary/30">{line.replace(/^  - |^• |^  • /, '')}</p>;
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

export default function ControlGuidePanel({ control, onClose }) {
  const [activeFramework, setActiveFramework] = useState(control?.framework || 'generic');
  const sections = FRAMEWORK_SECTIONS[activeFramework] || GENERIC_SECTIONS;
  const frameworks = ['SOC2', 'ASAE3150', 'ISO27001'];
  const frameworkLabel = { SOC2: 'SOC 2', ASAE3150: 'ASAE 3150', ISO27001: 'ISO 27001', generic: 'General' };

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
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Control Implementation Guide</span>
            </div>
            <h2 className="text-base font-bold text-foreground">{control?.control_id ? `${control.control_id} – ` : ''}{control?.title || 'Control Guide'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Framework: {frameworkLabel[activeFramework]} · Australia-specific guidance</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Framework tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-border">
          {frameworks.map(fw => (
            <button
              key={fw}
              onClick={() => setActiveFramework(fw)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                activeFramework === fw ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {frameworkLabel[fw]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Guidance reflects Australian regulatory context including the <strong>Privacy Act 1988</strong>, <strong>APRA CPS 234</strong>, <strong>ASD Essential Eight</strong>, <strong>JAS-ANZ accreditation</strong>, and <strong>AUASB assurance standards</strong>.
          </p>
          {sections.map((s, i) => <Section key={`${activeFramework}-${i}`} section={s} />)}
        </div>
      </div>
    </div>
  );
}