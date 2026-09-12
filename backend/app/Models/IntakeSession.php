<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SessionStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Core entity representing an AI-powered client intake session.
 *
 * @property string $id UUID primary key.
 * @property SessionStatus $status Current lifecycle status (cast to enum).
 * @property string|null $client_name Name of the prospective client.
 * @property string|null $client_email Email of the prospective client.
 * @property string|null $project_summary Free-text summary of the project discussed.
 * @property array<string, mixed>|null $requirements_json Structured requirements extracted by AI (cast from JSONB).
 * @property \Illuminate\Support\Carbon $started_at Timestamp when the session began.
 * @property \Illuminate\Support\Carbon|null $completed_at Timestamp when the session was finalized.
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, SessionDocument> $documents
 */
class IntakeSession extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'status',
        'client_name',
        'client_email',
        'project_summary',
        'requirements_json',
        'started_at',
        'completed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string|class-string>
     */
    protected function casts(): array
    {
        return [
            'status' => SessionStatus::class,
            'requirements_json' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Get all documents uploaded during this intake session.
     *
     * @return HasMany<SessionDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(SessionDocument::class);
    }
}
