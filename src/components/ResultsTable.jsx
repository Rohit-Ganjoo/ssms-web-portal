import React from 'react';

export default function ResultsTable({ results, error }) {
  if (error) {
    return (
      <div className="results-container glass-panel">
        <div style={{ color: 'var(--error)', padding: 16 }}>
          <strong>Error executing query:</strong>
          <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{error.message || error.toString()}</pre>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="results-container glass-panel" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Run a query to see results here.
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="results-container glass-panel" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Query returned 0 rows.
      </div>
    );
  }

  const columns = Object.keys(results[0]);

  return (
    <div className="results-container glass-panel">
      <div style={{ marginBottom: 8, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Results: {results.length} rows
      </div>
      <div className="results-table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col}>{row[col] !== null ? String(row[col]) : <em>null</em>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
