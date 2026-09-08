'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { EditorControls } from './EditorControls';

// Dynamically import Monaco Editor to ensure SSR safety
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-zinc-950 text-zinc-500 font-mono text-xs">
      Loading Monaco Code Editor...
    </div>
  ),
});

export const CodeEditor: React.FC = () => {
  const { sourceCode, setSourceCode, fontSize, theme, compileAll } = useCompilerStore();
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register Ctrl+Enter / Cmd+Enter shortcut to compile
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      compileAll();
    });

    // Custom syntax styling tweak for C-like language
    monaco.languages.typescript?.javascriptDefaults?.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
      <EditorControls />
      <div className="relative flex-1 w-full min-h-[350px]">
        <MonacoEditor
          height="100%"
          language="c"
          value={sourceCode}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          onChange={(value) => setSourceCode(value || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', Cascadia, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            padding: { top: 12, bottom: 12 },
            tabSize: 4,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
};
