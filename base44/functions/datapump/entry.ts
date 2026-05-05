import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all entity schemas
    const entities = ['Control', 'Risk', 'Policy', 'Task', 'Evidence', 'CmdbItem', 'Vendor', 'Obligation'];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Generate SQL schema creation statements
    const schemaSQL = [];
    schemaSQL.push('-- Compliance Management System Schema');
    schemaSQL.push(`-- Generated: ${new Date().toISOString()}\n`);

    // Fetch all data for each entity
    const allData = {};
    const dataSQL = [];
    dataSQL.push('-- Data Dump');
    dataSQL.push(`-- Generated: ${new Date().toISOString()}\n`);

    for (const entityName of entities) {
      try {
        const records = await base44.entities[entityName].list();
        allData[entityName] = records;

        // Generate CREATE TABLE statement
        schemaSQL.push(`-- ${entityName} Table`);
        schemaSQL.push(`CREATE TABLE IF NOT EXISTS "${entityName.toLowerCase()}" (`);
        
        const columns = [];
        columns.push('  id UUID PRIMARY KEY');
        columns.push('  created_date TIMESTAMP WITH TIME ZONE');
        columns.push('  updated_date TIMESTAMP WITH TIME ZONE');
        columns.push('  created_by TEXT');

        // Extract columns from first record if available
        if (records.length > 0) {
          const firstRecord = records[0];
          for (const [prop, value] of Object.entries(firstRecord)) {
            if (!['id', 'created_date', 'updated_date', 'created_by'].includes(prop)) {
              const colType = getPostgresTypeFromValue(value);
              columns.push(`  "${prop}" ${colType}`);
            }
          }
        }

        schemaSQL.push(columns.join(',\n'));
        schemaSQL.push(');\n');

        // Generate INSERT statements
        if (records.length > 0) {
          dataSQL.push(`-- ${entityName} Data (${records.length} records)`);
          for (const record of records) {
            const insertSQL = generateInsertSQL(entityName, record);
            dataSQL.push(insertSQL);
          }
          dataSQL.push('');
        }
      } catch (err) {
        console.error(`Error processing entity ${entityName}:`, err.message);
      }
    }

    // Generate JSON export as well
    const jsonData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      entities: allData
    };

    const schemaContent = schemaSQL.join('\n');
    const dataContent = dataSQL.join('\n');
    const jsonContent = JSON.stringify(jsonData, null, 2);

    // Files to upload
    const files = [
      { name: `datastructure/schema_${timestamp}.sql`, content: schemaContent },
      { name: `datadump/dump_${timestamp}.sql`, content: dataContent },
      { name: `datadump/dump_${timestamp}.json`, content: jsonContent }
    ];

    // Upload to GitHub using session
    let githubResults = null;
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');
      if (accessToken) {
        githubResults = await uploadFilesToGithub(accessToken, files);
      }
    } catch (err) {
      console.warn('GitHub upload not available:', err.message);
    }

    return Response.json({
      success: true,
      timestamp,
      files: {
        schema: { name: files[0].name, size: schemaContent.length },
        data: { name: files[1].name, size: dataContent.length },
        json: { name: files[2].name, size: jsonContent.length }
      },
      github: githubResults || { status: 'not_connected', message: 'GitHub connector not available' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function uploadFilesToGithub(accessToken, files) {
  try {
    // First, get repo info from GitHub
    const userResp = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });
    const userData = await userResp.json();
    const login = userData.login;

    // Find the most recently updated repo (likely the active one)
    const reposResp = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated`, {
      headers: { Authorization: `token ${accessToken}` }
    });
    const repos = await reposResp.json();
    const targetRepo = repos[0];

    if (!targetRepo) {
      return { status: 'error', message: 'No repositories found' };
    }

    const results = [];
    for (const file of files) {
      const path = file.name;
      const content = file.content;
      
      // Check if file exists
      const checkUrl = `https://api.github.com/repos/${login}/${targetRepo.name}/contents/${path}`;
      const checkResp = await fetch(checkUrl, {
        headers: { Authorization: `token ${accessToken}` }
      });

      let sha = null;
      if (checkResp.ok) {
        const existing = await checkResp.json();
        sha = existing.sha;
      }

      // Upload/update file
      const uploadPayload = {
        message: `[DATAPUMP] ${path}`,
        content: btoa(unescape(encodeURIComponent(content))),
        ...(sha && { sha })
      };

      const uploadResp = await fetch(checkUrl, {
        method: 'PUT',
        headers: {
          Authorization: `token ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(uploadPayload)
      });

      if (uploadResp.ok) {
        results.push({ file: path, status: 'success' });
      } else {
        const error = await uploadResp.text();
        results.push({ file: path, status: 'failed', error });
      }
    }

    return { status: 'success', repo: `${login}/${targetRepo.name}`, uploads: results };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

function getPostgresTypeFromValue(value) {
  if (value === null || value === undefined) return 'TEXT';
  
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'number') return 'NUMERIC';
  if (Array.isArray(value)) return 'JSONB';
  if (typeof value === 'object') return 'JSONB';
  
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return 'DATE';
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return 'TIMESTAMP WITH TIME ZONE';
  
  return 'TEXT';
}

function generateInsertSQL(entityName, record) {
  const columns = Object.keys(record);
  const values = Object.values(record).map(v => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return v.toString();
    if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
    return `'${String(v).replace(/'/g, "''")}'`;
  });

  return `INSERT INTO "${entityName.toLowerCase()}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT (id) DO UPDATE SET ${columns.filter(c => c !== 'id' && c !== 'created_date').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')};`;
}