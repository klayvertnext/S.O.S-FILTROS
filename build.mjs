import { copyFile, mkdir, rm } from 'node:fs/promises';

const publicFiles = [
  'index.html',
  'styles.css',
  'sos-theme.css',
  'app.js',
  'logo-sos-small.png'
];

await rm('public', { recursive: true, force: true });
await mkdir('public', { recursive: true });
await Promise.all(publicFiles.map(file => copyFile(file, `public/${file}`)));
