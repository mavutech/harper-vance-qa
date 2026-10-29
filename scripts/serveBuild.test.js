/** @fileoverview Smoke checks for compiled preview media and range responses. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const path = require('node:path');

test('compiled preview supports video ranges, HEAD, and invalid ranges', {timeout: 15000}, async () => {
  const port = '4187';
  const server = spawn(process.execPath, [path.join(__dirname, 'serveBuild.js')], {
    env: {...process.env, PORT: port}, stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise((resolve, reject) => {
      server.stdout.once('data', resolve);
      server.once('error', reject);
      server.once('exit', (code) => reject(new Error(`Preview exited: ${code}`)));
    });
    const url = `http://127.0.0.1:${port}/media/harper-vance-walkthrough-v6.mp4`;
    const head = await fetch(url, {method: 'HEAD'});
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-type'), 'video/mp4');
    const size = Number(head.headers.get('content-length'));
    assert.ok(size > 1024);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    for (const range of ['bytes=0-1023', 'bytes=-1024', `bytes=${size - 1024}-`]) {
      const response = await fetch(url, {headers: {Range: range}});
      assert.equal(response.status, 206);
      assert.equal((await response.arrayBuffer()).byteLength, 1024);
      assert.match(response.headers.get('content-range'), /^bytes \d+-\d+\/\d+$/);
    }
    for (const range of ['bytes=-', 'bytes=5-1', `bytes=${size}-`, 'bytes=0-1,3-4']) {
      const response = await fetch(url, {headers: {Range: range}});
      assert.equal(response.status, 416);
    }
    const captions = await fetch(`http://127.0.0.1:${port}/media/harper-vance-walkthrough-v6.en.vtt`);
    assert.match(captions.headers.get('content-type'), /^text\/vtt/);
    assert.match(await captions.text(), /^WEBVTT/);
  } finally {
    server.kill('SIGTERM');
  }
});
