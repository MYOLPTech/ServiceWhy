import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all controls
    const controls = await base44.entities.Control.list('-created_date');
    const updated = [];
    const failed = [];

    for (const control of controls) {
      try {
        // Skip if already has implementation details
        if (control.implementation_overview && control.implementation_overview.length > 100) {
          updated.push({ id: control.id, status: 'skipped', reason: 'Already populated' });
          continue;
        }

        const prompt = `You are a compliance expert specializing in ${control.framework} controls in Australia. 

Generate comprehensive, detailed, Australia-specific implementation guidance for this control:

Control ID: ${control.control_id}
Title: ${control.title}
Description: ${control.description}
Framework: ${control.framework}
Category: ${control.category}

Return a JSON object with these fields (all required):
{
  "implementation_type": "manual" | "automated" | "hybrid",
  "implementation_overview": "2-3 paragraph high-level overview of how to implement this control, with Australian context",
  "implementation_steps": [
    {"step_number": 1, "title": "Step title", "description": "Detailed description", "responsible_role": "Role responsible"},
    ...
  ],
  "automation_details": "If applicable, detailed description of tools, scripts, platforms for automation (e.g., IAM systems, SIEM, ticketing systems)",
  "manual_procedures": "If manual/hybrid, detailed procedures and workflows including Australian regulatory alignment",
  "best_practices": ["Practice 1 aligned with ASAE3150/SOC2/ISO27001", "Practice 2", ...],
  "common_pitfalls": ["Pitfall 1", "Pitfall 2", ...],
  "tools_and_systems": ["AWS IAM", "Okta", "Splunk", ...],
  "testing_and_validation": "How to test and validate this control is operating correctly",
  "frequency": "daily | weekly | monthly | quarterly | annually | continuous"
}

Ensure all guidance:
- References Australian Privacy Principles, APRA requirements, SOCI Act, and ASD Essential Eight where relevant
- Includes specific Australian regulatory requirements
- Provides detailed, actionable implementation steps
- References industry standards and tools commonly used in Australia
- Considers both large enterprises and mid-market organisations
- Is specific to the ${control.framework} framework requirements`;

        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              implementation_type: { type: 'string', enum: ['manual', 'automated', 'hybrid'] },
              implementation_overview: { type: 'string' },
              implementation_steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    step_number: { type: 'integer' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    responsible_role: { type: 'string' }
                  }
                }
              },
              automation_details: { type: 'string' },
              manual_procedures: { type: 'string' },
              best_practices: { type: 'array', items: { type: 'string' } },
              common_pitfalls: { type: 'array', items: { type: 'string' } },
              tools_and_systems: { type: 'array', items: { type: 'string' } },
              testing_and_validation: { type: 'string' },
              frequency: { type: 'string' }
            },
            required: ['implementation_type', 'implementation_overview', 'implementation_steps', 'automation_details', 'manual_procedures', 'best_practices', 'common_pitfalls', 'tools_and_systems', 'testing_and_validation', 'frequency']
          }
        });

        // Update control with populated details
        await base44.entities.Control.update(control.id, response);
        updated.push({ id: control.id, control_id: control.control_id, status: 'success' });

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        failed.push({ id: control.id, control_id: control.control_id, error: err.message });
      }
    }

    return Response.json({
      message: 'Control population complete',
      total: controls.length,
      updated: updated.length,
      failed: failed.length,
      results: { updated, failed }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});