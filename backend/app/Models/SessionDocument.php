<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tracks a file uploaded during an intake session.
 *
 * @property string $id UUID primary key.
 * @property string $intake_session_id Foreign key to the parent IntakeSession.
 * @property string $file_name Original filename as uploaded by the client.
 * @property string $file_path S3 object key (not a full URL).
 * @property string $mime_type MIME type of the uploaded file.
 * @property string|null $extracted_text Text content extracted from the document (e.g., via OCR or parser).
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read IntakeSession $intakeSession
 */
class SessionDocument extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'intake_session_id',
        'file_name',
        'file_path',
        'mime_type',
        'extracted_text',
    ];

    /**
     * Get the intake session this document belongs to.
     *
     * @return BelongsTo<IntakeSession, $this>
     */
    public function intakeSession(): BelongsTo
    {
        return $this->belongsTo(IntakeSession::class);
    }
}
