import React, { useEffect, useState } from 'react';
import { Database, Table } from 'lucide-react';
import { initDB, executeQuery, getTables, preloadSampleData } from './lib/db';
import FileUploader from './components/FileUploader';
import SQLEditor from './components/SQLEditor';
import ResultsTable from './components/ResultsTable';
import SidebarTableItem from './components/SidebarTableItem';

function App() {
  const [dbReady, setDbReady] = useState(false);
  const [tables, setTables] = useState([]);
  const [query, setQuery] = useState('-- Write your SQL query here\n');
  const [results, setResults] = useState(null);
  const [queryError, setQueryError] = useState(null);

  useEffect(() => {
    initDB().then(async () => {
      // Preload data so learners don't have to upload anything initially
      await preloadSampleData();
      
      setDbReady(true);
      const initialTables = await getTables();
      setTables(initialTables);
      
      // Auto-run the initial query if any table was loaded
      if (initialTables.length > 0) {
        const firstTable = initialTables[0];
        setQuery(`-- Query the preloaded table\nSELECT * FROM ${firstTable} LIMIT 10;\n`);
        const res = await executeQuery(`SELECT * FROM ${firstTable} LIMIT 10;`);
        setResults(res);
      }
    }).catch(console.error);
  }, []);

  const handleRunQuery = async (currentQuery = query) => {
    if (!currentQuery.trim()) return;
    
    setQueryError(null);
    try {
      const res = await executeQuery(currentQuery);
      setResults(res);
    } catch (err) {
      setQueryError(err);
      setResults(null);
    }
  };

  const handleTablesUpdate = (newTables, latestTable) => {
    setTables(newTables);
    setQuery(`SELECT * FROM ${latestTable} LIMIT 100;`);
    // Clear previous results
    setResults(null);
  };

  return (
    <div className="app-container">
      <header className="header glass-panel">
        <h1><Database color="var(--accent)" /> SSMS Web Portal</h1>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {dbReady ? (
            <span style={{ color: 'var(--success)' }}>● Engine Ready (DuckDB-WASM)</span>
          ) : (
            <span>● Initializing Engine...</span>
          )}
        </div>
      </header>

      <aside className="sidebar glass-panel">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>Data Sources</h2>
        <FileUploader onTablesUpdate={handleTablesUpdate} />
        
        {tables.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Tables</h3>
            <ul className="table-list">
              {tables.map(t => (
                <SidebarTableItem key={t} tableName={t} />
              ))}
            </ul>
          </div>
        )}
      </aside>

      <main className="main-content">
        <SQLEditor query={query} setQuery={setQuery} onRun={handleRunQuery} disabled={!dbReady} />
        <ResultsTable results={results} error={queryError} />
      </main>
    </div>
  );
}

export default App;
