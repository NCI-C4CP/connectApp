# Testing

This repository uses Vitest for automated tests.

## Run tests

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Test structure

- `tests/auth.spec.js`: auth callback behavior tests for `js/pages/signIn.js`.
- `tests/authStateRouting.spec.js`: auth-state routing helpers and legacy-interstitial policy tests used by `app.js`.
- `tests/sharedAuth.spec.js`: shared auth behavior for `js/shared.js` (magic link, telemetry, FirebaseUI wiring).
- `tests/homePageAuth.spec.js`: sign-up FirebaseUI integration tests for `js/pages/homePage.js`.
- `tests/usps.spec.js`: USPS/address validation behavior tests for `js/shared.js`.
- `tests/settingsHelpers.spec.js`: utility and validation tests for `js/settingsHelpers.js`.
- `tests/settingsAuthWorkflow.spec.js`: settings auth workflow helpers (error mapping/log context/unlink guard).
- `tests/helpers.js`: shared environment setup/teardown and reusable test utilities.
- `tests/moduleMocks.js`: reusable `vi.mock(...)` registrations and mock handles.
- `tests/testSetup.js`: global Vitest hooks (`setupFiles`) for environment/mocks cleanup.

## Notes

- Tests run in a Node environment by default.
- Browser globals are set up globally via `tests/testSetup.js` + `tests/helpers.js`.
- We intentionally avoid a default JSDOM dependency to reduce CI fragility.
- Fixture-based manual test payloads have been replaced with automated in-suite case tables.
- Some tests intentionally exercise failure paths; expected `console.error` output may appear while tests still pass.

## Global setup

```js
// vitest.config.js
setupFiles: ['tests/testSetup.js']
```

Module mocks pattern:

```js
import { registerSettingsHelpersModuleMocks } from './moduleMocks.js';

registerSettingsHelpersModuleMocks();
```
