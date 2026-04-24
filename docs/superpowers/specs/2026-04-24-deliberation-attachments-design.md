# Deliberation Attachments — Design

**Date**: 2026-04-24
**Status**: Approved

## Goal

Allow the author of a deliberation to attach annex documents (any file type, any
number) to a deliberation. Files are visible to all members who can see the
deliberation; only the author can add or remove files, and only during the
**draft** and **open** (discussion) phases.

## Scope

- Attachments are scoped to the **deliberation**, not to the proposal or
  individual proposal versions.
- Files can be added or removed only by the author, only in `draft` or `open`
  status. In `voting`, `outcome_pending`, `decided`, `cancelled` the attachment
  list is frozen (download only, no add/remove).
- All file types accepted, no app-level size limit (same as `Strategy::Resource`
  and `KnowledgeTopic`).

## Backend

### Model — `app/models/strategy/deliberation.rb`

- Add `has_many_attached :attachments`
- Add helper: `can_manage_attachments? → %w[draft open].include?(status)`
- Extend `as_json_full` to include `attachments: [{ id, filename, url, contentType, byteSize }]`
  (same shape used by `Strategy::Resource`).

### Routes — `config/routes.rb` (strategy block)

```
POST   /api/v1/strategy/deliberations/:id/attachments
DELETE /api/v1/strategy/deliberations/:id/attachments/:attachment_id
```

### Controller — `app/controllers/api/v1/strategy/deliberations_controller.rb`

Two new actions:

- `create_attachment` — requires `owner?` and `deliberation.can_manage_attachments?`;
  attaches `params[:file]`; returns the serialized attachment.
- `destroy_attachment` — requires `owner?` and `deliberation.can_manage_attachments?`;
  finds the `ActiveStorage::Attachment` by id on the deliberation and `purge`s it;
  returns 204.

Error cases return `403 Forbidden` (owner mismatch) or `422` (wrong phase / missing
file / attachment not found).

## Frontend

### `AttachmentsSection` inline block in `DeliberationDetail`

File: `app/frontend/strategy/components/DeliberationsSection.jsx`

Placement: inside the header card, **after** the Contexte block.

Visibility logic:
- Files exist → section always visible (all viewers can download).
- No files, `canManage === false` → section hidden.
- No files, `canManage === true` → section visible with an empty hint + "Ajouter" button.

`canManage = String(delib.createdById) === String(authMemberId) && ['draft','open'].includes(delib.status)`

UI:
- Each file: `Paperclip` icon + filename as a `<a>` download link; trash button
  at the right if `canManage`.
- "Ajouter un document" button triggers a hidden `<input type="file" multiple>`.
- Selected files are uploaded sequentially via `FormData` + `apiRequest`. During
  upload, show a pending row per file in flight.
- Delete is guarded by `window.confirm()` (project rule).
- After any add/remove, the parent calls `load({ preserveScroll: true })` to
  refresh.

## Tests

Extend `test/integration/strategy_test.rb`:

- Author uploads in `draft` → 201, attachment present in `as_json_full`
- Author uploads in `open` → 201
- Author uploads in `voting` → 422
- Non-author uploads in `draft` → 403
- Author deletes in `open` → 204, attachment removed
- Author deletes in `voting` → 422
- `as_json_full` includes attachments in the expected shape

## Skill sync

Update `~/.claude/skills/terranova-api/api-reference/` to document the two new
routes (project rule).
