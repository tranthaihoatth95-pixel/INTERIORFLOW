'use client';

/**
 * components/materials/MaterialTable.tsx — VIỆC 3: bảng liệt kê, cột tối thiểu theo phiếu
 * "ảnh · mã · tên · hãng · kích thước · giá · đơn vị · nguồn". Cùng phong cách inline-style +
 * biến `var(--t*)` như `components/present-editor/boq/BoqTable.tsx` (nhất quán design tokens).
 */
import { Image as ImageIcon, Pencil, Trash2, Orbit } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { dimensionLabel, imageUrlOf, materialSourceLabel, type MaterialSpecDto } from '@/lib/materials/warehouse/dto';
import { dinhDangVnd, type BaMat } from '@/lib/materials/ba-mat';
import { ChiBaoBaMat } from './ChiBaoBaMat';

export function MaterialTable({
  items,
  onEdit,
  onDelete,
  onEditPbr,
  baMatCua,
  onMoBaMat,
}: {
  items: MaterialSpecDto[];
  onEdit: (m: MaterialSpecDto) => void;
  onDelete: (m: MaterialSpecDto) => void;
  /** VIỆC 5 PHẦN B — mở lớp chỉnh chất liệu render (4 núm). Chỉ gọi được khi món CÓ SKU
   * (matId = sku, xem `lib/materials/pbr-store.ts`); món không mã thì nút không render. */
  onEditPbr?: (m: MaterialSpecDto) => void;
  /** [marker: vatLieuBaMat] ba mặt đã đọc sẵn cho từng dòng — bảng chỉ VẼ, không tự tra. */
  baMatCua: (m: MaterialSpecDto) => BaMat;
  onMoBaMat: (m: MaterialSpecDto) => void;
}) {
  const tr = useT();

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, background: 'var(--panel)', zIndex: 1 }}>
            {[
              '', tr('Mã', 'Code'), tr('Tên', 'Name'), tr('Ba mặt', 'Three faces'), tr('Hãng', 'Brand'), tr('Kích thước', 'Size'),
              tr('Giá', 'Price'), tr('Đơn vị', 'Unit'), tr('Phòng', 'Room'), tr('Nguồn', 'Source'), '',
            ].map((h, i) => (
              <th
                key={h + i}
                style={{
                  textAlign: i === 6 ? 'right' : 'left', padding: '0 10px', height: 30, fontWeight: 600, fontSize: 11,
                  color: 'var(--t4)', borderBottom: '1px solid var(--border-strong, var(--border))', whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((m) => {
            const src = materialSourceLabel(m);
            const url = imageUrlOf(m);
            return (
              <tr key={m.id} style={{ height: 46 }}>
                <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: 'var(--field)', display: 'grid', placeItems: 'center', color: 'var(--t4)' }}>
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={14} />
                    )}
                  </div>
                </td>
                <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t4)', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11 }}>
                  {m.sku || '—'}
                </td>
                <td
                  onClick={() => onEdit(m)}
                  title={tr('Bấm để sửa', 'Click to edit')}
                  style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t1)', cursor: 'pointer', fontWeight: 500 }}
                >
                  {m.name}
                  {m.verified && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
                      {tr('đã duyệt', 'verified')}
                    </span>
                  )}
                </td>
                {/* [marker: vatLieuBaMat] — cột đứng NGAY SAU tên: đây là câu trả lời cho
                    "món này dùng được ở chặng nào rồi", đọc trước khi quan tâm hãng/kích thước. */}
                <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)' }}>
                  <ChiBaoBaMat baMat={baMatCua(m)} onMo={() => onMoBaMat(m)} />
                </td>
                <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t3)' }}>{m.brand || '—'}</td>
                <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>{dimensionLabel(m)}</td>
                <td style={{ padding: '0 10px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>
                  {m.priceVnd != null ? `${dinhDangVnd(m.priceVnd)} ₫` : (m.priceNote || '—')}
                </td>
                <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t3)' }}>{m.unit || '—'}</td>
                {/* 06/08 VÒNG 2 (G-M3-08) — cột PHÒNG. Đây là chỗ NHÌN THẤY được rằng phòng đã
                    lưu thật xuống DB: nhập bảng có cột Phòng → tải lại trang → chữ vẫn còn. Trước
                    đó phòng chỉ sống trong state của cửa nhập, đóng tab là mất mà không ai biết. */}
                <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t3)' }}>{m.room || '—'}</td>
                <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t4)', fontSize: 11.5 }}>{tr(src.vi, src.en)}</td>
                <td style={{ padding: '0 6px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    {onEditPbr && m.sku && (
                      <button type="button" onClick={() => onEditPbr(m)} aria-label={tr('Chất liệu render', 'Render material')} title={tr('Chất liệu render (PBR)', 'Render material (PBR)')} style={iconBtn}>
                        <Orbit size={13} />
                      </button>
                    )}
                    <button type="button" onClick={() => onEdit(m)} aria-label={tr('Sửa', 'Edit')} style={iconBtn}>
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={() => onDelete(m)} aria-label={tr('Xoá', 'Delete')} style={iconBtn}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={11} style={{ padding: '32px 10px', textAlign: 'center', color: 'var(--t4)', fontSize: 12.5 }}>
                {tr('Không có vật liệu nào khớp.', 'No materials match.')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, borderRadius: 6,
  background: 'transparent', color: 'var(--t4)', cursor: 'pointer',
};
