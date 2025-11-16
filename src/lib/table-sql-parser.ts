import { Column } from './types';

interface ParsedTable {
  columns: Column[];
  comment?: string;
}

/**
 * Parses a CREATE TABLE SQL statement and extracts column definitions
 * This is a simplified parser that handles basic CREATE TABLE syntax
 */
export function parseCreateTableSQL(sql: string): ParsedTable | { error: string } {
  try {
    // Remove comments and normalize whitespace
    const cleanSQL = sql
      .replace(/--[^\n]*/g, '') // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .trim();

    // Extract CREATE TABLE section
    const createTableMatch = cleanSQL.match(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(([\s\S]+?)\);?/i
    );

    if (!createTableMatch) {
      return { error: 'Invalid CREATE TABLE syntax. Expected: CREATE TABLE table_name (...)' };
    }

    const [, , columnSection] = createTableMatch;

    // Parse columns
    const columns: Column[] = [];
    const primaryKeys: string[] = [];

    // Split by commas, but not commas inside parentheses
    const parts = splitByCommaOutsideParens(columnSection);

    for (const part of parts) {
      const trimmedPart = part.trim();

      // Check if this is a PRIMARY KEY constraint
      if (/^PRIMARY\s+KEY\s*\(/i.test(trimmedPart)) {
        const pkMatch = trimmedPart.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          const pkColumns = pkMatch[1].split(',').map(c => c.trim());
          primaryKeys.push(...pkColumns);
        }
        continue;
      }

      // Skip other constraints for now (FOREIGN KEY, UNIQUE, CHECK, etc.)
      if (
        /^FOREIGN\s+KEY/i.test(trimmedPart) ||
        /^UNIQUE\s*\(/i.test(trimmedPart) ||
        /^CHECK\s*\(/i.test(trimmedPart) ||
        /^CONSTRAINT/i.test(trimmedPart)
      ) {
        continue;
      }

      // Parse column definition
      const column = parseColumnDefinition(trimmedPart);
      if (column) {
        columns.push(column);
      }
    }

    // Mark primary keys
    primaryKeys.forEach(pkName => {
      const column = columns.find(c => c.title === pkName);
      if (column) {
        column.pk = true;
      }
    });

    // Extract table comment if exists
    const commentMatch = cleanSQL.match(/COMMENT\s+ON\s+TABLE\s+[^\s]+\s+IS\s+'([^']*)'/i);
    const tableComment = commentMatch ? commentMatch[1] : undefined;

    return {
      columns,
      comment: tableComment,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}

function parseColumnDefinition(def: string): Column | null {
  // Match: column_name type [constraints...]
  const match = def.match(/^(\w+)\s+([^\s]+)(.*)$/i);
  if (!match) return null;

  const [, name, dataType, constraints] = match;

  const column: Column = {
    title: name,
    format: dataType.toLowerCase(),
    type: mapSQLTypeToGenericType(dataType),
    required: false,
    pk: false,
  };

  // Parse constraints
  const upperConstraints = constraints.toUpperCase();

  // NOT NULL
  if (/NOT\s+NULL/.test(upperConstraints)) {
    column.required = true;
  }

  // PRIMARY KEY
  if (/PRIMARY\s+KEY/.test(upperConstraints)) {
    column.pk = true;
    column.required = true; // Primary keys are always NOT NULL
  }

  // UNIQUE
  if (/UNIQUE/.test(upperConstraints)) {
    // Could add a unique flag if needed
  }

  // DEFAULT value
  const defaultMatch = constraints.match(/DEFAULT\s+([^,\s]+(?:\s*\([^)]*\))?)/i);
  if (defaultMatch) {
    column.default = defaultMatch[1].replace(/^'|'$/g, ''); // Remove quotes if present
  }

  // REFERENCES (foreign key)
  const referencesMatch = constraints.match(/REFERENCES\s+(\w+)\.?(\w+)?\s*\((\w+)\)/i);
  if (referencesMatch) {
    const [, schemaOrTable, maybeTable, refColumn] = referencesMatch;
    if (maybeTable) {
      // Schema.table format
      column.fk = `${schemaOrTable}.${maybeTable}.${refColumn}`;
    } else {
      // Just table name, assume public schema
      column.fk = `public.${schemaOrTable}.${refColumn}`;
    }
  }

  return column;
}

function mapSQLTypeToGenericType(sqlType: string): string {
  const type = sqlType.toLowerCase();

  if (type.includes('char') || type.includes('text')) return 'string';
  if (type.includes('int') || type.includes('serial')) return 'integer';
  if (type.includes('numeric') || type.includes('decimal') || type.includes('real') || type.includes('double')) return 'number';
  if (type.includes('bool')) return 'boolean';
  if (type.includes('uuid')) return 'string';
  if (type.includes('json')) return 'object';
  if (type.includes('timestamp') || type.includes('date') || type.includes('time')) return 'string';
  if (type.includes('array')) return 'array';

  return 'string'; // Default fallback
}

function splitByCommaOutsideParens(str: string): string[] {
  const parts: string[] = [];
  let currentPart = '';
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '(') {
      parenDepth++;
      currentPart += char;
    } else if (char === ')') {
      parenDepth--;
      currentPart += char;
    } else if (char === ',' && parenDepth === 0) {
      parts.push(currentPart);
      currentPart = '';
    } else {
      currentPart += char;
    }
  }

  if (currentPart.trim()) {
    parts.push(currentPart);
  }

  return parts;
}
