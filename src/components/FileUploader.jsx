import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud } from 'lucide-react';
import { importExcelData, getTables } from '../lib/db';

export default function FileUploader({ onTablesUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processFile = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON array of objects
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      
      // Format table name (remove spaces, special chars)
      let tableName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      // Ensure it starts with a letter
      if (!/^[a-z]/i.test(tableName)) {
        tableName = 't_' + tableName;
      }
      
      await importExcelData(tableName, jsonData);
      const tables = await getTables();
      onTablesUpdate(tables, tableName);
      
    } catch (err) {
      console.error(err);
      setError("Failed to parse Excel file.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      processFile(file);
    } else {
      setError("Please upload an Excel or CSV file.");
    }
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  return (
    <div 
      className="file-upload-zone"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={() => document.getElementById('file-upload').click()}
    >
      <input 
        id="file-upload" 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        onChange={onFileChange} 
      />
      <UploadCloud size={32} color="var(--accent)" />
      <div style={{ fontWeight: 500 }}>
        {loading ? "Processing..." : "Drop Excel file here or click to browse"}
      </div>
      {error && <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>}
    </div>
  );
}
