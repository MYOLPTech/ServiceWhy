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
        const schema = await base44.entities[entityName].schema();
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

        // Add schema properties
        if (schema && schema.properties) {
          for (const [prop, def] of Object.entries(schema.properties)) {
            const colType = getPostgresType(def);
            columns.push(`  ${prop} ${colType}`);
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

    // Return the generated files
    return Response.json({
      success: true,
      timestamp,
      files: {
        schema: {
          name: `datastructure/schema_${timestamp}.sql`,
          content: schemaContent,
          size: schemaContent.length
        },
        data: {
          name: `datadump/dump_${timestamp}.sql`,
          content: dataContent,
          size: dataContent.length
        },
        json: {
          name: `datadump/dump_${timestamp}.json`,
          content: jsonContent,
          size: jsonContent.length
        }
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getPostgresType(definition) {
  if (!definition) return 'TEXT';
  
  const type = definition.type;
  const format = definition.format;

  if (type === 'boolean') return 'BOOLEAN';
  if (type === 'integer' || type === 'number') return 'NUMERIC';
  if (type === 'array') return 'JSONB';
  if (type === 'object') return 'JSONB';
  if (format === 'date') return 'DATE';
  if (format === 'date-time') return 'TIMESTAMP WITH TIME ZONE';
  
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