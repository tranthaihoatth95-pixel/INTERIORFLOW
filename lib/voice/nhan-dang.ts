/**
 * lib/voice/nhan-dang.ts — tầng NGHE. Thứ duy nhất trong lib/voice chạm tới trình duyệt.
 *
 * Ranh giới cố ý rất hẹp: file này chỉ biến âm thanh thành `BanChu` rồi thôi. Nó KHÔNG biết
 * lệnh là gì, không biết ghi chú là gì. Nhờ vậy `giai-y-dinh.ts` (nơi chứa toàn bộ nghĩa) vẫn
 * THUẦN và nghiệm thu được bằng cách bơm bản chữ vào — không cần micro.
 *
 * ⛔ KHÔNG nút giả, không giả vờ nghe: `khaNangNghe()` trả lý do bằng TIẾNG NGƯỜI khi máy không
 *    nghe được, và mặt tiền phải hiện đúng lý do đó (§9). Trình duyệt không hỗ trợ / người dùng
 *    từ chối micro là hai lý do KHÁC NHAU, phải nói khác nhau.
 *
 * ⚠️ Web Speech API gửi âm thanh đi nhận dạng ở máy chủ của trình duyệt trên phần lớn nền tảng.
 *    Đây là chỗ đụng luật local-first của IF — GHI RA để không ai tưởng nó chạy cục bộ. Đường
 *    nhận dạng cục bộ là việc của entry `vision-backbone-cuc-bo`/`runtime-ai-trong-if`, không
 *    phải việc lane này; hợp đồng `BanChu` đã tách sẵn nên đổi engine không đụng phần nghĩa.
 */

import type { BanChu, NgonNguNoi } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type LyDoKhongNghe = 'khong-co-api' | 'khong-co-window' | 'khong-an-toan';

export interface KhaNangNghe {
  readonly co: boolean;
  readonly lyDo?: LyDoKhongNghe;
  /** Câu nói thẳng cho người dùng [vi, en] — ≤12 từ, có hướng đi tiếp. */
  readonly noiThang?: [string, string];
}

/**
 * Máy này nghe được không? Nhận `win` để test được mà không cần trình duyệt thật.
 * KHÔNG xin quyền micro ở đây — xin quyền là hành động, phải do người dùng bấm mới xảy ra.
 */
export function khaNangNghe(win?: any): KhaNangNghe {
  const w = win ?? (typeof window === 'undefined' ? undefined : window);
  if (!w) {
    return {
      co: false,
      lyDo: 'khong-co-window',
      noiThang: ['Chỉ nghe được khi mở trong trình duyệt.', 'Listening only works in a browser.'],
    };
  }
  // Web Speech API chỉ chạy trên nguồn an toàn (https hoặc localhost).
  if (w.isSecureContext === false) {
    return {
      co: false,
      lyDo: 'khong-an-toan',
      noiThang: ['Cần mở bằng https mới dùng được micro.', 'Microphone needs an https page.'],
    };
  }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) {
    return {
      co: false,
      lyDo: 'khong-co-api',
      noiThang: ['Trình duyệt này chưa nghe được — hãy gõ chữ.', 'This browser cannot listen — type instead.'],
    };
  }
  return { co: true };
}

export interface MayNgheTuyChon {
  readonly ngonNgu?: NgonNguNoi;
  /** Mỗi lần có chữ mới (kể cả bản tạm). */
  readonly onBanChu: (b: BanChu) => void;
  /** Hỏng giữa chừng — mặt tiền phải hiện, không nuốt. */
  readonly onLoi?: (ma: string) => void;
  readonly onDung?: () => void;
}

export interface MayNghe {
  bat(): void;
  dung(): void;
}

/** Mã BCP-47 gửi cho engine. Tiếng Việt là đường chính nên đứng trước trong mọi mặc định. */
const MA_NGON_NGU: Record<NgonNguNoi, string> = { vi: 'vi-VN', en: 'en-US' };

/**
 * Dựng máy nghe. Trả `null` khi máy không nghe được — nơi gọi PHẢI xử `null` bằng cách hiện
 * `khaNangNghe().noiThang`, không được dựng nút câm.
 *
 * `interimResults` BẬT: người dùng cần thấy chữ chạy ra để biết máy đang nghe thật (tín hiệu
 * thật, không phải hiệu ứng). Nhưng bản tạm mang cờ `tamThoi: true` và `giaiBanChu()` từ chối
 * giải nó — thấy được, không thi hành được.
 */
export function taoMayNghe(tuyChon: MayNgheTuyChon, win?: any): MayNghe | null {
  const w = win ?? (typeof window === 'undefined' ? undefined : window);
  if (!khaNangNghe(w).co) return null;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  const ngonNgu: NgonNguNoi = tuyChon.ngonNgu ?? 'vi';

  const r = new Ctor();
  r.lang = MA_NGON_NGU[ngonNgu];
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;

  r.onresult = (ev: any) => {
    const list = ev.results;
    for (let i = ev.resultIndex; i < list.length; i++) {
      const kq = list[i];
      const alt = kq[0];
      if (!alt) continue;
      // `confidence` của engine trả 0 cho bản tạm ở nhiều trình duyệt — đó là "chưa biết",
      // KHÔNG phải "chắc 0%". Chuyển thành undefined thay vì bịa một con số.
      const c = typeof alt.confidence === 'number' && alt.confidence > 0 ? alt.confidence : undefined;
      tuyChon.onBanChu({
        van: String(alt.transcript ?? ''),
        doTinCay: kq.isFinal ? c : undefined,
        ngonNgu,
        tamThoi: !kq.isFinal,
      });
    }
  };
  r.onerror = (ev: any) => tuyChon.onLoi?.(String(ev?.error ?? 'khong-ro'));
  r.onend = () => tuyChon.onDung?.();

  return {
    bat: () => {
      try {
        r.start();
      } catch (e) {
        // start() ném khi đang chạy sẵn — không phải lỗi người dùng cần biết.
        void e;
      }
    },
    dung: () => {
      try {
        r.stop();
      } catch (e) {
        void e;
      }
    },
  };
}
