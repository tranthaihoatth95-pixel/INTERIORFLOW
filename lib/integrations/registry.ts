/**
 * lib/integrations/registry.ts — Khai báo mọi dịch vụ tích hợp (source of truth).
 *
 * Mỗi provider: endpoint OAuth + scope TỐI THIỂU + hàm configured() (đọc env, không lộ key).
 * oauth-core + dispatcher đọc bảng này. Tier: 1=xây thật · 2=khung(gate khoá) · 3=stub.
 * Scope mặc định ưu tiên READONLY; quyền ghi (mail-send/calendar-write) để cờ riêng khi bật.
 */
export type IntegrationProvider =
  | 'google'
  | 'ms365'
  | 'zoom'
  | 'team'
  | 'zalo'
  | 'spotify'
  | 'youtube'
  | 'applemusic';

export interface ProviderConfig {
  id: IntegrationProvider;
  label: string;
  tier: 1 | 2 | 3;
  kind: 'oauth' | 'apikey' | 'stub';
  authUrl?: string;
  tokenUrl?: string;
  /** scope tối thiểu (readonly-first). */
  scopes?: string[];
  /** đọc env → đã cấu hình chưa (KHÔNG trả giá trị key). */
  configured: () => boolean;
  /** ghi chú rủi ro/ToS hiển thị cho dev. */
  note?: string;
}

const env = (k: string) => (process.env[k] ?? '').trim();
const has = (...keys: string[]) => keys.every((k) => env(k).length > 0);

export const REGISTRY: Record<IntegrationProvider, ProviderConfig> = {
  google: {
    id: 'google',
    label: 'Google Workspace',
    tier: 1,
    kind: 'oauth',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    // readonly-first: đọc lịch + gửi mail (gửi là quyền ghi — cân nhắc tách sau).
    scopes: [
      'openid',
      'email',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/drive.file',
    ],
    configured: () => has('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
  },
  ms365: {
    id: 'ms365',
    label: 'Microsoft 365',
    tier: 1,
    kind: 'oauth',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['offline_access', 'User.Read', 'Calendars.Read', 'Mail.Read'],
    configured: () => has('MS365_CLIENT_ID', 'MS365_CLIENT_SECRET'),
  },
  zoom: {
    id: 'zoom',
    label: 'Zoom',
    tier: 1,
    kind: 'oauth',
    authUrl: 'https://zoom.us/oauth/authorize',
    tokenUrl: 'https://zoom.us/oauth/token',
    scopes: ['meeting:write'],
    configured: () => has('ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'),
  },
  team: {
    id: 'team',
    label: 'Team API (nội bộ)',
    tier: 1,
    kind: 'apikey',
    configured: () => has('TEAM_API_BASE', 'TEAM_API_TOKEN'),
    note: 'Adapter REST generic — chờ spec hệ thống nội bộ của đội.',
  },
  zalo: {
    id: 'zalo',
    label: 'Zalo Official Account',
    tier: 2,
    kind: 'oauth',
    authUrl: 'https://oauth.zaloapp.com/v4/oa/permission',
    tokenUrl: 'https://oauth.zaloapp.com/v4/oa/access_token',
    scopes: [],
    configured: () => has('ZALO_OA_APP_ID', 'ZALO_OA_SECRET'),
    note: 'CHỈ Official Account/ZNS. Zalo CÁ NHÂN không có API → tự động hoá = vi phạm ToS, KHÔNG hỗ trợ.',
  },
  spotify: {
    id: 'spotify',
    label: 'Spotify',
    tier: 2,
    kind: 'oauth',
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    scopes: ['user-read-playback-state', 'user-read-currently-playing'],
    configured: () => has('SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'),
    note: 'Playback đầy đủ cần Web Playback SDK + premium — hiện chỉ metadata/nhúng.',
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    tier: 2,
    kind: 'apikey',
    configured: () => has('YOUTUBE_API_KEY'),
    note: 'Data API v3 (quota-limited) cho tìm/nhúng video tham khảo. Cần cache + backoff.',
  },
  applemusic: {
    id: 'applemusic',
    label: 'Apple Music',
    tier: 3,
    kind: 'stub',
    configured: () => has('APPLE_MUSIC_TEAM_ID', 'APPLE_MUSIC_KEY_ID', 'APPLE_MUSIC_PRIVATE_KEY'),
    note: 'Cần Apple Developer + MusicKit + JWT ký .p8; playback chỉ trong SDK Apple → hiện STUB.',
  },
};

export function getProvider(id: string): ProviderConfig | null {
  return (REGISTRY as Record<string, ProviderConfig>)[id] ?? null;
}
