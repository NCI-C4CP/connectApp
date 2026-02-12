import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerSharedRuntimeModuleMocks } from './moduleMocks.js';

registerSharedRuntimeModuleMocks();

let escapeHTML;

// Fake encoder
const encodeHtmlText = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');
  
// Fake DOM for testing
const installEscapeDomStub = () => {
  const doc = globalThis.document || {};

  doc.createTextNode = vi.fn((value) => ({
    textContent: String(value),
  }));

  doc.createElement = vi.fn(() => {
    let content = '';
    return {
      appendChild: (node) => {
        content += node?.textContent ?? '';
      },
      get innerHTML() {
        return encodeHtmlText(content);
      },
    };
  });

  globalThis.document = doc;
  if (globalThis.window) {
    globalThis.window.document = doc;
  }
};

beforeAll(async () => {
  vi.resetModules();
  vi.doUnmock('../js/shared.js');
  const shared = await import('../js/shared.js');
  escapeHTML = shared.escapeHTML;
});

describe('escapeHTML', () => {
  beforeEach(() => {
    installEscapeDomStub();
  });

  it('escapes HTML-sensitive characters', () => {
    expect(escapeHTML('<')).toBe('&lt;');
    expect(escapeHTML('>')).toBe('&gt;');
    expect(escapeHTML('&')).toBe('&amp;');
    expect(escapeHTML('<>&')).toBe('&lt;&gt;&amp;');
  });

  it('preserves quotes for text-content usage', () => {
    expect(escapeHTML('"')).toBe('"');
    expect(escapeHTML("'")).toBe("'");
  });

  it('keeps normal strings unchanged', () => {
    expect(escapeHTML('John Smith')).toBe('John Smith');
    expect(escapeHTML('')).toBe('');
    expect(escapeHTML('   ')).toBe('   ');
    expect(escapeHTML('12345')).toBe('12345');
    expect(escapeHTML('Jose Maria')).toBe('Jose Maria');
  });

  it('escapes script-like payloads', () => {
    const scriptPayload = escapeHTML('<script>alert("xss")</script>');
    expect(scriptPayload).toContain('&lt;script&gt;');
    expect(scriptPayload).not.toContain('<script>');

    const imgPayload = escapeHTML('<img src=x onerror=alert(1)>');
    expect(imgPayload).toContain('&lt;img');
    expect(imgPayload).not.toContain('<img');

    const iframePayload = escapeHTML('<iframe src="https://evil.com"></iframe>');
    expect(iframePayload).toContain('&lt;iframe');
    expect(iframePayload).not.toContain('<iframe');
  });

  it('escapes mixed content while preserving text', () => {
    const mixed = escapeHTML('John<script>alert("xss")</script>');
    expect(mixed.startsWith('John')).toBe(true);
    expect(mixed).toContain('&lt;script&gt;');
    expect(mixed).not.toContain('<script>');

    expect(escapeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
    expect(escapeHTML('Name <Nickname> Last')).toContain('&lt;Nickname&gt;');
  });

  it('returns strings for all tested inputs', () => {
    expect(typeof escapeHTML('test')).toBe('string');
    expect(typeof escapeHTML('')).toBe('string');
    expect(typeof escapeHTML('<>')).toBe('string');
  });
});
