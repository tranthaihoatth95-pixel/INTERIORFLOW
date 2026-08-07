-- CreateTable
CREATE TABLE "GuModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "weightsJson" TEXT NOT NULL,
    "pairCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntegrationAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "scope" TEXT NOT NULL DEFAULT '',
    "expiresAt" DATETIME,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LarkPersonRef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "larkRecordId" TEXT NOT NULL,
    "larkAccount" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT,
    "department" TEXT,
    "isCrea" BOOLEAN NOT NULL DEFAULT false,
    "raw" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LarkTaskRef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "larkRecordId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "larkProjectName" TEXT NOT NULL,
    "larkProjectCode" TEXT,
    "ownerAccount" TEXT,
    "status" TEXT NOT NULL,
    "deadline" DATETIME,
    "daysLeft" INTEGER,
    "warningLabel" TEXT,
    "raw" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LarkUserMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "larkAccount" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "page" INTEGER,
    "content" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "tokens" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("sourceId") REFERENCES "NotebookSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("notebookId") REFERENCES "ProjectNotebook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalUrl" TEXT,
    "filePath" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "errorMsg" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("notebookId") REFERENCES "ProjectNotebook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductSpec" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "brand" TEXT,
    "sku" TEXT,
    "vendor" TEXT,
    "w" INTEGER,
    "d" INTEGER,
    "hUp" INTEGER,
    "materials" TEXT NOT NULL DEFAULT '',
    "finishes" TEXT NOT NULL DEFAULT '',
    "colorHex" TEXT,
    "imageAssetId" TEXT,
    "drawingBlock" TEXT,
    "priceNote" TEXT,
    "currency" TEXT,
    "larkRecordId" TEXT,
    "raw" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" DATETIME,
    "unit" TEXT,
    "priceVnd" DECIMAL,
    "wastagePercent" DECIMAL,
    "packagingSpec" TEXT,
    "altSku" TEXT,
    "styleTags" TEXT NOT NULL DEFAULT '',
    "scope" TEXT NOT NULL DEFAULT 'studio',
    "ownerId" TEXT,
    "supplierId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "confidence" TEXT,
    "room" TEXT
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rev" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "lastEditedBy" TEXT,
    "lastEditedDevice" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectNotebook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Flow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Untitled flow',
    "graphJson" TEXT NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
    "coverUrl" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "rev" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "lastEditedBy" TEXT,
    "lastEditedDevice" TEXT,
    FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Flow" ("createdAt", "graphJson", "id", "name", "projectId", "shareToken", "updatedAt", "userId", "version") SELECT "createdAt", "graphJson", "id", "name", "projectId", "shareToken", "updatedAt", "userId", "version" FROM "Flow";
DROP TABLE "Flow";
ALTER TABLE "new_Flow" RENAME TO "Flow";
CREATE INDEX "Flow_deletedAt_idx" ON "Flow"("deletedAt" ASC);
CREATE UNIQUE INDEX "Flow_shareToken_key" ON "Flow"("shareToken" ASC);
CREATE TABLE "new_LibraryAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '',
    "mime" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "usage" TEXT NOT NULL DEFAULT 'ref-render',
    "palette" TEXT NOT NULL DEFAULT '',
    "caption" TEXT NOT NULL DEFAULT '',
    "content" TEXT,
    "w" INTEGER NOT NULL DEFAULT 0,
    "h" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rev" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "lastEditedBy" TEXT,
    "lastEditedDevice" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LibraryAsset" ("category", "createdAt", "id", "mime", "name", "path", "tags", "userId") SELECT "category", "createdAt", "id", "mime", "name", "path", "tags", "userId" FROM "LibraryAsset";
DROP TABLE "LibraryAsset";
ALTER TABLE "new_LibraryAsset" RENAME TO "LibraryAsset";
CREATE INDEX "LibraryAsset_deletedAt_idx" ON "LibraryAsset"("deletedAt" ASC);
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "larkProjectCode" TEXT,
    "currentStage" TEXT NOT NULL DEFAULT 'concept',
    "stageLocked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rev" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "lastEditedBy" TEXT,
    "lastEditedDevice" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("clientName", "createdAt", "id", "name", "userId") SELECT "clientName", "createdAt", "id", "name", "userId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt" ASC);
CREATE INDEX "Project_larkProjectCode_idx" ON "Project"("larkProjectCode" ASC);
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 200,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT
);
INSERT INTO "new_User" ("createdAt", "credits", "email", "id", "isAdmin", "lastSeenAt", "name", "passwordHash") SELECT "createdAt", "credits", "email", "id", "isAdmin", "lastSeenAt", "name", "passwordHash" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone" ASC);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GuModel_userId_kind_key" ON "GuModel"("userId" ASC, "kind" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationAccount_userId_provider_key" ON "IntegrationAccount"("userId" ASC, "provider" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LarkPersonRef_larkAccount_key" ON "LarkPersonRef"("larkAccount" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LarkPersonRef_larkRecordId_key" ON "LarkPersonRef"("larkRecordId" ASC);

-- CreateIndex
CREATE INDEX "LarkTaskRef_status_idx" ON "LarkTaskRef"("status" ASC);

-- CreateIndex
CREATE INDEX "LarkTaskRef_larkProjectCode_idx" ON "LarkTaskRef"("larkProjectCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LarkTaskRef_larkRecordId_key" ON "LarkTaskRef"("larkRecordId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LarkUserMap_larkAccount_key" ON "LarkUserMap"("larkAccount" ASC);

-- CreateIndex
CREATE INDEX "NotebookChunk_sourceId_idx" ON "NotebookChunk"("sourceId" ASC);

-- CreateIndex
CREATE INDEX "NotebookChunk_notebookId_idx" ON "NotebookChunk"("notebookId" ASC);

-- CreateIndex
CREATE INDEX "NotebookSource_notebookId_idx" ON "NotebookSource"("notebookId" ASC);

-- CreateIndex
CREATE INDEX "ProductSpec_ownerId_idx" ON "ProductSpec"("ownerId" ASC);

-- CreateIndex
CREATE INDEX "ProductSpec_scope_idx" ON "ProductSpec"("scope" ASC);

-- CreateIndex
CREATE INDEX "ProductSpec_drawingBlock_idx" ON "ProductSpec"("drawingBlock" ASC);

-- CreateIndex
CREATE INDEX "ProductSpec_sku_idx" ON "ProductSpec"("sku" ASC);

-- CreateIndex
CREATE INDEX "ProductSpec_kind_idx" ON "ProductSpec"("kind" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSpec_larkRecordId_key" ON "ProductSpec"("larkRecordId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "ProjectMember_deletedAt_idx" ON "ProjectMember"("deletedAt" ASC);

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectNotebook_projectId_key" ON "ProjectNotebook"("projectId" ASC);

