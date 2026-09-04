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
 * thái, không riêng trạng thái mở, để nhất quán và không phát sinh thêm tấm backdrop blur nào
 * ngoài những chỗ đã có sẵn trên viewport này (đã đếm: ModeSwitchBar + nút Dựng ảnh + ViewCube +
 * card chào + `.vitals-pop` Trình tự — thêm 1 style riêng khác sẽ vượt ngân sách hiệu năng WebGL).
 *
 * [marker: Tool3DStateMachine] — dock nay nối MÁY TRẠNG THÁI CÔNG CỤ (`lib/render-studio/tool3d`,
 * phiếu tool-state-3d 12/08): bấm tool → `Tool3DBar` hiện ô nhập số ở đáy khung nhìn → Enter áp ·
 * Esc huỷ · Space về Chọn. Gizmo-first GIỮ NGUYÊN — tool rời là đường thêm, chọn/kéo mặt qua gizmo
 * trên khối đang chọn chạy y như cũ bất kể tool nào bật.
 *
 * Nút CÓ ENGINE THẬT (tất cả gọi hàm sẵn có, không tự chế): Chọn · Đường/Chữ nhật/Vòng tròn
 * (vẽ đáy → đùn, `wallSegmentOutline`/`ellipsePoints`) · Tường (lệnh hai điểm Command panel) ·
 * Di chuyển/Xoay/Nhân bản (`translateEntity`/`rotateEntity` trên khối đang chọn) · Thước
 * (`measureSelection`) · Thư viện · Vật liệu. Nút CHƯA có engine giữ `disabled` kèm lý do RIÊNG
 * từng nút (§9 cấm nút giả): Cùng loại (chưa có chọn-theo-loại) · Bo cạnh/Cắt khối (bevel/boolean
 * hôm nay ghi qua panel Sửa dạng tham số, chưa có thao tác rời) · Đo góc (chưa có engine đo góc).
 *
 * 15/08 (`toolbar-mot-khuon`, KB-1) — nút tự vẽ `itemBtnStyle` ĐỔI sang `ToolbarChip` dùng chung
 * với 2D/Trình bày: sửa 2 vi phạm cũ — nút bật `background: var(--accent)` tô đặc (trái 2.1.8.l
 * "ghost khi bật") và màu chữ `t3/t5` (ngoài thang chuẩn ToolbarChip dùng `t2`). Hành vi thu/mở
 * + luật "thu gọn chỉ hiện nút có hành vi thật" GIỮ NGUYÊN.
 */

import { useEffect, useState } from 'react';
import {
  Spline, Square, Circle, Layers, Scissors, RotateCw,
  Triangle, Boxes, Palette, MoreHorizontal, ChevronDown,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useTool3D, type Tool3DId } from '@/lib/render-studio/tool3d';
import { ToolbarChip, ToolbarBar } from '@/components/ui/ToolbarChip';
import { commonCommandsFor, bindStage } from '@/lib/commands/toolbar-source';
import { CommandIcon, commandHinh } from '@/components/ui/command-icon';
import { coPhimHeThong } from '@/lib/kbd'; // MỘT nguồn phím chính: ⌘ trên macOS · Ctrl nơi khác

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
  /** R3 — hình minh hoạ thao tác cho ô giải nghĩa, đến TỪ SỔ LỆNH qua `commandHinh()`;
   * item tự khai của dock không có hình (chỉ lệnh chung mang metadata này). */
  hinh?: React.ReactNode;
}

export default function ToolDock3D({ open, onToggleOpen, onCreateWall, onOpenLibrary, onOpenMaterialTab }: ToolDock3DProps) {
  const tr = useT();
  const activeTool = useTool3D((s) => s.active);
  const setActiveTool = useTool3D((s) => s.setActive);
  /** Nút tool = một dòng khai: active theo store, bấm là cầm tool (Tool3DBar tự hiện ô nhập). */
  const tool = (id: Tool3DId) => ({ active: activeTool === id, onClick: () => setActiveTool(id) });

  // Tab mở/thu gọn dock — đúng phím mock (`onClick="{{ go4 }}" title="… — Tab"`), guard gõ chữ
  // như mọi hotkey khác của mode 3D (`Render3DModeSkeleton.tsx` đã làm cùng kiểu).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (coPhimHeThong(e) || e.altKey || e.shiftKey) return;
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

  /* ══ TẦNG ① — LỆNH CHUNG, ĐỌC TỪ SỔ LỆNH ══
     B2 (`docs/TICKET-KIEN-TRUC-LENH-3-TANG.md`): dock THÔI sở hữu danh sách lệnh chung. Tên · icon ·
     phím · thứ tự nay đến từ `lib/commands/registry.ts`, nên 2D/3D/Trình chiếu KHÔNG THỂ hiện khác
     nhau nữa — đó là gốc của phàn nàn "3 chặng như 3 app".
     Tay thi hành vẫn của 3D (`bindStage` → `useTool3D`) cho tới B5: `CommandDef.run()` gọi
     `useCadStore`, đúng ở 2D nhưng SAI ở đây (khối đang chọn nằm ở `useTool3D`). Lệnh chung nào 3D
     chưa có engine thì KHÔNG bịa binding — nó tự mờ kèm lý do lấy từ sổ (§9). */
  const chung = bindStage(commonCommandsFor({ stage: 'render' }), {
    'cad.sel.select': { run: () => setActiveTool('select'), active: activeTool === 'select' },
    'cad.edit.move': { run: () => setActiveTool('move'), active: activeTool === 'move' },
    'cad.edit.rotate': { run: () => setActiveTool('rotate'), active: activeTool === 'rotate' },
    'cad.edit.copy': { run: () => setActiveTool('dup'), active: activeTool === 'dup' },
    'cad.dim.measure': { run: () => setActiveTool('ruler'), active: activeTool === 'ruler' },
  });

  const groups: { title: string; titleEn: string; items: DockGroupItem[] }[] = [
    {
      title: 'Lệnh chung', titleEn: 'Shared',
      items: [
        ...chung.map((c) => ({
          key: c.id,
          label: c.label[0], labelEn: c.label[1],
          icon: <CommandIcon name={c.icon} size={18} />,
          // Ở 3D hiện PHÍM ĐƠN (`directKey`), không hiện alias gõ — chặng này không có dòng lệnh
          // để mà gõ. Cùng một lệnh, hai đường nhập, mỗi mặt tiền chỉ khoe đường mình bật.
          shortcut: c.directKey,
          active: c.active,
          disabled: !c.enabled,
          onClick: c.enabled ? c.run : undefined,
          // R3 — câu giải nghĩa ưu tiên TỪ SỔ (`c.desc`, một nguồn với 2D); lệnh chung chưa khai
          // desc mới rơi về câu mặt tiền cũ. Hình cũng từ sổ, đổi khoá → glyph ở `commandHinh`.
          title: c.enabled
            ? c.desc
              ? tr(c.desc[0], c.desc[1])
              : tr(`${c.label[0]} — dùng chung ở cả ba chặng`, `${c.label[1]} — shared across all three stages`)
            : c.disabledReason,
          hinh: commandHinh(c.hinh),
        })),
        { key: 'select-same', label: 'Cùng loại', labelEn: 'Same type', icon: <Layers size={18} />, shortcut: '⇧V', disabled: true, title: tr('Chưa có chọn-theo-loại — engine chưa tra cùng type', 'No select-by-type yet — engine cannot query same type') },
      ],
    },
    {
      title: 'Vẽ', titleEn: 'Draw',
      items: [
        { key: 'line', label: 'Đường', labelEn: 'Line', icon: <Spline size={18} />, shortcut: 'L', ...tool('line'), title: tr('Dải khối hai điểm — nhập số, Enter dựng', 'Two-point strip — type numbers, Enter builds') },
        { key: 'rect', label: 'Chữ nhật', labelEn: 'Rectangle', icon: <Square size={18} />, shortcut: 'R', ...tool('rect'), title: tr('Đáy chữ nhật đùn thành khối', 'Rectangle base extruded to a block') },
        { key: 'circle', label: 'Vòng tròn', labelEn: 'Circle', icon: <Circle size={18} />, shortcut: 'C', ...tool('circle'), title: tr('Đáy tròn đùn thành khối', 'Circle base extruded to a block') },
      ],
    },
    {
      title: 'Dựng khối', titleEn: 'Model',
      items: [
        { key: 'wall', label: 'Tường', labelEn: 'Wall', icon: <Square size={18} />, shortcut: 'W', title: tr('Mở lệnh tường hai điểm', 'Open the two-point wall command'), onClick: onCreateWall },
        { key: 'pushpull', label: 'Kéo mặt', labelEn: 'Push/pull', icon: <Triangle size={18} />, shortcut: 'P', disabled: true, title: tr('Chọn khối tường rồi kéo mép trên ngay trên khung nhìn — không cần bấm nút này trước', 'Select a wall block then drag its top edge in the viewport — no need to press this first') },
        { key: 'fillet', label: 'Bo cạnh', labelEn: 'Fillet', icon: <RotateCw size={18} />, shortcut: 'F', disabled: true, title: tr('Bo cạnh nhập ở panel Sửa — chưa có thao tác rời', 'Bevel lives in the Edit panel — no standalone tool yet') },
        { key: 'cut', label: 'Cắt khối', labelEn: 'Cut', icon: <Scissors size={18} />, shortcut: 'X', disabled: true, title: tr('Khoét/boolean nhập ở panel Sửa — chưa có thao tác rời', 'Boolean cut lives in the Edit panel — no standalone tool yet') },
      ],
    },
    // ⛔ Nhóm "Biến đổi" (Di chuyển · Xoay · Nhân bản) ĐÃ XOÁ ở B2 — ba lệnh đó là LỆNH CHUNG,
    // nay đứng ở nhóm "Lệnh chung" đầu dock, lấy tên/icon/phím từ sổ. Giữ lại ở đây là để hai
    // nguồn cùng khai một lệnh — đúng cái B2 sinh ra để dẹp. Thước cũng vậy (xem nhóm Đo đạc).
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
        // "Thước" đã lên nhóm Lệnh chung (`cad.dim.measure`, phím T) — không khai lại ở đây.
        { key: 'angle', label: 'Góc', labelEn: 'Angle', icon: <MoreHorizontal size={18} />, shortcut: 'G', disabled: true, title: tr('Chưa có engine đo góc giữa hai cạnh', 'No angle-measuring engine yet') },
      ],
    },
  ];

  if (!open) {
    // Trạng thái 03 (thu gọn) — 1 hàng, chỉ icon. 11/08 Hoà soi: bản cũ bày CẢ 12 nút disabled
    // không nhãn không lý do → "hầu như chẳng sử dụng được". Ở dạng thu gọn icon câm không tải
    // nổi chữ "vì sao mờ" ⇒ chỉ hiện nút CÓ HÀNH VI THẬT (đúng chốt "dock chỉ mang lệnh dùng
    // liên tục"); các nút chờ-engine vẫn LỘ Ở DẠNG MỞ RỘNG ("Thêm") — nơi có nhãn + phím + lý
    // do, frontier không bị giấu (luật §9 vẫn giữ, chỉ đổi chỗ đứng cho trung thực với mắt nhìn).
    const flat = groups
      .flatMap((g, gi) => g.items.map((it) => ({ ...it, groupIdx: gi })))
      .filter((it) => !it.disabled);
    return (
      // B2 16/08 — vỏ dock thu gọn nay là `<ToolbarBar>` dùng chung (KB-1: h44 · r-full · đệm 6 ·
      // gap 2), thay cho khung tự vẽ `gap 1 · padding 4 · borderRadius 14 · hairline` trước đây.
      // Đây chính là khuôn GỐC mà 2D và Trình chiếu sẽ quy về (KB-1 "lấy dock capsule 3D làm gốc"),
      // nên nó phải là component chung chứ không phải style riêng của file này.
      <ToolbarBar
        style={{ position: 'absolute', left: '50%', bottom: 76, transform: 'translateX(-50%)', zIndex: 6 }}
      >
        {flat.map((item, i) => (
          <span key={item.key} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && item.groupIdx !== flat[i - 1].groupIdx && (
              <ToolbarBar.Sep />
            )}
            <ToolbarChip
              icon={item.icon}
              label={tr(item.label, item.labelEn)}
              desc={item.title}
              hinh={item.hinh}
              active={item.active}
              onClick={item.onClick}
              shortcutHint={item.shortcut}
            />
          </span>
        ))}
        <ToolbarBar.Sep />
        <button
          type="button"
          className="dock-icon-btn"
          onClick={onToggleOpen}
          // `title` là kênh CÂM trên cảm ứng và trình đọc màn hình đọc không nhất quán — nút này
          // có nhãn chữ "Thêm" nên phần title mang thông tin THÊM (phím Tab) phải đi đường
          // aria-label để tới được bàn phím/screen-reader. Giữ `title` cho hover chuột.
          aria-label={tr('Mở rộng bảng công cụ — phím Tab', 'Expand the tool panel — Tab key')}
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
      </ToolbarBar>
    );
  }

  // Trạng thái 04 (mở rộng) — 5 nhóm có nhãn (Lệnh chung + 4 nhóm riêng của chặng), khuôn mock
  // `dockOpen`. Trước B2 là 6 nhóm; "Biến đổi" và "Thước" đã nhập vào nhóm Lệnh chung.
  const rows = [groups.slice(0, 3), groups.slice(3)];
  return (
    <div
      className="if-3d-tool-dock"
      style={{
        position: 'absolute', left: '50%', bottom: 76, transform: 'translateX(-50%)', zIndex: 6, padding: 6,
        borderRadius: 14, border: '1px solid var(--vien-mo)', boxShadow: '0 12px 30px rgba(0, 0, 0, .2)',
        // B2 — hàng "Lệnh chung" mang 11 nút CÓ NHÃN nên hàng 1 dài hơn trước. Kẹp bề rộng theo
        // khung nhìn + cho cuộn ngang, để dock không bao giờ tràn ra ngoài mép màn hẹp (bệnh
        // "vỡ khổ hẹp" đã phải sửa một lần ở Statusbar/Files 14/08 — không tái diễn ở đây).
        maxWidth: 'calc(100vw - 32px)', overflowX: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '2px 0 4px' }}>
        {rows.map((row, ri) => (
          <div
            key={ri}
            style={{
              display: 'flex', alignItems: 'stretch',
              ...(ri > 0 ? { borderTop: '1px solid var(--vien-mo)', paddingTop: 9 } : {}),
            }}
          >
            {row.map((g, gi) => (
              <span key={g.title} style={{ display: 'flex' }}>
                {gi > 0 && <span style={{ width: 1, background: 'var(--vien-mo)', margin: '4px 0' }} />}
                <div style={{ padding: '0 9px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 11, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)', paddingLeft: 3 }}>
                    {tr(g.title, g.titleEn)}
                  </div>
                  <div style={{ display: 'flex', gap: 1 }}>
                    {g.items.map((item) => (
                      <ToolbarChip
                        key={item.key}
                        icon={item.icon}
                        label={tr(item.label, item.labelEn)}
                        desc={item.disabled ? undefined : item.title}
                        hinh={item.hinh}
                        active={item.active}
                        disabled={item.disabled}
                        disabledReason={item.disabled ? item.title : undefined}
                        onClick={item.onClick}
                        shortcutHint={item.shortcut}
                        showLabel
                      />
                    ))}
                  </div>
                </div>
              </span>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--vien-mo)', padding: '7px 11px 3px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, lineHeight: 1.5, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
        <span>{tr('Gõ số bất cứ lúc nào để nhập chính xác', 'Type a number any time for precise input')}</span>
        <span>{tr('Giữ Alt để nhân bản', 'Hold Alt to duplicate')}</span>
        <button
          type="button"
          className="dock-icon-btn"
          onClick={onToggleOpen}
          style={{
            marginLeft: 'auto', height: 24, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 10,
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
