/**
 * lib/commands/vcb.ts — SPEC-LENH-VE-IF §1/§4 khuyết ② "gõ số SAU thao tác kiểu VCB" (SketchUp
 * Value Control Box): kéo đại → gõ số → Enter → CHỈNH LẠI ĐƯỢC bằng gõ số mới cho tới thao tác kế.
 * Nhận thêm `3x` (nhân bản N lần, spacing = khoảng đã kéo) và `/3` (chia đều N, GIỮ NGUYÊN tổng
 * khoảng cách đã kéo) khi đang ở luồng Move-copy.
 *
 * Chỉ phần LÕI THUẦN (parse chuỗi gõ vào → tính toán) — KHÔNG giữ trạng thái "ô VCB đang mở cho
 * thao tác nào" (đó là state UI: khi nào mở, khi nào đóng lại lúc bắt đầu thao tác kế tiếp — nơi
 * gọi, CHINH/G4, tự quản qua state component/store, giống cách `campath.ts` thuần và
 * `Scene3DViewer.tsx` giữ state UI riêng). Cùng phong cách immutable/thuần với mọi module khác
 * trong `lib/cad/`+`lib/commands/`.
 */

export interface VcbValueToken {
  kind: 'value';
  /** mm — mọi số trần trong sổ lệnh IF đều là mm (xem alias 'O 150'/'F 50' trong `registry.ts`). */
  valueMm: number;
}
export interface VcbMultiplyToken {
  kind: 'multiply';
  /** N ở dạng `3x`/`x3` — số bản sao MONG MUỐN (không tính bản gốc), > 0, nguyên. */
  n: number;
}
export interface VcbDivideToken {
  kind: 'divide';
  /** N ở dạng `/3` — chia ĐỀU tổng khoảng cách đã kéo thành N phần, > 0, nguyên. */
  n: number;
}
export interface VcbInvalidToken {
  kind: 'invalid';
  raw: string;
}
export type VcbToken = VcbValueToken | VcbMultiplyToken | VcbDivideToken | VcbInvalidToken;

/**
 * Parse 1 chuỗi người dùng gõ vào ô VCB. Chấp nhận khoảng trắng thừa, dấu phẩy thập phân kiểu VN
 * (','→'.'). `3x`/`x3` (không phân biệt hoa/thường) = nhân bản; `/3` (có thể có hoặc không số 0
 * đứng trước, vd '/3' hoặc '0/3' đều = chia 3) = chia đều. Số trần (có thể có dấu thập phân,
 * KHÔNG âm, KHÔNG bằng 0) = giá trị mm. Mọi trường hợp khác → invalid, nơi gọi tự quyết hiển thị
 * lỗi/giữ nguyên ô nhập, hàm này không throw để UI dễ gọi trong lúc gõ dở (mỗi keystroke).
 */
export function parseVcbToken(raw: string): VcbToken {
  const s = raw.trim().replace(',', '.');
  if (!s) return { kind: 'invalid', raw };

  // 3x hoặc x3 — nhân bản.
  const mulA = /^(\d+(?:\.\d+)?)\s*[xX]$/.exec(s);
  const mulB = /^[xX]\s*(\d+(?:\.\d+)?)$/.exec(s);
  const mulMatch = mulA ?? mulB;
  if (mulMatch) {
    const n = Math.round(Number(mulMatch[1]));
    return n > 0 ? { kind: 'multiply', n } : { kind: 'invalid', raw };
  }

  // /3 — chia đều (cho phép '0/3' lẫn '/3').
  const divMatch = /^0?\/\s*(\d+(?:\.\d+)?)$/.exec(s);
  if (divMatch) {
    const n = Math.round(Number(divMatch[1]));
    return n > 0 ? { kind: 'divide', n } : { kind: 'invalid', raw };
  }

  // Số trần = giá trị mm.
  if (/^\d+(?:\.\d+)?$/.test(s)) {
    const v = Number(s);
    return v > 0 ? { kind: 'value', valueMm: v } : { kind: 'invalid', raw };
  }

  return { kind: 'invalid', raw };
}

/** Kết quả cho luồng Move-copy: `copyCount` bản sao (KHÔNG tính bản gốc), mỗi bản cách bản trước
 * đúng `stepMm` DỌC HƯỚNG đã kéo ban đầu (hướng không đổi — chỉ VCB đổi khoảng cách/số lượng). */
export interface MoveCopyPlan {
  copyCount: number;
  stepMm: number;
}

/**
 * Áp 1 `VcbToken` vào kế hoạch Move-copy đang có (`current`) — hành vi CHỈNH LẠI ĐƯỢC (SketchUp):
 *  - `value`  → đổi khoảng cách MỖI bước, GIỮ NGUYÊN số bản sao hiện tại.
 *  - `multiply` (`3x`) → N bản sao, MỖI bước = khoảng cách gốc đã kéo (`current.stepMm` khi
 *    `current.copyCount === 1`, tức trước khi có multiply/divide nào — xem test `[multiply sau
 *    multiply]` cho ca chỉnh lại giữa chừng dùng LẠI base đã lưu).
 *  - `divide` (`/3`) → N bản sao, TỔNG khoảng cách GIỮ NGUYÊN (`baseSpanMm`), mỗi bước =
 *    `baseSpanMm / N` (SketchUp: gõ `/3` chia đều đúng đoạn đã kéo, không nhân thêm).
 *  - `invalid` → trả nguyên `current` (gõ dở/sai không phá kế hoạch đang có).
 *
 * `baseSpanMm` = tổng khoảng cách GỐC lúc kéo tay lần đầu (KHÔNG đổi giữa các lần gõ số lại —
 * đúng hành vi VCB "chỉnh lại được nhiều lần cho tới thao tác kế", mỗi lần chỉnh đều tính lại từ
 * base gốc chứ không cộng dồn lên kết quả lần chỉnh trước, tránh trôi số qua nhiều lần gõ).
 */
export function applyVcbToMoveCopy(current: MoveCopyPlan, token: VcbToken, baseSpanMm: number): MoveCopyPlan {
  switch (token.kind) {
    case 'value':
      return { copyCount: current.copyCount, stepMm: token.valueMm };
    case 'multiply':
      return { copyCount: token.n, stepMm: baseSpanMm };
    case 'divide':
      return { copyCount: token.n, stepMm: baseSpanMm / token.n };
    case 'invalid':
      return current;
  }
}
