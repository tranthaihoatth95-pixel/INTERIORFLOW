'use client';

/**
 * components/studio/SelectSameKindButton.tsx — VIỆC 2③ (`docs/PHIEU-CODE-IF-DOT6-2026-08-03.md`
 * NHÓM B) port `docs/mocks/mock-2d-ky-thuat.html` nút "Chọn hết cùng loại".
 *
 * ⚠️ DISABLED CÓ CHỦ Ý — nhiệm vụ giao rõ: "nút này CHỜ PHU xong A4 mới nối thật được". Đã
 * SEARCH trước khi code (§0b): A4 (`gán entityId cho mọi nhóm 3D`, `lib/three/cad-to-obj.ts`)
 * ĐÃ XONG (`1c0b91d`, PHU) — nhưng đọc kỹ `docs/SPEC-TANG-DU-LIEU-CAU-KIEN.md` §8 (dòng
 * "Đ3 mở khoá đúng điểm sáng Revit … = lọc entities.filter(e => e.block === ghế.block) trên
 * Doc, KHÔNG PHẢI thuật toán 3D") thì A4 chỉ là ĐIỀU KIỆN CẦN (P2 trong lộ trình §9), không phải
 * ĐIỀU KIỆN ĐỦ — cái thật sự khoá tính năng này là **Đ3 "selectedIds sống ở tầng Doc"** (P3,
 * giao G4, CHƯA làm — xem bảng §9). Vì vậy nút VẪN disabled, nhưng lý do ghi ở `title` là Đ3/P3,
 * KHÔNG copy nguyên văn lý do cũ "chờ A4" nữa (A4 xong rồi — ghi vậy là SAI, phạm luật §0 trung
 * thực). Phát hiện này đã báo trong báo cáo phiên, để TỔNG/Hoà cân nhắc có greenlight bản 2D-only
 * (không xuyên 3D) sớm hơn Đ3 đầy đủ hay không.
 *
 * Phần ĐẾM ("N tường … dày …mm") là dữ liệu THẬT (đọc `doc.entities` hiện có, không cần A4/Đ3) —
 * chỉ HÀNH VI BẤM (đổi `selection`) mới bị khoá, để không tự chế 1 cơ chế chọn song song với
 * Đ3 sắp tới (chống “hai nguồn” — luật `SPEC-TANG-DU-LIEU-CAU-KIEN.md` §10).
 */

import { useMemo } from 'react';
import { Grid2x2 } from 'lucide-react';
import type { Doc, Entity } from '@/lib/cad/model';
import { WALL_KIND_OPTIONS } from '@/lib/cad/model';
import { isWallLikeEntity } from '@/lib/cad/standards/checker';

function sameKindCaption(doc: Doc, target: Entity): string {
  const kind = target.wallKind;
  const thickness = target.wallThicknessMm;
  const count = doc.entities.filter(
    (e) => isWallLikeEntity(e) && e.wallKind === kind && e.wallThicknessMm === thickness,
  ).length;
  const kindLabel = kind ? WALL_KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind : 'chưa phân loại';
  const thicknessLabel = thickness != null ? `dày ${thickness}` : 'chưa khai độ dày';
  return `${count} tường ${kindLabel}, ${thicknessLabel}`;
}

export default function SelectSameKindButton({ doc, entity }: { doc: Doc; entity: Entity }) {
  const caption = useMemo(() => sameKindCaption(doc, entity), [doc, entity]);
  return (
    <div>
      <button
        type="button"
        disabled
        title="Chờ P3 (selectedIds sống ở tầng Doc, SPEC-TANG-DU-LIEU-CAU-KIEN §8 Đ3 — việc của G4) — hiện chưa có cơ chế đặt selection từ danh sách entity cùng loại mà không tự chế cơ chế song song"
        style={{
          width: '100%',
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          border: '1px solid var(--border)',
          borderRadius: 10,
          background: 'var(--field)',
          color: 'var(--t4)',
          font: '600 12px inherit',
          cursor: 'not-allowed',
          opacity: 0.6,
        }}
      >
        <Grid2x2 size={14} />
        Chọn hết cùng loại
      </button>
      <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 7 }}>{caption}</div>
    </div>
  );
}
