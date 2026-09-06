import { defineConfig } from 'vite';
import { resolve } from 'path';

// Multi-page app: login (index), student area, teacher area.
// Student/teacher pages are stubs for now — built out in later steps.
export default defineConfig({
  server: { port: 5173 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        student: resolve(__dirname, 'student.html'),
        teacher: resolve(__dirname, 'teacher.html'),
      },
    },
  },
});
