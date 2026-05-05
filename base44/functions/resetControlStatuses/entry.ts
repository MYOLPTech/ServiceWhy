import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const controls = await base44.entities.Control.list('-created_date', 1000);
    let updated = 0;

    for (const control of controls) {
      await base44.entities.Control.update(control.id, { status: 'not_started' });
      updated++;
    }

    return Response.json({ 
      status: 'success', 
      total_updated: updated,
      message: `Reset ${updated} controls to not_started status`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});