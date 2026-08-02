/**
 * lib/boq/from-project.ts — BOQ v2 Việc 1 (02/08): cầu nối giữa Doc THẬT của 1 dự án và
 * `computeBoqCached()` (Việc 2) — THUẦN (không Prisma/React/DOM), test bằng sucrase-node như
 * phần còn lại của `lib/boq/`.
 *
 * ⚠️ PHÁT HIỆN KIẾN TRÚC (L1, bắt buộc đọc trước khi code — đã kiểm, không đoán):
 * `docs/IF-CORE-SCHEMA.md` dòng 174 ghi rõ **"Pha 1 (nay): Desktop đóng gói, KHÔNG đồng bộ"** —
 * đối chiếu thêm `lib/cad/store.ts` (Zustand `'use client'`, field `doc: Doc` sống trong bộ nhớ
 * trình duyệt) + `lib/sheets-persist.ts` (persist Doc vào IndexedDB CỦA TRÌNH DUYỆT, khoá
 * `userId::route::projectId`) + `app/api/flows/[id]/route.ts` (server chỉ lưu/trả THẲNG
 * `Flow.graphJson` — chuỗi JSON React Flow graph, KHÔNG BAO GIỜ parse ra Doc). Kết luận: **hiện
 * tại KHÔNG có bảng Prisma nào lưu `Doc` theo `projectId`** — chỉ đạo gốc "viết lớp đọc từ Doc
 * hiện hành (project đang mở)" giả định có 1 bản Doc phía server để đọc, điều đó KHÔNG đúng với
 * kiến trúc hiện tại (không phải lỗi hiểu sai chỉ đạo — brief viết trước khi có L1 này).
 *
 * Vì vậy hàm ở đây nhận `Doc` do CALLER truyền vào (client đã có sẵn trong bộ nhớ runtime lúc gọi
 * — đúng pattern `useCadStore.getState().doc` đã dùng ở `lib/nodes/defs/render-v2.ts` dòng 244)
 * — KHÔNG tự "đọc từ DB". Hệ quả trực tiếp: `app/api/boq/[projectId]/route.ts` PHẢI là **POST**
 * nhận `{ doc }` trong body (client gửi kèm Doc hiện có), KHÔNG PHẢI GET như brief gốc viết —
 * xem quyết định này lặp lại ở route.ts + `docs/BAO-CAO-PHU.md` mục BOQ v2. Nếu Pha 2/3
 * (`IF-CORE-SCHEMA.md`) sau này thêm đồng bộ Doc lên server, chữ ký `computeBoqForProject()`
 * KHÔNG cần đổi — chỉ chỗ GỌI nó (route.ts) đổi từ đọc body sang đọc DB, giữ nguyên module này.
 */
import { computeBoqCached, type ComputeBoqCachedResult } from './cache';
import type { Doc } from '../cad/model';
import type { MaterialSpecLite } from './model';

/**
 * Hình lát tối thiểu của `specToDto()` (`lib/server/specs.ts`, đã vá đủ 6 field 2.1.9.r ở BOQ
 * v1) mà hàm này cần — CHỈ liệt kê field BOQ dùng tới, không phải toàn bộ DTO (DTO có nhiều field
 * khác: `brand`/`w`/`d`/`hUp`/... không liên quan BOQ). Structurally-compatible: object đầy đủ từ
 * `GET /api/specs?kind=material` gán thẳng vào tham số kiểu này được, không cần strip field thừa
 * tay (TypeScript excess-property-check chỉ áp cho object LITERAL, không áp cho biến đã có kiểu).
 */
export interface ProductSpecDtoLite {
  id: string;
  name: string;
  vendor: string | null;
  sku: string | null;
  unit: string | null;
  priceVnd: number | null;
  wastagePercent: number | null;
}

/** DTO (dữ liệu qua JSON, đã Number()-hoá Decimal) → `MaterialSpecLite` (`lib/boq/model.ts`) —
 * 2 kiểu hình dạng giống hệt nhau ở các field liên quan, tách riêng type để `lib/boq/model.ts`
 * không phải biết gì về "DTO"/API (giữ đúng nguyên tắc THUẦN đã đặt ra cho `computeBoq`). */
export function specDtoToMaterialLite(dto: ProductSpecDtoLite): MaterialSpecLite {
  return {
    id: dto.id,
    name: dto.name,
    vendor: dto.vendor,
    sku: dto.sku,
    unit: dto.unit,
    priceVnd: dto.priceVnd,
    wastagePercent: dto.wastagePercent,
  };
}

/**
 * Tính BOQ cho 1 dự án — CÓ NHỚ (`computeBoqCached`, `cacheKey = projectId`, xem `lib/boq/cache.ts`
 * cho cơ chế LIÊN KẾT SỐNG). `doc` do caller (route.ts) truyền vào từ body request — xem lý do ở
 * đầu file. `specDtos` do caller tự tra qua `GET /api/specs?kind=material` (không fetch bên trong,
 * giữ THUẦN, test không cần mock network/DB — cùng nguyên tắc `computeBoq` gốc).
 */
export function computeBoqForProject(
  projectId: string,
  doc: Doc,
  specDtos: ProductSpecDtoLite[],
): ComputeBoqCachedResult {
  const specs = specDtos.map(specDtoToMaterialLite);
  return computeBoqCached(projectId, doc, specs);
}
