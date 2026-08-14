# DEVPROXY AI - Project Architecture & Coding Standards

## 1. Core Principles
* **MVP Focus:** Do not over-engineer. Build only what is explicitly requested.
* **Divide & Conquer:** Break all large problems into granular, atomic steps. Execute one by one.
* **Single Source of Truth:** Never duplicate logic. 
* **Design Patterns:** Strictly adhere to SOLID, DRY, SRP (Single Responsibility Principle), and SOC (Separation of Concerns).

## 2. Backend Standards (Laravel / PHP)
* Use strict typing (`declare(strict_types=1);`) and comprehensive PHPDoc comments for all classes, methods, and properties.
* **No Nested Ifs:** Use Early Returns / Guard Clauses exclusively.
* **Error Handling:** Do not wrap everything in generic `try/catch` blocks. Let exceptions bubble up to Laravel's global exception handler unless specific local recovery is required.
* Keep Controllers lean. Controllers handle HTTP concerns ONLY. Push core business logic to dedicated **Action** classes or **Domain Services**.
* Do not use fallbacks or default values arbitrarily. Ask for clarification if a requirement clashes.

## 3. Frontend Standards (Next.js / React)
* Use strict TypeScript interfaces and JSDoc comments for all components and utility functions. Never use `any`.
* **DOM Purity:** Write minimal JSX. Absolutely no unnecessary or deeply nested `<div>` wrappers. Use React Fragments `<>` where appropriate.
* **Component Architecture:** Keep components granular and focused on a single UI responsibility (Container / Presentational pattern).
* Separate state management/hooks from presentational UI components.

## 4. Execution Rules
* **Always verify context:** Before writing code, ensure you understand the exact module being worked on.
* **Ask before assuming:** If a directive is ambiguous or contradicts these rules, stop and ask the user for clarification.
* **Clean Code:** Prioritize readability over cleverness. Code must be easily readable by a human engineer.

---

## 5. Folder & Project Structure

The repository follows a clean, decoupled monorepo layout. Every file must be placed strictly according to its responsibility.

```text
BIPROXY/
├── AI_INSTRUCTIONS.md
│
├── backend/                  # Laravel Core Backend API
│   ├── app/
│   │   ├── Actions/          # Single-responsibility business logic classes (e.g., FinalizeIntakeSessionAction.php)
│   │   ├── Enums/            # Typed PHP Enums (e.g., SessionStatus.php)
│   │   ├── Http/
│   │   │   ├── Controllers/  # Lean API Controllers (Grouped by scope: Public, Internal, Admin)
│   │   │   │   ├── Admin/
│   │   │   │   ├── Internal/
│   │   │   │   └── Public/
│   │   │   ├── Requests/     # Strict Form Request Validation classes
│   │   │   └── Resources/    # API Data Transformation Resources (DTOs)
│   │   ├── Models/           # Eloquent Models (Strict typing, mass assignment protection)
│   │   └── Services/         # Integrations & Infrastructure (e.g., DocumentParserService.php, S3StorageService.php)
│   ├── config/
│   ├── database/
│   │   ├── factories/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
│       ├── api.php           # REST Endpoints
│       └── web.php
│
├── frontend/                 # Next.js (App Router) Client & Admin Dashboard
│   ├── app/                  # App Router Pages & Layouts
│   │   ├── (admin)/          # Protected Admin Dashboard routes
│   │   │   └── dashboard/
│   │   ├── intake/           # Public Client Meeting routes
│   │   │   └── [id]/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/           # UI Components (Granular & Pure)
│   │   ├── admin/            # Dashboard specific UI components
│   │   ├── meeting/          # Live Room UI components (Orb, Chat, Upload dropzone)
│   │   └── ui/               # Generic primitive UI elements (Buttons, Inputs, Modals)
│   ├── hooks/                # Custom React Hooks (Stateful & WebSockets logic)
│   ├── lib/                  # Utility functions, API clients, and constants
│   ├── services/             # HTTP Client / Fetchers for Backend endpoints
│   └── types/                # Pure TypeScript Interfaces & Types
│
└── realtime/                 # (Sprint 3) Node.js WebRTC / Gemini Live Relay Server
    ├── src/
    │   ├── handlers/
    │   ├── services/
    │   └── index.ts
    └── package.json