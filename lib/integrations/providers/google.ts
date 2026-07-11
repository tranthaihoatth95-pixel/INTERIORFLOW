import { getValidToken } from '@/lib/integrations/oauth-core';

/**
 * Google Workspace — Calendar (readonly) + Gmail (send) + Drive (file). REST qua fetch thuần
 * (không nạp googleapis nặng). Token lấy qua getValidToken('google'). ⚠ gmail.send là quyền GHI.
 */
export async function listCalendarEvents(userId: string, max = 5) {
  const token = await getValidToken(userId, 'google');
  if (!token) throw new Error('Chưa kết nối Google.');
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('maxResults', String(max));
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('timeMin', new Date().toISOString());
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Google Calendar ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((e: { summary?: string; start?: { dateTime?: string; date?: string } }) => ({
    title: e.summary ?? '(không tiêu đề)',
    start: e.start?.dateTime ?? e.start?.date ?? '',
  }));
}

/** Gửi mail qua Gmail API (RFC822 base64url). Quyền GHI — dùng có chủ đích. */
export async function sendMail(userId: string, to: string, subject: string, body: string) {
  const token = await getValidToken(userId, 'google');
  if (!token) throw new Error('Chưa kết nối Google.');
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=\r\n` +
      `Content-Type: text/plain; charset=UTF-8\r\n\r\n${body}`,
  ).toString('base64url');
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) throw new Error(`Gmail send ${res.status}`);
  return res.json();
}
