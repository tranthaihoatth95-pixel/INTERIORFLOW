-- BASELINE BÙ — IF-MIGRATION-LEDGER-RECONCILIATION-001 (27/08, Hoà chốt "chữa gốc").
--
-- VÌ SAO CÓ TỆP NÀY. Đo được ngày 27/08: áp lần lượt 6 thư mục migration vào một DB RỖNG chỉ
-- dựng ra 21 bảng, trong khi `prisma/dev.db` thật có 24. Ba bảng — `ProjectFile`,
-- `AssetRepresentation`, `ProjectAssetUsage` — cùng `LibraryAsset.contentHash`,
-- `ProductSpec.matId` và 8 index TỒN TẠI TRONG DB mà KHÔNG thư mục nào khai. Chúng ra đời qua
-- `prisma db push` (không sinh thư mục) chứ không qua migration.
--
-- Hệ quả trước khi có tệp này: thư mục `migrations/` KHÔNG dựng lại được cơ sở dữ liệu của chính
-- dự án mình. `migrate diff --from-migrations` gãy `P3006 · no such table: ProjectFile`; thư mục
-- `20260821140000` gãy ngay dòng 17 vì `ProjectFile` chưa tồn tại. Nghĩa là: CI gãy, máy mới gãy,
-- `migrate reset` gãy — và một bản khôi phục từ số không là bất khả.
--
-- ⚠️ VÌ SAO ĐẶT MỐC 20260820000000 (TRƯỚC `20260821140000`). Prisma chạy theo thứ tự tên thư mục.
-- `20260821140000` ALTER `ProjectFile` thêm ba cột duyệt, nên `ProjectFile` phải tồn tại TRƯỚC
-- nó. Vì vậy tệp này tạo `ProjectFile` **KHÔNG kèm** `reviewState`/`reviewedAt`/`reviewedBy` —
-- ba cột đó là việc của `20260821140000`, để nguyên lịch sử đúng như nó đã xảy ra. Nếu tạo kèm
-- ba cột ở đây thì `20260821140000` sẽ gãy `duplicate column name`.
--
-- ✅ ĐÃ CHỨNG MINH (không phải khai): dựng DB rỗng → áp 1→5 → áp tệp này → áp `20260821140000`,
-- rồi `migrate diff` với bản sao byte-cho-byte của `dev.db` thật ⇒ **"This is an empty migration"**.
-- Thư mục nay dựng lại đúng cơ sở dữ liệu thật.
--
-- ⛔ TRÊN DB ĐANG CHẠY, TUYỆT ĐỐI KHÔNG CHẠY SQL NÀY — mọi thứ ở đây ĐÃ TỒN TẠI, chạy là
-- `table already exists`. Trên DB đang chạy chỉ đánh dấu đã áp:
--     npx prisma migrate resolve --applied 20260820000000_baseline_bu_ba_bang
--     npx prisma migrate resolve --applied 20260821140000_them_project_file_review_state
-- Hai lệnh đó chỉ CHÈN HÀNG vào `_prisma_migrations`, không đụng một hàng dữ liệu nào (đã diễn
-- tập trên bản sao: 0 hàng dữ liệu đổi, lùi sạch bằng một câu DELETE).
-- Điều kiện tiên quyết: không tiến trình `prisma mcp` nào đang chạy · có bản sao lưu byte-cho-byte
-- đã diễn tập khôi phục (`prisma/dev.db.bak-2026-08-27-mocsach-truoc-baseline`).

-- AlterTable
ALTER TABLE "LibraryAsset" ADD COLUMN "contentHash" TEXT;

-- AlterTable
ALTER TABLE "ProductSpec" ADD COLUMN "matId" TEXT;

-- CreateTable
CREATE TABLE "AssetRepresentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payloadRef" TEXT NOT NULL,
    "truthLevel" TEXT NOT NULL DEFAULT 'inferred',
    "provenance" TEXT NOT NULL DEFAULT '',
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    FOREIGN KEY ("assetId") REFERENCES "LibraryAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectAssetUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "canvasId" TEXT,
    "usage" TEXT NOT NULL,
    "note" TEXT,
    "addedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    FOREIGN KEY ("assetId") REFERENCES "LibraryAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "contentHash" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rev" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "lastEditedBy" TEXT,
    "lastEditedDevice" TEXT,
    FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AssetRepresentation_deletedAt_idx" ON "AssetRepresentation"("deletedAt" ASC);

-- CreateIndex
CREATE INDEX "AssetRepresentation_assetId_kind_idx" ON "AssetRepresentation"("assetId" ASC, "kind" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAssetUsage_projectId_assetId_usage_key" ON "ProjectAssetUsage"("projectId" ASC, "assetId" ASC, "usage" ASC);

-- CreateIndex
CREATE INDEX "ProjectAssetUsage_projectId_idx" ON "ProjectAssetUsage"("projectId" ASC);

-- CreateIndex
CREATE INDEX "ProjectAssetUsage_assetId_idx" ON "ProjectAssetUsage"("assetId" ASC);

-- CreateIndex
CREATE INDEX "ProjectFile_deletedAt_idx" ON "ProjectFile"("deletedAt" ASC);

-- CreateIndex
CREATE INDEX "ProjectFile_projectId_idx" ON "ProjectFile"("projectId" ASC);

-- CreateIndex
CREATE INDEX "LibraryAsset_userId_contentHash_idx" ON "LibraryAsset"("userId" ASC, "contentHash" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSpec_matId_key" ON "ProductSpec"("matId" ASC);

