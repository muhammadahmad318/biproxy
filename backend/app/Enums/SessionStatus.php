<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Represents the lifecycle status of an intake session.
 *
 * Used as a backed string enum to enforce strict typing at the application layer.
 * The database column stores the raw string value; this enum provides type-safety.
 */
enum SessionStatus: string
{
    case ACTIVE = 'active';
    case PENDING_APPROVAL = 'pending_approval';
    case APPROVED = 'approved';
    case DISCARDED = 'discarded';
}
