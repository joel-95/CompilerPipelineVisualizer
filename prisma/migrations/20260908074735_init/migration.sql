-- CreateTable
CREATE TABLE "compilation_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "source_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compilation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lexical_tokens" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "column" INTEGER NOT NULL,

    CONSTRAINT "lexical_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syntax_tree" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "tree_json" TEXT NOT NULL,

    CONSTRAINT "syntax_tree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symbol_table" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "symbol_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semantic_info" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "error_type" TEXT,
    "message" TEXT NOT NULL,
    "line" INTEGER,
    "column" INTEGER,

    CONSTRAINT "semantic_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intermediate_code" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "ir_code" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,

    CONSTRAINT "intermediate_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compilation_errors" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "error_msg" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "line" INTEGER,
    "column" INTEGER,

    CONSTRAINT "compilation_errors_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lexical_tokens" ADD CONSTRAINT "lexical_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "compilation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syntax_tree" ADD CONSTRAINT "syntax_tree_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "compilation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbol_table" ADD CONSTRAINT "symbol_table_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "compilation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semantic_info" ADD CONSTRAINT "semantic_info_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "compilation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intermediate_code" ADD CONSTRAINT "intermediate_code_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "compilation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compilation_errors" ADD CONSTRAINT "compilation_errors_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "compilation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
