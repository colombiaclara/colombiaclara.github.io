import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.OUTPUT_PATH ?? 'dist');
const hostFlag = process.argv.indexOf('--host');
const portFlag = process.argv.indexOf('--port');
const host = hostFlag >= 0 ? process.argv[hostFlag + 1] : '127.0.0.1';
const port = portFlag >= 0 ? Number(process.argv[portFlag + 1]) : 4173;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const decoded = decodeURIComponent(url.pathname);
    if (decoded.includes('..') || decoded.includes('\\')) throw new Error('unsafe path');
    let file = path.join(root, decoded);
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = path.join(file, 'index.html');
    const bytes = await readFile(file);
    response.writeHead(200, { 'content-type': mime[path.extname(file)] ?? 'application/octet-stream', 'x-content-type-options': 'nosniff' });
    response.end(bytes);
  } catch {
    const bytes = await readFile(path.join(root, '404.html'));
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    response.end(bytes);
  }
});
server.listen(port, host, () => console.log(`Preview ready on ${host}:${port}`));
