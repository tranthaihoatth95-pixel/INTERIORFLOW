'use client';

import { AlertTriangle, Eye, Unlink } from 'lucide-react';
import { findMaterial } from '@/lib/three/materials';
import type { SelectedBox } from './CommandPanel';
import { RawStyle } from './RawStyle';
import { VE3D_CSS } from './ve3d-css';

export interface ObjectSource {
  /** sinh từ bản vẽ 2D nào (tên sheet/bản vẽ chặng 1). */
  drawingName: string;
  /** còn đồng bộ với bản vẽ hay đã tách. */
  detached: boolean;
}

export interface ObjectPropertiesProps {
  object: SelectedBox | null;
  source?: ObjectSource | null;
  visible?: boolean;
  onToggleVisible?: () => void;
  onResize?: (patch: Partial<Pick<SelectedBox, 'widthMm' | 'depthMm' | 'heightMm' | 'elevationMm'>>) => void;
  /** bấm dòng vật liệu → mở tab Vật liệu của CommandPanel (một cửa, không catalog thứ hai). */
  onOpenMaterial?: () => void;
}

/**
 * OBJECT PROPERTIES — nội dung ổ Inspector của mode Vẽ 3D. 4 nhóm:
 * Kích thước · Vật liệu (matId + dòng moat) · Nguồn · Hiển thị.
 *
 * Nhóm NGUỒN quan trọng nhất: khối này SINH TỪ BẢN VẼ 2D (chặng 1). Sửa kích thước ở đây =
 * TÁCH khỏi bản vẽ — phải cảnh báo rõ bằng --warning (brief 03/08) TRƯỚC khi người dùng sửa,
 * không phải sau khi lỡ tay.
 *
 * ⚠️ Không biết gì về shell — CHINH cắm vào ổ Inspector của AppShell.
 */
export function ObjectProperties({
  object,
  source = null,
  visible = true,
  onToggleVisible,
  onResize,
  onOpenMaterial,
}: ObjectPropertiesProps) {
  if (!object) {
    return (
      <div className="if-ve3d objp">
        <RawStyle css={VE3D_CSS} />
        <p className="empty">Chọn 1 khối trong khung nhìn để xem thuộc tính.</p>
      </div>
    );
  }

  const mat = object.matId ? findMaterial(object.matId) : undefined;
  const linked = source && !source.detached;

  return (
    <div className="if-ve3d objp">
      <RawStyle css={VE3D_CSS} />

      <div className="kv"><span className="k">Khối</span><span className="v">{object.name}</span></div>

      {/* ── KÍCH THƯỚC ── */}
      <div className="grp">
        <div className="gh">Kích thước</div>
        {linked && (
          // CHINH-5 chữ→icon (SPEC-PANEL-ROLLOUT §3): "Sửa ở đây: tách khỏi bản vẽ" = icon xích
          // đứt + --warning, câu đầy đủ nằm ở tooltip (luật §3.5: icon bắt buộc có tooltip Việt).
          <div
            className="warn mini"
            title={`Khối này sinh từ bản vẽ ${source.drawingName}. Sửa kích thước ở đây sẽ tách khỏi bản vẽ — đổi bên bản vẽ sẽ không còn tự cập nhật sang.`}
          >
            <Unlink size={13} strokeWidth={2} aria-hidden />
            <span>Sửa ở đây = tách khỏi bản vẽ</span>
          </div>
        )}
        <div className="fields">
          {([
            ['Rộng', 'widthMm'],
            ['Sâu', 'depthMm'],
            ['Cao', 'heightMm'],
            ['Cao độ đáy', 'elevationMm'],
          ] as const).map(([label, key]) => (
            <div className="fld" key={key}>
              <label htmlFor={`objp-${key}`}>{label}</label>
              <div className="box">
                <input
                  id={`objp-${key}`}
                  type="number"
                  value={object[key]}
                  onChange={(e) => onResize?.({ [key]: Number(e.target.value) } as Partial<SelectedBox>)}
                />
                <span className="u">mm</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VẬT LIỆU ── */}
      <div className="grp">
        <div className="gh">Vật liệu</div>
        {mat ? (
          <button type="button" className="matline" onClick={onOpenMaterial} style={{ cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <span className="sw" style={{ background: mat.swatch }} />
            <span className="t">
              <b>{mat.name}</b>
              <span>{mat.matId}</span>
            </span>
          </button>
        ) : (
          <button type="button" className="row" onClick={onOpenMaterial}>
            Chưa gán — mở tab Vật liệu
          </button>
        )}
        {/* CHINH-5 chữ→icon: câu "Xuất sang D5 · V-Ray giữ nguyên" → 3 chip engine, cái nào giữ
            được mã thì SÁNG (matId là chuẩn chung nên cả 3 sáng — moat, xem SPEC-VAT-LIEU §1). */}
        <div className="kv">
          <span className="k">Xuất sang</span>
          <span className="chips" style={{ marginLeft: 'auto' }} title="Mã matId giữ nguyên khi xuất sang D5 hoặc V-Ray — không phải gán lại.">
            {(['IF', 'V-Ray', 'D5'] as const).map((eng) => (
              <span key={eng} className="chip lit">{eng}</span>
            ))}
          </span>
        </div>
      </div>

      {/* ── NGUỒN ── */}
      <div className="grp">
        <div className="gh">Nguồn</div>
        {source ? (
          <>
            <div className="kv"><span className="k">Sinh từ</span><span className="v">{source.drawingName}</span></div>
            {/* CHINH-5 chữ→icon: trạng thái = CHẤM TRÒN màu + tooltip (xanh = đồng bộ, cam = đã
                tách) — câu đầy đủ trong title, người dùng trỏ vào là đọc được. */}
            <div className="kv">
              <span className="k">Trạng thái</span>
              <span
                className="v"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                title={source.detached ? 'Đã tách khỏi bản vẽ — đổi bên bản vẽ 2D không còn cập nhật sang.' : 'Đang đồng bộ với bản vẽ.'}
              >
                <span className={source.detached ? 'dot detached' : 'dot sync'} aria-hidden />
                <span className="sr-only">{source.detached ? 'Đã tách khỏi bản vẽ' : 'Đang đồng bộ với bản vẽ'}</span>
              </span>
            </div>
            {source.detached && (
              <div className="warn">
                <AlertTriangle size={13} strokeWidth={2} />
                <span>Khối đã tách — đổi bên bản vẽ 2D sẽ <b>không</b> cập nhật sang khối này nữa.</span>
              </div>
            )}
          </>
        ) : (
          <div className="kv"><span className="k">Sinh từ</span><span className="v">Vẽ tay trong 3D</span></div>
        )}
      </div>

      {/* ── HIỂN THỊ ── */}
      <div className="grp">
        <div className="gh">Hiển thị</div>
        <div className="tgl">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={13} strokeWidth={1.75} /> Hiện trong khung nhìn
          </span>
          <button
            type="button"
            className={visible ? 'sw2 on' : 'sw2'}
            role="switch"
            aria-checked={visible}
            aria-label="Hiện trong khung nhìn"
            onClick={onToggleVisible}
          />
        </div>
      </div>
    </div>
  );
}
