'use client';

/**
 * components/studio/VitalsStateBadge.tsx — 4 trạng thái Vitals (VIỆC 1 (b), 05/08).
 *
 * Theo mock `docs/mocks/Vitals v2.dc.html` màn "01": bốn viên trạng thái phân biệt bằng
 * CHUYỂN ĐỘNG và ĐỘ SÁNG — KHÔNG thêm màu (đúng luật design system, chỉ một sắc `--accent`).
 * `nghỉ` chấm mờ thở chậm · `đang nghe` vòng sáng lan theo nhịp · `đang nghĩ` hạt quay quanh
 * chấm · `đang trả lời` viên tím đặc, chấm trắng đập nhanh.
 *
 * Nguồn thật hiện có: `VitalsGesture.tsx` chỉ có MỘT tín hiệu thật — `sending` (đang chờ phản
 * hồi fetch, không streaming) → map thẳng vào 'answering' (khớp nhãn `VitalsTyping` cũ "Vitals
 * đang trả lời…"). 'listening'/'thinking' CHƯA có nguồn dữ liệu thật (không có voice input,
 * không có streaming 2 pha) — export state cho ai cần nhưng KHÔNG bịa nơi gọi (luật §0 trung
 * thực + luật "không nút giả"). Khi có voice/streaming thật, gán state đó vào đúng lúc.
 *
 * `prefers-reduced-motion`: mọi animation tắt qua CSS (globals.css), nhưng 4 trạng thái vẫn
 * phân biệt được ở KHUNG TĨNH nhờ độ sáng/hình khối khác nhau (nghỉ mờ nhất · đang nghe có
 * vòng viền tĩnh · đang nghĩ có hạt vệ tinh thứ hai · đang trả lời đặc nhất) — không phụ
 * thuộc màu.
 */

export type VitalsState = 'idle' | 'listening' | 'thinking' | 'answering';

const STATE_LABEL: Record<VitalsState, string> = {
  idle: 'Nghỉ',
  listening: 'Đang nghe',
  thinking: 'Đang nghĩ',
  answering: 'Đang trả lời',
};

/** Chỉ chấm — dùng lồng vào chrome có sẵn (header popover, pill StatusBar…). */
export function VitalsStateDot({ state, size = 7 }: { state: VitalsState; size?: number }) {
  if (state === 'thinking') {
    return (
      <span
        className="vitals-state-orbit"
        style={{ width: size * 1.7, height: size * 1.7 }}
        aria-hidden="true"
      >
        <span className="vitals-state-orbit-core" style={{ width: size, height: size }} />
        <span className="vitals-state-orbit-satellite" />
      </span>
    );
  }
  return (
    <span
      className={`vitals-state-dot vitals-state-dot--${state}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/** Viên đầy đủ (chấm + nhãn) — dùng ở popover header / bất kỳ nơi cần tự giải thích trạng thái. */
export function VitalsStateBadge({
  state,
  label,
}: {
  state: VitalsState;
  /** Ghi đè nhãn mặc định (vd kèm tên chặng: "Vitals · 3D Thiết kế"). */
  label?: string;
}) {
  return (
    <span className={`vitals-state-badge vitals-state-badge--${state}`} role="status" aria-label={`Vitals: ${STATE_LABEL[state]}`}>
      <VitalsStateDot state={state} />
      <span className="vitals-state-badge-label">{label ?? STATE_LABEL[state]}</span>
    </span>
  );
}
