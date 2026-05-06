import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

// Entity name -> business ID field
const ENTITIES = [
  { name: 'Control', idField: 'control_id' },
  { name: 'Risk', idField: 'risk_id' },
  { name: 'Policy', idField: 'policy_id' },
  { name: 'Task', idField: 'task_id' },
  { name: 'Evidence', idField: 'evidence_id' },
  { name: 'CmdbItem', idField: 'asset_id' },
  { name: 'Vendor', idField: 'vendor_id' },
  { name: 'Obligation', idField: 'obligation_id' },
  { name: 'Incident', idField: 'incident_id' },
];

// Map linked_*_ids field -> target entity name
const LINK_FIELD_TO_ENTITY = {
  linked_control_ids: 'Control',
  linked_risk_ids: 'Risk',
  linked_policy_ids: 'Policy',
  linked_task_ids: 'Task',
  linked_evidence_ids: 'Evidence',
  linked_cmdb_ids: 'CmdbItem',
  linked_vendor_ids: 'Vendor',
  linked_obligation_ids: 'Obligation',
  linked_incident_ids: 'Incident',
};

function flattenForSheet(record) {
  const flat = {};
  for (const [k, v] of Object.entries(record)) {
    if (k.startsWith('linked_') && k.endsWith('_ids')) continue; // handled in Linkages tab
    if (v === null || v === undefined) {
      flat[k] = '';
    } else if (Array.isArray(v) || typeof v === 'object') {
      flat[k] = JSON.stringify(v);
    } else {
      flat[k] = v;
    }
  }
  return flat;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const wb = XLSX.utils.book_new();
    const allRecords = {}; // entityName -> records

    // Fetch all entities
    for (const ent of ENTITIES) {
      const records = await base44.asServiceRole.entities[ent.name].list();
      const active = records.filter(r => !r.is_deleted);
      allRecords[ent.name] = active;
      const rows = active.map(flattenForSheet);
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
      XLSX.utils.book_append_sheet(wb, ws, ent.name);
    }

    // Build Linkages tab
    const linkages = [];
    for (const ent of ENTITIES) {
      const records = allRecords[ent.name];
      for (const r of records) {
        const fromId = r[ent.idField] || r.id;
        for (const [field, targetEntity] of Object.entries(LINK_FIELD_TO_ENTITY)) {
          const ids = r[field];
          if (Array.isArray(ids) && ids.length) {
            const targetIdField = ENTITIES.find(e => e.name === targetEntity)?.idField;
            const targetRecords = allRecords[targetEntity] || [];
            for (const targetRawId of ids) {
              // Try to resolve to business ID; fall back to raw
              const target = targetRecords.find(t => t.id === targetRawId);
              const toId = target ? (target[targetIdField] || target.id) : targetRawId;
              linkages.push({
                from_entity: ent.name,
                from_id: fromId,
                to_entity: targetEntity,
                to_id: toId,
              });
            }
          }
        }
      }
    }
    const linkSheet = XLSX.utils.json_to_sheet(linkages.length ? linkages : [{ from_entity: '', from_id: '', to_entity: '', to_id: '' }]);
    XLSX.utils.book_append_sheet(wb, linkSheet, 'Linkages');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    // Chunked base64 encoding to avoid call stack overflow on large buffers
    const bytes = new Uint8Array(buf);
    const CHUNK = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    const b64 = btoa(binary);
    return Response.json({
      filename: `compliance-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      base64: b64,
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});