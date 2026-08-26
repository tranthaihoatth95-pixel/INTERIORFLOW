'use client';

/**
 * components/present-editor/NguonLienKet.tsx — [marker: nguonLienKet] MÔ HÌNH NGUỒN-LIÊN-KẾT
 * của chặng Trình chiếu, nói ra thành chữ ngay ở màn trống.
 *
 * 🔴 LỖ ĐƯỢC VÁ (đo 20/08 trên app thật, tiền cảnh, dự án rỗng):
 * màn Trình chiếu khi chưa có hồ sơ hiện `PresentDocTypePicker` (thư viện mẫu — đẹp, có chủ
 * đích) NHƯNG **không chỗ nào nói hồ sơ sẽ lấy số/hình TỪ ĐÂU**. Người dùng đứng trước một kho
 * mẫu mà không biết mẫu đó sẽ được nuôi bằng gì, nên không biết vì sao mở ra lại trống. Cùng
 * lúc, ổ Navigator bên trái in câu *"Chuyển trang ở dải thumbnail dưới canvas"* trong khi
 * **chưa có canvas nào** — chỉ dẫn trỏ vào thứ không tồn tại.
 *
 * ⛔ KHÔNG DỰNG KHO THỨ HAI (**[Đ2]** nhìn-vào-trong-trước · NO-REBUILD §B25). Mọi con số ở đây
 * đọc từ ĐÚNG những cỗ máy đang chạy:
 *   · `getProjectDoc()`  (`lib/present-editor/project-doc.ts`) — CÙNG đường BOQ trong Trình
 *     chiếu vẫn đi: store trước, IndexedDB sau. Không tự fetch kiểu khác.
 *   · `docToObjScene()`  (`lib/three/cad-to-obj.ts`)           — CÙNG engine màn 3D dựng cảnh.
 *     Đếm `groups` chứ không đoán theo loại entity ⇒ số ở đây và số khối thấy ở 3D là MỘT.
 *   · `POST /api/boq/:projectId`                                — CÙNG đường `BoqScreen` đi.
 *
 * ⛔ CẤM BỊA % (Hoà chốt 16/08): trước đây lúc chờ BOQ có một thanh tiến trình dùng nhánh
 * **không đo được**. Nay bỏ hẳn thanh đó — màn chờ phải TĨNH, một thanh chạy ở đây là thêm
 * chuyển động vào đúng chỗ cần yên. Trong lúc chưa đo xong thì component **không phát ra gì**
 * (xem `dangDo` cuối tệp), nên vẫn không có con số bịa nào lọt ra.
 *
 * ✅ LUẬT X2 "không màn nào được chặn": mỗi nguồn đang RỖNG vẫn là một **lối đi**, không phải
 * một lời từ chối — bấm vào là sang đúng chặng làm ra thứ còn thiếu. Nút không bấm được thì
 * `aria-disabled` + `aria-describedby` mang LÝ DO THẬT (không dùng `title` — `title` câm trên
 * cảm ứng và Tab bỏ qua nút `disabled`, bài học 16/08).
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import { effectiveUserId } from '@/lib/resume';
import { getProjectDoc } from '@/lib/present-editor/project-doc';
import { docToObjScene } from '@/lib/three/cad-to-obj';
import type { Doc } from '@/lib/cad/model';

/** Đếm mã vật liệu RIÊNG BIỆT đang dùng trong bản vẽ — cùng khoá `matId` mà BOQ gom theo. */
function demMatId(doc: Doc): number {
  const set = new Set<string>();
  for (const e of doc.entities) {
    const m = (e as { matId?: unknown }).matId;
    if (typeof m === 'string' && m) set.add(m);
  }
  return set.size;
}

export function NguonLienKet() {
  const tr = useT();
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const projectId = params?.id ?? '';
  const storeUserId = useFlowStore((s) => s.user?.id);
  const userId = effectiveUserId(storeUserId) ?? '';

  const [demVe, setDemVe] = useState<number | null>(null);
  const [demKhoi, setDemKhoi] = useState<number | null>(null);
  const [demMat, setDemMat] = useState<number | null>(null);
  const [demBoq, setDemBoq] = useState<number | null>(null);
  /** BOQ hỏng (mạng/quyền) — khai THẬT, không để mãi ở trạng thái "đang đo". */
  const [boqLoi, setBoqLoi] = useState(false);

  useEffect(() => {
    let huy = false;
    (async () => {
      const { doc } = await getProjectDoc(userId, projectId).catch(() => ({ doc: null as Doc | null }));
      if (huy || !doc) return;
      setDemVe(doc.entities.length);
      setDemMat(demMatId(doc));
      // Dựng cảnh có thể ném khi Doc lạ — hỏng thì khai 0 chứ không treo mãi ở "đang đo".
      try {
        setDemKhoi(docToObjScene(doc).groups.length);
      } catch {
        setDemKhoi(0);
      }
      if (!projectId) { setDemBoq(0); return; }
      try {
        const res = await fetch(`/api/boq/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc }),
        });
        if (huy) return;
        if (!res.ok) { setBoqLoi(true); return; }
        const js = (await res.json()) as { rows?: unknown[] };
        if (huy) return;
        setDemBoq(Array.isArray(js.rows) ? js.rows.length : 0);
      } catch {
        if (!huy) setBoqLoi(true);
      }
    })();
    return () => { huy = true; };
  }, [userId, projectId]);

  /**
   * 🔴 ĐỔI CÁCH BÀY (20/08, Hoà bác màn chờ cũ) — GIỮ NGUYÊN ENGINE ĐỌC SỐ Ở TRÊN, chỉ đổi cách
   * nói. Trước đây bốn THẺ LỚN, mỗi thẻ một con số to + một câu giải thích, xếp thành lưới 4 cột
   * ngay dưới đầu đề ⇒ vào Present là gặp một bức tường thẻ, đọc ra *"phải làm xong mấy bước này
   * Present mới cho làm việc"*. Nay là MỘT DÒNG TÍN HIỆU khẽ, vai phụ.
   *
   * Ba luật khoá ở đây:
   *  ① ⛔ **KHÔNG BÀY SỐ 0** — "BOQ 0 dòng" là thứ bị bác đích danh. Nguồn rỗng thì im lặng,
   *    không chiếm chỗ. Màn chờ nói *bạn CÓ gì*, không kể lể *bạn THIẾU gì*.
   *  ② ⛔ **CẤM SỐ ĐẾM GIẢ** — `so === null` là CHƯA ĐO XONG (khác hẳn `0` = đo rồi, thật sự
   *    rỗng). Chưa đo xong thì không phát ra con số nào, kể cả 0 tạm.
   *  ③ Không có gì thật ⇒ **trả `null`**, không để lại vỏ rỗng. Ô trống là bằng chứng còn việc,
   *    nhưng một cái khung không nói gì thì chỉ là rác thị giác.
   */
  const tinHieu: { khoa: string; so: number; chu: string; di: string }[] = [
    { khoa: 'ban-ve', so: demVe ?? 0, chu: tr('đối tượng 2D', '2D objects'), di: 'cad' },
    { khoa: 'khoi-3d', so: demKhoi ?? 0, chu: tr('khối 3D', '3D blocks'), di: 'render' },
    { khoa: 'vat-lieu', so: demMat ?? 0, chu: tr('vật liệu', 'materials'), di: 'cad' },
    { khoa: 'boq', so: boqLoi ? 0 : demBoq ?? 0, chu: tr('dòng BOQ', 'BOQ rows'), di: 'cad' },
  ].filter((t) => t.so > 0);

  // Chưa đo xong thì im — thà chậm một nhịp còn hơn nhấp nháy một con số rồi đổi.
  const dangDo = demVe === null || demKhoi === null || demMat === null || (demBoq === null && !boqLoi);
  if (dangDo || tinHieu.length === 0) return null;

  return (
    <p
      aria-label={tr('Dự án này đang có gì', 'What this project already has')}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        margin: '14px 0 0',
        color: 'var(--t3)',
        fontSize: 12,
      }}
    >
      {tinHieu.map((t, i) => (
        <span key={t.khoa} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && (
            <span aria-hidden style={{ margin: '0 4px', color: 'var(--t4)' }}>
              ·
            </span>
          )}
          <button
            type="button"
            onClick={() => projectId && router.push(`/projects/${projectId}/${t.di}`)}
            style={{
              padding: '2px 4px',
              border: 0,
              borderRadius: 'var(--r-1, 6px)',
              background: 'transparent',
              color: 'var(--t2)',
              font: 'inherit',
              cursor: 'pointer',
            }}
          >
            <strong style={{ color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>{t.so}</strong> {t.chu}
          </button>
        </span>
      ))}
    </p>
  );
}

export default NguonLienKet;
