// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(async ({ mode, command }) => {
  const plugins = [react()];

  // شغّل إضافات الـ visual-editor فقط أثناء التطوير وإذا كانت ملفاتها موجودة
  const dev = mode === 'development' || command === 'serve';
  const veDir = path.resolve(process.cwd(), 'plugins/visual-editor');

  if (dev && fs.existsSync(veDir)) {
    try {
      const { default: inlineEditor } = await import('./plugins/visual-editor/vite-plugin-react-inline-editor.js');
      const { default: editMode } = await import('./plugins/visual-editor/vite-plugin-edit-mode.js');
      inlineEditor && plugins.push(inlineEditor());
      editMode && plugins.push(editMode());
    } catch {
      // تجاهل لو كانت الإضافات غير موجودة — لا تمنع البناء
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)), // استخدم @ ليشير إلى src
      },
    },
    build: {
      outDir: 'dist',
      target: 'es2019',
      sourcemap: false,
    },
    server: {
      host: true,
      port: 5173,
      open: false,
    },
    preview: {
      host: true,
      port: 5173,
    },
  };
});
