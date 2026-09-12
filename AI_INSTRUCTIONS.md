# DEVPROXY AI - Project Architecture & Coding Standards

## 1. Core Principles

- **MVP Focus:** Do not over-engineer. Build only what is explicitly requested.
- **Divide & Conquer:** Break all large problems into granular, atomic steps. Execute one by one.
- **Single Source of Truth:** Never duplicate logic.
- **Design Patterns:** Strictly adhere to SOLID, DRY, SRP (Single Responsibility Principle), and SOC (Separation of Concerns).

## 2. Backend Standards (Laravel / PHP)

- Use strict typing (`declare(strict_types=1);`) and comprehensive PHPDoc comments for all classes, methods, and properties.
- **No Nested Ifs:** Use Early Returns / Guard Clauses exclusively.
- **Error Handling:** Do not wrap everything in generic `try/catch` blocks. Let exceptions bubble up to Laravel's global exception handler unless specific local recovery is required.
- Keep Controllers lean. Controllers handle HTTP concerns ONLY. Push core business logic to dedicated **Action** classes or **Domain Services**.
- Do not use fallbacks or default values arbitrarily. Ask for clarification if a requirement clashes.

## 3. Frontend Architecture & Standards (Next.js / React)

### 3.1. TypeScript & Documentation

- **Strict Type Safety:** Define explicit interfaces or types for all components, props, state, and utility functions. The use of the `any` type is strictly prohibited. Rely on strict compiler options to catch type mismatches at build time.
- **JSDoc Standards:** Write clear, concise JSDoc comments for all shared components and complex utility functions. Document the intended usage, parameter definitions, and return types to ensure robust IDE intellisense for the team.

### 3.2. Styling, Theming, & Tailwind

- **Global Design Tokens (CSS Variables):** Do not hardcode static color classes (e.g., `bg-blue-500`). Instead, define semantic CSS variables in the global stylesheet (e.g., `--color-primary`, `--color-background`) and map them within `tailwind.config.ts`. This ensures a single source of truth for the application's theme and allows instant, global updates or dark-mode toggling.
- **Dynamic Class Management:** When constructing conditional Tailwind classes, use utility libraries like `clsx` and `tailwind-merge` to resolve styling conflicts efficiently and cleanly.

### 3.3. Component Design & DOM Purity

- **DOM Purity:** Write clean, minimal JSX. Avoid "div soup" (excessive, meaningless nested `<div>` wrappers) as it bloats the DOM and complicates CSS layouts. Always default to React Fragments (`<>...</>`) to group sibling elements.
- **Separation of Concerns:** Enforce the Container/Presentational pattern. Abstract business logic, data fetching, and state management into custom React Hooks or container components, keeping Presentational components focused solely on rendering the UI.
- **Granular Architecture:** Build small, single-responsibility components. If a component grows beyond a few hundred lines or manages multiple distinct UI sections, refactor it into smaller sub-components.

### 3.4. Next.js Ecosystem & Performance

- **Server vs. Client Components:** Default to React Server Components (RSC) to minimize JavaScript bundle sizes and improve SEO. Only use the `'use client'` directive at the leaf nodes of your component tree where interactivity, hooks (`useState`, `useEffect`), or browser APIs are explicitly required.
- **Built-in Optimizations:** Always utilize Next.js native components to ensure peak Web Vitals. Use `next/image` for automatic image optimization/lazy loading, `next/font` for layout-shift prevention, and `next/link` for prefetched client-side routing.
- **Accessibility (a11y):** Prioritize semantic HTML (`<main>`, `<nav>`, `<aside>`, `<button>`). Ensure all interactive elements are keyboard accessible and have proper `aria-labels` when visual context is missing.

## 4. Execution Rules

- **Always verify context:** Before writing code, ensure you understand the exact module being worked on.
- **Ask before assuming:** If a directive is ambiguous or contradicts these rules, stop and ask the user for clarification.
- **Clean Code:** Prioritize readability over cleverness. Code must be easily readable by a human engineer.

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
```
