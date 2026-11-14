// @ts-check
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const envFiles = ['.env', '.env.local'];

for (const envFile of envFiles) {
  const envPath = `${repoRoot}/${envFile}`;

  if (!fs.existsSync(envPath)) continue;

  const content = fs.readFileSync(envPath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^(['"])(.*)\1$/, '$2');

    process.env[key] = value;
  }
}

export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'static',
  site: 'https://woolet.com',
  vite: {
    envDir: repoRoot,
  },
  server: {
    port: parseInt(process.env.LANDING_PORT || '4321', 10),
  },
});
