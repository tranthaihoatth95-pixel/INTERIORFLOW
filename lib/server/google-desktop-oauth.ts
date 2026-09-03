import { createHash, randomBytes } from 'node:crypto';

type Ticket = { userId: string; expiresAt: number };

const globalTickets = globalThis as typeof globalThis & {
  __ifGoogleDesktopTickets?: Map<string, Ticket>;
};

const tickets = globalTickets.__ifGoogleDesktopTickets ?? new Map<string, Ticket>();
globalTickets.__ifGoogleDesktopTickets = tickets;

export const GOOGLE_DESKTOP_STATE_COOKIE = 'if_google_desktop_state';
export const GOOGLE_DESKTOP_VERIFIER_COOKIE = 'if_google_desktop_verifier';

export function base64url(input: Buffer) {
  return input.toString('base64url');
}

export function newPkce() {
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

export function localDesktopOrigin(url: URL): string | null {
  if (url.protocol !== 'http:' || (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost')) return null;
  return url.origin;
}

export function issueDesktopTicket(userId: string, now = Date.now()) {
  for (const [key, value] of tickets) if (value.expiresAt <= now) tickets.delete(key);
  const ticket = base64url(randomBytes(32));
  tickets.set(ticket, { userId, expiresAt: now + 60_000 });
  return ticket;
}

export function consumeDesktopTicket(ticket: string, now = Date.now()): string | null {
  const record = tickets.get(ticket);
  tickets.delete(ticket); // một lần, kể cả đã hết hạn
  return record && record.expiresAt > now ? record.userId : null;
}
