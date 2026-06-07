-- AlterTable
ALTER TABLE "Project" ADD COLUMN "pros" TEXT;
ALTER TABLE "Project" ADD COLUMN "risks" TEXT;
ALTER TABLE "Project" ADD COLUMN "salesPoints" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'doc',
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProjectDocument" ("createdAt", "fileName", "fileUrl", "id", "projectId", "sizeBytes", "title") SELECT "createdAt", "fileName", "fileUrl", "id", "projectId", "sizeBytes", "title" FROM "ProjectDocument";
DROP TABLE "ProjectDocument";
ALTER TABLE "new_ProjectDocument" RENAME TO "ProjectDocument";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
