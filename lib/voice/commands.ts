/**
 * lib/voice/commands.ts — NGỮ PHÁP LỆNH GIỌNG NÓI cho trình chiếu (02/09, slice "Present +
 * BOQ + voice"). MỘT hành động duy nhất được mở cho giọng nói: ĐIỀU HƯỚNG TRANG khi đang trình
 * chiếu — tất định (bảng từ khoá cố định VI/EN, không AI), thuận nghịch (lật trang không đổi
 * dữ liệu, lùi lại được ngay), KHÔNG BAO GIỜ đụng model deck/Doc (voice không ghi sự thật dự án).
 *
 * THUẦN — không Web Speech API ở đây (đó là việc của `components/voice/VoiceNav.tsx`); file này
 * chỉ biến CHUỖI đã nhận dạng → LỆNH, để test bằng sucrase-node và để mọi nguồn chữ (giọng nói,
 * ô gõ, phím tắt) đi qua cùng một bảng lệnh.
 */

export type VoiceNavCommand =
  | { kind: 'next' }
  | { kind: 'prev' }
  | { kind: 'first' }
  | { kind: 'last' }
  | { kind: 'goto'; page: number }
  | { kind: 'stop' }
  | { kind: 'none' };

/** Bỏ dấu tiếng Việt + hạ chữ + gom khoảng trắng — để "Trang Tiếp" ≡ "trang tiep" ≡ "trang tiếp". */
export function normalizeUtterance(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const WORD_NUM: Record<string, number> = {
  // VI (đã bỏ dấu)
  mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, sau: 6, bay: 7, tam: 8, chin: 9, muoi: 10,
  // EN
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

function readNumber(tok: string[]): number | null {
  if (!tok.length) return null;
  if (/^\d{1,3}$/.test(tok[0])) return Number(tok[0]);
  const a = WORD_NUM[tok[0]];
  if (a === undefined) return null;
  // "muoi hai" = 12 · "hai muoi" = 20 · "hai muoi ba" = 23 (đủ cho deck ≤ 99 trang)
  if (a === 10 && tok[1] && WORD_NUM[tok[1]] !== undefined && WORD_NUM[tok[1]] < 10) return 10 + WORD_NUM[tok[1]];
  if (a < 10 && tok[1] === 'muoi') {
    const c = tok[2] && WORD_NUM[tok[2]] !== undefined && WORD_NUM[tok[2]] < 10 ? WORD_NUM[tok[2]] : 0;
    return a * 10 + c;
  }
  return a;
}

/**
 * Chuỗi nhận dạng → lệnh. Bảng từ khoá CỐ ĐỊNH — thêm từ là thêm ở đây kèm test, không học máy.
 * Ưu tiên: dừng nghe > tới trang N > đầu/cuối > tiếp/lùi. Không khớp → 'none' (UI im lặng, chỉ
 * hiện transcript để người nói biết máy nghe gì).
 */
export function parseVoiceNav(raw: string): VoiceNavCommand {
  const s = normalizeUtterance(raw);
  if (!s) return { kind: 'none' };
  const t = s.split(' ');
  const has = (...phr: string[]) => phr.some((p) => (` ${s} `).includes(` ${p} `));

  if (has('dung nghe', 'tat mic', 'stop listening', 'thoi nghe', 'stop voice')) return { kind: 'stop' };

  // "trang 5" · "toi trang 12" · "den trang ba" · "go to slide 4" · "slide seven" · "page 3"
  const m = t.findIndex((w) => w === 'trang' || w === 'slide' || w === 'page');
  if (m >= 0) {
    const n = readNumber(t.slice(m + 1));
    if (n !== null && n >= 1) return { kind: 'goto', page: n };
  }

  if (has('trang dau', 'dau tien', 've dau', 'first slide', 'first page', 'go first', 'beginning')) return { kind: 'first' };
  if (has('trang cuoi', 'cuoi cung', 'last slide', 'last page', 'go last', 'the end')) return { kind: 'last' };
  if (has('trang tiep', 'tiep theo', 'tiep', 'ke tiep', 'sang trang', 'next', 'forward', 'next slide', 'next page')) return { kind: 'next' };
  if (has('trang truoc', 'lui lai', 'quay lai', 'lui', 'truoc', 'previous', 'back', 'go back', 'previous slide')) return { kind: 'prev' };
  return { kind: 'none' };
}

/** Áp lệnh lên chỉ số trang — thuần, kẹp trong [0, total-1]. 'stop'/'none' trả nguyên. */
export function applyVoiceNav(cmd: VoiceNavCommand, idx: number, total: number): number {
  if (total <= 0) return 0;
  const clamp = (n: number) => Math.max(0, Math.min(total - 1, n));
  switch (cmd.kind) {
    case 'next': return clamp(idx + 1);
    case 'prev': return clamp(idx - 1);
    case 'first': return 0;
    case 'last': return total - 1;
    case 'goto': return clamp(cmd.page - 1);
    default: return clamp(idx);
  }
}

/** Nhãn ngắn của lệnh để đọc lên vùng aria-live (người dùng biết máy đã hiểu gì). */
export function describeVoiceNav(cmd: VoiceNavCommand, lang: 'vi' | 'en'): string {
  const L = (vi: string, en: string) => (lang === 'vi' ? vi : en);
  switch (cmd.kind) {
    case 'next': return L('Trang tiếp', 'Next slide');
    case 'prev': return L('Trang trước', 'Previous slide');
    case 'first': return L('Trang đầu', 'First slide');
    case 'last': return L('Trang cuối', 'Last slide');
    case 'goto': return L(`Tới trang ${cmd.page}`, `Go to slide ${cmd.page}`);
    case 'stop': return L('Dừng nghe', 'Stop listening');
    default: return L('Không hiểu — thử "trang tiếp", "trang trước", "trang 3"', 'Not understood — try "next", "back", "slide 3"');
  }
}

/** Gợi ý câu lệnh hiện cạnh nút mic — cùng bảng từ khoá, không bịa thêm. */
export function voiceNavHints(lang: 'vi' | 'en'): string[] {
  return lang === 'vi'
    ? ['trang tiếp', 'trang trước', 'trang đầu', 'trang cuối', 'trang 5', 'dừng nghe']
    : ['next', 'back', 'first slide', 'last slide', 'slide 5', 'stop listening'];
}
