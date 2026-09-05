'use client';

/**
 * lib/tay-cam-thu-muc.ts — KHOÁ TAY CẦM THƯ MỤC THEO NGƯỜI ĐÃ ĐĂNG NHẬP.
 *
 * ⛔ LỖ P1 ĐANG CHỮA — QUYỀN HỆ TỆP RÒ QUA NGƯỜI DÙNG (Hoà phân loại 05/09):
 * `lib/root-folder.ts` và `lib/cad/auto-backup.ts` cất handle thư mục vào IndexedDB dưới **khoá
 * CỐ ĐỊNH** (`rootDir` · `backupDir`). Trên MỘT máy dùng chung:
 *
 *   người A đăng nhập → cấp quyền thư mục `~/InteriorFlow` → handle nằm trong IndexedDB
 *   người A đăng xuất → người B đăng nhập trên CÙNG hồ sơ trình duyệt
 *   → app đọc lại đúng handle đó → **người B thừa hưởng quyền đọc/ghi thư mục của người A**
 *
 * Đây KHÔNG phải một tuỳ chọn vô hại. Handle này là đường dữ liệu dự án THẬT: `real-fs.ts` ·
 * `brand-kit-disk.ts` · `colors/store.ts` · `PresentSheets.tsx` đều đọc nó để ghi tệp lên đĩa.
 * Nó vi phạm thẳng bất biến *"dữ liệu người A không được rơi vào tay người B"* — cùng bất biến mà
 * `clearLastUserId` (04/09) sinh ra để bảo vệ, nhưng lớp hệ tệp thì chưa ai đóng.
 *
 * ⚠️ FAIL CLOSED — chưa biết người dùng là ai thì **KHÔNG cất và KHÔNG đọc** handle. Thà bắt người
 * ta chọn lại thư mục một lần còn hơn trao nhầm quyền: chọn lại là một cú bấm, trao nhầm là mất
 * dữ liệu của người khác.
 *
 * ⚠️ KHOÁ CŨ KHÔNG ĐƯỢC NHẬN VỀ. Bản ghi `rootDir`/`backupDir` không mang tên ai — nhận nó cho
 * người đang đăng nhập CHÍNH LÀ tái hiện đúng lỗ đang chữa (người B mở app lần đầu sẽ "kế thừa"
 * thư mục của người A). Nên khoá cũ bị **XOÁ** khi gặp, không di trú.
 * ⇒ Cái mất: người đã chọn thư mục trước 05/09 phải chọn lại MỘT lần. Cái giữ: mọi tệp trên đĩa
 * còn nguyên — thứ bị xoá là **lời cấp quyền**, không phải dữ liệu.
 */

import { getLastUserId } from './resume';

/** Khoá theo người, hoặc `null` khi chưa biết người dùng (⇒ nơi gọi phải fail closed). */
export function khoaTheoNguoi(goc: string): string | null {
  const uid = getLastUserId();
  return uid ? `${goc}:${uid}` : null;
}

/** Xoá bản ghi mang khoá CŨ (không theo người). Gọi mỗi lần đọc — rẻ, và đóng cửa vĩnh viễn. */
export function xoaKhoaCu(db: IDBDatabase, store: string, khoaCu: string): void {
  try {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(khoaCu);
  } catch {
    /* không có store hoặc DB đang đóng — không đáng làm gãy đường đọc */
  }
}

/**
 * Xoá MỌI tay cầm của người vừa đăng xuất, ở cả hai kho.
 *
 * Phòng thủ lớp hai: khoá đã theo người nên người B vốn không đọc được handle của người A. Lớp này
 * đóng thêm ca *"cùng một người, máy công cộng"* — đăng xuất xong thì lời cấp quyền cũng phải hết,
 * không nằm lại chờ ai đó đăng nhập lại bằng chính tài khoản đó trên máy lạ.
 *
 * KHÔNG ném lỗi, KHÔNG gọi mạng — chạy được cả khi IndexedDB bị chặn hẳn.
 */
export async function xoaTayCamCuaPhien(uid: string | null): Promise<void> {
  if (!uid || typeof indexedDB === 'undefined') return;
  const kho: Array<[string, string, string]> = [
    ['interiorflow-root', 'handles', `rootDir:${uid}`],
    ['interiorflow-backup', 'handles', `backupDir:${uid}`],
  ];
  await Promise.all(kho.map(([ten, store, khoa]) => new Promise<void>((resolve) => {
    try {
      const req = indexedDB.open(ten, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(store)) req.result.createObjectStore(store);
      };
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction(store, 'readwrite');
          tx.objectStore(store).delete(khoa);
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); resolve(); };
        } catch { db.close(); resolve(); }
      };
    } catch { resolve(); }
  })));
}
