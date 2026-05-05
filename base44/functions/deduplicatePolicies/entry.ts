import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all policies and related entities
    const allPolicies = await base44.asServiceRole.entities.Policy.list();
    const allObligations = await base44.asServiceRole.entities.Obligation.list();

    // Group policies by title
    const policyGroups = {};
    allPolicies.forEach(p => {
      const title = p.title || p.data?.title;
      if (!title) return;
      if (!policyGroups[title]) {
        policyGroups[title] = [];
      }
      policyGroups[title].push({
        id: p.id,
        title: title,
        policy_id: p.policy_id || p.data?.policy_id,
        review_date: p.review_date || p.data?.review_date,
      });
    });

    const duplicates = [];
    const toDelete = [];

    // Find duplicates and identify which to delete
    for (const title in policyGroups) {
      const policies = policyGroups[title];
      if (policies.length > 1) {
        // Sort by review_date desc (keep May 2027 ones first)
        const sorted = policies.sort((a, b) => {
          const dateA = new Date(a.review_date || '2000-01-01');
          const dateB = new Date(b.review_date || '2000-01-01');
          return dateB - dateA;
        });

        // Keep the first (newest review date), soft-delete others
        duplicates.push({
          title,
          keep: sorted[0],
          delete: sorted.slice(1),
        });

        sorted.slice(1).forEach(p => toDelete.push(p.id));
      }
    }

    // For each policy to delete, migrate its linkages to the keeper
    const updates = [];
    for (const dup of duplicates) {
      for (const oldPolicy of dup.delete) {
        // Find obligations linking to old policy
        const linkedObligations = allObligations.filter(o => {
          const policyIds = o.linked_policy_ids || o.data?.linked_policy_ids || [];
          return policyIds.includes(oldPolicy.id);
        });

        // Update each obligation to link to keeper instead
        for (const obl of linkedObligations) {
          const policyIds = obl.linked_policy_ids || obl.data?.linked_policy_ids || [];
          const newPolicyIds = policyIds.filter(id => id !== oldPolicy.id);
          if (!newPolicyIds.includes(dup.keep.id)) {
            newPolicyIds.push(dup.keep.id);
          }
          updates.push({
            entity: 'Obligation',
            id: obl.id,
            data: { linked_policy_ids: newPolicyIds },
          });
        }

        // Soft-delete the old policy
        updates.push({
          entity: 'Policy',
          id: oldPolicy.id,
          data: { is_deleted: true, deleted_date: new Date().toISOString() },
        });
      }
    }

    // Execute all updates
    for (const update of updates) {
      if (update.entity === 'Policy') {
        await base44.asServiceRole.entities.Policy.update(update.id, update.data);
      } else if (update.entity === 'Obligation') {
        await base44.asServiceRole.entities.Obligation.update(update.id, update.data);
      }
    }

    return Response.json({
      success: true,
      duplicatesFound: duplicates.length,
      policiesDeleted: toDelete.length,
      obligationsUpdated: updates.filter(u => u.entity === 'Obligation').length,
      summary: duplicates.map(d => ({
        title: d.title,
        kept: { id: d.keep.id, policy_id: d.keep.policy_id, review_date: d.keep.review_date },
        deleted: d.delete.map(p => ({ id: p.id, policy_id: p.policy_id, review_date: p.review_date })),
      })),
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});