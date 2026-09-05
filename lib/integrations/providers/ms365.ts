import { getValidToken } from '@/lib/integrations/oauth-core';
import { chuanHoaDanhSachGraph, khungMacDinh, type MeetingContext } from '@/lib/integrations/providers/ms365-normalize';

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

/**
 * Slice 7 (09/26) — HỌP/LỊCH cho bối cảnh dự án: `/me/calendarView` (mở rộng sự kiện lặp, đúng khung
 * thời gian) thay vì `/me/events` (không mở rộng lặp). Chỉ `$select` trường cần — không kéo body mail
 * họp. Header `Prefer: outlook.timezone="UTC"` để `dateTime` về UTC thống nhất (normalize gắn Z).
 * Scope cần: `Calendars.Read` (đối chiếu trước ở `calendar.ts`, ở đây 403 chỉ còn là lỗi thật).
 */
export async function listMeetings(
  userId: string,
  opts: { tu?: string; den?: string; max?: number } = {},
): Promise<MeetingContext[]> {
  const token = await getValidToken(userId, 'ms365');
  if (!token) throw new Error('Chưa kết nối Microsoft 365.');
  const khung = khungMacDinh();
  const url = new URL('https://graph.microsoft.com/v1.0/me/calendarView');
  url.searchParams.set('startDateTime', opts.tu ?? khung.tu);
  url.searchParams.set('endDateTime', opts.den ?? khung.den);
  url.searchParams.set('$top', String(Math.min(Math.max(opts.max ?? 25, 1), 100)));
  url.searchParams.set('$orderby', 'start/dateTime');
  url.searchParams.set(
    '$select',
    'id,subject,start,end,isAllDay,isOnlineMeeting,onlineMeeting,onlineMeetingUrl,location,organizer,attendees,webLink,isCancelled',
  );
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' },
  });
  if (!res.ok) throw new Error(`MS Graph calendarView ${res.status}`);
  const data = (await res.json()) as { value?: unknown };
  return chuanHoaDanhSachGraph(data.value);
}

/**
 * ĐẶT PHÒNG (Microsoft Bookings) — CỬA CHƯA MỞ, khai thật thay vì trả mảng rỗng giả:
 * cần scope `Bookings.Read.All` (KHÔNG nằm trong scope tối thiểu registry) + endpoint
 * `/solutions/bookingBusinesses/{id}/appointments` + tenant có bật Bookings. Chưa có mã gọi.
 */
export const BOOKING_GATE = {
  scope: 'Bookings.Read.All',
  endpoint: '/solutions/bookingBusinesses/{id}/appointments',
  trangThai: 'chua-co-ma' as const,
};
