import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function walkFiles(root: string): Promise<string[]> {
  const output: string[] = [];
  async function visit(directory: string): Promise<void> {
    const names = (await readdir(directory)).sort((a: string, b: string) => a < b ? -1 : a > b ? 1 : 0);
    for (const name of names) {
      const absolute = path.join(directory, name);
      const info = await stat(absolute);
      if (info.isDirectory()) await visit(absolute);
      else output.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  }
  await visit(root);
  return output;
}

export async function createBuildManifest(root: string): Promise<{ algorithm: string; files: Array<{ path: string; bytes: number; sha256: string }>; rootDigest: string }> {
  const paths = (await walkFiles(root)).filter(item => item !== 'build-manifest.json');
  const files = [];
  for (const relative of paths) {
    const bytes = await readFile(path.join(root, relative));
    files.push({ path: relative, bytes: bytes.length, sha256: sha256(bytes) });
  }
  const rootDigest = sha256(canonicalJson(files.map(({ path: filePath, sha256: digest }) => ({ path: filePath, sha256: digest }))));
  return { algorithm: 'CC-WEB-MANIFEST-SHA256-V1', files, rootDigest };
}
