import { defineConfig } from 'vite';
import { resolve } from 'path';

// Multi-page app: login (index), student area, teacher area.
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this as a project page (github.io/oral-coach-app/),
  // a sub-path, not the domain root — asset/navigation URLs must account
  // for that in production builds. Dev server stays at the root.
  base: command === 'build' ? '/oral-coach-app/' : '/',
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
}));
