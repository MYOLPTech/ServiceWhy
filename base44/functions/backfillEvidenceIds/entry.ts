import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const all = await base44.asServiceRole.entities.Evidence.list('created_date');
    const withId = all.filter(e => e.evidence_id);
    const withoutId = all.filter(e => !e.evidence_id);

    const usedNums = withId
      .map(e => parseInt((e.evidence_id || '').replace('EVD-', ''), 10))
      .filter(n => !isNaN(n));
    let next = usedNums.length > 0 ? Math.max(...usedNums) + 1 : 1;

    const updates = [];
    for (const ev of withoutId) {
      const newId = `EVD-${String(next).padStart(3, '0')}`;
      await base44.asServiceRole.entities.Evidence.update(ev.id, { evidence_id: newId });
      updates.push({ id: ev.id, title: ev.title, evidence_id: newId });
      next++;
    }

    return Response.json({ success: true, updated: updates.length, nextAvailable: `EVD-${String(next).padStart(3, '0')}`, updates });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});