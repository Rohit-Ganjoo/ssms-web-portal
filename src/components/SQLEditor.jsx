import React from 'react';
import Editor from '@monaco-editor/react';

export default function SQLEditor({ query, setQuery, onRun, disabled }) {
  
  const handleEditorDidMount = (editor, monaco) => {
    // Add custom keybinding for Ctrl+Enter to run query
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!disabled) onRun(editor.getValue());
    });
  };

  return (
    <div className="editor-container glass-panel">
      <div className="editor-header">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          SQL Editor
        </div>
        <button className="btn" onClick={() => onRun(query)} disabled={disabled}>
          Run (Ctrl+Enter)
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          defaultLanguage="sql"
          theme="vs-dark"
          value={query}
          onChange={(value) => setQuery(value)}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true
          }}
        />
      </div>
    </div>
  );
}
