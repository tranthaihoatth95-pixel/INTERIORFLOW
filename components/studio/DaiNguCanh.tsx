'use client';

/**
 * components/studio/DaiNguCanh.tsx — DẢI NGỮ CẢNH ở mép trên: người dùng luôn biết mình
 * ĐANG Ở ĐÂU, và bấm một lần là đổi được chỗ đứng.
 *
 * ⚠️ ĐO TRƯỚC KHI VẼ — vì sao dải này CHỈ CÓ HAI TẦNG (dự án · chặng), không có tầng
 * "Không gian/Workspace" như Blueprint mô tả:
 *   · `prisma/schema.prisma` KHÔNG có model `Workspace`. Hai chỗ duy nhất mang chữ đó là
 *     `Task.workspaceId String?` (:658) và một cột transitional (:752-760) mà chính comment
 *     trong schema tự khai: *"Model Workspace/… CHƯA tồn tại trong schema này"* — khoá chuỗi
 *     tự do, không FK, không bảng.
 *   · `lib/store.ts:33` `export type WorkspaceMode = Phase` — thứ app đang gọi là "workspace"
 *     CHÍNH LÀ chặng, không phải một tầng nằm giữa dự án và chặng.
 *   ⇒ Vẽ ba tầng lúc này là vẽ một tầng KHÔNG TỒN TẠI. Người dùng sẽ hỏi "bấm vào đổi được
 *   gì" và câu trả lời là không gì cả — đúng loại nút-giả §9 cấm. Khi Workspace có model +
 *   nơi lưu thật, thêm MỘT segment vào giữa là đủ; khung ở đây đã chừa sẵn chỗ (`SEGMENTS`).
 *
 * ⛔ KHÔNG lộ đường dẫn kiến trúc nội bộ (`Project > Workspace > Canvas > Flow`). Người dùng
 * cần ngữ cảnh THIẾT KẾ có nghĩa — tên dự án họ đặt, và chặng họ đang làm.
 *
 * KHIÊM TỐN, KHÔNG HÉT: chữ `--t3`, nền trong suốt lúc rảnh, chỉ sáng lên khi trỏ vào/mở.
 * Nó là mỏ neo, không phải nút hành động.
 *
 * [Đ2] Bộ chuyển ngữ cảnh KHÔNG tự viết luồng điều hướng nào: đổi chặng gọi `pickStage`
 * (lib/studio/stage-nav.ts — cùng hàm phím ⌘1/⌘2/⌘3 và rail đang gọi), đổi dự án gọi
 * `goHomeConfirmed` (lib/resume.ts — có cửa hỏi-trước-khi-rời). Đổi tên dự án tái dùng đúng
 * ô nhập cũ của AppChrome, chỉ dời vào menu để một chỗ đứng không mang hai việc.
 */

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, FolderOpen, PencilLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PHASES, type Phase } from '@/lib/phases';
import { useT, useLang } from '@/lib/i18n';
import { useDismissable } from '@/lib/useDismissable';
import { goHomeConfirmed } from '@/lib/resume';

export interface DaiNguCanhProps {
  /** Tên dự án đang mở — `useFlowStore.flowName`, do người dùng đặt. */
  tenDuAn: string;
  /** Chặng đang đứng. `null` = màn cấp app (Trang chủ) — lúc đó dải chỉ nói tên dự án. */
  chang: Phase | null;
  /** Đổi chặng — nơi gọi truyền thẳng `pickStage` đã wire sẵn của AppChrome. */
  onChonChang: (p: Phase) => void;
  /** Mở ô đổi tên dự án (AppChrome giữ state ô nhập, dải chỉ ra lệnh mở). */
  onDoiTen: () => void;
}

/** Các tầng ngữ cảnh dải này biết vẽ. Danh sách để MỞ RỘNG khi có tầng thật, không phải để
 * lấp cho đủ khuôn — xem docstring đầu file. */
type Segment = { khoa: 'du-an' | 'chang'; chu: string };

export function DaiNguCanh({ tenDuAn, chang, onChonChang, onDoiTen }: DaiNguCanhProps) {
  const tr = useT();
  const lang = useLang();
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [neo, setNeo] = useState<{ top: number; left: number } | null>(null);
  const nutRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!mo) return;
    const el = nutRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setNeo({ top: r.bottom + 6, left: r.left });
  }, [mo]);
  useDismissable({ open: mo, onDismiss: () => setMo(false), refs: [nutRef, menuRef] });

  const nhanChang = (p: Phase) => {
    const meta = PHASES.find((x) => x.id === p);
    return (lang === 'en' ? meta?.labelEn : meta?.label) ?? p;
  };

  const SEGMENTS: Segment[] = [
    { khoa: 'du-an', chu: tenDuAn || tr('Chưa đặt tên', 'Untitled') },
    ...(chang ? [{ khoa: 'chang' as const, chu: nhanChang(chang) }] : []),
  ];

  return (
    <>
      <button
        ref={nutRef}
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        aria-haspopup="menu"
        aria-label={tr(
          `Ngữ cảnh: ${SEGMENTS.map((s) => s.chu).join(' — ')}. Mở bộ chuyển ngữ cảnh.`,
          `Context: ${SEGMENTS.map((s) => s.chu).join(' — ')}. Open context switcher.`,
        )}
        data-dai-ngu-canh=""
        className="flex min-w-0 items-center gap-1.5 rounded-[var(--r-2)] px-2 py-1 text-[length:var(--fs-xs)] transition-colors duration-[120ms] hover:bg-[var(--hover)]"
        style={{ background: mo ? 'var(--hover)' : 'transparent' }}
      >
        {SEGMENTS.map((s, i) => (
          <span key={s.khoa} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && (
              // Vạch dọc mảnh, KHÔNG phải ký tự ">" — mũi tên đọc ra là "đường dẫn có thứ bậc
              // kỹ thuật", đúng thứ phiếu cấm lộ. Vạch chỉ nói "hai thứ cạnh nhau".
              <span aria-hidden="true" className="h-3 w-px shrink-0 bg-[var(--vien-mo)]" />
            )}
            <span
              className="min-w-0 truncate"
              style={{
                // Chặng là chỗ đứng HIỆN TẠI ⇒ đậm hơn nửa bậc; tên dự án là mỏ neo, nhạt hơn.
                color: i === SEGMENTS.length - 1 ? 'var(--t2)' : 'var(--t3)',
                maxWidth: i === 0 ? 190 : 140,
              }}
            >
              {s.chu}
            </span>
          </span>
        ))}
        <ChevronDown size={13} className="shrink-0 text-[var(--t4)]" aria-hidden="true" />
      </button>

      {mo && neo && typeof document !== 'undefined'
        ? createPortal(
            // PORTAL ra body — luật K4 (00-CHOT 02/08): tấm nổi KHÔNG được lồng trong chrome
            // kính, không thì backdrop root chặn blur và menu xuyên thấu.
            <div
              ref={menuRef}
              role="menu"
              aria-label={tr('Chuyển ngữ cảnh', 'Switch context')}
              style={{ position: 'fixed', top: neo.top, left: neo.left, zIndex: 60, width: 248 }}
              className="nen-mo-panel overflow-hidden rounded-[var(--r-3)] border border-[var(--border)] p-1 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]"
            >
              <div className="px-2 pb-1 pt-1.5 text-[length:var(--fs-xs)] uppercase tracking-wide text-[var(--t4)]">
                {tr('Dự án', 'Project')}
              </div>
              <MucMenu
                icon={<PencilLine size={14} />}
                chu={tr('Đổi tên dự án', 'Rename project')}
                onClick={() => {
                  setMo(false);
                  onDoiTen();
                }}
              />
              <MucMenu
                icon={<FolderOpen size={14} />}
                chu={tr('Mở dự án khác', 'Open another project')}
                onClick={() => {
                  setMo(false);
                  goHomeConfirmed(router, { push: true });
                }}
              />
              <div className="my-1 h-px bg-[var(--vien-mo)]" />
              <div className="px-2 pb-1 pt-0.5 text-[length:var(--fs-xs)] uppercase tracking-wide text-[var(--t4)]">
                {tr('Chặng', 'Stage')}
              </div>
              {PHASES.map((p) => (
                <MucMenu
                  key={p.id}
                  icon={
                    p.id === chang ? (
                      <Check size={14} />
                    ) : (
                      // Chỗ trống ĐÚNG BỀ RỘNG dấu tick — không có nó thì hàng đang chọn thụt
                      // ra so với hàng khác, mắt đọc thành hai danh sách.
                      <span aria-hidden="true" style={{ display: 'block', width: 14, height: 14 }} />
                    )
                  }
                  chu={lang === 'en' ? p.labelEn : p.label}
                  dangChon={p.id === chang}
                  onClick={() => {
                    setMo(false);
                    onChonChang(p.id);
                  }}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MucMenu({
  icon,
  chu,
  onClick,
  dangChon,
}: {
  icon: React.ReactNode;
  chu: string;
  onClick: () => void;
  dangChon?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      // `aria-current` chứ không chỉ dấu tick: dấu tick là kênh HÌNH, trình đọc màn hình cần
      // kênh thứ hai (luật màu/hình không được là kênh duy nhất).
      aria-current={dangChon ? 'true' : undefined}
      className="flex w-full items-center gap-2 rounded-[var(--r-2)] px-2 py-1.5 text-left text-[length:var(--fs-sm)] transition-colors duration-[120ms] hover:bg-[var(--hover)]"
      style={{ color: dangChon ? 'var(--t1)' : 'var(--t2)' }}
    >
      <span className="shrink-0 text-[var(--t4)]">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{chu}</span>
    </button>
  );
}
