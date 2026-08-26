/**
 * lib/server/access-scope.ts — phần THUẦN của phạm vi tài nguyên NGOÀI cây `Project`.
 *
 * Tách khỏi `access.ts` vì cùng lý do `access-policy.ts` đã tách: `access.ts` kéo theo Prisma nên
 * không test được bằng `sucrase-node`. Route KHÔNG import file này trực tiếp — import qua
 * `@/lib/server/access` (một cửa duy nhất, `access.ts` re-export).
 */
import nodePath from 'path';

/**
 * `LibraryAsset` nằm **NGOÀI** cây `Project`, nên `ProjectMember`/`visibleProjectIds` không với
 * tới nó. Hôm nay `GET /api/library` cố ý *"trả tất cả asset của mọi user"* — kho DÙNG CHUNG.
 * Đó là hành vi đang chạy, không phải tai nạn; siết nó là **đổi tính năng**, không phải vá lỗi.
 *
 * ⇒ Đặt sau CỜ, mặc định TẮT (giữ nguyên hành vi hôm nay). Bật `IF_LIBRARY_SCOPE_ENFORCE=1` thì
 * bytes chỉ về tay người upload hoặc admin — **cùng luật mà `DELETE /api/library/[id]` đã thi
 * hành**, tức là không đẻ định nghĩa quyền thứ hai, chỉ mở rộng định nghĩa đã có sang đường đọc.
 *
 * Luật Hoà 26/08: *"dựng tenant/access contract additive, feature-flagged. Không bật enforcement
 * rộng trước proof."* Cờ này chính là chỗ đó. Cả hai nhánh đều có proof (`scripts/proof/library-file-scope.mjs`).
 */
export function libraryScopeEnforced(): boolean {
  return process.env.IF_LIBRARY_SCOPE_ENFORCE === '1';
}

export function canReadLibraryAsset(
  user: { id: string; isAdmin: boolean },
  asset: { userId: string },
): boolean {
  if (!libraryScopeEnforced()) return true; // kho dùng chung — hành vi hôm nay, giữ nguyên
  return asset.userId === user.id || user.isAdmin;
}

/**
 * `asset.path` là chuỗi trong DB. Nếu nó chứa `../` thì `path.join(UPLOAD_DIR, path)` **thoát ra
 * khỏi `uploads/`** và route đọc được file tuỳ ý trên máy. Chốt chặn này KHÔNG có cờ và KHÔNG
 * phụ thuộc quyền: nó không đổi hành vi hợp lệ nào, chỉ chặn đường thoát. Cùng khuôn với
 * `app/api/project-files/_lib/doc-noi-dung.ts` (tên tệp phẳng, giải xong phải bằng chính nó).
 */
export function duongDanTrongThuMuc(thuMuc: string, tenTuongDoi: string): string | null {
  if (!tenTuongDoi || tenTuongDoi.includes('\0')) return null;
  // `path.join(thuMuc, '/etc/passwd')` KHÔNG thoát ra (join coi `/` đầu là đoạn tương đối) — nên
  // đây không phải lỗ. Vẫn từ chối tường minh: một chuỗi tuyệt đối trong cột `path` là dữ liệu
  // sai, và im lặng biến nó thành đường con là giấu cái sai đó đi.
  if (nodePath.isAbsolute(tenTuongDoi)) return null;
  const p = nodePath.resolve(nodePath.join(thuMuc, tenTuongDoi));
  const goc = nodePath.resolve(thuMuc);
  if (p !== goc && !p.startsWith(goc + nodePath.sep)) return null;
  return p;
}

