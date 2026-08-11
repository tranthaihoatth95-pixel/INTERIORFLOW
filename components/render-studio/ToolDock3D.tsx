'use client';

/**
 * components/render-studio/ToolDock3D.tsx — "dock công cụ nổi đáy viewport" cho mode Vẽ 3D,
 * đúng mock chuẩn `docs/M-3D-OUT.md` VIỆC 1 (`docs/mocks/3D Dựng khối.dc.html`, trạng thái
 * 03 "dockSmall" thu gọn 1 hàng · 04 "dockOpen" mở rộng 6 nhóm). `Command3DPanel.tsx:23` đã tự
 * ghi rõ mảnh này CHƯA làm — đây là phần bù.
 *
 * ⚠️ KHÔNG dùng `.glass-float` (luật G9 `globals.css` — trần CỨNG 4 chỗ trên canvas 3D đã dùng
 * hết: ModeSwitchBar · nút "Dựng ảnh" · ViewCube · Lightbox). Dock 6 nhóm mở rộng cũng thuộc diện
 * "panel >2 dòng chữ" mà G9 CẤM cho kính lỏng → dùng `.vitals-pop` (nền đặc ≥96%) cho CẢ 2 trạng
 * thái, không riêng trạng thái mở, để nhất quán và không phát sinh thêm tấm backdrop-filter nào
 * ngoài những chỗ đã có sẵn trên viewport này (đã đếm: ModeSwitchBar + nút Dựng ảnh + ViewCube +
 * card chào + `.vitals-pop` Trình tự — thêm 1 style riêng khác sẽ vượt ngân sách hiệu năng WebGL).
 *
 * SỰ THẬT CẦN NÓI RÕ (đúng §9 "cấm nút giả"): mô hình thao tác của mock là kiểu AutoCAD/SketchUp
 * — bấm công cụ RỜI rồi mới thao tác trên khung nhìn. `Viewport3D` hôm nay KHÔNG có máy trạng
 * thái công cụ như vậy — chọn/kéo mặt (push-pull) chạy qua gizmo bám thẳng vào khối đang chọn,
 * không qua bước "bấm nút Kéo mặt trước". Nên trong dock này CHỈ 2 nút có hành vi thật (Thư viện,
 * Vật liệu — đều gọi thẳng hàm đã có, không tự chế); "Chọn" hiện luôn ở trạng thái đang bật vì đó
 * đúng là cách khung nhìn vận hành mặc định, không phải nút bấm được. Các nút còn lại (Vẽ đường/
 * Hình chữ nhật/Vòng tròn/Cùng loại/Bo cạnh/Cắt khối/Di chuyển/Xoay/Nhân bản/Thước đo/Đo góc)
 * `disabled` kèm lý do tại chỗ — không có lệnh dựng hình rời tương ứng trong engine hôm nay.
 */

import { useEffect, useState } from 'react';
import {
  MousePointer2, Spline, Square, Circle, Layers, Scissors, Move, RotateCw, Copy,
  Ruler, Triangle, Boxes, Palette, MoreHorizontal, ChevronDown,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

const CHUA_DUNG_DUOC = {
  vi: 'Chưa dựng được — khung nhìn 3D hôm nay thao tác qua gizmo kéo-thả trên khối đang chọn, chưa có lệnh công cụ rời',
  en: 'Not built yet — the 3D viewport works via drag gizmos on the selected block, no standalone tool command yet',
};

interface ToolDock3DProps {
  open: boolean;
  onToggleOpen: () => void;
  /** Opens the numeric two-point Wall command in the Create panel. */
  onCreateWall: () => void;
  onOpenLibrary: () => void;
  onOpenMaterialTab: () => void;
}

interface DockGroupItem {
  key: string;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}

export default function ToolDock3D({ open, onToggleOpen, onCreateWall, onOpenLibrary, onOpenMaterialTab }: ToolDock3DProps) {
  const tr = useT();

  // Tab mở/thu gọn dock — đúng phím mock (`onClick="{{ go4 }}" title="… — Tab"`), guard gõ chữ
  // như mọi hotkey khác của mode 3D (`Render3DModeSkeleton.tsx` đã làm cùng kiểu).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const el = e.target;
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        onToggleOpen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggleOpen]);

  const groups: { title: string; titleEn: string; items: DockGroupItem[] }[] = [
    {
      title: 'Chọn', titleEn: 'Select',
      items: [
        { key: 'select', label: 'Chọn', labelEn: 'Select', icon: <MousePointer2 size={18} />, shortcut: 'V', active: true, title: tr('Đang bật — bấm khối trên khung nhìn để chọn', 'On by default — click a block in the viewport to select') },
        { key: 'select-same', label: 'Cùng loại', labelEn: 'Same type', icon: <Layers size={18} />, shortcut: '⇧V', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
      ],
    },
    {
      title: 'Vẽ', titleEn: 'Draw',
      items: [
        { key: 'line', label: 'Đường', labelEn: 'Line', icon: <Spline size={18} />, shortcut: 'L', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
        { key: 'rect', label: 'Chữ nhật', labelEn: 'Rectangle', icon: <Square size={18} />, shortcut: 'R', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
        { key: 'circle', label: 'Vòng tròn', labelEn: 'Circle', icon: <Circle size={18} />, shortcut: 'C', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
      ],
    },
    {
      title: 'Dựng khối', titleEn: 'Model',
      items: [
        { key: 'wall', label: 'Tường', labelEn: 'Wall', icon: <Square size={18} />, shortcut: 'W', title: tr('Mở lệnh tường hai điểm', 'Open the two-point wall command'), onClick: onCreateWall },
        { key: 'pushpull', label: 'Kéo mặt', labelEn: 'Push/pull', icon: <Triangle size={18} />, shortcut: 'P', disabled: true, title: tr('Chọn khối tường rồi kéo mép trên ngay trên khung nhìn — không cần bấm nút này trước', 'Select a wall block then drag its top edge in the viewport — no need to press this first') },
        { key: 'fillet', label: 'Bo cạnh', labelEn: 'Fillet', icon: <RotateCw size={18} />, shortcut: 'F', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
        { key: 'cut', label: 'Cắt khối', labelEn: 'Cut', icon: <Scissors size={18} />, shortcut: 'X', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
      ],
    },
    {
      title: 'Biến đổi', titleEn: 'Transform',
      items: [
        { key: 'move', label: 'Di chuyển', labelEn: 'Move', icon: <Move size={18} />, shortcut: 'M', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
        { key: 'rotate', label: 'Xoay', labelEn: 'Rotate', icon: <RotateCw size={18} />, shortcut: 'Q', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
        { key: 'dup', label: 'Nhân bản', labelEn: 'Duplicate', icon: <Copy size={18} />, shortcut: 'D', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
      ],
    },
    {
      title: 'Đồ đạc', titleEn: 'Furnishing',
      items: [
        { key: 'library', label: 'Thư viện', labelEn: 'Library', icon: <Boxes size={18} />, shortcut: '1', title: tr('Mở Thư viện khối', 'Open the block library'), onClick: onOpenLibrary },
        { key: 'material', label: 'Vật liệu', labelEn: 'Material', icon: <Palette size={18} />, shortcut: 'B', title: tr('Mở tab Vật liệu', 'Open the Material tab'), onClick: onOpenMaterialTab },
      ],
    },
    {
      title: 'Đo đạc', titleEn: 'Measure',
      items: [
        { key: 'ruler', label: 'Thước', labelEn: 'Ruler', icon: <Ruler size={18} />, shortcut: 'T', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
        { key: 'angle', label: 'Góc', labelEn: 'Angle', icon: <MoreHorizontal size={18} />, shortcut: 'G', disabled: true, title: tr(CHUA_DUNG_DUOC.vi, CHUA_DUNG_DUOC.en) },
      ],
    },
  ];

  // 08/08 — port ĐÚNG mock (đọc trọn docs/mocks/"3D Dựng khối.dc.html" trước khi sửa, luật L1):
  // mock định nghĩa hover CHO MỌI nút kể cả disabled-trên-mock (nó không có khái niệm disabled,
  // engine hôm nay có) — `.dock-icon-btn` (globals.css) làm phần hover thật CSS làm được mà JSX
  // inline style không làm được. Nút `active` vẫn tô nền accent tĩnh, không cần hover riêng.
  const itemBtnStyle = (item: DockGroupItem, compact: boolean): React.CSSProperties => ({
    width: compact ? 32 : 66,
    height: compact ? 32 : undefined,
    padding: compact ? 0 : '6px 2px 4px',
    border: 0,
    borderRadius: 10,
    background: item.active ? 'var(--accent)' : 'transparent',
    color: item.active ? 'var(--on-accent)' : item.disabled ? 'var(--t5)' : 'var(--t3)',
    cursor: item.disabled ? 'not-allowed' : item.onClick ? 'pointer' : 'default',
    display: 'flex',
    flexDirection: compact ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: compact ? 0 : 3,
    fontFamily: 'inherit',
    opacity: item.disabled ? 0.45 : 1,
  });

  if (!open) {
    // Trạng thái 03 (thu gọn) — 1 hàng, chỉ icon, đúng mock `dockSmall`.
    const flat = groups.flatMap((g, gi) => g.items.map((it) => ({ ...it, groupIdx: gi })));
    return (
      <div
        className="if-3d-tool-dock"
        style={{
          position: 'absolute', left: '50%', bottom: 76, transform: 'translateX(-50%)', zIndex: 6,
          display: 'flex', alignItems: 'center', gap: 1, padding: 4, borderRadius: 14,
          border: '1px solid var(--mat-hairline)', boxShadow: '0 12px 30px rgba(0, 0, 0, .2)',
        }}
      >
        {flat.map((item, i) => (
          <span key={item.key} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && item.groupIdx !== flat[i - 1].groupIdx && (
              <span style={{ width: 1, height: 20, background: 'var(--mat-hairline)', margin: '0 5px' }} />
            )}
            <button
              type="button"
              className="dock-icon-btn"
              title={item.title}
              disabled={item.disabled}
              onClick={item.onClick}
              style={itemBtnStyle(item, true)}
            >
              {item.icon}
            </button>
          </span>
        ))}
        <span style={{ width: 1, height: 20, background: 'var(--mat-hairline)', margin: '0 5px' }} />
        <button
          type="button"
          className="dock-icon-btn"
          onClick={onToggleOpen}
          title={tr('Mở rộng bảng công cụ — Tab', 'Expand the tool panel — Tab')}
          style={{
            height: 32, padding: '0 11px', border: 0, borderRadius: 10, background: 'transparent',
            color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
          }}
        >
          <MoreHorizontal size={15} />
          {tr('Thêm', 'More')}
        </button>
      </div>
    );
  }

  // Trạng thái 04 (mở rộng) — 6 nhóm có nhãn, đúng mock `dockOpen`.
  const rows = [groups.slice(0, 3), groups.slice(3)];
  return (
    <div
      className="if-3d-tool-dock"
      style={{
        position: 'absolute', left: '50%', bottom: 76, transform: 'translateX(-50%)', zIndex: 6, padding: 6,
        borderRadius: 14, border: '1px solid var(--mat-hairline)', boxShadow: '0 12px 30px rgba(0, 0, 0, .2)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '2px 0 4px' }}>
        {rows.map((row, ri) => (
          <div
            key={ri}
            style={{
              display: 'flex', alignItems: 'stretch',
              ...(ri > 0 ? { borderTop: '1px solid var(--mat-hairline)', paddingTop: 9 } : {}),
            }}
          >
            {row.map((g, gi) => (
              <span key={g.title} style={{ display: 'flex' }}>
                {gi > 0 && <span style={{ width: 1, background: 'var(--mat-hairline)', margin: '4px 0' }} />}
                <div style={{ padding: '0 9px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 11, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)', paddingLeft: 3 }}>
                    {tr(g.title, g.titleEn)}
                  </div>
                  <div style={{ display: 'flex', gap: 1 }}>
                    {g.items.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="dock-icon-btn"
                        title={item.title}
                        disabled={item.disabled}
                        onClick={item.onClick}
                        style={itemBtnStyle(item, false)}
                      >
                        {item.icon}
                        <span style={{ fontSize: 10, lineHeight: 1.5, whiteSpace: 'nowrap', color: item.active ? 'var(--on-accent)' : 'var(--t3)' }}>
                          {tr(item.label, item.labelEn)}
                        </span>
                        {item.shortcut && (
                          <span style={{ fontSize: 9, lineHeight: 1.5, color: item.active ? 'var(--on-accent)' : 'var(--t4)', opacity: item.active ? 0.75 : 1 }}>
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </span>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--mat-hairline)', padding: '7px 11px 3px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, lineHeight: 1.5, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
        <span>{tr('Gõ số bất cứ lúc nào để nhập chính xác', 'Type a number any time for precise input')}</span>
        <span>{tr('Giữ Alt để nhân bản', 'Hold Alt to duplicate')}</span>
        <button
          type="button"
          className="dock-icon-btn"
          onClick={onToggleOpen}
          style={{
            marginLeft: 'auto', height: 24, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8,
            background: 'transparent', color: 'var(--t3)', fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <ChevronDown size={13} />
          {tr('Thu gọn · Tab', 'Collapse · Tab')}
        </button>
      </div>
    </div>
  );
}
