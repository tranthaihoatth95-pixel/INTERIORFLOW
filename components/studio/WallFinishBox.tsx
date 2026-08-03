'use client';

/**
 * components/studio/WallFinishBox.tsx — VIỆC 2① (`docs/PHIEU-CODE-IF-DOT6-2026-08-03.md` NHÓM B)
 * port `docs/mocks/mock-2d-ky-thuat.html` mục "Lớp hoàn thiện" (2 dòng vật liệu mặt A/mặt B của
 * tường, nút "Đổi lớp hoàn thiện").
 *
 * ⚠️ MOCK GHI BADGE "PLACEHOLDER" Ở TIÊU ĐỀ ASIDE (áp cho CẢ khối này) — theo Luật port L2
 * (`PHIEU-CODE-IF-DOT6` NHÓM B: "port nguyên văn token, NHƯNG vùng nào mock ghi PLACEHOLDER thì
 * KHÔNG port thành dữ liệu thật"), component này CHỈ port KHUNG/TOKEN, KHÔNG bịa 2 vật liệu giả
 * "Sơn trắng ngà"/"Ốp gỗ sồi" như mock. Lý do: đã đọc hết `lib/cad/model.ts` — `Base`/mọi Entity
 * hiện KHÔNG có field "vật liệu hoàn thiện theo TỪNG MẶT" của tường. Cái gần nhất là
 * `HatchEntity.specId` (matId của phần poché tường — MỘT giá trị chung cho cả đoạn, không phải
 * 2 mặt riêng). Thêm field 2-mặt là QUYẾT ĐỊNH DATA MODEL mới, ngoài phạm vi "port UI" — để
 * TỔNG/Hoà chốt, không tự bịa ở đây.
 *
 * Cả 2 dòng hiện "— chưa gán —" (đúng quy ước đã dùng trong app, xem `CadEditor.tsx:2040`
 * `<option value="">— chưa gán —</option>` cho mọi field BIM optional chưa có giá trị — KHÔNG
 * suy đoán/không hiện số 0 giả). Nút "Đổi lớp hoàn thiện" disabled kèm `title` giải thích —
 * không phải nút chết vô cớ, người dùng bấm vẫn thấy VÌ SAO chưa làm được.
 */

export default function WallFinishBox() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t4)' }}>
          Lớp hoàn thiện
        </span>
        <span
          title="Vật liệu hoàn thiện theo từng mặt tường — chưa có trong dữ liệu bản vẽ, đang chờ chốt cách lưu (xem comment đầu WallFinishBox.tsx)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 16,
            padding: '0 6px',
            borderRadius: 6,
            background: 'var(--field)',
            color: 'var(--t4)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '.03em',
          }}
        >
          SẮP CÓ
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(['mặt A', 'mặt B'] as const).map((face) => (
          <div
            key={face}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              height: 34,
              padding: '0 9px',
              background: 'var(--field)',
              borderRadius: 10,
            }}
          >
            <span
              aria-hidden
              style={{ width: 18, height: 18, borderRadius: '50%', flex: 'none', background: 'var(--border-strong)' }}
            />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--t4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              — chưa gán —
            </span>
            <span style={{ font: '400 11px ui-monospace, Menlo, monospace', color: 'var(--t4)' }}>{face}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled
        title="Cần chốt cách lưu vật liệu THEO TỪNG MẶT tường vào Doc trước (hiện chỉ có 1 vật liệu chung/đoạn qua HatchEntity.specId) — TỔNG/Hoà quyết, chưa code"
        style={{
          marginTop: 8,
          width: '100%',
          height: 28,
          border: '1px solid var(--border)',
          borderRadius: 10,
          background: 'var(--field)',
          color: 'var(--t4)',
          font: '600 11px inherit',
          cursor: 'not-allowed',
          opacity: 0.6,
        }}
      >
        Đổi lớp hoàn thiện
      </button>
    </div>
  );
}
