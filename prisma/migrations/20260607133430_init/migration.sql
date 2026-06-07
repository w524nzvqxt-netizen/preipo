-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "stage" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "pricePerShare" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "volume" REAL,
    "minTicket" REAL,
    "valuation" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "message" TEXT,
    "projectId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
