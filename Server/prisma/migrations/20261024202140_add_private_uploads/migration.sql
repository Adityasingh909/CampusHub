-- CreateTable
CREATE TABLE "PrivateFolder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateFile" (
    "id" SERIAL NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "folderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrivateFolder_userId_idx" ON "PrivateFolder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateFolder_userId_name_key" ON "PrivateFolder"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateFile_storageKey_key" ON "PrivateFile"("storageKey");

-- CreateIndex
CREATE INDEX "PrivateFile_userId_createdAt_idx" ON "PrivateFile"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PrivateFile_folderId_idx" ON "PrivateFile"("folderId");

-- AddForeignKey
ALTER TABLE "PrivateFolder" ADD CONSTRAINT "PrivateFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateFile" ADD CONSTRAINT "PrivateFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateFile" ADD CONSTRAINT "PrivateFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "PrivateFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
