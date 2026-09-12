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
     * Creates the `intake_sessions` table — the core entity of the AI engine.
     * The `status` column maps to the SessionStatus PHP Enum (defined in app/Enums/).
     * `requirements_json` uses the native PostgreSQL JSONB type for indexed querying.
     */
    public function up(): void
    {
        Schema::create('intake_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Maps to App\Enums\SessionStatus
            $table->string('status')->default('active');

            $table->string('client_name')->nullable();
            $table->string('client_email')->nullable();

            $table->text('project_summary')->nullable();

            // Native JSONB — PostgreSQL only. Enables indexed querying on requirements data.
            $table->jsonb('requirements_json')->nullable();

            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intake_sessions');
    }
};
