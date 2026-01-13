# AI-First Agent Systems Standard (Global)

## Agent UX
- Users must understand: what the agent is doing, why, and what it needs.
- Provide cancel/undo where possible.
- Failure modes must be graceful: fall back to manual action or guided steps.

## Tools
- Least privilege always.
- Evidence trail after tool actions: what changed + how to verify.

## Observability
- Log agent actions and outcomes (audit table or structured logs).
- Include request IDs and timestamps.
