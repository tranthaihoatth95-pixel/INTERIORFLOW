import { getValidToken } from '@/lib/integrations/oauth-core';

/**
 * Spotify — KHUNG. Hiện chỉ đọc "đang phát" (metadata) để hiện nhạc nền lúc làm việc.
 * Playback đầy đủ cần Web Playback SDK + tài khoản Premium (client-side) — để sau.
 */
export async function nowPlaying(userId: string) {
  const token = await getValidToken(userId, 'spotify');
  if (!token) throw new Error('Chưa kết nối Spotify.');
  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return null; // không phát gì
  if (!res.ok) throw new Error(`Spotify ${res.status}`);
  const d = await res.json();
  return {
    track: d.item?.name ?? '',
    artist: (d.item?.artists ?? []).map((a: { name: string }) => a.name).join(', '),
    isPlaying: !!d.is_playing,
  };
}
