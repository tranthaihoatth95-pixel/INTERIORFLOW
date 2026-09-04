-- MIGRATION BÙ — đưa thư mục migrations về đúng `schema.prisma`.
--
-- VÌ SAO CÓ (đo 04/09, khi dựng môi trường xác minh): `prisma migrate deploy` áp đủ 6 migration
-- nhưng chỉ dựng **21/24 bảng**. Ba model chỉ từng tồn tại nhờ `prisma db push` gõ tay, không ai
-- sinh migration cho chúng — xem chính tên migration cũ `catchup_db_push_baseline`, tức đây là
-- lần THỨ HAI cùng một thói quen để lại nợ.
--
-- ⚠️ HỆ QUẢ NẾU KHÔNG CÓ TỆP NÀY: máy chủ mới triển khai bằng `migrate deploy` dựng CSDL THIẾU
-- BẢNG, và `prisma migrate status` vẫn báo "up to date" vì nó chỉ đối chiếu thư mục migrations
-- với bảng `_prisma_migrations`, KHÔNG so `schema.prisma` với CSDL thật ⇒ lệch này IM LẶNG.
--
-- AN TOÀN: sinh bằng `prisma migrate diff --from-migrations --to-schema-datamodel`, thuần THÊM —
-- **0 câu DROP**. Hai `ALTER TABLE` đều thêm cột TEXT nullable. Chỉ mục UNIQUE trên
-- `ProductSpec.matId` an toàn vì cột vừa thêm nên mọi hàng đều NULL (SQLite cho phép nhiều NULL
-- trong UNIQUE), không có giá trị trùng để đụng.
--
-- ⛔ KHÔNG chứa `ProjectFile.reviewState`: cột đó nằm trong một migration mồ côi trên nhánh cũ,
-- nhưng `schema.prisma` CHƯA BAO GIỜ khai nó (cửa duyệt schema chưa được chốt) ⇒ thêm vào là
-- dựng cột mà Prisma Client không biết.

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
    CONSTRAINT "AssetRepresentation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "LibraryAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "ProjectAssetUsage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectAssetUsage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "LibraryAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AssetRepresentation_assetId_kind_idx" ON "AssetRepresentation"("assetId", "kind");

-- CreateIndex
CREATE INDEX "AssetRepresentation_deletedAt_idx" ON "AssetRepresentation"("deletedAt");

-- CreateIndex
CREATE INDEX "ProjectFile_projectId_idx" ON "ProjectFile"("projectId");

-- CreateIndex
CREATE INDEX "ProjectFile_deletedAt_idx" ON "ProjectFile"("deletedAt");

-- CreateIndex
CREATE INDEX "ProjectAssetUsage_assetId_idx" ON "ProjectAssetUsage"("assetId");

-- CreateIndex
CREATE INDEX "ProjectAssetUsage_projectId_idx" ON "ProjectAssetUsage"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAssetUsage_projectId_assetId_usage_key" ON "ProjectAssetUsage"("projectId", "assetId", "usage");

-- CreateIndex
CREATE INDEX "LibraryAsset_userId_contentHash_idx" ON "LibraryAsset"("userId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSpec_matId_key" ON "ProductSpec"("matId");

