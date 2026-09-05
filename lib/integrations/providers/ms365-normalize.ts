/**
 * lib/integrations/providers/ms365-normalize.ts — Chuẩn hoá sự kiện Microsoft Graph → `MeetingContext`
 * TÁCH khỏi `ms365.ts` (file đó kéo oauth-core → Prisma, không test node được). Hàm thuần, fixture
 * theo hình dạng Graph v1.0 `/me/calendarView`.
 */
export interface MeetingContext {
  id: string;
  tieuDe: string;
  batDau: string; // ISO
  ketThuc: string; // ISO
  caNgay: boolean;
  truc_tuyen: boolean;
  joinUrl: string | null;
  diaDiem: string | null;
  nguoiToChuc: string | null;
  soNguoi: number;
  /** liên kết mở trên Outlook web — không phải join. */
  webLink: string | null;
  /** nguồn: id provider — để UI ghi "từ Microsoft 365", không phải sự thật dự án. */
  nguon: 'ms365' | 'google';
}

export interface GraphEvent {
  id?: string;
  subject?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  isAllDay?: boolean;
  isOnlineMeeting?: boolean;
  onlineMeeting?: { joinUrl?: string } | null;
  onlineMeetingUrl?: string | null;
  location?: { displayName?: string } | null;
  organizer?: { emailAddress?: { name?: string; address?: string } } | null;
  attendees?: unknown[];
  webLink?: string;
  isCancelled?: boolean;
}

/** Graph trả `dateTime` KHÔNG có hậu tố Z khi timeZone=UTC (vd "2026-09-03T08:00:00.0000000") —
 * gắn Z để client parse đúng. Nếu đã có offset thì giữ. */
export function isoTuGraph(dt: string | undefined, tz: string | undefined): string {
  if (!dt) return '';
  const cat = dt.replace(/(\.\d{3})\d+/, '$1');
  if (/[zZ]$|[+-]\d\d:\d\d$/.test(cat)) return cat;
  return tz === undefined || tz === 'UTC' ? `${cat}Z` : cat;
}

export function chuanHoaSuKienGraph(e: GraphEvent): MeetingContext | null {
  if (!e.id || e.isCancelled) return null;
  const joinUrl = e.onlineMeeting?.joinUrl || e.onlineMeetingUrl || null;
  return {
    id: e.id,
    tieuDe: e.subject?.trim() || '(không tiêu đề)',
    batDau: isoTuGraph(e.start?.dateTime, e.start?.timeZone),
    ketThuc: isoTuGraph(e.end?.dateTime, e.end?.timeZone),
    caNgay: !!e.isAllDay,
    truc_tuyen: !!e.isOnlineMeeting || !!joinUrl,
    joinUrl,
    diaDiem: e.location?.displayName?.trim() || null,
    nguoiToChuc: e.organizer?.emailAddress?.name?.trim() || e.organizer?.emailAddress?.address?.trim() || null,
    soNguoi: Array.isArray(e.attendees) ? e.attendees.length : 0,
    webLink: e.webLink ?? null,
    nguon: 'ms365',
  };
}

export function chuanHoaDanhSachGraph(items: unknown): MeetingContext[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => chuanHoaSuKienGraph((it ?? {}) as GraphEvent))
    .filter((m): m is MeetingContext => m !== null)
    .sort((a, b) => a.batDau.localeCompare(b.batDau));
}

/** Khung thời gian mặc định cho bối cảnh dự án: hôm nay → +14 ngày. */
export function khungMacDinh(now = new Date()): { tu: string; den: string } {
  const tu = new Date(now.getTime());
  tu.setUTCHours(0, 0, 0, 0);
  const den = new Date(tu.getTime() + 14 * 86_400_000);
  return { tu: tu.toISOString(), den: den.toISOString() };
}
