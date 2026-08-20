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
 * ══ ✅ DEDUPE THEO `contentHash` — NỢ ĐÃ TRẢ 20/08 (cửa duyệt 01, Hoà chốt) ═══════════════════
 * Docstring cũ ở đây ghi *"KHÔNG dedupe được — `LibraryAsset` không có cột hash"*. Câu đó **hết
 * hiệu lực**: cột `LibraryAsset.contentHash` + `@@index([userId, contentHash])` nay có thật
 * (`prisma/schema.prisma:322-331`, đã đo bằng truy vấn thật).
 *   · Hash **KHÔNG tính lại**: `ProjectFile.contentHash` đã mang sẵn sha256 của đúng binary đó,
 *     cùng hàm `bamContentHash` ⇒ đọc thẳng, không băm lại 25MB lần hai.
 *   · Khoá coi-là-một-vật = **`userId` + `contentHash` + LỚP `license:`**, cả ba. Bỏ `userId` là
 *     rò tài sản xuyên người dùng; bỏ `license:` là gộp hai tệp trùng bytes nhưng KHÁC GIẤY PHÉP
 *     — ca HỢP LỆ, và gộp nhầm thì hồ sơ khách mang sai giấy phép.
 *   · Trùng ⇒ **dùng lại asset cũ + gắn thêm tag `nguon:` mới**, KHÔNG sinh hàng thứ hai. Kết quả
 *     trả về `dungLai: true` để nơi gọi nói đúng chuyện đã xảy ra.
 *   · ⛔ **KHÔNG BAO GIỜ thêm `@unique` cho `contentHash`** — đọc `schema.prisma:322-331`. Kho
 *     đang có trùng-bytes-khác-giấy-phép THẬT; unique áp vào là đổ ngay lúc backfill.
 *
 * ══ 🔴 CỬA "ĐÃ XEM" — KHÔNG PHẢI CỔNG DUYỆT, VÀ ĐÂY LÀ SỰ THẬT (đo 20/08) ════════════════════
 * `daXem` chỉ sống trong `useState` của một màn (`components/filemanager/TepNguonDuAn.tsx:442`),
 * KHÔNG có cột DB, KHÔNG gửi lên trong body, và route promote KHÔNG hỏi tới. Nó là **danh sách
 * tự đánh dấu phía người dùng**, mất khi tải lại trang.
 * ⇒ Hợp đồng của cửa này, khai thẳng: **Promote KHÔNG đòi duyệt.** Bất kỳ ai qua được
 *   `assertProjectAccess(…, 'bim')` đều promote được, ngay cả khi chưa tick gì.
 * ⇒ Máy chủ KHÔNG cưỡng chế được trạng thái nó không lưu. Muốn cổng duyệt THẬT thì phải có chỗ
 *   ghi trạng thái đó — tức đổi schema, mà schema là cửa của Hoà. Hình dạng đề xuất đã trình
 *   MAIN (`docs/bao-cao-phien/2026-08-20-LANE-B-promote-quality.md` §Review contract).
 * ⛔ Cho tới khi có cột thật: **cấm dựng cổng giả ở đây** (kiểm một cờ client gửi lên là để người
 *   gọi tự khai mình đã duyệt — đó là cổng bằng giấy, tệ hơn không có vì nó tạo cảm giác an toàn).
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
import { buildGalleryTag, parseGalleryTags, type GalleryLicense } from '../library/gallery-tags';
import { trichSieuDuLieuTuDia, dungBanGhiLibraryAsset } from './asset-metadata';

/**
 * Lớp giấy phép mà Promote gán cho vật sinh ra. Tệp do người dùng tự đưa vào dự án ⇒ `user`.
 * Đây CŨNG là lớp dùng để so trùng — hai tệp trùng bytes mà khác lớp này là HAI vật.
 */
export const PROMOTE_LICENSE: GalleryLicense = 'user';

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
      /** true = CHÍNH ProjectFile này đã promote trước đó, KHÔNG sinh asset mới. */
      daCo: boolean;
      /**
       * true = tệp KHÁC nhưng TRÙNG NỘI DUNG (cùng user + cùng hash + cùng lớp giấy phép) đã có
       * trong Thư viện ⇒ dùng lại vật đó, chỉ gắn thêm nguồn gốc. KHÁC `daCo` có chủ đích: `daCo`
       * là *"bạn bấm lại"*, `dungLai` là *"vật này kho đã có, từ tệp khác"* — hai câu khác nhau,
       * người dùng cần phân biệt.
       */
      dungLai: boolean;
      assetId: string;
      imgId: string;
      usageId: string;
      usage: string;
      projectId: string;
      /** Siêu dữ liệu ĐÃ GHI được (null khi dùng lại/đã có — không trích lại). */
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
      dungLai: false,
      assetId: daPromote.id,
      imgId: imgIdFromKey(daPromote.id),
      usageId: row.id,
      usage,
      projectId: pf.projectId,
      meta: null,
    };
  }

  // ── ①b TRÙNG NỘI DUNG với một tệp KHÁC? (dedupe theo contentHash) ───────────────────────────
  // Chạy TRƯỚC khi đọc đĩa: hash đã có sẵn trên `ProjectFile`, nên ca trùng không tốn một lượt
  // đọc tệp nào. Bản ghi cũ (trước backfill) có thể `contentHash = null` ⇒ bỏ qua bước này,
  // KHÔNG coi null là một giá trị so trùng được (null gặp null không phải "cùng nội dung").
  if (pf.contentHash) {
    const trung = await timAssetTrungNoiDung(input.userId, pf.contentHash);
    if (trung) {
      const out = await prisma.$transaction(async (tx) => {
        // Gắn thêm nguồn gốc — vật này nay đến từ HAI tệp thô. Ghi cả hai, không đè cái cũ:
        // provenance mất một nhánh là mất đúng thứ Promote sinh ra để giữ.
        await tx.libraryAsset.update({
          where: { id: trung.id },
          data: { tags: themTag(trung.tags, tagNguon), lastEditedBy: input.userId },
        });
        const usageRow = await taoHoacHoiSinhUsage(tx, {
          projectId: pf.projectId, assetId: trung.id, usage, addedBy: input.userId, note: input.note,
        });
        return usageRow.id;
      });
      return {
        ok: true,
        daCo: false,
        dungLai: true,
        assetId: trung.id,
        imgId: imgIdFromKey(trung.id),
        usageId: out,
        usage,
        projectId: pf.projectId,
        meta: null,
      };
    }
  }

  // ── ①c TRÍCH SIÊU DỮ LIỆU — server tự đọc tệp, KHÔNG tin nhãn nào ───────────────────────────
  // Cùng cửa trích với `library-save.ts` (`asset-metadata.ts`). Đây là chỗ vá lỗ "9 tài sản đều
  // 0×0": trước đây bước này KHÔNG TỒN TẠI.
  const meta = await trichSieuDuLieuTuDia(pf.path, pf.contentHash);
  if (!meta) {
    // Bản ghi còn, tệp đã mất trên đĩa. 410 (Gone) chứ không 404: `ProjectFile` TÌM THẤY, thứ
    // biến mất là nội dung. Sinh asset trỏ vào đường dẫn chết là đẻ một vật hỏng vào kho dùng
    // chung — thà từ chối và nói rõ.
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
  const tags = [tagNguon, buildGalleryTag('license', PROMOTE_LICENSE)].join(',');

  const out = await prisma.$transaction(async (tx) => {
    const asset = await tx.libraryAsset.create({
      // ⭐ CÙNG hàm dựng bản ghi với `library-save.ts` — hai cửa ghi, MỘT khuôn. Thêm/bớt trường
      // là cả hai cùng đổi; không còn cách nào để một cửa "quên" một cột nữa.
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
    dungLai: false,
    assetId: out.assetId,
    imgId: imgIdFromKey(out.assetId),
    usageId: out.usageId,
    usage,
    projectId: pf.projectId,
    meta: { w: meta.w, h: meta.h, palette: meta.palette, ghiChu: meta.ghiChu },
  };
}

/* ══════════════════════ DEDUPE THEO NỘI DUNG ═══════════════════════════════════════════════ */

/** Thêm một tag vào chuỗi CSV nếu chưa có. Giữ thứ tự cũ, không sắp lại, không nhân bản. */
export function themTag(tagsCu: string, tagMoi: string): string {
  const list = (tagsCu ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  if (list.some((t) => t.toLowerCase() === tagMoi.toLowerCase())) return tagsCu;
  return [...list, tagMoi].join(',');
}

/**
 * Tìm asset CÙNG NỘI DUNG đã có trong kho của chính người này.
 *
 * Khoá = `userId` + `contentHash` (đi thẳng vào `@@index([userId, contentHash])`, không quét
 * bảng) + lớp `license:` (lọc ở TẦNG CODE, vì license sống trong CSV `tags` không index được).
 * Lọc license ở code là đúng chỗ: bộ ứng viên sau khi lọc theo index đã rất nhỏ (cùng người,
 * cùng byte), nên đây KHÔNG phải quét toàn bảng trá hình.
 *
 * Trả hàng CŨ NHẤT khi có nhiều — vật gốc, không phải bản sao mới nhất. (Kho hiện có nhóm trùng
 * thật ×7 từ trước khi có cột hash; sau backfill chúng sẽ lộ ra ở đây.)
 */
async function timAssetTrungNoiDung(userId: string, contentHash: string) {
  const ungVien = await prisma.libraryAsset.findMany({
    where: { userId, contentHash, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, tags: true },
  });
  return ungVien.find((a) => parseGalleryTags(a.tags).license === PROMOTE_LICENSE) ?? null;
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
