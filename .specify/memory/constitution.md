<!--
Sync Impact Report
Version change: Unspecified → 1.0.0
Modified principles:
- [defined] Frontend-Only, API-Ready Data Architecture
- [defined] React + TypeScript with Minimal Dependencies
- [defined] Test-First: Unit Tests for UI and Utilities
- [defined] Code Quality Gates & Commit Hooks
- [defined] Mobile-First, Responsive, Accessible UI
Added sections:
- Architecture & Technology Constraints
- Development Workflow & Quality Gates
Removed sections:
- None
Templates requiring updates:
- .specify/templates/plan-template.md: ✅ updated (Constitution Check gates)
- .specify/templates/spec-template.md: ✅ validated (no changes)
- .specify/templates/tasks-template.md: ⚠ pending (file not found)
- .specify/templates/commands/*: ⚠ pending (directory not found)
Follow-up TODOs:
- None
-->

# Metro Guide Constitution

## Core Principles

### Frontend-Only, API-Ready Data Architecture
- The application is 100% client-side. No server code is allowed in this repo.
- All data and logic reside in the frontend. Initial data uses local fixtures or
  generated mocks.
- Data access MUST go through a repository + data-source adapter boundary
  (e.g., `services/` repositories delegating to `data/` sources).
- Define stable TypeScript contracts for repositories and entities in `types/`.
- A single swappable `DataSource` interface enables painless future migration to
  a remote API without touching UI components.
- Side-effects (fetch, storage, timers) are isolated in `services/` and never
  in UI components.

### React + TypeScript with Minimal Dependencies
- React (TypeScript) is the UI framework. Avoid heavy UI libraries/components.
- Components MUST be named in PascalCase and placed under `src/components/`.
- Prefer function components and hooks; keep components pure and small.
- State management: use local state and React Context sparingly. No Redux/MobX
  unless justified by complexity and approved via review.
- Routing (if needed) uses a minimal router. Avoid global side effects.

### Test-First: Unit Tests for UI and Utilities
- Every UI component and major util MUST have unit tests.
- Use a lightweight stack (e.g., Vitest or Jest) with React Testing Library.
- Tests MUST assert behavior and accessibility, not implementation details.
- Coverage targets: 90% lines/branches for components and utilities.
- New or modified code MUST include/update tests in the same PR.

### Code Quality Gates & Commit Hooks
- ESLint and Prettier are mandatory. TypeScript strict mode MUST be enabled.
- Pre-commit hooks (e.g., Husky + lint-staged) run:
  - `eslint --fix` on staged files
  - `prettier --write --check` on staged files
  - Type check and unit tests for changed scopes (or fast subset)
- Commits are rejected if any lint/format/type/test step fails.
- CI MUST run lint, type-check, and tests; PRs cannot merge unless all pass.

### Mobile-First, Responsive, Accessible UI
- Design is mobile-first and responsive; it MUST also work well on desktop.
- Prefer semantic HTML, WCAG AA contrast, keyboard navigation, focus states.
- Use CSS variables, Flexbox/Grid; avoid heavyweight CSS frameworks.
- Establish design tokens (spacing, color, typography) for consistency.
- UI should be aesthetically pleasing, fast, and accessible by default.

## Architecture & Technology Constraints

- Language: TypeScript; Framework: React.
- Directory conventions:
  - `src/components/` for presentational components
  - `src/pages/` or `src/routes/` for route-level views (if routing exists)
  - `src/services/` for repositories, data sources, and side effects
  - `src/utils/` for pure utilities
  - `src/types/` for shared TypeScript contracts
  - `src/styles/` for tokens and global styles
  - `tests/` mirroring `src/` for unit tests
- Data boundary:
  - Define `DataSource` interfaces (e.g., `LocalDataSource`, future `ApiDataSource`)
  - Repositories depend only on interfaces, not concrete implementations
- Error handling:
  - Repositories return discriminated unions or throw domain-specific errors
  - UI surfaces user-friendly messages; no raw error leakage
- Performance:
  - Avoid unnecessary renders; memoize thoughtfully; lazy-load heavy routes
  - Images and assets optimized; no blocking synchronous work in render paths

## Development Workflow & Quality Gates

- Branching: feature branches from `main`; small, focused PRs.
- Reviews: at least one reviewer approval; verify principle compliance.
- Commit messages: conventional format is encouraged for clarity.
- Required checks before merge:
  - ESLint (no errors), Prettier (formatted), TypeScript (no errors), Tests pass
  - Coverage thresholds enforced for components and utilities (90%)
- Documentation:
  - Public exports and complex components/utilities include concise JSDoc
  - Architectural decisions recorded in PR descriptions when relevant

## Governance

- The Constitution supersedes other team practices within this repo.
- Amendments:
  - Proposed via PR referencing rationale and impact on existing code.
  - Version bumped per semantic rules below; `LAST_AMENDED_DATE` updated.
  - If governance changes are backward incompatible, include migration notes.
- Versioning policy for this document:
  - MAJOR: Remove/redefine principles or change mandatory gates.
  - MINOR: Add new principles/sections or materially expand guidance.
  - PATCH: Clarifications and non-semantic refinements.
- Compliance:
  - All PR reviews MUST check adherence to principles and gates.
  - Exceptions require explicit justification and issue tracking.

**Version**: 1.0.0 | **Ratified**: 2025-11-13 | **Last Amended**: 2025-11-13
