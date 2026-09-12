<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\IntakeSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Transforms an IntakeSession model into a clean JSON API payload.
 *
 * @mixin IntakeSession
 */
class IntakeSessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'client_name' => $this->client_name,
            'project_summary' => $this->project_summary,
            'requirements_json' => $this->requirements_json,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
        ];
    }
}
