// One-time setup: connects your Google Calendar to the /book flow.
// Run it in your own terminal from the repo root:  node scripts/google-auth.mjs
// It asks for your OAuth client id/secret, opens Google's consent screen, then saves
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN to Vercel (production).

import http from 'node:http';
import { spawn, exec } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}`;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const clientId = (await rl.question('OAuth client ID: ')).trim();
const clientSecret = (await rl.question('OAuth client secret: ')).trim();
rl.close();

const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: clientId, redirect_uri: REDIRECT, response_type: 'code', scope: SCOPE,
  access_type: 'offline', prompt: 'consent',
});

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const params = new URL(req.url, REDIRECT).searchParams;
    if (!params.has('code') && !params.has('error')) return res.end();
    res.end(params.has('code') ? 'Connected! You can close this tab.' : `Error: ${params.get('error')}`);
    server.close();
    params.has('code') ? resolve(params.get('code')) : reject(new Error(params.get('error')));
  });
  server.listen(PORT, () => {
    console.log(`\nOpening Google sign-in. If nothing opens, visit:\n${authUrl}\n`);
    const opener = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${opener} "${authUrl}"`);
  });
});

const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    code, client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT, grant_type: 'authorization_code',
  }),
});
const tokens = await res.json();
if (!tokens.refresh_token) throw new Error(`No refresh token: ${JSON.stringify(tokens)}`);

function vercelEnv(name, value) {
  return new Promise((resolve, reject) => {
    const rm = spawn('vercel', ['env', 'rm', name, 'production', '--yes'], { shell: true, stdio: 'ignore' });
    rm.on('close', () => {
      const add = spawn('vercel', ['env', 'add', name, 'production', '--sensitive'], { shell: true, stdio: ['pipe', 'ignore', 'inherit'] });
      add.stdin.end(value);
      add.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`vercel env add ${name} failed`))));
    });
  });
}

await vercelEnv('GOOGLE_CLIENT_ID', clientId);
await vercelEnv('GOOGLE_CLIENT_SECRET', clientSecret);
await vercelEnv('GOOGLE_REFRESH_TOKEN', tokens.refresh_token);
console.log('\nSaved to Vercel. Redeploy (vercel deploy --prod) and new bookings will land on your calendar.');
