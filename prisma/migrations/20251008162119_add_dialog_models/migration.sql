-- CreateTable
CREATE TABLE "dialog_meetings" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleKk" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "summaryRu" TEXT,
    "summaryKk" TEXT,
    "summaryEn" TEXT,
    "overviewRu" TEXT,
    "overviewKk" TEXT,
    "overviewEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialog_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialog_questions" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleKk" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "collapsedTextRu" TEXT NOT NULL,
    "collapsedTextKk" TEXT NOT NULL,
    "collapsedTextEn" TEXT NOT NULL,
    "expandedTextRu" TEXT,
    "expandedTextKk" TEXT,
    "expandedTextEn" TEXT,
    "decisionLabelRu" TEXT,
    "decisionLabelKk" TEXT,
    "decisionLabelEn" TEXT,
    "triggerPhrases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialog_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dialog_meetings_code_key" ON "dialog_meetings"("code");

-- CreateIndex
CREATE UNIQUE INDEX "dialog_questions_meeting_id_number_key" ON "dialog_questions"("meeting_id", "number");

-- AddForeignKey
ALTER TABLE "dialog_questions" ADD CONSTRAINT "dialog_questions_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "dialog_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
