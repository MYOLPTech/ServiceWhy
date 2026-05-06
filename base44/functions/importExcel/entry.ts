import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

const ENTITIES = [
  { name: 'Control', idField: 'control_id', prefix: 'CTL' },
  { name: 'Risk', idField: 'risk_id', prefix: 'RSK' },
  { name: 'Policy', idField: 'policy_id', prefix: 'POL' },
  { name: 'Task', idField: 'task_id', prefix: 'TSK' },
  { name: 'Evidence', idField: 'evidence_id', prefix: 'EVD' },
  { name: 'CmdbItem', idField: 'asset_id', prefix: 'ASSET' },
  { name: 'Vendor', idField: 'vendor_id', prefix: 'VND' },
  { name: 'Obligation', idField: 'obligation_id', prefix: 'OBL' },
  { name: 'Incident', idField: 'incident_id', prefix: 'INC' },
];

// Find the highest numeric suffix used across existing records for a given prefix
function getMaxIdNumber(records, idField, prefix) {
  let max = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  for (const r of records) {
    const v = r[idField];
    if (typeof v === 'string') {
      const m = v.match(re);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
  }
  return max;
}

function formatId(prefix, n) {
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

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

const SYSTEM_FIELDS = ['id', 'created_date', 'updated_date', 'created_by'];
const CHUNK_SIZE = 25;

function unflattenRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === '' || v === null || v === undefined) continue;
    if (SYSTEM_FIELDS.includes(k)) continue;
    if (k.startsWith('linked_') && k.endsWith('_ids')) continue;
    if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
      try { out[k] = JSON.parse(v); continue; } catch (_) {}
    }
    out[k] = v;
  }
  return out;
}

// Compare relevant fields between incoming data and existing record. Returns true if changed.
function hasChanges(data, existing) {
  for (const key of Object.keys(data)) {
    const a = data[key];
    const b = existing[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { file_url, phase = 'plan', cursor = null, plan = null, idMap = null } = body;
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    // Download workbook every call (stateless). Cheap relative to entity ops.
    const fileRes = await fetch(file_url);
    const buf = await fileRes.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });

    // ---------- PHASE: PLAN ----------
    // Build a diff plan: for each entity, determine which rows are new, changed, or unchanged.
    if (phase === 'plan') {
      const builtPlan = { entities: {}, totals: { create: 0, update: 0, skip: 0, links: 0 } };
      const builtIdMap = {};

      for (const ent of ENTITIES) {
        builtIdMap[ent.name] = {};
        builtPlan.entities[ent.name] = { create: [], update: [], skip: 0, nextIdNumber: 1 };

        if (!wb.SheetNames.includes(ent.name)) continue;
        const sheet = wb.Sheets[ent.name];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const existing = await base44.asServiceRole.entities[ent.name].list();
        const byBizId = {};
        for (const r of existing) {
          if (r[ent.idField]) byBizId[r[ent.idField]] = r;
          builtIdMap[ent.name][r[ent.idField] || r.id] = r.id;
        }

        // Determine next progressive id number for this entity
        let nextNum = getMaxIdNumber(existing, ent.idField, ent.prefix) + 1;

        rows.forEach((row, idx) => {
          const data = unflattenRow(row);
          if (Object.keys(data).length === 0) {
            builtPlan.entities[ent.name].skip++;
            return;
          }
          const bizId = data[ent.idField];
          if (bizId && byBizId[bizId]) {
            const existingRec = byBizId[bizId];
            if (hasChanges(data, existingRec)) {
              builtPlan.entities[ent.name].update.push({ rowIndex: idx, internalId: existingRec.id, bizId, data });
            } else {
              builtPlan.entities[ent.name].skip++;
            }
          } else {
            // Auto-assign a fresh, progressive business ID — overrides any incoming id
            const newBizId = formatId(ent.prefix, nextNum++);
            const originalBizId = bizId; // keep so links from the spreadsheet still resolve
            const newData = { ...data, [ent.idField]: newBizId };
            builtPlan.entities[ent.name].create.push({ rowIndex: idx, bizId: newBizId, originalBizId, data: newData });
          }
        });
        builtPlan.entities[ent.name].nextIdNumber = nextNum;

        builtPlan.totals.create += builtPlan.entities[ent.name].create.length;
        builtPlan.totals.update += builtPlan.entities[ent.name].update.length;
        builtPlan.totals.skip += builtPlan.entities[ent.name].skip;
      }

      // Count linkages (just for progress total)
      if (wb.SheetNames.includes('Linkages')) {
        const linkRows = XLSX.utils.sheet_to_json(wb.Sheets['Linkages'], { defval: '' });
        builtPlan.totals.links = linkRows.length;
      }

      const totalWork = builtPlan.totals.create + builtPlan.totals.update + builtPlan.totals.links;
      return Response.json({
        success: true,
        phase: 'plan',
        plan: builtPlan,
        idMap: builtIdMap,
        totalWork,
        nextCursor: { phase: 'entities', entityIdx: 0, kind: 'create', offset: 0 },
      });
    }

    // ---------- PHASE: ENTITIES (chunked create/update) ----------
    if (phase === 'entities') {
      const stats = { created: 0, updated: 0, errors: [] };
      const newIdMap = idMap || {};
      let { entityIdx, kind, offset } = cursor;

      let processed = 0;
      while (entityIdx < ENTITIES.length && processed < CHUNK_SIZE) {
        const ent = ENTITIES[entityIdx];
        const list = plan.entities[ent.name][kind];

        if (offset >= list.length) {
          // Move to next kind / next entity
          if (kind === 'create') { kind = 'update'; offset = 0; }
          else { entityIdx++; kind = 'create'; offset = 0; }
          continue;
        }

        const item = list[offset];
        try {
          if (kind === 'create') {
            const created = await base44.asServiceRole.entities[ent.name].create(item.data);
            if (item.bizId) newIdMap[ent.name][item.bizId] = created.id;
            // Also map the original spreadsheet id so linkages referencing it still resolve
            if (item.originalBizId) newIdMap[ent.name][item.originalBizId] = created.id;
            if (created[ent.idField]) newIdMap[ent.name][created[ent.idField]] = created.id;
            stats.created++;
          } else {
            await base44.asServiceRole.entities[ent.name].update(item.internalId, item.data);
            if (item.bizId) newIdMap[ent.name][item.bizId] = item.internalId;
            stats.updated++;
          }
        } catch (e) {
          stats.errors.push(`${ent.name} ${kind} "${item.bizId || item.internalId}": ${e.message}`);
        }
        offset++;
        processed++;
      }

      const done = entityIdx >= ENTITIES.length;
      return Response.json({
        success: true,
        phase: 'entities',
        stats,
        idMap: newIdMap,
        processed,
        nextCursor: done
          ? { phase: 'links', offset: 0 }
          : { phase: 'entities', entityIdx, kind, offset },
      });
    }

    // ---------- PHASE: LINKS ----------
    if (phase === 'links') {
      const stats = { links: 0, errors: [] };
      let { offset } = cursor;

      if (!wb.SheetNames.includes('Linkages')) {
        return Response.json({ success: true, phase: 'links', stats, processed: 0, nextCursor: null, done: true });
      }

      const linkRows = XLSX.utils.sheet_to_json(wb.Sheets['Linkages'], { defval: '' });

      // Group all links once, then apply in chunks. To keep this stateless we do small batches by row offset.
      // To minimize round-trips per record, group the current chunk by (from_entity, fromInternalId).
      const chunk = linkRows.slice(offset, offset + CHUNK_SIZE);
      const grouped = {};
      for (const link of chunk) {
        const { from_entity, from_id, to_entity, to_id } = link;
        if (!from_entity || !from_id || !to_entity || !to_id) continue;
        const fromInternal = idMap?.[from_entity]?.[from_id];
        const toInternal = idMap?.[to_entity]?.[to_id];
        if (!fromInternal || !toInternal) {
          stats.errors.push(`Link skipped: ${from_entity}/${from_id} -> ${to_entity}/${to_id}`);
          continue;
        }
        const linkField = ENTITY_TO_LINK_FIELD[to_entity];
        if (!linkField) continue;
        grouped[from_entity] ??= {};
        grouped[from_entity][fromInternal] ??= {};
        grouped[from_entity][fromInternal][linkField] ??= new Set();
        grouped[from_entity][fromInternal][linkField].add(toInternal);
      }

      for (const [entityName, perRecord] of Object.entries(grouped)) {
        for (const [internalId, fields] of Object.entries(perRecord)) {
          try {
            const current = await base44.asServiceRole.entities[entityName].get(internalId);
            const update = {};
            let changed = false;
            for (const [field, idSet] of Object.entries(fields)) {
              const existingSet = new Set(current[field] || []);
              const before = existingSet.size;
              for (const id of idSet) existingSet.add(id);
              if (existingSet.size !== before) {
                update[field] = Array.from(existingSet);
                stats.links += (existingSet.size - before);
                changed = true;
              }
            }
            if (changed) {
              await base44.asServiceRole.entities[entityName].update(internalId, update);
            }
          } catch (e) {
            stats.errors.push(`Linkage ${entityName}/${internalId}: ${e.message}`);
          }
        }
      }

      const newOffset = offset + chunk.length;
      const done = newOffset >= linkRows.length;
      return Response.json({
        success: true,
        phase: 'links',
        stats,
        processed: chunk.length,
        nextCursor: done ? null : { phase: 'links', offset: newOffset },
        done,
      });
    }

    return Response.json({ error: 'Unknown phase' }, { status: 400 });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});