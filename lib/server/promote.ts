/**
 * lib/server/promote.ts — CỬA DUY NHẤT của bước **Promote**: `ProjectFile` → `LibraryAsset`
 * (+ BẮT BUỘC một `ProjectAssetUsage` cho project nguồn).
 *
 * ══ CONTRACT HOÀ CHỐT (docs/memory/sessions/2026-08-19/16-project-asset-ownership-spec §A1) ══
 *   `ProjectFile`   = đầu vào THÔ, thuộc ĐÚNG MỘT project (1-N), chưa đủ định nghĩa.
 *   `LibraryAsset`  = vật ĐÃ HIỂU, dùng lại được — **KHÔNG mang `projectId`**, không thuộc về
 *                     project nào. Đây là lý do Promote KHÔNG phải "đổi cờ" mà là **sinh vật mới
 *                     ở tầng khác** rồi nối ngược lại bằng usage.
 *   Promote         = tạo (hoặc gắn) `LibraryAsset` **VÀ** tạo `ProjectAssetUsage` cho project
 *                     nguồn. Thiếu vế sau thì project vừa "mất" tệp của mình → đó là hỏng, không
 *                     phải tối ưu. Vì thế hai việc đi trong MỘT `$transaction`.
 *   1 LibraryAsset  → N Project (qua `ProjectAssetUsage`).
 * Bản đồ dòng chảy: `docs/IF-KIEN-TRUC.md` §5 *Files → cửa sổ công cụ → Thư viện → đề xuất*.
 *
 * ══ SIÊU DỮ LIỆU — server TỰ ĐỌC TỆP, không tin nhãn nào (vá 04/09) ══════════════════════════
 * Trước bản vá này, `libraryAsset.create` ở đây KHÔNG ghi `w`/`h`/`palette`/`contentHash` một chữ
 * nào ⇒ **mọi tài sản promote đều `0×0`, palette rỗng**. Nay đi qua `lib/server/asset-metadata.ts`
 * — CÙNG cửa trích + CÙNG cửa dựng bản ghi với `library-save.ts`, nên thêm/bớt một cột là cả hai
 * cửa cùng đổi, không còn cách nào để một cửa "quên" một trường.
 *   · `contentHash` KHÔNG băm lại: `ProjectFile.contentHash` đã mang sha256 của đúng binary đó
 *     (cùng hàm `bamContentHash`) ⇒ truyền xuống dùng lại, không đọc-băm 25MB lần hai.
 *   · Không đo được thì `0` / `[]` / `null` — KHÔNG đoán. `w=0` đọc là *"chưa biết"*.
 *
 * ══ 🔧 ĐÍNH CHÍNH — docstring cũ ở chỗ này ĐÃ SAI, đừng chép lại ══════════════════════════════
 * Bản trước viết *"`LibraryAsset` KHÔNG CÓ cột `contentHash` ⇒ không dedupe được"*. Đo lại tại
 * nguồn 04/09: cột `LibraryAsset.contentHash` **CÓ THẬT**, kèm `@@index([userId, contentHash])`
 * (`prisma/schema.prisma`, model `LibraryAsset`). Câu cũ mô tả một hiện trạng đã qua.
 * ⇒ Bản vá này **ghi `contentHash`** cho mọi asset mới sinh (điều kiện cần của dedupe).
 * ⇒ Nhưng **CHƯA BẬT dedupe-theo-nội-dung** — đó là việc RIÊNG, ngoài phạm vi lượt vá này. Khoá
 *   coi-là-một-vật phải là `userId` + `contentHash` + LỚP `license:` (bỏ `userId` là rò tài sản
 *   xuyên người dùng; bỏ `license:` là gộp hai tệp trùng bytes nhưng KHÁC GIẤY PHÉP — ca hợp lệ).
 *   Bật nó còn kéo theo một trạng thái trả về mới (*"vật này kho đã có, từ tệp khác"* ≠ *"bạn bấm
 *   lại"*) ⇒ phải quyết riêng, không kèm vào một bản vá siêu dữ liệu.
 * ⛔ **KHÔNG BAO GIỜ thêm `@unique` cho `contentHash`** — đọc ghi chú trong `schema.prisma`: kho
 *   đang có trùng-bytes-khác-giấy-phép THẬT, unique áp vào là đổ ngay lúc backfill.
 *
 * ══ IDEMPOTENT — promote lại CÙNG một ProjectFile KHÔNG nhân bản ═════════════════════════════
 * `ProjectFile` cũng **không có** cột `promotedAt`/`assetId` để đánh dấu. Không bịa cột ⇒ dấu
 * vết đi qua **provenance tag** đã có sẵn vocabulary: `buildGalleryTag('nguon', …)`
 * (`lib/library/gallery-tags.ts:60`) — KHÔNG chế cú pháp tag mới, `nguon:` vốn nhận chuỗi tự do.
 *   tag = `nguon:projectfile:<projectFileId>`
 * Promote tra tag này trước; thấy rồi ⇒ trả lại asset cũ (`daCo: true`), chỉ đảm bảo usage tồn
 * tại. ⚠️ HẠN CHẾ CỦA CÁCH NÀY (khai thẳng, cùng lý do với đoạn dedupe ở trên): tra bằng
 * `tags contains` là **quét bảng, không dùng index**. Chấp nhận được ở đây vì nó chạy đúng MỘT
 * lần cho mỗi thao tác Promote của người dùng, khác hẳn dedupe-theo-nội-dung phải chạy cho mọi
 * file. Có cột thật thì thay ngay.
 *
 * Import RELATIVE — `sucrase-node` không đọc `paths` của tsconfig.
 */
import { prisma } from './db';
import { imgIdFromKey } from '../img-id';
import { LIBRARY_USAGES } from './library-save';
import { buildGalleryTag } from '../library/gallery-tags';
import { trichSieuDuLieuTuDia, dungBanGhiLibraryAsset } from './asset-metadata';

/**
 * Suy `usage` mặc định từ MIME — quy ước phiếu: ảnh → `ref-render`, PDF → `brief`, còn lại →
 * `ref-render`. Vocabulary lấy nguyên `LIBRARY_USAGES` (`library-save.ts:17`), **KHÔNG phải
 * taxonomy thứ ba** (xem comment `schema.prisma:701-708`).
 */
export function usageTuMime(mime: string): string {
  if (mime === 'application/pdf') return 'brief';
  return 'ref-render';
}

/** Tag provenance của một ProjectFile — MỘT nơi khai, đừng gõ chuỗi tay ở chỗ khác. */
export function tagNguonProjectFile(projectFileId: string): string {
  return buildGalleryTag('nguon', `projectfile:${projectFileId}`);
}

export interface PromoteInput {
  projectFileId: string;
  /** chủ sở hữu bản ghi `LibraryAsset` sinh ra + `addedBy` của usage. */
  userId: string;
  /** đè usage suy từ MIME. Ngoài `LIBRARY_USAGES` thì bị bỏ qua (rơi về suy từ MIME). */
  usage?: string;
  /** đè tên hiển thị; mặc định lấy `ProjectFile.name`. */
  name?: string;
  /**
   * `LibraryAsset.category` là chuỗi TỰ DO, kho hiện tại có 11 giá trị khác nhau (đo 20/08) —
   * KHÔNG có vocabulary chuẩn để suy. Không truyền ⇒ lấy chính `usage` làm category, để không
   * bịa ra một nhãn tiếng Việt nghe-có-vẻ-đúng. UI nên truyền giá trị thật.
   */
  category?: string;
  note?: string;
}

export type PromoteResult =
  | {
      ok: true;
      /** true = ProjectFile này đã promote trước đó, KHÔNG sinh asset mới. */
      daCo: boolean;
      assetId: string;
      imgId: string;
      usageId: string;
      usage: string;
      projectId: string;
      /**
       * Siêu dữ liệu ĐÃ TRÍCH được ở lượt này, để nơi gọi nói đúng thứ vừa ghi mà không phải
       * đọc lại DB. `null` khi KHÔNG trích lượt này (ca `daCo` — asset cũ, không đụng tới).
       * Thêm mới (04/09) và ADDITIVE: nơi gọi cũ không đọc trường này vẫn chạy y nguyên.
       */
      meta: { w: number; h: number; palette: string[]; ghiChu: string[] } | null;
    }
  | { ok: false; error: string; status: number };

/**
 * Promote một `ProjectFile`. **KHÔNG kiểm quyền** — caller (route) lo `assertProjectAccess`,
 * cùng quy ước với `saveLibraryAssetFromBuffer`.
 */
export async function promoteProjectFile(input: PromoteInput): Promise<PromoteResult> {
  const pf = await prisma.projectFile.findUnique({
    where: { id: input.projectFileId },
    select: {
      id: true, projectId: true, name: true, mime: true, path: true, deletedAt: true,
      // hash đã tính lúc nhận tệp — kéo theo để KHÔNG băm lại binary lần hai.
      contentHash: true,
    },
  });
  if (!pf || pf.deletedAt) return { ok: false, error: 'Không tìm thấy tệp dự án.', status: 404 };

  const usage =
    input.usage && LIBRARY_USAGES.includes(input.usage) ? input.usage : usageTuMime(pf.mime);
  const tagNguon = tagNguonProjectFile(pf.id);

  // ── ① Đã promote chưa? (idempotent — xem docstring đầu file) ────────────────────────────────
  const daPromote = await prisma.libraryAsset.findFirst({
    where: { tags: { contains: tagNguon }, deletedAt: null },
    select: { id: true },
  });

  if (daPromote) {
    // Asset đã có ⇒ chỉ ĐẢM BẢO usage tồn tại (có thể đã bị gỡ mềm ở lượt trước).
    const row = await baoDamUsage({
      projectId: pf.projectId,
      assetId: daPromote.id,
      usage,
      addedBy: input.userId,
      note: input.note,
    });
    return {
      ok: true,
      daCo: true,
      assetId: daPromote.id,
      imgId: imgIdFromKey(daPromote.id),
      usageId: row.id,
      usage,
      projectId: pf.projectId,
      // Asset cũ, không trích lại — nói `null` thay vì dựng số giả cho có trường.
      meta: null,
    };
  }

  // ── ①b TRÍCH SIÊU DỮ LIỆU — server tự đọc tệp, KHÔNG tin nhãn nào ───────────────────────────
  // Đây là chỗ vá lỗ "tài sản promote đều 0×0": trước đây bước này KHÔNG TỒN TẠI. Chạy SAU bước
  // idempotent ở trên để ca "bấm lại" không tốn một lượt đọc đĩa nào.
  const meta = await trichSieuDuLieuTuDia(pf.path, pf.contentHash);
  if (!meta) {
    // Bản ghi còn, tệp đã mất trên đĩa. 410 (Gone) chứ không 404: `ProjectFile` TÌM THẤY, thứ
    // biến mất là nội dung. Sinh asset trỏ vào đường dẫn chết là đẻ một vật hỏng vào kho DÙNG
    // CHUNG — thà từ chối và nói rõ.
    return {
      ok: false,
      error: 'Tệp gốc không còn trên đĩa — không đưa vào Thư viện được. Tải lại tệp rồi thử lại.',
      status: 410,
    };
  }

  // ── ② Sinh LibraryAsset + ProjectAssetUsage TRONG MỘT transaction ───────────────────────────
  // Cùng sinh hoặc cùng thất bại. Nếu asset sinh mà usage hỏng thì project vừa mất dấu tệp của
  // mình mà asset thì đã mang tag "đã promote" ⇒ lần sau chạy lại cũng không sửa được — đúng
  // trạng thái kẹt mà transaction sinh ra để chặn.
  //
  // ⭐ `path` DÙNG LẠI ĐÚNG FILE ĐÃ CÓ TRÊN ĐĨA (`pf.path`) — KHÔNG copy sang tệp thứ hai.
  // Cùng nội dung mà nằm hai chỗ là hai nguồn sự thật cho một vật; và bản thô là **bất biến**
  // (luật `smart-ingest`: bản gốc bất biến, dẫn xuất trỏ về gốc).
  const tags = [tagNguon, buildGalleryTag('license', 'user')].join(',');

  const out = await prisma.$transaction(async (tx) => {
    const asset = await tx.libraryAsset.create({
      // ⭐ CÙNG hàm dựng bản ghi với `library-save.ts` — hai cửa ghi, MỘT khuôn. Thêm/bớt trường
      // là cả hai cùng đổi; không còn cách nào để một cửa "quên" một cột nữa.
      // (Trần 120 ký tự của `name` nay do chính hàm đó giữ, không cắt hai lần.)
      data: dungBanGhiLibraryAsset({
        userId: input.userId,
        name: String(input.name ?? pf.name),
        category: String(input.category ?? usage),
        tags,
        mime: pf.mime,
        path: pf.path,
        usage,
        meta,
      }),
      select: { id: true },
    });

    // Cùng khuôn "hồi sinh / 409 / create" của `app/api/project-asset-usage/route.ts` — composite
    // unique @@unique([projectId, assetId, usage]) KHÔNG loại trừ deletedAt. Ở đây asset vừa sinh
    // nên không thể có hàng cũ, nhưng vẫn đi qua cùng một hàm để không có hai cách ghi usage.
    const usageRow = await taoHoacHoiSinhUsage(tx, {
      projectId: pf.projectId,
      assetId: asset.id,
      usage,
      addedBy: input.userId,
      note: input.note,
    });
    return { assetId: asset.id, usageId: usageRow.id };
  });

  return {
    ok: true,
    daCo: false,
    assetId: out.assetId,
    imgId: imgIdFromKey(out.assetId),
    usageId: out.usageId,
    usage,
    projectId: pf.projectId,
    meta: { w: meta.w, h: meta.h, palette: meta.palette, ghiChu: meta.ghiChu },
  };
}

interface UsageInput {
  projectId: string;
  assetId: string;
  usage: string;
  addedBy: string;
  note?: string;
}

/** Client Prisma hoặc transaction client — đủ hẹp để nhận cả hai mà không `any` trần. */
type TxLike = { projectAssetUsage: typeof prisma.projectAssetUsage };

/**
 * create nếu chưa có · hồi sinh nếu đã xoá mềm · giữ nguyên nếu đang sống.
 * ⚠️ KHÁC route POST /api/project-asset-usage một điểm CÓ CHỦ Ý: ở đó "đã gắn rồi" là **409**
 * (người dùng bấm gắn hai lần → phải báo). Ở đây "đã gắn rồi" là **thành công lặng lẽ**, vì
 * Promote phải IDEMPOTENT — bấm lại không được báo lỗi, chỉ không nhân bản.
 */
async function taoHoacHoiSinhUsage(tx: TxLike, i: UsageInput) {
  const existed = await tx.projectAssetUsage.findUnique({
    where: { projectId_assetId_usage: { projectId: i.projectId, assetId: i.assetId, usage: i.usage } },
    select: { id: true, deletedAt: true },
  });
  if (existed && !existed.deletedAt) return existed;
  if (existed) {
    return tx.projectAssetUsage.update({
      where: { id: existed.id },
      data: { deletedAt: null, note: i.note ?? null, addedBy: i.addedBy },
      select: { id: true, deletedAt: true },
    });
  }
  return tx.projectAssetUsage.create({
    data: {
      projectId: i.projectId,
      assetId: i.assetId,
      usage: i.usage,
      note: i.note ?? null,
      addedBy: i.addedBy,
    },
    select: { id: true, deletedAt: true },
  });
}

function baoDamUsage(i: UsageInput) {
  return taoHoacHoiSinhUsage(prisma, i);
}
