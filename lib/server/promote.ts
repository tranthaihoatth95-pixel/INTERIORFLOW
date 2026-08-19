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
 * ══ 🔴 KHÔNG DEDUPE ĐƯỢC THEO `contentHash` — KHAI THẲNG, KHÔNG BỊA ══════════════════════════
 * `ProjectFile` CÓ cột `contentHash` (`prisma/schema.prisma:662`) nhưng **`LibraryAsset` KHÔNG
 * CÓ** (đo tại nguồn 20/08, `schema.prisma:282-321` — 0 cột hash). ⇒ Không có cách nào hỏi
 * *"đã có LibraryAsset nào cùng nội dung chưa"* mà không quét toàn bảng.
 *   · **KHÔNG tự thêm cột** — phiếu cấm đổi schema, và regenerate Prisma Client sẽ làm các phiên
 *     dev server đang sống lỗi P2022 (ca thật đã ghi ở `schema.prisma:283-288`).
 *   · **ĐÃ CÂN VÀ BÁC** phương án nhét hash vào `LibraryAsset.tags`: `tags` là CSV free-text
 *     không index ⇒ tra là quét O(n) toàn bảng (đang có ~1.6k hàng, sẽ tăng), và `contains` trên
 *     chuỗi ghép còn dính khớp nhầm tiền tố. Dedupe sai nguy hiểm hơn không dedupe: nó **gắn
 *     nhầm project A vào asset của project B**.
 * ⇒ v0: mỗi lần Promote một ProjectFile CHƯA promote → sinh `LibraryAsset` mới. Dedupe xuyên-file
 *   theo nội dung là **việc còn nợ**, cần cột `contentHash` (+ index) trên `LibraryAsset`.
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
    }
  | { ok: false; error: string; status: number };

/**
 * Promote một `ProjectFile`. **KHÔNG kiểm quyền** — caller (route) lo `assertProjectAccess`,
 * cùng quy ước với `saveLibraryAssetFromBuffer`.
 */
export async function promoteProjectFile(input: PromoteInput): Promise<PromoteResult> {
  const pf = await prisma.projectFile.findUnique({
    where: { id: input.projectFileId },
    select: { id: true, projectId: true, name: true, mime: true, path: true, deletedAt: true },
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
      data: {
        userId: input.userId,
        name: String(input.name ?? pf.name).slice(0, 120),
        category: String(input.category ?? usage),
        tags,
        mime: pf.mime,
        path: pf.path,
        usage,
        lastEditedBy: input.userId,
      },
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
