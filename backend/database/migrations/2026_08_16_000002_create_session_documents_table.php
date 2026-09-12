<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the `session_documents` table — tracks files uploaded during an intake session.
     * Enforces referential integrity: deleting an intake session cascades and removes its documents.
     */
    public function up(): void
    {
        Schema::create('session_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('intake_session_id')
                  ->constrained('intake_sessions')
                  ->cascadeOnDelete();

            $table->string('file_name');

            // Stores the S3 object key (not a full URL).
            $table->string('file_path');

            $table->string('mime_type');

            $table->text('extracted_text')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_documents');
    }
};
