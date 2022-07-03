import { cp, rm } from 'node:fs/promises';

await rm('dist/languages', { recursive: true, force: true });
await cp('src/languages', 'dist/languages', { recursive: true });