import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

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

const ENTITY_TO_LINK_FIELD = {
  Control: 'linked_control_ids',
  Risk: 'linked_risk_ids',
  Policy: 'linked_policy_ids',
  Task: 'linked_task_ids',
  Evidence: 'linked_evidence_ids',
  CmdbItem: 'linked_cmdb_ids',
  Vendor: 'linked_vendor_ids',
  Obligation: 'linked_obligation_ids',
  Incident: 'linked_incident_ids',
};

// System/built-in fields to strip before create/update
const SYSTEM_FIELDS = ['id', 'created_date', 'updated_date', 'created_by'];

function unflattenRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === '' || v === null || v === undefined) continue;
    if (SYSTEM_FIELDS.includes(k)) continue;
    if (k.startsWith('linked_') && k.endsWith('_ids')) continue; // handled by Linkages tab
    // Try to parse JSON-looking strings (arrays/objects)
    if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
      try { out[k] = JSON.parse(v); continue; } catch (_) {}
    }
    out[k] = v;
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    // Download and parse XLSX
    const fileRes = await fetch(file_url);
    const buf = await fileRes.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });

    const stats = { created: {}, updated: {}, skipped: {}, links: 0, errors: [] };
    // Map: entityName -> { businessId -> internalId }
    const idMap = {};

    // Pass 1: upsert each entity tab
    for (const ent of ENTITIES) {
      stats.created[ent.name] = 0;
      stats.updated[ent.name] = 0;
      stats.skipped[ent.name] = 0;
      idMap[ent.name] = {};

      if (!wb.SheetNames.includes(ent.name)) continue;
      const sheet = wb.Sheets[ent.name];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      // Load existing records to match by business ID
      const existing = await base44.asServiceRole.entities[ent.name].list();
      const byBizId = {};
      for (const r of existing) {
        if (r[ent.idField]) byBizId[r[ent.idField]] = r;
        idMap[ent.name][r[ent.idField] || r.id] = r.id;
      }

      for (const row of rows) {
        const data = unflattenRow(row);
        const bizId = data[ent.idField];

        // Skip totally empty rows
        if (Object.keys(data).length === 0) {
          stats.skipped[ent.name]++;
          continue;
        }

        try {
          if (bizId && byBizId[bizId]) {
            const existingRec = byBizId[bizId];
            await base44.asServiceRole.entities[ent.name].update(existingRec.id, data);
            idMap[ent.name][bizId] = existingRec.id;
            stats.updated[ent.name]++;
          } else {
            const created = await base44.asServiceRole.entities[ent.name].create(data);
            if (bizId) idMap[ent.name][bizId] = created.id;
            if (created[ent.idField]) idMap[ent.name][created[ent.idField]] = created.id;
            stats.created[ent.name]++;
          }
        } catch (e) {
          stats.errors.push(`${ent.name} row "${bizId || '(no id)'}": ${e.message}`);
        }
      }
    }

    // Pass 2: process Linkages tab
    if (wb.SheetNames.includes('Linkages')) {
      const linkRows = XLSX.utils.sheet_to_json(wb.Sheets['Linkages'], { defval: '' });
      // Group by from record: { fromEntity -> fromInternalId -> { linkField -> Set(toInternalIds) } }
      const grouped = {};
      for (const link of linkRows) {
        const { from_entity, from_id, to_entity, to_id } = link;
        if (!from_entity || !from_id || !to_entity || !to_id) continue;
        const fromInternal = idMap[from_entity]?.[from_id];
        const toInternal = idMap[to_entity]?.[to_id];
        if (!fromInternal || !toInternal) {
          stats.errors.push(`Link skipped: ${from_entity}/${from_id} -> ${to_entity}/${to_id} (id not resolved)`);
          continue;
        }
        const linkField = ENTITY_TO_LINK_FIELD[to_entity];
        if (!linkField) continue;
        grouped[from_entity] ??= {};
        grouped[from_entity][fromInternal] ??= {};
        grouped[from_entity][fromInternal][linkField] ??= new Set();
        grouped[from_entity][fromInternal][linkField].add(toInternal);
      }

      // Apply updates: merge with existing linked_*_ids (non-destructive)
      for (const [entityName, perRecord] of Object.entries(grouped)) {
        for (const [internalId, fields] of Object.entries(perRecord)) {
          try {
            const current = await base44.asServiceRole.entities[entityName].get(internalId);
            const update = {};
            for (const [field, idSet] of Object.entries(fields)) {
              const merged = new Set([...(current[field] || []), ...idSet]);
              update[field] = Array.from(merged);
              stats.links += idSet.size;
            }
            await base44.asServiceRole.entities[entityName].update(internalId, update);
          } catch (e) {
            stats.errors.push(`Linkage update ${entityName}/${internalId}: ${e.message}`);
          }
        }
      }
    }

    return Response.json({ success: true, stats });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});