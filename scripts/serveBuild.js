#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * @fileoverview Serves the compiled single-page application during CI checks.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const {publicPageRedirect} = require('./publicPageRedirect');

const buildDirectory = path.resolve(__dirname, '..', 'build');
const fallbackFile = path.join(buildDirectory, 'index.html');
const port = Number.parseInt(process.env.PORT, 10) || 3000;
const contentTypes = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.vtt': 'text/vtt; charset=utf-8',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
});

/**
 * Resolves a request to a compiled asset or the SPA entry point.
 *
 * @param {string} requestUrl - Incoming request URL
 * @returns {Promise<string>} Safe file path inside the build directory
 */
async function resolveFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
  const relativePath = pathname.replace(/^\/+/, '');
  const requestedFile = path.resolve(buildDirectory, relativePath);
  if (!requestedFile.startsWith(`${buildDirectory}${path.sep}`) && requestedFile !== buildDirectory) {
    return fallbackFile;
  }
  try {
    const stats = await fs.promises.stat(requestedFile);
    if (stats.isFile()) return requestedFile;
  } catch (_error) {
    // Client-side routes use the compiled entry point.
  }
  return fallbackFile;
}

const server = http.createServer(async (request, response) => {
  try {
    const destination = publicPageRedirect(request.url || '/', request.method);
    if (destination) {
      response.writeHead(302, {Location: destination, 'Cache-Control': 'no-store'});
      response.end();
      return;
    }
    const filePath = await resolveFile(request.url || '/');
    const body = await fs.promises.readFile(filePath);
    const headers = {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'bytes',
    };
    const range = request.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = match && match[1] ? Number(match[1]) : Math.max(0, body.length - Number(match?.[2]));
      const end = match && match[1] && match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= body.length) {
        response.writeHead(416, {...headers, 'Content-Range': `bytes */${body.length}`});
        response.end();
        return;
      }
      response.writeHead(206, {...headers, 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Content-Length': end - start + 1});
      response.end(request.method === 'HEAD' ? undefined : body.subarray(start, end + 1));
      return;
    }
    response.writeHead(200, {...headers, 'Content-Length': body.length});
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (_error) {
    response.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end('Unable to serve the compiled application.');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Compiled application available at http://127.0.0.1:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
