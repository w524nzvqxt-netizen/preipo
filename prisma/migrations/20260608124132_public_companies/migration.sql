-- CreateTable
CREATE TABLE "PublicCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "sector" TEXT,
    "ipoDate" TEXT,
    "ipoPriceUSD" REAL,
    "ipoValuationUSD" REAL,
    "currentPriceUSD" REAL,
    "currentMarketCapUSD" REAL,
    "asOf" TEXT,
    "rounds" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
