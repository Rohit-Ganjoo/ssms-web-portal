import React, { useState } from 'react';
import { Table, ChevronRight, ChevronDown, Columns } from 'lucide-react';
import { getColumns } from '../lib/db';

export default function SidebarTableItem({ tableName }) {
  const [expanded, setExpanded] = useState(false);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && columns.length === 0) {
      setLoading(true);
      try {
        const cols = await getColumns(tableName);
        setColumns(cols);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <li className="table-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: 0 }}>
      <div 
        onClick={toggleExpand} 
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer' }}
      >
        {expanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
        <Table size={16} color="var(--accent)" /> 
        <span style={{ fontWeight: 500 }}>{tableName}</span>
      </div>
      
      {expanded && (
        <div style={{ padding: '4px 12px 12px 36px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {loading ? (
            <div>Loading columns...</div>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {columns.map(col => (
                <li key={col.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Columns size={12} /> {col.name} <span style={{ opacity: 0.6, fontSize: '0.7rem', marginLeft: 'auto' }}>{col.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
