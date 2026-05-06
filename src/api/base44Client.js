/**
 * Local Storage Data Layer
 *
 * Drop-in replacement for the @base44/sdk client.
 * Provides the same API surface (entities.X.list/create/update, functions.invoke,
 * integrations.Core.UploadFile) but persists everything in localStorage.
 *
 * Includes full Excel import/export via SheetJS (xlsx).
 */

import * as XLSX from 'xlsx';

const STORAGE_PREFIX = 'sw_';

// ── Sheet ↔ Entity mapping ──────────────────────────────────────────────

const SHEET_ENTITY_MAP = {
  Controls: 'Control',
  Control: 'Control',
  Risks: 'Risk',
  Risk: 'Risk',
  Policies: 'Policy',
  Policy: 'Policy',
  Tasks: 'Task',
  Task: 'Task',
  Evidence: 'Evidence',
  CMDB: 'CmdbItem',
  CmdbItem: 'CmdbItem',
  CmdbItems: 'CmdbItem',
  Vendors: 'Vendor',
  Vendor: 'Vendor',
  Incidents: 'Incident',
  Incident: 'Incident',
  Obligations: 'Obligation',
  Obligation: 'Obligation',
};

/** ID field used to match existing records for each entity */
const ENTITY_ID_FIELD = {
  Control: 'control_id',
  Risk: 'risk_id',
  Policy: 'policy_id',
  Task: 'task_id',
  Evidence: 'title',
  CmdbItem: 'asset_id',
  Vendor: 'vendor_id',
  Incident: 'title',
  Obligation: 'obligation_id',
};

/** Maps linked_*_ids field names to their target entity */
const LINK_FIELD_TO_MODULE = {
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

/** Reverse: given a target entity, which linked_ field holds its IDs */
const MODULE_TO_LINK_FIELD = {};
for (const [field, mod] of Object.entries(LINK_FIELD_TO_MODULE)) {
  MODULE_TO_LINK_FIELD[mod] = field;
}

const ENTITY_SHEET_MAP = {
  Control: 'Controls',
  Risk: 'Risks',
  Policy: 'Policies',
  Task: 'Tasks',
  Evidence: 'Evidence',
  CmdbItem: 'CMDB',
  Vendor: 'Vendors',
  Incident: 'Incidents',
  Obligation: 'Obligations',
};

const SHEET_TO_ENTITY = {};
for (const [entity, sheet] of Object.entries(ENTITY_SHEET_MAP)) {
  SHEET_TO_ENTITY[sheet] = entity;
}

// ── helpers ──────────────────────────────────────────────────────────────

function getStore(entityName) {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${entityName}`);
  return raw ? JSON.parse(raw) : [];
}

function setStore(entityName, items) {
  localStorage.setItem(`${STORAGE_PREFIX}${entityName}`, JSON.stringify(items));
}

function nextId(entityName) {
  const key = `${STORAGE_PREFIX}${entityName}_seq`;
  const seq = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  localStorage.setItem(key, String(seq));
  return seq;
}

// ── entity factory ───────────────────────────────────────────────────────

function createEntity(entityName) {
  return {
    list(sortField) {
      return new Promise((resolve) => {
        let items = getStore(entityName);
        if (sortField) {
          const desc = sortField.startsWith('-');
          const field = desc ? sortField.slice(1) : sortField;
          items = [...items].sort((a, b) => {
            const av = a[field] || '';
            const bv = b[field] || '';
            return desc ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
          });
        }
        resolve(items);
      });
    },

    create(data) {
      return new Promise((resolve) => {
        const items = getStore(entityName);
        const newItem = {
          ...data,
          id: nextId(entityName),
          created_date: data.created_date || new Date().toISOString(),
        };
        items.push(newItem);
        setStore(entityName, items);
        resolve(newItem);
      });
    },

    update(id, data) {
      return new Promise((resolve, reject) => {
        const items = getStore(entityName);
        const idx = items.findIndex((i) => i.id === id);
        if (idx === -1) return reject(new Error(`${entityName} #${id} not found`));
        items[idx] = { ...items[idx], ...data };
        setStore(entityName, items);
        resolve(items[idx]);
      });
    },

    delete(id) {
      return new Promise((resolve) => {
        const items = getStore(entityName).filter((i) => i.id !== id);
        setStore(entityName, items);
        resolve();
      });
    },
  };
}

// ── Excel helpers ────────────────────────────────────────────────────────

/** Convert a data-url or fetch URL into an ArrayBuffer */
async function urlToArrayBuffer(fileUrl) {
  if (fileUrl.startsWith('data:')) {
    const base64 = fileUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
  const res = await fetch(fileUrl);
  return res.arrayBuffer();
}

/** Parse a value that might be a JSON string back into an array/object */
function parseJsonField(val) {
  if (val == null || val === '') return undefined;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try { return JSON.parse(trimmed); } catch { /* fall through */ }
    }
  }
  return val;
}

/** Build an import plan by diffing Excel sheets against localStorage */
async function buildImportPlan(fileUrl) {
  const buf = await urlToArrayBuffer(fileUrl);
  const wb = XLSX.read(buf, { type: 'array' });

  const plan = { entities: [], totals: { create: 0, update: 0, skip: 0, links: 0 } };
  const idMap = {};

  for (const sheetName of wb.SheetNames) {
    const entityName = SHEET_ENTITY_MAP[sheetName];
    if (!entityName) continue;

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
    if (rows.length === 0) continue;

    const idField = ENTITY_ID_FIELD[entityName] || 'title';
    const existing = getStore(entityName);
    const existingMap = {};
    existing.forEach((item) => {
      const key = item[idField];
      if (key) existingMap[String(key).toLowerCase()] = item;
    });

    const toCreate = [];
    const toUpdate = [];
    let skipCount = 0;

    for (const row of rows) {
      // Parse any JSON-like fields
      for (const [k, v] of Object.entries(row)) {
        row[k] = parseJsonField(v);
      }

      const matchKey = row[idField] ? String(row[idField]).toLowerCase() : null;
      const match = matchKey ? existingMap[matchKey] : null;

      if (match) {
        // Check if anything actually changed
        const changed = Object.keys(row).some((k) => {
          if (k === 'id') return false;
          return JSON.stringify(row[k]) !== JSON.stringify(match[k]);
        });
        if (changed) {
          toUpdate.push({ row, existingId: match.id });
        } else {
          skipCount++;
        }
      } else {
        toCreate.push({ row });
      }
    }

    plan.entities.push({ entityName, toCreate, toUpdate, skipCount });
    plan.totals.create += toCreate.length;
    plan.totals.update += toUpdate.length;
    plan.totals.skip += skipCount;
  }

  // Parse the Links sheet if it exists
  const linksSheet = wb.Sheets['Links'];
  let linkRows = [];
  if (linksSheet) {
    linkRows = XLSX.utils.sheet_to_json(linksSheet).filter(
      (r) => r.from_module && r.from_id && r.to_module && r.to_id
    );
  }
  plan.totals.links = linkRows.length;

  // Cache the parsed links for the links phase
  localStorage.setItem(`${STORAGE_PREFIX}_import_links`, JSON.stringify(linkRows));

  const totalWork = plan.totals.create + plan.totals.update + linkRows.length;
  return { plan, idMap, totalWork };
}

/** Apply cached linkages from the Links sheet back into entity records */
function applyImportLinks() {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}_import_links`);
  const linkRows = raw ? JSON.parse(raw) : [];
  localStorage.removeItem(`${STORAGE_PREFIX}_import_links`);

  let linksApplied = 0;
  const errors = [];

  // Group links by from_module + from_id
  const grouped = {};
  for (const row of linkRows) {
    const key = `${row.from_module}::${row.from_id}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }

  for (const [key, rows] of Object.entries(grouped)) {
    const [fromSheet, fromReadableId] = key.split('::');
    const fromEntity = SHEET_TO_ENTITY[fromSheet] || SHEET_ENTITY_MAP[fromSheet];
    if (!fromEntity) {
      errors.push(`Unknown from_module: ${fromSheet}`);
      continue;
    }

    // Find the source record by its readable ID
    const fromIdField = ENTITY_ID_FIELD[fromEntity] || 'title';
    const items = getStore(fromEntity);
    const srcIdx = items.findIndex(
      (i) => String(i[fromIdField] || i.title || i.name || '').toLowerCase() === fromReadableId.toLowerCase()
    );
    if (srcIdx === -1) {
      errors.push(`Could not find ${fromSheet} "${fromReadableId}"`);
      continue;
    }

    for (const row of rows) {
      const toEntity = SHEET_TO_ENTITY[row.to_module] || SHEET_ENTITY_MAP[row.to_module];
      if (!toEntity) {
        errors.push(`Unknown to_module: ${row.to_module}`);
        continue;
      }

      // Find the target record by its readable ID
      const toIdField = ENTITY_ID_FIELD[toEntity] || 'title';
      const targetItems = getStore(toEntity);
      const target = targetItems.find(
        (t) => String(t[toIdField] || t.title || t.name || '').toLowerCase() === String(row.to_id).toLowerCase()
      );
      if (!target) {
        errors.push(`Could not find ${row.to_module} "${row.to_id}"`);
        continue;
      }

      // Determine which linked_ field to use
      const linkField = MODULE_TO_LINK_FIELD[toEntity];
      if (!linkField) {
        errors.push(`No link field for ${toEntity}`);
        continue;
      }

      // Add the target ID if not already present
      const existing = items[srcIdx][linkField] || [];
      if (!existing.includes(target.id)) {
        items[srcIdx][linkField] = [...existing, target.id];
        linksApplied++;
      }
    }

    setStore(fromEntity, items);
  }

  return {
    stats: { links: linksApplied, errors },
    processed: linkRows.length,
    done: true,
    nextCursor: null,
  };
}

/** Execute entity creates/updates from the plan */
function executeEntities(plan, cursor) {
  const CHUNK_SIZE = 50;
  let processed = 0;
  let created = 0;
  let updated = 0;
  const errors = [];

  let { entityIdx, kind, offset } = cursor;

  while (entityIdx < plan.entities.length && processed < CHUNK_SIZE) {
    const entity = plan.entities[entityIdx];
    const entityName = entity.entityName;
    const items = getStore(entityName);

    if (kind === 'create') {
      const batch = entity.toCreate.slice(offset, offset + (CHUNK_SIZE - processed));
      for (const { row } of batch) {
        const newItem = {
          ...row,
          id: nextId(entityName),
          created_date: row.created_date || new Date().toISOString(),
        };
        items.push(newItem);
        created++;
        processed++;
      }
      setStore(entityName, items);

      offset += batch.length;
      if (offset >= entity.toCreate.length) {
        kind = 'update';
        offset = 0;
      }
    }

    if (kind === 'update' && processed < CHUNK_SIZE) {
      const batch = entity.toUpdate.slice(offset, offset + (CHUNK_SIZE - processed));
      for (const { row, existingId } of batch) {
        const idx = items.findIndex((i) => i.id === existingId);
        if (idx !== -1) {
          items[idx] = { ...items[idx], ...row, updated_date: new Date().toISOString() };
          updated++;
        }
        processed++;
      }
      setStore(entityName, items);

      offset += batch.length;
      if (offset >= entity.toUpdate.length) {
        entityIdx++;
        kind = 'create';
        offset = 0;
      }
    }
  }

  const done = entityIdx >= plan.entities.length;
  const nextCursor = done
    ? { phase: 'links', offset: 0 }
    : { phase: 'entities', entityIdx, kind, offset };

  return {
    idMap: {},
    stats: { created, updated, errors },
    processed,
    nextCursor,
  };
}

/** Resolve the human-readable ID for an entity record */
function getReadableId(entityName, item) {
  const field = ENTITY_ID_FIELD[entityName];
  return item[field] || item.title || item.name || String(item.id);
}

/** Build an Excel export workbook from all localStorage entities */
function buildExportWorkbook() {
  const wb = XLSX.utils.book_new();
  const linkRows = [];

  for (const [entityName, sheetName] of Object.entries(ENTITY_SHEET_MAP)) {
    const items = getStore(entityName);

    const rows = items.map((item) => {
      const row = {};
      for (const [k, v] of Object.entries(item)) {
        // Extract linked_*_ids into the Links sheet instead
        if (k.startsWith('linked_') && k.endsWith('_ids')) {
          const targetModule = LINK_FIELD_TO_MODULE[k];
          const ids = Array.isArray(v) ? v : [];
          if (targetModule && ids.length > 0) {
            const fromId = getReadableId(entityName, item);
            // Resolve each linked ID to its readable form
            const targetItems = getStore(targetModule);
            const targetMap = {};
            targetItems.forEach((t) => { targetMap[t.id] = t; });
            for (const linkedId of ids) {
              const targetItem = targetMap[linkedId];
              const toId = targetItem ? getReadableId(targetModule, targetItem) : String(linkedId);
              const toSheet = ENTITY_SHEET_MAP[targetModule] || targetModule;
              linkRows.push({
                from_module: sheetName,
                from_id: fromId,
                to_module: toSheet,
                to_id: toId,
              });
            }
          }
          continue; // don't put linked_ fields in entity sheet
        }
        row[k] = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Add Links sheet
  const linksWs = XLSX.utils.json_to_sheet(
    linkRows.length > 0 ? linkRows : [{ from_module: '', from_id: '', to_module: '', to_id: '' }]
  );
  XLSX.utils.book_append_sheet(wb, linksWs, 'Links');

  return wb;
}

// ── public client ────────────────────────────────────────────────────────

export const base44 = {
  entities: {
    Control: createEntity('Control'),
    Task: createEntity('Task'),
    Risk: createEntity('Risk'),
    Policy: createEntity('Policy'),
    Evidence: createEntity('Evidence'),
    CmdbItem: createEntity('CmdbItem'),
    Vendor: createEntity('Vendor'),
    Incident: createEntity('Incident'),
    Obligation: createEntity('Obligation'),
  },

  functions: {
    async invoke(name, args) {
      // ── importExcel ──────────────────────────────────────────────
      if (name === 'importExcel') {
        const { file_url, phase, plan, cursor } = args;

        if (phase === 'plan') {
          const result = await buildImportPlan(file_url);
          return { data: result };
        }

        if (phase === 'entities') {
          const result = executeEntities(plan, cursor);
          return { data: result };
        }

        if (phase === 'links') {
          const result = applyImportLinks();
          return { data: result };
        }
      }

      // ── exportExcel ──────────────────────────────────────────────
      if (name === 'exportExcel') {
        const wb = buildExportWorkbook();
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        return {
          data: {
            base64: wbout,
            filename: `servicewhy-export-${new Date().toISOString().split('T')[0]}.xlsx`,
          },
        };
      }

      // ── datapump ─────────────────────────────────────────────────
      if (name === 'datapump') {
        return {
          data: {
            files: [],
            github: { status: 'not_connected' },
          },
        };
      }

      console.warn(`[ServiceWhy] Function "${name}" is not implemented in local mode.`);
      return { data: {} };
    },
  },

  integrations: {
    Core: {
      UploadFile({ file }) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ file_url: reader.result });
          reader.readAsDataURL(file);
        });
      },
    },
  },

  auth: {
    logout() {
      localStorage.removeItem('google_auth_token');
      window.location.href = '/login';
    },
  },
};
