# AgencyOS — Volume 3: Frontend Architecture & User Experience Specification

**Version:** 1.0

This volume is the **authoritative specification for the frontend and UX**. It
ratifies the application stack that [Volume 2's tech-stack](tech-stack.md) left
as "recommended," defines the design system, and maps every
[data entity](database-architecture.md) to a screen across the three portals.

> Each portal is a **role-gated experience within one application**, not a
> separate app — the global layout, design system, and shared components are
> common; the sidebar and permitted screens are determined by the user's role
> and effective [permissions](permission-matrix.md).

---

## 1. Frontend Philosophy

> **Every user should only see what they need, exactly when they need it.**

The interface should feel like **Linear, Notion, or Stripe** rather than a
traditional enterprise application. Speed, clarity, and consistency are
prioritized over visual complexity.

## 2. Technology Stack (Ratified)

| Concern    | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | **Next.js 15 (App Router)**, **React 19**, **TypeScript** |
| Styling    | **Tailwind CSS**, **shadcn/ui**, CSS variables for theming |
| Animation  | **Framer Motion**                                  |
| UI state   | **Zustand**                                        |
| Server state | **TanStack Query**                               |
| Forms      | **React Hook Form** + **Zod** validation           |

Server state (from Supabase) is owned by TanStack Query; ephemeral UI state
(panels, drafts, layout) by Zustand. The two are never conflated.

## 3. Design System

### 3.1 Color Palette

Dark-first, exposed as CSS variables so themes can be swapped.

| Token            | Value     | Use                        |
| ---------------- | --------- | -------------------------- |
| Primary          | `#2563EB` | Primary actions, links.    |
| Success          | `#22C55E` | Positive states.           |
| Warning          | `#F59E0B` | Caution states.            |
| Danger           | `#EF4444` | Destructive / error.       |
| Background        | `#0B1220` | App background.            |
| Surface          | `#111827` | Panels, sidebar.           |
| Card             | `#1F2937` | Cards, raised surfaces.    |
| Border           | `#374151` | Dividers, outlines.        |
| Text Primary     | `#F9FAFB` | Primary text.              |
| Text Secondary   | `#9CA3AF` | Muted / secondary text.    |

### 3.2 Typography

- **Font:** Inter.
- Display 36–48px · H1 32px · H2 24px · H3 20px · Body 16px · Caption 14px.

### 3.3 Spacing

- 8px grid. All spacing is a multiple of 8 (with 4px permitted for dense inline
  cases).

## 4. Navigation Architecture & Global Layout

```
────────────────────────────────────────
 Top Navigation  (search · notifications · workspace · profile)
────────────────────────────────────────
 Sidebar         │  Content Area
 (role-gated)    │
────────────────────────────────────────
```

The **sidebar is role-gated** — its items are filtered by the user's role and
permissions (see per-portal sections). Responsive behavior:

| Breakpoint | Sidebar / Navigation           |
| ---------- | ------------------------------ |
| Desktop    | Permanent sidebar.             |
| Tablet     | Collapsible sidebar.           |
| Mobile     | Bottom navigation.             |

## 5. Login Experience

```
Landing page → Login → Authentication → Workspace Selection → Dashboard
```

Login options: **Email, Google, Microsoft, Magic Link, SSO (Enterprise).** These
map to Supabase Auth providers. After auth, a user selects a **workspace** (a
user may belong to more than one) before landing on the role-appropriate
dashboard.

## 6. CEO Portal

Full experience. Sidebar:

```
Dashboard · CRM · Projects · Tasks · Calendar · Messages · Files ·
Contracts · Invoices · Analytics · Team · Permissions · Integrations ·
Automation · Settings
```

### 6.1 Dashboard

Draggable widgets: Revenue, Profit, Projects, Tasks Due, Clients, Workers
Online, Unread Messages, Outstanding Invoices, Upcoming Meetings, AI Insights,
Recent Activity.

### 6.2 CRM

Pipeline board: `Lead → Qualified → Proposal → Negotiation → Won → Client`.
Every card opens a **Client Profile** with tabs: Overview, Projects, Invoices,
Contracts, Messages, Meeting Notes, Activity, Files, Timeline, Custom Fields.

### 6.3 Project Dashboard

Per-project tabs: Overview, Tasks, Timeline, Calendar, Files, Discussion,
Invoices, Contracts, Approvals, Meeting Notes, Activity Log, Settings.

**Project Overview** displays: Progress, Budget, Hours, Team, Upcoming
Milestones, AI Summary, Health Score.

### 6.4 Tasks

Views: **Kanban, List, Calendar, Timeline, Gantt (future).** Each task:
Title, Description, Status, Priority, Due Date, Assignee, Followers, Comments,
Attachments, Time Entries, Subtasks, Dependencies.

### 6.5 Analytics

Revenue, Worker Productivity, Profit Margin, Client Value, Project Completion,
Time Tracking, Forecasts, AI Predictions.

### 6.6 Team

Directory columns: Avatar, Name, Role, Online, Projects, Hours, Performance,
Permissions.

### 6.7 Permission Editor

Live-editable matrix mapping the [permission model](database-architecture.md#10-roles--permission-model)
to toggles, e.g. Project View ☑ · Project Edit ☑ · Delete Project ☐ · View
Invoices ☑ · Delete Invoices ☐ · Create Contracts ☑. Changes apply immediately
and are audited.

## 7. Worker Portal

Simplified experience. **No billing, no analytics, no admin.** Sidebar:

```
Dashboard · Projects · Tasks · Messages · Calendar · Files · Profile
```

- **Dashboard:** Today's Tasks, Assigned Projects, Calendar, Unread Messages,
  Recent Files, Notifications.
- **Project page (worker view):** Tasks, Files, Messages, Meeting Notes,
  Comments, Timeline.
- **Task actions:** Change Status, Upload Files, Comment, Track Time, Complete
  Task. **Cannot archive a project.**

Visibility is bounded by role and project assignment; workers never see
unrelated projects or restricted financials.

## 8. Client Portal

Clean and minimal. Sidebar:

```
Home · Projects · Invoices · Contracts · Messages · Meetings · Calendar · Profile
```

- **Dashboard:** Current Projects, Upcoming Meetings, Outstanding Invoices,
  Unread Messages, Recent Files.
- **Projects:** Progress, Milestones, Files, Timeline, Approvals, Meeting Notes.
- **Invoices:** List with Status, Amount, Due Date, Download PDF, **Pay Online**.
- **Contracts:** View, Download, **Sign**, History.
- **Messages:** Dedicated project chats only — **no internal conversations.**
- **Meeting Notes:** Agenda, Notes, AI Summary, Action Items, Recording Link.
- **Calendar:** Meetings, Deadlines, Reviews.

Clients only ever see data explicitly shared with them, enforced by RLS.

## 9. Universal Search

Top search bar and **⌘K / Ctrl+K** command palette, searching: Projects,
Clients, Tasks, Invoices, Contracts, Files, Messages, Meeting Notes, Workers.
Results are permission-filtered per user.

## 10. Notifications

Realtime Notification Center. Types: Project, Task, Invoice, Meeting, AI,
Message, Approval. Backed by the `notifications` table and Supabase Realtime.

## 11. Shared Components

One UI library used by every module:

```
Buttons · Cards · Tables · Data Grid · Modal · Drawer · Command Palette ·
Avatar · Badge · Tooltip · Toast · Timeline · Tabs · Breadcrumbs ·
Pagination · Date Picker · Rich Text Editor
```

Built on shadcn/ui + Tailwind so every module looks and behaves consistently.

## 12. Forms

Every form supports: **Autosave, Validation (Zod), Undo, Draft Mode, Keyboard
Navigation.** Implemented with React Hook Form + Zod schemas shared with the
data layer where possible.

## 13. Responsive Design

| Breakpoint | Behavior                                             |
| ---------- | ---------------------------------------------------- |
| Desktop    | Full experience, permanent sidebar.                  |
| Tablet     | Sidebar collapses.                                   |
| Mobile     | Bottom navigation; cards replace tables; large touch targets. |

## 14. Accessibility

**WCAG AA compliant.** Requirements: keyboard navigation, screen-reader support,
high-contrast mode, visible focus indicators, reduced-motion option (honored by
Framer Motion animations).

## 15. AI Integration

Every major page includes an **AI assistant panel** that is contextual to the
current screen. Examples:

- **CEO:** "Which projects are at risk this week?"
- **Worker:** "Summarize all feedback on my assigned tasks."
- **Client:** "What happened since our last meeting?"

The assistant **only accesses data the current user is permitted to view** —
the same RLS and permission checks that gate the UI gate the assistant.

## 16. Component Hierarchy

```
App
├── Auth
├── Dashboard
├── CRM
├── Projects
│   ├── Overview
│   ├── Tasks
│   ├── Files
│   ├── Calendar
│   ├── Discussion
│   ├── Timeline
│   ├── Invoices
│   └── Contracts
├── Calendar
├── Messaging
├── Notifications
├── AI
└── Settings
```

## 17. Design Principles

1. One-click access to common actions.
2. No dead ends — every page links naturally to related data.
3. Contextual AI that understands the current screen.
4. Realtime by default — no manual refreshes.
5. Consistent interactions across all modules.
6. Fast keyboard navigation for power users.
7. Progressive disclosure — advanced controls only when needed.

## 18. Reconciliation with Prior Volumes

| Prior volume | Volume 3 ratifies / refines |
| ------------ | --------------------------- |
| Vol. 1: "React, three portal shells" | **Next.js 15 / React 19 / TS**, portals as **one role-gated app** |
| Vol. 2: Supabase Realtime | Notification Center + live widgets consume it |
| Vol. 2: permission tables | Live **Permission Editor** UI + role-gated sidebar |
| Vol. 2: `ai_*` tables | Contextual **AI assistant panel** on every major page |
| Vol. 1: pluggable auth | Login providers map to **Supabase Auth** (Email/Google/Microsoft/Magic Link/SSO) |

The single-app-with-role-gating decision supersedes Volume 2's proposed
`/apps/web-ceo|web-worker|web-client` split; see the updated repo shape in
[tech-stack.md §5](tech-stack.md#5-repository-shape-proposed).

## 19. Looking Ahead to Volume 4

Volume 4 turns these screens into a working platform: backend architecture,
REST/GraphQL API contracts, Supabase Edge Functions, webhooks, Stripe
integration, Google Calendar sync, AI Gateway, realtime messaging,
notifications, automation engine, external integrations, and event-driven
architecture.
</content>
