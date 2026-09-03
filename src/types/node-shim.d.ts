declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  version: string;
  cwd(): string;
  exitCode?: number;
};

declare const Buffer: {
  byteLength(value: string): number;
  from(value: string): Uint8Array;
};

declare module 'node:assert/strict' {
  const assert: any;
  export default assert;
}

declare module 'node:crypto' {
  export function createHash(algorithm: string): any;
}

declare module 'node:fs' {
  export const existsSync: any;
  export const readFileSync: any;
  export const statSync: any;
}

declare module 'node:fs/promises' {
  export const access: any;
  export const cp: any;
  export const mkdir: any;
  export const mkdtemp: any;
  export const readFile: any;
  export const readdir: any;
  export const rm: any;
  export const stat: any;
  export const writeFile: any;
}

declare module 'node:http' {
  export const createServer: any;
}

declare module 'node:os' {
  export const tmpdir: any;
}

declare module 'node:path' {
  const path: any;
  export default path;
}

declare module 'node:module' {
  export function stripTypeScriptTypes(code: string, options?: { mode?: 'strip' | 'transform'; sourceMap?: boolean }): string;
}

declare module 'node:zlib' {
  export const gzipSync: any;
}

declare module 'node:test' {
  const test: any;
  export default test;
}

declare module 'node:url' {
  export const fileURLToPath: any;
}

declare module 'node:child_process' {
  export const spawn: any;
  export const spawnSync: any;
}
