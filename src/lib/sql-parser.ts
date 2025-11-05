import { TableState, Column } from './types';

/**
 * Parse PostgreSQL CREATE TABLE statements into TableState format
 */
export function parseSQLSchema(sql: string): TableState {
  const tables: TableState = {};

  // Remove comments (both -- and /* */)
  let cleanedSQL = sql
    .replace(/--[^\n]*/g, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

  // Split into individual statements
  const statements = cleanedSQL.split(';').filter(s => s.trim());

  for (const statement of statements) {
    const trimmed = statement.trim();

    // Match CREATE TABLE statements
    const createTableMatch = trimmed.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?["']?(\w+)["']?\s*\(/i);

    if (createTableMatch) {
      const tableName = createTableMatch[1];
      const columns = parseColumns(statement);

      tables[tableName] = {
        title: tableName,
        is_view: false,
        columns: columns,
        position: { x: 0, y: 0 }
      };
    }

    // Match CREATE VIEW statements
    const createViewMatch = trimmed.match(/create\s+(?:or\s+replace\s+)?view\s+(?:if\s+not\s+exists\s+)?["']?(\w+)["']?\s+as/i);

    if (createViewMatch) {
      const viewName = createViewMatch[1];

      tables[viewName] = {
        title: viewName,
        is_view: true,
        columns: [],
        position: { x: 0, y: 0 }
      };
    }
  }

  // Second pass: Extract foreign keys and add them to columns
  for (const statement of statements) {
    const trimmed = statement.trim();
    const createTableMatch = trimmed.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?["']?(\w+)["']?\s*\(/i);

    if (createTableMatch) {
      const tableName = createTableMatch[1];

      // Extract ALTER TABLE statements for this table
      const alterMatches = statements.filter(s =>
        s.match(new RegExp(`alter\\s+table\\s+["']?${tableName}["']?`, 'i'))
      );

      for (const alterStmt of alterMatches) {
        parseForeignKeysFromAlter(tables, tableName, alterStmt);
      }
    }
  }

  return tables;
}

/**
 * Parse columns from CREATE TABLE statement
 */
function parseColumns(createStatement: string): Column[] {
  const columns: Column[] = [];

  // Extract the content between parentheses
  const match = createStatement.match(/\(([\s\S]+)\)/);
  if (!match) return columns;

  const content = match[1];

  // Split by commas, but be careful with nested parentheses
  const columnDefs = splitByComma(content);

  for (const def of columnDefs) {
    const trimmed = def.trim();

    // Skip constraint definitions
    if (
      trimmed.match(/^constraint\s+/i) ||
      trimmed.match(/^primary\s+key\s*\(/i) ||
      trimmed.match(/^foreign\s+key\s*\(/i) ||
      trimmed.match(/^unique\s*\(/i) ||
      trimmed.match(/^check\s*\(/i)
    ) {
      continue;
    }

    const column = parseColumnDefinition(trimmed);
    if (column) {
      columns.push(column);
    }
  }

  return columns;
}

/**
 * Parse a single column definition
 */
function parseColumnDefinition(def: string): Column | null {
  // Extract column name (with optional quotes)
  const nameMatch = def.match(/^["']?(\w+)["']?\s+(.+)/i);
  if (!nameMatch) return null;

  const columnName = nameMatch[1];
  const rest = nameMatch[2];

  // Extract data type
  const typeMatch = rest.match(/^(\w+)(?:\s*\([\d,\s]+\))?/i);
  if (!typeMatch) return null;

  const dataType = typeMatch[0].trim();

  // Check for constraints
  const isPrimaryKey = /primary\s+key/i.test(rest);
  const isNotNull = /not\s+null/i.test(rest);

  // Check for foreign key reference
  let foreignKey: string | undefined;
  const fkMatch = rest.match(/references\s+["']?(\w+)["']?\s*\(["']?(\w+)["']?\)/i);
  if (fkMatch) {
    foreignKey = `${fkMatch[1]}.${fkMatch[2]}`;
  }

  // Check for default value
  let defaultValue: any;
  const defaultMatch = rest.match(/default\s+([^,\s]+(?:\s*\([^)]*\))?)/i);
  if (defaultMatch) {
    defaultValue = defaultMatch[1].trim();
  }

  // Map PostgreSQL types to format
  const format = mapPostgreSQLType(dataType);

  return {
    title: columnName,
    format: format,
    type: determineType(format),
    default: defaultValue,
    required: isNotNull || isPrimaryKey,
    pk: isPrimaryKey,
    fk: foreignKey
  };
}

/**
 * Parse foreign keys from ALTER TABLE statements
 */
function parseForeignKeysFromAlter(tables: TableState, tableName: string, alterStmt: string): void {
  const fkMatch = alterStmt.match(/add\s+(?:constraint\s+\w+\s+)?foreign\s+key\s*\(["']?(\w+)["']?\)\s*references\s+["']?(\w+)["']?\s*\(["']?(\w+)["']?\)/i);

  if (fkMatch && tables[tableName]) {
    const columnName = fkMatch[1];
    const refTable = fkMatch[2];
    const refColumn = fkMatch[3];

    // Find the column and add FK reference
    const column = tables[tableName].columns?.find(c => c.title === columnName);
    if (column) {
      column.fk = `${refTable}.${refColumn}`;
    }
  }
}

/**
 * Split string by comma, respecting parentheses
 */
function splitByComma(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current);
  }

  return result;
}

/**
 * Map PostgreSQL data types to internal format
 */
function mapPostgreSQLType(pgType: string): string {
  const type = pgType.toLowerCase();

  // Serial types
  if (type.includes('serial')) return 'integer';

  // Integer types
  if (type === 'smallint') return 'int2';
  if (type === 'integer' || type === 'int') return 'int4';
  if (type === 'bigint') return 'int8';

  // Numeric types
  if (type.includes('numeric') || type.includes('decimal')) return 'numeric';
  if (type === 'real') return 'float4';
  if (type === 'double precision' || type === 'double') return 'float8';

  // String types
  if (type.includes('varchar') || type.includes('character varying')) return 'varchar';
  if (type.includes('char') || type.includes('character')) return 'char';
  if (type === 'text') return 'text';

  // Boolean
  if (type === 'boolean' || type === 'bool') return 'bool';

  // Date/Time types
  if (type === 'date') return 'date';
  if (type === 'time') return 'time';
  if (type.includes('timestamp')) {
    if (type.includes('with time zone') || type.includes('timestamptz')) {
      return 'timestamptz';
    }
    return 'timestamp';
  }

  // UUID
  if (type === 'uuid') return 'uuid';

  // JSON types
  if (type === 'json') return 'json';
  if (type === 'jsonb') return 'jsonb';

  // Array types
  if (type.includes('[]')) return type;

  // Default: return as-is
  return type;
}

/**
 * Determine the type category from format
 */
function determineType(format: string): string {
  const f = format.toLowerCase();

  // Numeric types
  if (f.includes('int') || f.includes('serial') || f === 'numeric' || f.includes('float')) {
    return 'number';
  }

  // String types
  if (f.includes('char') || f === 'text') {
    return 'string';
  }

  // Boolean
  if (f === 'bool') {
    return 'boolean';
  }

  // JSON
  if (f === 'json' || f === 'jsonb') {
    return 'object';
  }

  // Array
  if (f.includes('[]')) {
    return 'array';
  }

  // Default
  return 'string';
}
