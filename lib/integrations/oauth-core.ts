import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/server/db';
import { encryptToken, decryptToken } from '@/lib/integrations/crypto';
import { getProvider, type ProviderConfig, type IntegrationProvider } from '@/lib/integrations/registry';

/**
 * lib/integrations/oauth-core.ts — Khuôn OAuth authorization-code TỔNG QUÁT (fetch thuần,
 * không NextAuth), nhân từ app/api/auth/google. Khác Google-login: LƯU token (mã hoá) để gọi
 * API thay mặt user, và state-cookie TÁCH theo provider (chống nhầm luồng CSRF).
 */

const stateCookie = (p: string) => `if_oauth_${p}`;

export function callbackUrl(origin: string, provider: string): string {
  return `${origin}/api/integrations/${provider}/callback`;
}

/** Bước 1: dựng URL consent + đặt state cookie httpOnly (CSRF, 10 phút). */
export function buildAuthUrl(cfg: ProviderConfig, origin: string): string {
  const state = crypto.randomUUID();
  cookies().set(stateCookie(cfg.id), state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  const params = new URLSearchParams({
    client_id: clientId(cfg.id),
    redirect_uri: callbackUrl(origin, cfg.id),
    response_type: 'code',
    state,
  });
  if (cfg.scopes?.length) params.set('scope', cfg.scopes.join(' '));
  // Google/MS cần các cờ này để phát refresh_token.
  if (cfg.id === 'google') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }
  return `${cfg.authUrl}?${params.toString()}`;
}

/** Bước 2: so khớp + xoá state (dùng 1 lần). */
export function verifyState(provider: string, returned: string | null): boolean {
  const jar = cookies();
  const saved = jar.get(stateCookie(provider))?.value;
  jar.delete(stateCookie(provider));
  return !!saved && !!returned && saved === returned;
}

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

/** Đổi code lấy token tại token endpoint của provider. */
export async function exchangeCode(cfg: ProviderConfig, code: string, origin: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: callbackUrl(origin, cfg.id),
    client_id: clientId(cfg.id),
    client_secret: clientSecret(cfg.id),
  });
  const res = await fetch(cfg.tokenUrl!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Token endpoint ${cfg.id} lỗi ${res.status}`);
  return res.json();
}

/** Lưu token (mã hoá) vào IntegrationAccount, upsert theo (user, provider). */
export async function saveTokens(userId: string, provider: string, t: TokenSet, meta?: unknown) {
  const expiresAt = t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null;
  const data = {
    accessToken: encryptToken(t.access_token),
    refreshToken: t.refresh_token ? encryptToken(t.refresh_token) : null,
    scope: t.scope ?? '',
    expiresAt,
    meta: meta ? JSON.stringify(meta) : null,
  };
  await prisma.integrationAccount.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, ...data },
    update: data,
  });
}

/**
 * Lấy access token còn hạn cho (user, provider); tự refresh nếu hết hạn & có refresh_token.
 * Trả null nếu chưa kết nối.
 */
export async function getValidToken(userId: string, provider: string): Promise<string | null> {
  const acc = await prisma.integrationAccount.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!acc) return null;
  const notExpired = !acc.expiresAt || acc.expiresAt.getTime() - 60_000 > Date.now();
  if (notExpired) return decryptToken(acc.accessToken);

  // hết hạn → refresh
  const cfg = getProvider(provider);
  if (!cfg?.tokenUrl || !acc.refreshToken) return decryptToken(acc.accessToken);
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: decryptToken(acc.refreshToken),
    client_id: clientId(provider as IntegrationProvider),
    client_secret: clientSecret(provider as IntegrationProvider),
  });
  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Refresh token ${provider} lỗi ${res.status}`);
  const t: TokenSet = await res.json();
  await saveTokens(userId, provider, { ...t, refresh_token: t.refresh_token ?? decryptToken(acc.refreshToken) });
  return t.access_token;
}

export async function disconnect(userId: string, provider: string) {
  await prisma.integrationAccount
    .delete({ where: { userId_provider: { userId, provider } } })
    .catch(() => {});
}

export async function isConnected(userId: string, provider: string): Promise<boolean> {
  const acc = await prisma.integrationAccount.findUnique({
    where: { userId_provider: { userId, provider } },
    select: { id: true },
  });
  return !!acc;
}

/* ── client id/secret theo provider (env, server-only) ── */
function clientId(p: IntegrationProvider): string {
  const map: Record<IntegrationProvider, string> = {
    google: 'GOOGLE_CLIENT_ID',
    ms365: 'MS365_CLIENT_ID',
    zoom: 'ZOOM_CLIENT_ID',
    zalo: 'ZALO_OA_APP_ID',
    spotify: 'SPOTIFY_CLIENT_ID',
    youtube: 'YOUTUBE_CLIENT_ID',
    team: 'TEAM_API_TOKEN',
    applemusic: 'APPLE_MUSIC_KEY_ID',
  };
  return (process.env[map[p]] ?? '').trim();
}
function clientSecret(p: IntegrationProvider): string {
  const map: Record<IntegrationProvider, string> = {
    google: 'GOOGLE_CLIENT_SECRET',
    ms365: 'MS365_CLIENT_SECRET',
    zoom: 'ZOOM_CLIENT_SECRET',
    zalo: 'ZALO_OA_SECRET',
    spotify: 'SPOTIFY_CLIENT_SECRET',
    youtube: 'YOUTUBE_CLIENT_SECRET',
    team: 'TEAM_API_TOKEN',
    applemusic: 'APPLE_MUSIC_PRIVATE_KEY',
  };
  return (process.env[map[p]] ?? '').trim();
}
