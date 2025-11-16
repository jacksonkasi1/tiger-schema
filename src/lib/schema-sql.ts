import { Table, TableState } from './types';

/**
 * Generate full Postgres schema DDL
 */
export function generateSchemaSQL(tables: TableState): string {
  const lines: string[] = [];
  const tableIds = Object.keys(tables).sort();

  // Generate CREATE TABLE statements
  tableIds.forEach((tableId, index) => {
    const table = tables[tableId];
    if (!table || !table.columns || table.columns.length === 0) return;

    if (index > 0) lines.push('');

    const schema = table.schema || 'public';
    const tableName = `${schema}.${table.title}`;

    lines.push(`CREATE TABLE ${tableName} (`);

    const columnDefs = table.columns.map((col) => {
      const parts: string[] = [`  ${col.title}`];
      parts.push(col.format || col.type || 'text');
      if (col.required) parts.push('NOT NULL');
      if (col.default) parts.push(`DEFAULT ${col.default}`);
      return parts.join(' ');
    });

    const pks = table.columns.filter(c => c.pk).map(c => c.title);
    columnDefs.forEach((def, i) => {
      const isLast = i === columnDefs.length - 1 && pks.length === 0;
      lines.push(def + (isLast ? '' : ','));
    });

    if (pks.length > 0) {
      lines.push(`  PRIMARY KEY (${pks.join(', ')})`);
    }

    lines.push(');');

    // Foreign keys
    const fks = table.columns.filter(c => c.fk);
    fks.forEach(col => {
      if (col.fk) {
        lines.push(`ALTER TABLE ${tableName} ADD FOREIGN KEY (${col.title}) REFERENCES ${col.fk};`);
      }
    });
  });

  return lines.join('\n');
}

/**
 * Generate SQL for a single table
 */
export function generateTableSQL(table: Table): string {
  if (!table || !table.columns || table.columns.length === 0) {
    return `-- No columns defined`;
  }

  const lines: string[] = [];
  const schema = table.schema || 'public';
  const tableName = `${schema}.${table.title}`;

  lines.push(`CREATE TABLE ${tableName} (`);

  const columnDefs = table.columns.map((col) => {
    const parts: string[] = [`  ${col.title}`];
    parts.push(col.format || col.type || 'text');
    if (col.required) parts.push('NOT NULL');
    if (col.default) parts.push(`DEFAULT ${col.default}`);
    return parts.join(' ');
  });

  const pks = table.columns.filter(c => c.pk).map(c => c.title);
  columnDefs.forEach((def, i) => {
    const isLast = i === columnDefs.length - 1 && pks.length === 0;
    lines.push(def + (isLast ? '' : ','));
  });

  if (pks.length > 0) {
    lines.push(`  PRIMARY KEY (${pks.join(', ')})`);
  }

  lines.push(');');

  return lines.join('\n');
}

/**
 * Simple SQL parser (basic CREATE TABLE support)
 */
export function parseSchemaSQL(sql: string): { tables: TableState; error?: string } {
  try {
    const tables: TableState = {};
    const createTableRegex = /CREATE\s+TABLE\s+(?:(\w+)\.)?(\w+)\s*\(([\s\S]+?)\);?/gi;

    let match;
    while ((match = createTableRegex.exec(sql)) !== null) {
      const [, schema, tableName, columnSection] = match;
      const tableId = schema ? `${schema}.${tableName}` : tableName;

      // Simple column parsing
      const columnLines = columnSection.split(',').map(l => l.trim());
      const columns = [];

      for (const line of columnLines) {
        if (/PRIMARY\s+KEY/i.test(line)) continue;

        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;

        const [name, type, ...rest] = parts;
        const restStr = rest.join(' ').toUpperCase();

        columns.push({
          title: name,
          format: type.toLowerCase(),
          type: 'string',
          required: restStr.includes('NOT NULL'),
          pk: restStr.includes('PRIMARY KEY'),
          default: restStr.match(/DEFAULT\s+(\S+)/)?.[1],
        });
      }

      tables[tableId] = {
        title: tableName,
        schema: schema || undefined,
        columns,
        position: { x: 0, y: 0 },
      };
    }

    return { tables };
  } catch (error) {
    return {
      tables: {},
      error: error instanceof Error ? error.message : 'Parse error',
    };
  }
}
