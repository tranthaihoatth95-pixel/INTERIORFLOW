import { getValidToken } from '@/lib/integrations/oauth-core';

/**
 * Microsoft 365 (Graph) — Outlook Calendar + Mail (READONLY mặc định). REST fetch tới
 * graph.microsoft.com. Token qua getValidToken('ms365'). Bật Mail.Send/Calendars.ReadWrite
 * riêng (đổi scope trong registry) khi cần quyền ghi.
 */
async function graph(userId: string, path: string) {
  const token = await getValidToken(userId, 'ms365');
  if (!token) throw new Error('Chưa kết nối Microsoft 365.');
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`MS Graph ${res.status}`);
  return res.json();
}

export async function listCalendarEvents(userId: string, max = 5) {
  const data = await graph(userId, `/me/events?$top=${max}&$orderby=start/dateTime&$select=subject,start`);
  return (data.value ?? []).map((e: { subject?: string; start?: { dateTime?: string } }) => ({
    title: e.subject ?? '(no subject)',
    start: e.start?.dateTime ?? '',
  }));
}

export async function listMailMessages(userId: string, max = 5) {
  const data = await graph(userId, `/me/messages?$top=${max}&$select=subject,from,receivedDateTime`);
  return (data.value ?? []).map(
    (m: { subject?: string; from?: { emailAddress?: { address?: string } }; receivedDateTime?: string }) => ({
      subject: m.subject ?? '',
      from: m.from?.emailAddress?.address ?? '',
      at: m.receivedDateTime ?? '',
    }),
  );
}
