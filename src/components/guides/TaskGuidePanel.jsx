import React, { useState } from 'react';
import { X, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TASK_GUIDES = {
  implementation: {
    label: 'Implementation Task',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    sections: [
      {
        title: '1. Scoping & Planning',
        content: `Before any technical work begins, define the precise scope of what you are implementing.

• **Identify the authoritative source:** For ISO 27001, reference the standard (AS/NZS ISO/IEC 27001:2023 adopted in Australia). For SOC 2, reference the AICPA Trust Services Criteria. For ASAE 3150, reference the Auditing and Assurance Standards Board (AUASB) standard.
• **Map to the control objective:** Confirm which specific control(s) this task satisfies. Document the control ID and objective statement verbatim.
• **Define success criteria:** What does "done" look like? E.g., "MFA enabled on 100% of privileged accounts, verified by screenshot evidence and access review sign-off."
• **Identify stakeholders:** Who owns this? Who approves it? Who is impacted? In Australian organisations, consider whether the Privacy Act 1988 (Cth) or sector-specific regulation (e.g., APRA CPS 234 for financial entities) applies.
• **Estimate effort:** Break the task into sub-tasks with time estimates. Use a project tracker (Jira, Azure DevOps, etc.).`
      },
      {
        title: '2. Designing the Solution',
        content: `Design the control or process before building it.

• **Draft a design document:** Even a one-page design is sufficient. Cover: what the control does, how it works technically, who is responsible, and how compliance will be evidenced.
• **Threat modelling (if technical):** Consider the STRIDE model. What threats does this control mitigate? Are there residual risks?
• **Consider Australian legal obligations:** Data sovereignty (where data is stored), the Privacy Act and Australian Privacy Principles (APPs), the Security of Critical Infrastructure Act 2018 (SOCI) if applicable, and sector guidance from APRA, ASIC, or the ASD.
• **Peer review:** Have at least one other qualified person review the design before building. For security-sensitive controls, involve the CISO.
• **Document design decisions:** Record why specific choices were made. Auditors (including ASAE 3150 practitioners) will ask.`
      },
      {
        title: '3. Building & Configuring',
        content: `Implement the control in a non-production environment first.

• **Use a staging/test environment:** Never build directly in production. Document the test environment configuration.
• **Follow change management:** Raise a change request per the Change Management Policy before touching production.
• **Scripted/automated deployment preferred:** Use IaC (Terraform, CloudFormation, Bicep) for infrastructure controls. This ensures repeatability and auditability.
• **Principle of least privilege:** When configuring access controls, grant only what is required. Default deny.
• **Document configuration settings:** Record every configuration step, settings value, and rationale. This becomes your implementation evidence.
• **Test in staging:** Execute a defined test plan. Record pass/fail results. Fix failures before moving to production.`
      },
      {
        title: '4. Production Deployment & Go-Live',
        content: `Deploy to production with appropriate approval and safety measures.

• **CAB approval:** Submit for Change Advisory Board (or equivalent) approval before deploying.
• **Rollback plan:** Define and document a rollback procedure in case deployment causes issues.
• **Deploy during maintenance window:** Schedule deployment during a low-risk window. Notify affected stakeholders in advance.
• **Post-deployment verification:** Run your test plan again in production. Confirm the control is operating as designed.
• **Monitor for issues:** Watch system logs and alerts for 48–72 hours post-deployment.
• **Update CMDB/Asset Register:** Record the new or changed component in the asset register.`
      },
      {
        title: '5. Evidence Collection & Documentation',
        content: `Evidence is the proof that the control exists and is working. For SOC 2 and ASAE 3150 this is critical.

• **Types of evidence to collect:**
  - Screenshots with timestamps (system-generated where possible)
  - Configuration exports (JSON, XML, policy exports)
  - Signed approval records
  - Testing records and results
  - Automated tool outputs (scan results, log extracts)
• **Evidence naming convention:** Use a consistent format: [ControlID]_[EvidenceType]_[Date]. E.g., CC6.1_MFA_Config_Screenshot_2025-06-30.
• **Store evidence in the platform:** Upload to the Evidence module linked to the relevant control.
• **Chain of custody:** Evidence must be traceable. Document who collected it, when, and from what system.
• **Review frequency:** Ongoing/operating controls need periodic evidence (monthly, quarterly). Point-in-time evidence must be dated within the audit period.`
      },
      {
        title: '6. Ongoing Monitoring & Maintenance',
        content: `Controls must continue to operate effectively over time.

• **Define monitoring frequency:** How often will you verify the control is working? (Daily automated checks, weekly review, quarterly audit.)
• **Set up alerts:** Where possible, configure automated alerting if the control fails or degrades (e.g., MFA disabled, certificate expired).
• **Assign an ongoing owner:** Someone must own this control going forward. This should be documented in the control register.
• **Annual review:** All controls should be reviewed at least annually, more frequently if risk changes. In Australian organisations, align with the fiscal year if reviewing alongside financial audits.
• **Update documentation:** When the control changes, update all related documentation promptly.`
      }
    ]
  },
  remediation: {
    label: 'Remediation Task',
    color: 'bg-red-50 border-red-200 text-red-800',
    sections: [
      {
        title: '1. Understanding the Finding',
        content: `Before remediating, fully understand what the problem is.

• **Read the finding carefully:** Understand the exact gap, weakness, or non-conformity. Note the source: penetration test, vulnerability scan, internal audit, external auditor finding, or self-assessment.
• **Classify severity:** Is this a critical finding, a major non-conformity (ISO 27001), or a deficiency (SOC 2)? For ASAE 3150, determine if it affects the subject matter or the auditor's opinion.
• **Understand root cause:** Surface issues have deeper causes. A missing patch is a symptom; the root cause may be a broken patch management process. Fix root causes, not just symptoms.
• **Assess legal and regulatory exposure:** In Australia, consider: mandatory data breach notification under the Privacy Act (NDB scheme); APRA Prudential Standard obligations; ASD Essential Eight maturity impact; potential ASIC or ASX disclosure obligations for material incidents.
• **Document the finding:** Record it formally before doing anything else. This creates your audit trail.`
      },
      {
        title: '2. Containment (Immediate Action)',
        content: `For active or high-severity findings, containment comes before remediation.

• **Immediate risk reduction:** If the finding represents an active or imminent risk, implement interim controls first. E.g., block the exploit path, isolate affected systems, revoke compromised credentials.
• **Notify stakeholders:** Alert the CISO, affected business owners, and (where required) senior management.
• **Preserve evidence:** Do not destroy logs or system state. You may need them for root cause analysis or regulatory reporting.
• **Assess notifiable data breach obligation:** Under the Australian Privacy Act 1988, if the finding relates to a data breach likely to cause serious harm to individuals, mandatory notification to the OAIC and affected individuals is required. Engage legal counsel early.
• **Document containment actions taken with timestamps.**`
      },
      {
        title: '3. Remediation Planning',
        content: `Plan the fix before executing it.

• **Define the remediation:** What specific action(s) will close the finding? Be precise.
• **Identify resources:** Who will do the work? What tools, systems, or budget are required?
• **Set a target date:** Align to your patch SLAs or audit remediation timelines. If the finding was raised by an external auditor or regulator, they will expect a committed date.
• **Design the solution:** Will you patch, reconfigure, add a compensating control, or redesign the process? Document the chosen approach and rationale.
• **Risk acceptance if delayed:** If the finding cannot be remediated immediately, formally document a risk acceptance with the CISO and relevant executive sponsor. Include a compensating control and a binding target date.
• **Test plan:** How will you verify the remediation worked?`
      },
      {
        title: '4. Implementing the Fix',
        content: `Execute the remediation in a controlled, documented manner.

• **Follow change management:** Even urgent remediations require at minimum a documented emergency change.
• **Test in non-production first:** Patches or configuration changes can cause unexpected issues. Always test before production.
• **Deploy and verify:** Apply the fix to production. Run your test plan. Confirm the finding is closed.
• **Re-scan or re-test:** For vulnerability findings, run the scanner again after patching to confirm closure. Retain the before/after scan reports.
• **Update the risk register:** If the finding was risk-rated, update the risk record to reflect the new residual risk post-remediation.`
      },
      {
        title: '5. Closure & Evidence',
        content: `Close the finding with full documentation.

• **Remediation evidence:** Collect proof that the fix worked. This may include:
  - Before/after vulnerability scan reports
  - Configuration screenshots with timestamps
  - System log extracts
  - Signed-off test results
• **Update the finding record:** Mark the finding as remediated in the issue tracker and compliance platform.
• **Notify the finding owner:** Inform the auditor, penetration tester, or internal team that raised the finding. Provide evidence for their review.
• **Root cause corrective action:** Document the systemic fix you implemented to prevent recurrence. This is what auditors look for under ISO 27001 Clause 10.2 (Continual Improvement).
• **Lessons learned:** What process improvement prevents this issue from arising again?`
      }
    ]
  },
  review: {
    label: 'Review Task',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    sections: [
      {
        title: '1. Preparing for the Review',
        content: `Structure the review before conducting it.

• **Define the review objective:** What are you reviewing, and why? (Periodic control test, access review, DR test, vendor review, policy review, etc.)
• **Gather relevant documentation:** Collect the prior review results, current control documentation, and any exception records.
• **Define the review population and sample:** For access reviews, pull a complete list of current users and access rights. For control testing, define the population of transactions or events and select a sample per the risk rating (higher risk = larger sample).
• **Sampling standards in Australia:** For SOC 2 and ASAE 3150 engagements, auditors typically use AICPA/AUASB sampling guidance. Attribute sampling for compliance testing; 25–40 items is a common starting point for key controls.
• **Assign reviewers:** The reviewer should be independent of the activity being reviewed (separation of duties). Managers should review their own team's access.`
      },
      {
        title: '2. Conducting the Review',
        content: `Execute the review systematically and document every step.

• **Work through the review checklist:** Use a structured checklist so nothing is missed.
• **For access reviews:**
  - Compare current access list against approved roles/responsibilities.
  - Flag: users who have left, users whose role has changed, excessive permissions, service accounts without documented justification.
  - Document each decision (retain/revoke/modify) with the reviewer's name and date.
• **For control testing:**
  - Select the sample using a defensible method (random or systematic).
  - Obtain evidence for each sample item.
  - Record exceptions: items where the control did not operate as designed.
• **For DR/BCP tests:**
  - Follow the test script precisely.
  - Document actual RTO/RPO achieved vs targets.
  - Record all failures, workarounds, and observations.
• **Maintain an audit trail:** Every decision and observation must be dated and attributed to a named reviewer.`
      },
      {
        title: '3. Reporting Findings',
        content: `Produce a clear, factual review report.

• **Document the scope and period:** State exactly what was reviewed and for what date range.
• **Summary of results:** How many items were reviewed? How many exceptions found?
• **Detail each exception:** For each finding, document: what was found, why it is an issue, which control or policy it breaches, the risk associated.
• **Exception rate:** Calculate exception rate. For SOC 2, even a single exception on a key control can result in a qualified opinion if not remediated and documented.
• **Recommendations:** For each exception, state the recommended corrective action and proposed owner.
• **Management sign-off:** The review report should be reviewed and signed off by the relevant manager or CISO before being filed.`
      },
      {
        title: '4. Following Up on Exceptions',
        content: `Exceptions found during reviews must be actioned and tracked to closure.

• **Create remediation tasks:** Each exception should generate a remediation task with an owner and due date.
• **Track to closure:** Monitor remediation progress. Escalate if tasks are overdue.
• **Re-test if required:** For material exceptions, consider re-testing after remediation to confirm closure.
• **Update the risk register:** If a control is found to be operating ineffectively, assess the residual risk and update the risk register accordingly.
• **Auditor notification:** If the review was conducted as part of audit preparation and material exceptions are found, notify the external auditor early. ASAE 3150 practitioners and SOC 2 auditors appreciate transparency over surprises.`
      }
    ]
  },
  documentation: {
    label: 'Documentation Task',
    color: 'bg-green-50 border-green-200 text-green-800',
    sections: [
      {
        title: '1. Determining the Document Type',
        content: `Different documents serve different purposes. Understand what you're writing before starting.

• **Policy:** High-level statement of intent, principles, and mandatory requirements. Approved by senior management. Reviewed annually. (E.g., Information Security Policy)
• **Standard:** Specific mandatory requirements that implement a policy. More detailed than a policy. (E.g., Password Standard)
• **Procedure:** Step-by-step instructions for how to carry out an activity. Operational-level. (E.g., Incident Response Procedure)
• **Guideline:** Advisory best-practice guidance. Not mandatory. (E.g., Secure Coding Guidelines)
• **Plan:** A document describing how something will be achieved. (E.g., Disaster Recovery Plan)
• **System Description (ASAE 3150):** A specific document type required for an ASAE 3150 engagement. Must describe the service organisation's system including infrastructure, software, people, procedures, and data. Must fairly present the system.`
      },
      {
        title: '2. Structure and Content',
        content: `Well-structured documents are easier to audit and maintain.

• **Mandatory sections for policies and procedures:**
  1. Purpose – Why does this document exist?
  2. Scope – Who and what does it apply to?
  3. Definitions – Define any technical or legal terms.
  4. Roles and Responsibilities – Who is accountable/responsible?
  5. Requirements/Procedures – The actual content.
  6. Compliance – Consequences of non-compliance.
  7. Related Documents – Cross-reference other policies.
  8. Review and Approval – Who reviews, who approves, how often.
  9. Document Control – Version number, effective date, owner.

• **Plain English:** Write in plain English. Avoid jargon. The Australian Government Style Manual recommends plain English for all government and regulated-sector documents.
• **Be specific:** Vague requirements like "users should use strong passwords" are unauditable. "Passwords must be a minimum of 12 characters including uppercase, lowercase, numbers, and special characters" is auditable.`
      },
      {
        title: '3. Review and Approval Workflow',
        content: `All compliance documentation must follow a formal approval process.

• **Draft:** Author creates the document. Track version numbers from the start (e.g., v0.1 for drafts).
• **Technical review:** Subject matter experts review for accuracy and completeness.
• **Legal/compliance review:** For policies touching Australian law (Privacy Act, SOCI Act, financial regulations), engage legal counsel or a compliance specialist.
• **Management review:** Relevant manager reviews for business alignment.
• **Final approval:** Policies must be approved by the appropriate authority level. ISO 27001 and SOC 2 require evidence of management approval. For ASAE 3150, management must assert that the system description fairly presents the system.
• **Communication:** Once approved, the document must be communicated to all relevant personnel. Record acknowledgements.
• **Document control:** Update the document register with the new version, effective date, review date, and approver.`
      },
      {
        title: '4. Evidence for Audit',
        content: `The document itself is evidence. But auditors want more.

• **Retain approval records:** Meeting minutes, email approvals, or electronic sign-off records are all valid. Store in the evidence module linked to the relevant control.
• **Retain prior versions:** Show version history. Auditors may ask what changed between versions.
• **Retain training acknowledgements:** If staff must acknowledge a policy, retain signed acknowledgement records. For digital acknowledgements, export a list showing name, date, and policy version.
• **Retain communication records:** Email notifications, intranet posts, or LMS records showing the policy was communicated.
• **Demonstrate the document is "live":** Auditors may test whether staff actually know about and follow documented procedures. Train staff, not just write documents.`
      }
    ]
  },
  training: {
    label: 'Training Task',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    sections: [
      {
        title: '1. Training Needs Analysis',
        content: `Before designing training, understand what training is actually needed.

• **Identify the audience:** All staff, specific roles (e.g., developers, administrators, finance), or third parties?
• **Identify the gap:** What knowledge or behaviour is currently missing or inadequate? Use incidents, audit findings, or phishing simulation results as inputs.
• **Map to requirements:** Which standard/framework requires this training? (E.g., ISO 27001 A.6.3 requires security awareness; SOC 2 CC1.4 requires competency; ASAE 3150 requires that personnel understand their control responsibilities.)
• **Australian regulatory requirements:** Some industries in Australia have mandated training requirements (e.g., APRA-regulated entities, ASD-certified organisations). Check applicable sector obligations.
• **Define learning outcomes:** What should people be able to do or know after the training?`
      },
      {
        title: '2. Designing and Delivering Training',
        content: `Effective security training changes behaviour, not just knowledge.

• **Formats:** eLearning modules (most scalable), in-person workshops, video content, phishing simulations, tabletop exercises.
• **Content for security awareness training (minimum):**
  - Recognising phishing and social engineering
  - Password hygiene and MFA importance
  - Data classification and handling requirements
  - Reporting obligations (how and when to report incidents)
  - Acceptable use of IT resources
  - Physical security (clean desk, tailgating)
  - Australian Privacy Act obligations (handling personal information)
• **Phishing simulations:** Run monthly simulated phishing campaigns. Track click rates over time. Targeted training for clickers. This is expected by SOC 2 and ISO 27001 auditors.
• **Role-based training:** Developers need secure coding training; administrators need privileged access training; executives need social engineering awareness.
• **Frequency:** Annual mandatory training as a minimum. Monthly phishing simulations. New-hire training within 30 days of commencement.`
      },
      {
        title: '3. Tracking and Evidence Collection',
        content: `Training completion records are essential audit evidence.

• **Learning Management System (LMS):** Use an LMS (or at minimum a spreadsheet with sign-off records) to track who completed what, when, and their score/result.
• **Completion targets:** SOC 2 and ISO 27001 auditors expect high completion rates. Target 100%; accept no less than 95% with a documented follow-up process for non-completers.
• **Evidence to retain:**
  - LMS completion report (name, date, course, result) — export as PDF or CSV
  - Training materials (slides, course content) in the version used
  - For in-person sessions: signed attendance register with date and facilitator name
  - Phishing simulation reports showing campaign results over time
• **Suspended access for non-completers:** Consider a policy that access is suspended for staff who fail to complete mandatory training within the required timeframe. This shows auditors the control has teeth.
• **Link to the Evidence module:** Upload training completion reports as evidence against the relevant control.`
      },
      {
        title: '4. Effectiveness Measurement',
        content: `Prove the training is working, not just that people completed it.

• **Phishing click rate trend:** Is the percentage of staff clicking phishing simulations declining over time? Document and graph this.
• **Incident reporting rate:** Is the number of staff-reported suspicious emails increasing? This is a positive indicator of awareness.
• **Knowledge assessment scores:** Include a quiz in eLearning modules. Track average scores and improvement over time.
• **Annual effectiveness review:** Conduct a formal review of training effectiveness annually. Adjust content based on findings. Document this review.
• **Benchmark against industry:** ASD publishes the Australian Cyber Security Centre (ACSC) Annual Cyber Threat Report. Use industry incident trends to validate training topics are current.`
      }
    ]
  },
  audit_prep: {
    label: 'Audit Preparation Task',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    sections: [
      {
        title: '1. Understanding the Audit',
        content: `Before preparing, understand exactly what the auditor will do.

• **SOC 2 Type II:** Tests whether controls were operating effectively over a defined period (typically 12 months). Auditor reviews evidence samples from throughout the period. Result is an independent auditor's report.
• **ASAE 3150:** Australian assurance standard for reporting on controls at a service organisation. The auditor issues an assurance report on management's assertion about the effectiveness of controls. Governed by the AUASB; applicable standards include ASAE 3150 and ASAE 3000.
• **ISO 27001:** Certification audit conducted by an accredited certification body (CB). Two stages: Stage 1 (documentation review), Stage 2 (implementation effectiveness testing). Annual surveillance audits; full re-certification every 3 years.
• **Request the audit plan early:** Ask the auditor for their planned testing approach, evidence requests, and schedule in advance. This avoids last-minute scrambles.
• **Assign an audit coordinator:** One person should be the single point of contact for the auditor. This person coordinates evidence requests, schedules interviews, and tracks outstanding items.`
      },
      {
        title: '2. Pre-Audit Readiness Assessment',
        content: `Conduct an internal readiness review before the external auditor arrives.

• **Control walkthrough:** For each in-scope control, verify: Is it documented? Is it operating? Is there evidence? Is the evidence within the audit period?
• **Gap analysis:** Identify controls that are missing, partially implemented, or have insufficient evidence. Prioritise based on risk to audit opinion.
• **Evidence completeness check:** Ensure all required evidence has been collected for the full audit period. Common gaps: quarterly access reviews missing one quarter; training records missing some staff; vulnerability scans not saved.
• **ASAE 3150 system description review:** Verify the system description accurately and completely describes the system as it is actually operating. Any discrepancy is a potential qualified opinion risk.
• **Interview preparation:** Prepare key staff for auditor interviews. They should be able to explain their role in control execution naturally and accurately. Brief them on what to expect.
• **Documentation review:** Ensure all policies, procedures, and standards are current (within their review dates) and approved.`
      },
      {
        title: '3. Evidence Organisation',
        content: `Organise evidence so the auditor can efficiently review it.

• **Evidence index:** Create a master index mapping each control to its evidence items: control ID, control name, evidence description, file name, collection date, collector name.
• **Naming convention:** [ControlID]_[EvidenceType]_[Date]_[Version]. E.g., CC6.1_UserAccessReview_Q1_2025.pdf
• **Folder/module structure:** Organise evidence by control objective or framework domain. In the Evidence module, link each evidence record to the relevant control.
• **Completeness check:** For each control, ask: Does this evidence prove the control was designed appropriately? Does it prove the control operated effectively throughout the period?
• **Quality check:** Is the evidence legible? System-generated with timestamps? Obtained from the actual production system (not a mock-up)? Independently verifiable?
• **Sensitive evidence:** For evidence containing personal information, ensure it is handled consistently with the Privacy Act. Consider redacting personal data where it is not needed for the audit.`
      },
      {
        title: '4. Managing the Audit',
        content: `Be organised, responsive, and transparent during the audit.

• **Respond to evidence requests promptly:** Auditors work to a schedule. Delayed evidence can jeopardise the completion date.
• **Prepare a status tracker:** Track every evidence request: description, requested date, due date, owner, status (outstanding/provided).
• **Anticipate follow-up questions:** If you provide partial evidence, expect follow-up. Brief the team on likely questions.
• **Escalate issues early:** If a significant control gap or exception is identified during the audit, tell the CISO and executive sponsor immediately. Do not hide findings; proactive disclosure is better than the auditor discovering issues independently.
• **Maintain a log of auditor conversations:** Record the date, participants, and key points discussed in any auditor meetings. This protects you if there are later disputes.
• **For ASAE 3150:** The management assertion is signed by management (typically CEO/CFO). Ensure they are briefed on the findings and comfortable signing before the report is issued.`
      },
      {
        title: '5. Post-Audit Actions',
        content: `The audit is not complete when the auditor leaves.

• **Management letter / findings report:** Review the auditor's findings in detail. Even a clean opinion may include observations for improvement.
• **Remediation plan:** For each finding or observation, assign an owner, define the remediation action, and set a target date. Track in this platform.
• **Communicate results:** Brief the board, executive team, and relevant operational staff on audit results.
• **Improve continuously:** Use audit findings as inputs to your ISO 27001 continual improvement programme (Clause 10). Document improvements made.
• **Plan the next audit cycle:** Immediately start collecting evidence for the next period. Don't let evidence collection become a last-minute exercise again.
• **Australian regulatory reporting:** If the audit results affect regulatory obligations (e.g., APRA, ASIC, ATO), assess whether disclosure or reporting is required. Engage legal counsel.`
      }
    ]
  }
};

const DEFAULT_GUIDE = {
  label: 'General Task',
  color: 'bg-slate-50 border-slate-200 text-slate-800',
  sections: TASK_GUIDES.implementation.sections
};

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
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {section.content.split('\n').map((line, i) => {
              if (line.startsWith('• **') || line.startsWith('• **')) {
                const match = line.match(/^• \*\*(.+?)\*\*:? ?(.*)/);
                if (match) return <p key={i} className="mt-2"><span className="font-semibold text-foreground">{match[1]}:</span> {match[2]}</p>;
              }
              if (line.startsWith('• ')) return <p key={i} className="mt-1 pl-3 border-l-2 border-primary/30">{line.slice(2)}</p>;
              if (line.trim() === '') return <div key={i} className="mt-2" />;
              return <p key={i} className="mt-2 font-medium text-foreground/80">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskGuidePanel({ task, onClose }) {
  const guide = TASK_GUIDES[task?.type] || DEFAULT_GUIDE;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-card w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-start justify-between px-6 py-4 border-b border-border rounded-t-2xl`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Implementation Guide</span>
            </div>
            <h2 className="text-base font-bold text-foreground">{task?.title || 'Task Guide'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{guide.label} · Australia-specific guidance</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            This guide reflects Australian regulatory context including the <strong>Privacy Act 1988 (Cth)</strong>, <strong>Security of Critical Infrastructure Act 2018</strong>, <strong>APRA prudential standards</strong>, and the <strong>AUASB assurance framework</strong>.
          </p>
          {guide.sections.map((s, i) => <Section key={i} section={s} />)}
        </div>
      </div>
    </div>
  );
}