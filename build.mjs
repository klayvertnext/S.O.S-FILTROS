import { copyFile, mkdir, rm } from 'node:fs/promises';

const publicFiles = [
  'index.html',
  'styles.css',
  'motion.css',
  'sos-theme.css',
  'admin.css',
  'admin-layout-fix.css',
  'site-config.js',
  'supabase-api.js',
  'app.js',
  'motion.js',
  'painel.js',
  'logo-sos-small.png',
  'logo-sos-icone.png',
  'site/index.html'
];

await rm('public', { recursive: true, force: true });
await mkdir('public', { recursive: true });
await mkdir('public/site', { recursive: true });
await Promise.all(publicFiles.map(file => copyFile(file, `public/${file}`)));
