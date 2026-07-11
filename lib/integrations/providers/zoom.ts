import { getValidToken } from '@/lib/integrations/oauth-core';

/**
 * Zoom — tạo meeting + trả join URL (gắn vào Calendar / luồng present cho khách).
 * Token qua getValidToken('zoom'). Scope tối thiểu: meeting:write.
 */
export async function createMeeting(userId: string, topic: string, startISO?: string) {
  const token = await getValidToken(userId, 'zoom');
  if (!token) throw new Error('Chưa kết nối Zoom.');
  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      type: startISO ? 2 : 1, // 2 = scheduled, 1 = instant
      start_time: startISO,
      settings: { join_before_host: true, waiting_room: true },
    }),
  });
  if (!res.ok) throw new Error(`Zoom create meeting ${res.status}`);
  const m = await res.json();
  return { id: m.id, joinUrl: m.join_url as string, startUrl: m.start_url as string };
}
