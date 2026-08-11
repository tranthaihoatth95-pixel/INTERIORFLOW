-- CreateTable
CREATE TABLE "ProjectProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "loaiHinh" TEXT,
    "dienTichM2" REAL,
    "nganSach" TEXT,
    "mocBanGiao" DATETIME,
    "hienTrang" TEXT,
    "ghiChu" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectProfile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectProfile_projectId_key" ON "ProjectProfile"("projectId");
