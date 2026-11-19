// Vice Cover Studio — entry program (Node 22, standard library only).
//
// Hands the app in: copies app/ and screenshots/ from this repository into
// the output directory and writes /output/dossier.json with buildDossier
// from vendor/makefun-app.ts. Deterministic: two runs write identical bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function listFilesSorted(dir: string, base = ''): string[] {
  const out: string[] = [];
  const entries = readdirSync(join(dir, base), { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  for (const entry of entries) {
    const rel = base === '' ? entry.name : `${base}/${entry.name}`;
    if (entry.isDirectory()) out.push(...listFilesSorted(dir, rel));
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

function copyTree(sourceDir: string, targetDir: string): void {
  for (const rel of listFilesSorted(sourceDir)) {
    const from = join(sourceDir, rel);
    const to = join(targetDir, rel);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to);
  }
}

function main(): void {
  const appDir = join(REPO_ROOT, 'app');
  const shotsDir = join(REPO_ROOT, 'screenshots');
  if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
    throw new Error('main.ts: app/ is missing from the repository');
  }
  if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
    throw new Error('main.ts: screenshots/ is missing from the repository');
  }
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyTree(appDir, join(OUTPUT_DIR, 'app'));
  copyTree(shotsDir, join(OUTPUT_DIR, 'screenshots'));
  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log(`wrote ${join(OUTPUT_DIR, 'dossier.json')} (${dossier.length} bytes)`);
}

main();
