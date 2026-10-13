<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\IntakeSession;
use App\Models\SessionDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;

class UploadIntakeDocumentAction
{
    public function execute(IntakeSession $session, UploadedFile $file): SessionDocument
    {
        $path = $file->store("intake_documents/{$session->id}", 'local');

        // 1. Initialize parser and extract text
        $parser = new Parser();
        $pdf = $parser->parseFile(Storage::disk('local')->path($path));
        $extractedText = $pdf->getText();

        // 2. Save the document record (ensure your migration supports an 'extracted_text' column)
        return $session->documents()->create([
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'file_path' => $path,
            'extracted_text' => $extractedText,
        ]);
    }
}