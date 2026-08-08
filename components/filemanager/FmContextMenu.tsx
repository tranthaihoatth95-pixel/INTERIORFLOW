'use client';

/**
 * components/filemanager/FmContextMenu.tsx — menu chuột phải cho 1 dòng/thẻ file ở `/files`.
 *
 * Nguồn: `docs/SPEC-MAT-DO-CON-TRO.md` §4 việc 1 ("Menu chuột phải + chọn nhiều") — desktop thiếu
 * hẳn từ vựng chuột. Chỉ 3 hành động: Đổi tên · Tải xuống · Xoá — CHỈ NỐI hành động đã có thật ở
 * `lib/filemanager/real-fs.ts` (file THẬT trên đĩa, qua File System Access) và
 * `lib/filemanager/local-state.ts` (bản ghi tải-lên-trong-phiên chưa ghi được đĩa) — file dữ liệu
 * MẪU tĩnh (`lib/filemanager/mock-data.ts`, id tiền tố `f-`) không có gì đứng sau để đổi/xoá/tải,
 * nên 3 nút MỜ + `title` nói rõ lý do (đúng luật "nút mờ phải kèm lý do", không giả vờ chạy).
 *
 * Portal ra `document.body` + `useDismissable` (Esc/click ngoài) — cùng khuôn `AccountMenu.tsx`,
 * không tự chế cơ chế đóng thứ hai (bài học K4 `TICKET-FIX-KINH-HEADER-2026-08-02.md`).
 *
 * Đổi tên: KHÔNG dùng `window.prompt` (crash trong webview nhúng, xem `CadCanvas.tsx` — cả app đã
 * bỏ hết) — bấm "Đổi tên" biến menu thành 1 ô nhập TẠI CHỖ, Enter chốt / Esc huỷ.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Trash2, Download } from 'lucide-react';
import { useDismissable } from '@/lib/useDismissable';

export interface FmMenuTarget {
  fileId: string;
  fileName: string;
  /** toạ độ đã kẹp trong viewport — tính sẵn ở nơi gọi (`FileManagerShell`), menu chỉ vẽ đúng chỗ. */
  x: number;
  y: number;
}

interface Props {
  target: FmMenuTarget | null;
  onDismiss: () => void;
  canRename: boolean;
  canDownload: boolean;
  canDelete: boolean;
  /** lý do khi 1 nút mờ — khác nhau tuỳ file THẬT/tạm/mẫu, tính sẵn ở nơi gọi. */
  renameReason: string;
  downloadReason: string;
  deleteReason: string;
  onRename: (fileId: string, newName: string) => void;
  onDownload: (fileId: string) => void;
  onDelete: (fileId: string) => void;
}

export function FmContextMenu({
  target,
  onDismiss,
  canRename,
  canDownload,
  canDelete,
  renameReason,
  downloadReason,
  deleteReason,
  onRename,
  onDownload,
  onDelete,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');

  // Mỗi lần mở menu lên 1 target mới: về đúng trạng thái danh sách hành động (không giữ ô nhập
  // dở từ lần mở trước).
  useEffect(() => {
    setRenaming(false);
    setDraftName(target?.fileName ?? '');
  }, [target?.fileId]);

  useDismissable({ open: !!target, onDismiss, refs: [menuRef] });

  if (typeof document === 'undefined' || !target) return null;

  const commitRename = () => {
    const name = draftName.trim();
    if (name && name !== target.fileName) onRename(target.fileId, name);
    onDismiss();
  };

  return createPortal(
    <div ref={menuRef} className="fm-ctxmenu" style={{ top: target.y, left: target.x }} role="menu" aria-label="Thao tác với file">
      {renaming ? (
        <form
          className="fm-ctxrename"
          onSubmit={(e) => {
            e.preventDefault();
            commitRename();
          }}
        >
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              // Chặn phím này lan ra bộ điều hướng bàn phím toàn màn (mũi tên/Delete ở
              // `FileManagerShell`) trong lúc đang gõ tên — Esc vẫn để `useDismissable` xử lý.
              e.stopPropagation();
              if (e.key === 'Escape') onDismiss();
            }}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Tên mới"
          />
        </form>
      ) : (
        <>
          <button
            type="button"
            role="menuitem"
            disabled={!canRename}
            title={!canRename ? renameReason : undefined}
            onClick={() => setRenaming(true)}
          >
            <Pencil size={13} /> Đổi tên
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canDownload}
            title={!canDownload ? downloadReason : undefined}
            onClick={() => {
              onDownload(target.fileId);
              onDismiss();
            }}
          >
            <Download size={13} /> Tải xuống
          </button>
          <button
            type="button"
            role="menuitem"
            className="danger"
            disabled={!canDelete}
            title={!canDelete ? deleteReason : undefined}
            onClick={() => {
              onDelete(target.fileId);
              onDismiss();
            }}
          >
            <Trash2 size={13} /> Xoá
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
