-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "dialog_questions" DROP CONSTRAINT "dialog_questions_meeting_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- CreateTable
CREATE TABLE "dialog_faq" (
    "id" TEXT NOT NULL,
    "question_ru" TEXT NOT NULL,
    "question_kk" TEXT,
    "question_en" TEXT,
    "answer_ru" TEXT NOT NULL,
    "answer_kk" TEXT,
    "answer_en" TEXT,
    "similar_questions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialog_faq_pkey" PRIMARY KEY ("id")
);
