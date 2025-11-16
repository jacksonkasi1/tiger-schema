import { Table, Column } from './types';

/**
 * Generates a CREATE TABLE SQL statement from a table definition
 */
export function generateCreateTableSQL(table: Table): string {
  if (!table || !table.columns || table.columns.length === 0) {
    return `-- No columns defined for table "${table.title}"`;
  }

  const schema = table.schema || 'public';
  const tableName = `${schema}.${table.title}`;

  const lines: string[] = [];
  lines.push(`CREATE TABLE ${tableName} (`);

  // Generate column definitions
  const columnDefs = table.columns.map((column) => {
    const parts: string[] = [];

    // Column name
    parts.push(`  ${column.title}`);

    // Data type
    const dataType = column.format || column.type || 'text';
    parts.push(dataType);

    // NOT NULL constraint
    if (column.required) {
      parts.push('NOT NULL');
    }

    // Default value
    if (column.default !== undefined && column.default !== null && column.default !== '') {
      const defaultValue = formatDefaultValue(column.default, dataType);
      parts.push(`DEFAULT ${defaultValue}`);
    }

    return parts.join(' ');
  });

  // Add column definitions
  lines.push(...columnDefs.map((def, i) =>
    i < columnDefs.length - 1 || hasPrimaryKeys(table.columns!) ? `${def},` : def
  ));

  // Add PRIMARY KEY constraint if any
  const primaryKeys = table.columns!.filter(col => col.pk).map(col => col.title);
  if (primaryKeys.length > 0) {
    lines.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
  }

  lines.push(');');

  // Add table comment if exists
  if (table.comment) {
    lines.push('');
    lines.push(`COMMENT ON TABLE ${tableName} IS '${escapeSQLString(table.comment)}';`);
  }

  // Add column comments if they exist
  const columnsWithComments = table.columns!.filter(col => col.comment);
  if (columnsWithComments.length > 0) {
    lines.push('');
    columnsWithComments.forEach(col => {
      lines.push(
        `COMMENT ON COLUMN ${tableName}.${col.title} IS '${escapeSQLString(col.comment || '')}';`
      );
    });
  }

  // Add foreign key constraints
  const foreignKeys = table.columns!.filter(col => col.fk);
  if (foreignKeys.length > 0) {
    lines.push('');
    foreignKeys.forEach(col => {
      const fkParts = col.fk?.split('.');
      if (fkParts && fkParts.length === 3) {
        const [fkSchema, fkTable, fkColumn] = fkParts;
        lines.push(
          `ALTER TABLE ${tableName} ADD FOREIGN KEY (${col.title}) REFERENCES ${fkSchema}.${fkTable}(${fkColumn});`
        );
      }
    });
  }

  return lines.join('\n');
}

function hasPrimaryKeys(columns: Column[]): boolean {
  return columns.some(col => col.pk);
}

function formatDefaultValue(value: any, dataType: string): string {
  // Handle common SQL functions
  const upperValue = String(value).toUpperCase();
  if (
    upperValue === 'NOW()' ||
    upperValue === 'CURRENT_TIMESTAMP' ||
    upperValue === 'NULL' ||
    upperValue.startsWith('GEN_RANDOM_UUID') ||
    upperValue.startsWith('UUID_GENERATE')
  ) {
    return upperValue;
  }

  // Handle boolean values
  if (dataType === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  // Handle numeric values
  if (
    dataType === 'integer' ||
    dataType === 'bigint' ||
    dataType === 'smallint' ||
    dataType === 'numeric' ||
    dataType === 'decimal' ||
    dataType === 'real' ||
    dataType === 'double precision'
  ) {
    return String(value);
  }

  // Default: treat as string
  return `'${escapeSQLString(String(value))}'`;
}

function escapeSQLString(str: string): string {
  return str.replace(/'/g, "''");
}
