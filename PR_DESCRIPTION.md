# Implement Keyboard Navigation for Wallet Dropdown

## Summary

This PR implements full keyboard navigation accessibility support for the `WalletDropdown` component, locking in the contract with comprehensive unit tests.

Closes #

## Type of Change

- [ ] `feat` — new feature
- [x] `fix` — bug fix / accessibility improvement
- [x] `test` — adding or updating tests
- [ ] `docs` — documentation only

## Scope

- [x] Frontend / Web (`components/WalletDropdown.tsx`, `components/WalletDropdown.test.tsx`)
- [ ] CI / Ops

---

## What Changed and Why

### Keyboard Navigation Features in `components/WalletDropdown.tsx`
- **ArrowDown / ArrowUp**: Cycle focus through the dropdown items (Copy Address button, Account, Settings, Disconnect) with complete wrap-around support.
- **PageDown**: Jump focus directly to the last interactive element in the dropdown (Disconnect button or Connect Wallet button).
- **PageUp**: Jump focus directly to the first interactive element in the dropdown (Copy Address button or Connect Wallet button).
- **Enter**: Activate the currently focused element programmatically by triggering its `click()` event.
- Fully preserved standard `Escape` and `Tab` focus ring behaviors.

### Unit Testing in `components/WalletDropdown.test.tsx`
Added 8 comprehensive unit tests to cover:
- Connected and disconnected initial focus targeting.
- Arrow keys focus cycle and wrap-around boundaries.
- Page Up/Down direct focus jumps.
- Enter key click activation.
- Tab key cycle behavior.
- Escape key dropdown close callback.
- Sad path handling when no focusable elements are found.

---

## Verification

### Automated Tests
- Ran the new component tests:
  ```bash
  npx vitest run components/WalletDropdown.test.tsx
  ```
  Result: **Passed (8/8 tests)**

- Ran the complete test suite:
  ```bash
  npm test
  ```
  Result: **Passed (38/38 tests)**

### Linter & Type Check
- Ran eslint check specifically on changed files:
  ```bash
  npx eslint components/WalletDropdown.tsx components/WalletDropdown.test.tsx
  ```
  Result: **Clean (0 errors, 0 warnings)**
