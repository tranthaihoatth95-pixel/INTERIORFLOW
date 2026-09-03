import assert from 'node:assert/strict';
import {
  consumeDesktopTicket,
  issueDesktopTicket,
  localDesktopOrigin,
  newPkce,
} from './google-desktop-oauth';

const pkce = newPkce();
assert.match(pkce.verifier, /^[A-Za-z0-9_-]{43,128}$/);
assert.match(pkce.challenge, /^[A-Za-z0-9_-]{43}$/);
assert.notEqual(pkce.verifier, pkce.challenge);

assert.equal(localDesktopOrigin(new URL('http://127.0.0.1:3777/x')), 'http://127.0.0.1:3777');
assert.equal(localDesktopOrigin(new URL('http://localhost:3777/x')), 'http://localhost:3777');
assert.equal(localDesktopOrigin(new URL('https://127.0.0.1:3777/x')), null);
assert.equal(localDesktopOrigin(new URL('http://evil.example/x')), null);

const now = Date.now();
const ticket = issueDesktopTicket('user-1', now);
assert.equal(consumeDesktopTicket(ticket, now + 1), 'user-1');
assert.equal(consumeDesktopTicket(ticket, now + 2), null, 'ticket phải chống replay');
const expired = issueDesktopTicket('user-2', now);
assert.equal(consumeDesktopTicket(expired, now + 60_001), null);

console.log('google desktop oauth: PASS');
