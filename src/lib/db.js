import * as duckdb from '@duckdb/duckdb-wasm';
import * as XLSX from 'xlsx';

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

let db = null;
let conn = null;

export async function initDB() {
  if (db) return { db, conn };

  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: 'text/javascript'
    })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  conn = await db.connect();
  
  return { db, conn };
}

export async function executeQuery(query) {
  if (!conn) throw new Error("Database not initialized");
  
  try {
    const result = await conn.query(query);
    return result.toArray().map(row => row.toJSON());
  } catch (error) {
    console.error("SQL Error:", error);
    throw error;
  }
}

export async function importExcelData(tableName, data) {
  if (!conn) throw new Error("Database not initialized");

  if (data.length === 0) return;
  
  await conn.query(`DROP TABLE IF EXISTS ${tableName}`);
  
  // Register file and let DuckDB automatically infer types via read_json_auto
  await db.registerFileText('temp.json', JSON.stringify(data));
  await conn.query(`CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('temp.json')`);
}

export async function preloadSampleData() {
  // Automatically discover all CSV, JSON, and Excel files inside the src/data folder
  const dataFiles = import.meta.glob('../data/*.{csv,json,xlsx,xls}', { query: '?url', import: 'default' });
  
  for (const path in dataFiles) {
    const fileName = path.split('/').pop();
    // Create a safe table name (e.g. 'employees' from 'employees.csv')
    const tableName = fileName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    try {
      // Get the URL of the bundled asset
      const fileUrl = await dataFiles[path]();
      
      // Fetch its contents
      const response = await fetch(fileUrl);
      
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        
        await importExcelData(tableName, jsonData);
      } else {
        const text = await response.text();
        
        // Register file in DuckDB's virtual filesystem
        await db.registerFileText(fileName, text);
        
        // Tell DuckDB to read from it and create a table
        await conn.query(`DROP TABLE IF EXISTS ${tableName}`);
        if (fileName.endsWith('.csv')) {
          // sample_size=-1 forces DuckDB to read the whole file to prevent bad type inferences
          await conn.query(`CREATE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${fileName}', sample_size=-1)`);
        } else if (fileName.endsWith('.json')) {
          await conn.query(`CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('${fileName}')`);
        }
      }
      
      console.log(`Successfully loaded table: ${tableName}`);
    } catch (err) {
      console.error(`Failed to preload ${fileName}:`, err);
    }
  }
}

export async function getTables() {
  if (!conn) return [];
  const result = await executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'");
  return result.map(r => r.table_name);
}

export async function getColumns(tableName) {
  if (!conn) return [];
  const result = await executeQuery(`PRAGMA table_info('${tableName}')`);
  return result.map(r => ({ name: r.name, type: r.type }));
}
