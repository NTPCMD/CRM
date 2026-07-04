# AgencyOS Documentation

This directory holds the canonical product and engineering documentation for
AgencyOS.

## Product

| Document | Description |
| -------- | ----------- |
| [PRD — Volume 1: Product Requirements & System Architecture](product/prd-volume-1.md) | Vision, goals, personas, roles, modules, and success metrics. |

## Architecture

| Document | Description |
| -------- | ----------- |
| [System Architecture](architecture/system-architecture.md) | High-level platform architecture, layers, and module map. |
| [Data Model](architecture/data-model.md) | Core entities and their relationships. |
| [Permission Matrix](architecture/permission-matrix.md) | Configurable capability-based authorization model. |
| [Technology Stack](architecture/tech-stack.md) | Recommended stack and rationale. |

## Reference

| Document | Description |
| -------- | ----------- |
| [Glossary](glossary.md) | Definitions of domain terms used across the docs. |

## Conventions

- Documents are the source of truth for scope. Code should trace back to a
  requirement here.
- Requirement IDs use the form `FR-<module>-<n>` (functional) and
  `NFR-<n>` (non-functional).
- Changes to product scope should update the PRD in the same pull request as
  the implementing code where practical.
</content>
