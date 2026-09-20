<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\IntakeSession;
use App\Models\SessionDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UploadIntakeDocumentAction
{
    public function execute(IntakeSession $session, UploadedFile $file): SessionDocument
    {
        $path = $file->store("intake_documents/{$session->id}", 'local');

        return $session->documents()->create([
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'file_path' => $path,
        ]);
    }
}
