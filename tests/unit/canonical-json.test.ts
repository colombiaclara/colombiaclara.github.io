import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { canonicalJson, createBuildManifest, sha256, walkFiles } from '../../src/build/canonical-json.ts';

test('canonical JSON sorts keys and retains array order', () => {
  assert.equal(canonicalJson({ z: 1, a: [{ b: 2, a: 1 }] }), '{\n  "a": [\n    {\n      "a": 1,\n      "b": 2\n    }\n  ],\n  "z": 1\n}\n');
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('walk and manifest are stable and exclude self', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'cc-manifest-'));
  await mkdir(path.join(root, 'b'));
  await writeFile(path.join(root, 'b', 'z.txt'), 'z');
  await writeFile(path.join(root, 'a.txt'), 'a');
  await writeFile(path.join(root, 'build-manifest.json'), 'ignored');
  assert.deepEqual(await walkFiles(root), ['a.txt', 'b/z.txt', 'build-manifest.json']);
  const manifest = await createBuildManifest(root);
  assert.deepEqual(manifest.files.map(file => file.path), ['a.txt', 'b/z.txt']);
  assert.equal(manifest.rootDigest.length, 64);
});
