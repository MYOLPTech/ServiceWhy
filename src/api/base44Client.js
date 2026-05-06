/**
 * Local Storage Data Layer
 * 
 * Drop-in replacement for the @base44/sdk client.
 * Provides the same API surface (entities.X.list/create/update, functions.invoke,
 * integrations.Core.UploadFile) but persists everything in localStorage.
 * 
 * This means the app works fully offline with zero backend dependencies.
 */

const STORAGE_PREFIX = 'sw_';

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
    /**
     * list(sortField?) → Promise<Item[]>
     * sortField: optional string like '-created_date' (prefixed with '-' for desc)
     */
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

    /**
     * create(data) → Promise<Item>
     */
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

    /**
     * update(id, data) → Promise<Item>
     */
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

    /**
     * delete(id) → Promise<void>
     */
    delete(id) {
      return new Promise((resolve) => {
        const items = getStore(entityName).filter((i) => i.id !== id);
        setStore(entityName, items);
        resolve();
      });
    },
  };
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

  /** Stub for base44.functions.invoke — returns empty/noop results */
  functions: {
    invoke(name, _args) {
      console.warn(`[ServiceWhy] Function "${name}" is not available in local mode.`);
      return Promise.resolve({ data: {} });
    },
  },

  /** Stub for base44.integrations.Core.UploadFile — stores as data-url */
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

  /** Stub for base44.auth — uses our own AuthContext now */
  auth: {
    logout() {
      localStorage.removeItem('google_auth_token');
      window.location.href = '/login';
    },
  },
};
