import { vi } from 'vitest';

const TEST_GLOBAL_KEYS = [
  'window',
  'document',
  'location',
  'localStorage',
  'sessionStorage',
  'matchMedia',
  'bootstrap',
  'navigator',
];

let previousGlobals = null;

const setGlobalValue = (key, value) => {
  try {
    globalThis[key] = value;
    return;
  } catch (error) {
    // Fall back to defineProperty for globals that are read-only in some runtimes.
  }

  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const captureGlobals = () => {
  const snapshot = {};
  for (const key of TEST_GLOBAL_KEYS) {
    snapshot[key] = {
      hadOwnProperty: Object.prototype.hasOwnProperty.call(globalThis, key),
      value: globalThis[key],
    };
  }
  return snapshot;
};

const createBootstrapStub = () => ({
  Modal: function Modal() {
    this.show = () => {};
    this.hide = () => {};
  },
});

export const createStorageStub = () => ({
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
});

export const createMatchMediaStub = () => ({
  matches: false,
  media: '(pointer:coarse)',
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

export const createDocumentStub = (overrides = {}) => ({
  readyState: 'complete',
  visibilityState: 'visible',
  hasFocus: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  getElementById: () => null,
  querySelector: () => null,
  createElement: () => ({
    setAttribute: () => {},
    appendChild: () => {},
    style: {},
  }),
  body: {
    appendChild: () => {},
  },
  ...overrides,
});

export const setupTestEnvironment = (options = {}) => {
  if (previousGlobals) {
    teardownTestEnvironment();
  }

  previousGlobals = captureGlobals();

  const location = {
    host: 'localhost:3000',
    hostname: 'localhost',
    href: 'http://localhost:3000/#',
    search: '',
    hash: '#',
    origin: 'http://localhost:3000',
    pathname: '/',
    ...(options.location || {}),
  };
  const localStorage = options.localStorage || createStorageStub();
  const sessionStorage = options.sessionStorage || createStorageStub();
  const navigator = {
    userAgent: 'node-test',
    maxTouchPoints: 0,
    msMaxTouchPoints: 0,
    ...(options.navigator || {}),
  };
  const document = createDocumentStub(options.document);
  const matchMedia = options.matchMedia || createMatchMediaStub();
  const window = {
    location,
    localStorage,
    sessionStorage,
    document,
    navigator,
    matchMedia,
    addEventListener: () => {},
    removeEventListener: () => {},
    ...(options.window || {}),
  };
  const bootstrap = options.bootstrap || createBootstrapStub();

  setGlobalValue('location', location);
  setGlobalValue('localStorage', localStorage);
  setGlobalValue('sessionStorage', sessionStorage);
  setGlobalValue('navigator', navigator);
  setGlobalValue('matchMedia', matchMedia);
  setGlobalValue('document', document);
  setGlobalValue('window', window);
  setGlobalValue('bootstrap', bootstrap);

  return { location, localStorage, sessionStorage, navigator, matchMedia, document, window, bootstrap };
};

export const teardownTestEnvironment = () => {
  if (!previousGlobals) return;

  for (const key of TEST_GLOBAL_KEYS) {
    const snapshot = previousGlobals[key];
    if (snapshot.hadOwnProperty) {
      setGlobalValue(key, snapshot.value);
      continue;
    }

    try {
      delete globalThis[key];
    } catch (error) {
      // Ignore cleanup failures for non-configurable globals.
    }
  }

  previousGlobals = null;
};

export const installDocumentByIdMap = (elementsById = {}) => {
  const doc = globalThis.document || createDocumentStub();
  doc.getElementById = vi.fn((id) => {
    if (Object.prototype.hasOwnProperty.call(elementsById, id)) {
      return elementsById[id];
    }
    return null;
  });

  setGlobalValue('document', doc);
  if (globalThis.window) {
    globalThis.window.document = doc;
  }

  return doc;
};

export const createWrapperDiv = (dataset = {}) => ({
  dataset: { ...dataset },
});

export const createFirebaseAuthStub = (overrides = {}) => ({
  auth: {
    EmailAuthProvider: {
      PROVIDER_ID: 'mock-email-provider',
      EMAIL_LINK_SIGN_IN_METHOD: 'mock-email-link-sign-in',
    },
    PhoneAuthProvider: {
      PROVIDER_ID: 'mock-phone-provider',
    },
    ...(overrides.auth || {}),
  },
  ...overrides,
});
