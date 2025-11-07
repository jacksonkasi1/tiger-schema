import { TableState, Column } from './types';
import { Parser } from 'node-sql-parser';

/**
 * Parse PostgreSQL CREATE TABLE statements into TableState format using node-sql-parser
 */
export function parseSQLSchema(sql: string): TableState {
  const parser = new Parser();
  const tables: TableState = {};

  try {
    // Parse SQL to AST
    const ast = parser.astify(sql, { database: 'PostgreSQL' });

    // Ensure ast is an array
    const statements = Array.isArray(ast) ? ast : [ast];

    // First pass: Create tables and views
    for (const statement of statements) {
      if (!statement) continue;

      // Handle CREATE TABLE
      if (statement.type === 'create' && statement.keyword === 'table') {
        const tableInfo = extractTableInfo(statement);
        if (tableInfo) {
          // Use schema-qualified name as key to avoid collisions (e.g., public.users vs auth.users)
          const uniqueKey = `${tableInfo.schema}.${tableInfo.name}`;

          tables[uniqueKey] = {
            title: tableInfo.name,
            is_view: false,
            columns: tableInfo.columns,
            position: { x: 0, y: 0 },
            schema: tableInfo.schema
          };
        }
      }

      // Handle CREATE VIEW
      if (statement.type === 'create' && statement.keyword === 'view') {
        const viewInfo = extractViewInfo(statement);
        if (viewInfo) {
          // Use schema-qualified name as key
          const uniqueKey = `${viewInfo.schema}.${viewInfo.name}`;

          tables[uniqueKey] = {
            title: viewInfo.name,
            is_view: true,
            columns: [],
            position: { x: 0, y: 0 },
            schema: viewInfo.schema
          };
        }
      }
    }

    // Second pass: Process ALTER TABLE for foreign keys and primary keys
    for (const statement of statements) {
      if (!statement) continue;

      if (statement.type === 'alter') {
        processAlterTable(statement, tables);
      }
    }

  } catch (error) {
    console.error('Error parsing SQL with node-sql-parser:', error);
    // Fallback: try to extract basic info from the error or return empty
    console.warn('Falling back to regex-based parsing might be needed for complex SQL');
  }

  return tables;
}

/**
 * Extract table information from CREATE TABLE AST node
 */
function extractTableInfo(statement: any): { name: string; schema: string; columns: Column[] } | null {
  try {
    const tableInfo = statement.table?.[0];
    if (!tableInfo) return null;

    const tableName = tableInfo.table;
    const schema = tableInfo.db || 'public';

    console.log(`Extracting table: ${tableName}, schema: ${schema}, db field:`, tableInfo.db);

    const columns: Column[] = [];

    // Parse column definitions
    if (statement.create_definitions) {
      for (const def of statement.create_definitions) {
        if (def.resource === 'column') {
          const column = parseColumnFromAST(def);
          if (column) {
            columns.push(column);
          }
        }

        // Handle inline primary keys
        if (def.resource === 'constraint' && def.constraint_type === 'primary key') {
          const pkColumns = def.definition || [];
          pkColumns.forEach((pkCol: any) => {
            const colName = pkCol.column;
            const col = columns.find(c => c.title === colName);
            if (col) {
              col.pk = true;
              col.required = true;
            }
          });
        }

        // Handle inline foreign keys
        if (def.resource === 'constraint' && def.constraint_type === 'FOREIGN KEY') {
          const fkColumns = def.definition || [];
          const refTable = def.reference_definition?.table?.[0]?.table;
          const refColumns = def.reference_definition?.definition || [];

          if (fkColumns.length > 0 && refColumns.length > 0 && refTable) {
            const colName = fkColumns[0].column;
            const refColName = refColumns[0].column;
            const col = columns.find(c => c.title === colName);
            if (col) {
              col.fk = `${refTable}.${refColName}`;
            }
          }
        }
      }
    }

    return { name: tableName, schema, columns };
  } catch (error) {
    console.error('Error extracting table info:', error);
    return null;
  }
}

/**
 * Extract view information from CREATE VIEW AST node
 */
function extractViewInfo(statement: any): { name: string; schema: string } | null {
  try {
    const viewInfo = statement.table?.[0];
    if (!viewInfo) return null;

    const viewName = viewInfo.table;
    const schema = viewInfo.db || 'public';

    return { name: viewName, schema };
  } catch (error) {
    console.error('Error extracting view info:', error);
    return null;
  }
}

/**
 * Parse column definition from AST
 */
function parseColumnFromAST(columnDef: any): Column | null {
  try {
    // Extract column name - handle deeply nested structure
    let columnName: string | undefined;

    // Try different paths based on AST structure
    if (columnDef.column?.column?.expr?.value) {
      // Most common: columnDef.column.column.expr.value
      columnName = String(columnDef.column.column.expr.value);
    } else if (columnDef.column?.column) {
      columnName = typeof columnDef.column.column === 'string'
        ? columnDef.column.column
        : String(columnDef.column.column);
    } else if (typeof columnDef.column === 'string') {
      columnName = columnDef.column;
    }

    if (!columnName) {
      console.error('Could not extract column name from:', columnDef);
      return null;
    }

    // Extract data type
    let dataType: string = 'text';
    if (columnDef.definition?.dataType) {
      dataType = String(columnDef.definition.dataType);
    }

    const format = mapPostgreSQLType(dataType);

    // Check for primary key
    let isPrimaryKey = false;
    if (columnDef.primary_key === 'primary key') {
      isPrimaryKey = true;
    }

    // Check nullable - handle null value safely
    let isNotNull = false;
    if (columnDef.nullable !== null && columnDef.nullable !== undefined) {
      isNotNull = columnDef.nullable.type === 'not null';
    }

    // Check default value
    let defaultValue: any;
    if (columnDef.default_val && columnDef.default_val.type !== null) {
      defaultValue = extractDefaultValue(columnDef.default_val);
    }

    // Check for inline references (foreign key)
    let foreignKey: string | undefined;
    if (columnDef.reference_definition) {
      const refTable = columnDef.reference_definition.table?.[0]?.table;
      const refColumn = columnDef.reference_definition.definition?.[0]?.column;
      if (refTable && refColumn) {
        foreignKey = `${refTable}.${refColumn}`;
      }
    }

    return {
      title: columnName,
      format: format,
      type: determineType(format),
      default: defaultValue,
      required: isNotNull || isPrimaryKey,
      pk: isPrimaryKey,
      fk: foreignKey
    };
  } catch (error) {
    console.error('Error parsing column:', error, 'Column def was:', columnDef);
    return null;
  }
}

/**
 * Process ALTER TABLE statement for foreign keys and primary keys
 */
function processAlterTable(statement: any, tables: TableState): void {
  try {
    const tableInfo = statement.table?.[0];
    if (!tableInfo) {
      console.log('ALTER TABLE: no table info found');
      return;
    }

    const tableName = tableInfo.table;
    const tableSchema = tableInfo.db || 'public';
    const uniqueKey = `${tableSchema}.${tableName}`;

    console.log(`Processing ALTER TABLE for: ${tableName} (key: ${uniqueKey})`);

    const table = tables[uniqueKey];
    if (!table) {
      console.warn(`ALTER TABLE: table ${uniqueKey} not found in tables list. Available keys:`, Object.keys(tables));
      return;
    }

    // statement.expr is an ARRAY of constraints, not a single object!
    const constraints = Array.isArray(statement.expr) ? statement.expr : [statement.expr];

    for (const expr of constraints) {
      if (!expr) continue;

      // Check if this is a constraint definition
      if (expr.resource === 'constraint' && expr.constraint_type) {
        const constraint = expr.create_definitions || expr;
        console.log(`  Found constraint type: ${constraint.constraint_type}`);

        // Handle PRIMARY KEY
        if (constraint.constraint_type === 'primary key') {
          const pkColumns = constraint.definition || [];
          console.log(`  Adding PRIMARY KEY to columns:`, pkColumns.map((c: any) => c.column?.expr?.value || c.column));
          pkColumns.forEach((pkCol: any) => {
            const colName = pkCol.column?.expr?.value || pkCol.column;
            const col = table.columns?.find(c => c.title === colName);
            if (col) {
              col.pk = true;
              col.required = true;
            }
          });
        }

        // Handle FOREIGN KEY
        if (constraint.constraint_type === 'FOREIGN KEY') {
          const fkColumns = constraint.definition || [];
          const refTable = constraint.reference_definition?.table?.[0]?.table;
          const refColumns = constraint.reference_definition?.definition || [];

          // Extract column names from nested structure
          const colName = fkColumns[0]?.column?.expr?.value || fkColumns[0]?.column;
          const refColName = refColumns[0]?.column?.expr?.value || refColumns[0]?.column;

          console.log(`  Adding FOREIGN KEY: ${tableName}.${colName} -> ${refTable}.${refColName}`);

          if (colName && refColName && refTable) {
            const col = table.columns?.find(c => c.title === colName);
            if (col) {
              col.fk = `${refTable}.${refColName}`;
              console.log(`  ✅ FK added to column: ${colName}`);
            } else {
              console.warn(`  ❌ Column ${colName} not found in table ${tableName}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing ALTER TABLE:', error);
  }
}

/**
 * Extract default value from AST node
 */
function extractDefaultValue(defaultVal: any): any {
  if (!defaultVal) return undefined;

  // Handle 'default' wrapper
  if (defaultVal.type === 'default' && defaultVal.value) {
    return extractDefaultValue(defaultVal.value);
  }

  if (defaultVal.type === 'single_quote_string' || defaultVal.type === 'string') {
    return defaultVal.value;
  }

  if (defaultVal.type === 'number') {
    return defaultVal.value;
  }

  if (defaultVal.type === 'bool') {
    return defaultVal.value;
  }

  if (defaultVal.type === 'function') {
    // Handle nested function name structure
    if (defaultVal.name?.name?.[0]?.value) {
      return `${defaultVal.name.name[0].value}()`;
    }
    return `${defaultVal.name}()`;
  }

  if (defaultVal.type === 'expr_list') {
    return defaultVal.value?.map((v: any) => v.value).join(', ');
  }

  return defaultVal.value || undefined;
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
  if (type.includes('float')) return 'float8';

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
