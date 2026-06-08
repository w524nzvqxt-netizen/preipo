-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "stage" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "salesPoints" TEXT,
    "pros" TEXT,
    "risks" TEXT,
    "pricePerShare" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "volume" REAL,
    "minTicket" REAL,
    "valuation" REAL,
    "expectedExit" TEXT,
    "expectedReturn" REAL,
    "videoScript" TEXT,
    "financialAnalysis" TEXT,
    "scenarios" TEXT,
    "videoJobId" TEXT,
    "videoStatus" TEXT,
    "videoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "dealStatus" TEXT NOT NULL DEFAULT 'open',
    "exitValuation" REAL,
    "cocMultiple" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("createdAt", "currency", "description", "expectedExit", "expectedReturn", "financialAnalysis", "id", "isActive", "isHot", "logoUrl", "minTicket", "name", "pricePerShare", "pros", "risks", "salesPoints", "scenarios", "sector", "stage", "updatedAt", "valuation", "videoJobId", "videoScript", "videoStatus", "videoUrl", "volume") SELECT "createdAt", "currency", "description", "expectedExit", "expectedReturn", "financialAnalysis", "id", "isActive", "isHot", "logoUrl", "minTicket", "name", "pricePerShare", "pros", "risks", "salesPoints", "scenarios", "sector", "stage", "updatedAt", "valuation", "videoJobId", "videoScript", "videoStatus", "videoUrl", "volume" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
