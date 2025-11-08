// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig(async ({ mode }) => {
  const plugins = [react()];

  // شغّل إضافات الـ visual-editor فقط محليًا وأصلًا إذا كانت ملفاتها موجودة
  const veDir = path.resolve(__dirname, 'plugins/visual-editor');
  const dev = mode === 'development';

  if (dev && fs.existsSync(veDir)) {
    try {
      const { default: inlineEditor } = await import('./plugins/visual-editor/vite-plugin-react-inline-editor.js');
      const { default: editMode } = await import('./plugins/visual-editor/vite-plugin-edit-mode.js');
      inlineEditor && plugins.push(inlineEditor());
      editMode && plugins.push(editMode());
    } catch {
      // تجاهل لو ناقصة — لا تمنع البناء
    }
  }

  return {
    plugins,
    // بقية إعداداتك إن وُجدت…
  };
});
