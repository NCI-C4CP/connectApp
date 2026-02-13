/**
 * Unit tests for the escapeHTML function from js/shared.js
 * 
 * Run in browser console while the app is loaded:
 *   import('/tests/escapeHTML.spec.js').then(m => m.runTests());
 * 
 * Or import and call runTests() from any script context where the DOM is available.
 */
import { escapeHTML } from '../js/shared.js';

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(`FAIL: ${message}`);
    }
};

const assertEqual = (actual, expected, testName) => {
    if (actual !== expected) {
        throw new Error(`FAIL: ${testName}\n  Expected: "${expected}"\n  Actual:   "${actual}"`);
    }
};

const runTest = (testName, testFn) => {
    try {
        testFn();
        console.log(`✅ PASS: ${testName}`);
        return true;
    } catch (e) {
        console.error(`❌ ${e.message}`);
        return false;
    }
};

export const runTests = () => {
    console.log('=== escapeHTML Unit Tests ===\n');
    let passed = 0;
    let failed = 0;

    const test = (name, fn) => {
        if (runTest(name, fn)) {
            passed++;
        } else {
            failed++;
        }
    };

    // --- Basic HTML entity escaping ---

    test('escapes < character', () => {
        assertEqual(escapeHTML('<'), '&lt;', 'escapes <');
    });

    test('escapes > character', () => {
        assertEqual(escapeHTML('>'), '&gt;', 'escapes >');
    });

    test('escapes & character', () => {
        assertEqual(escapeHTML('&'), '&amp;', 'escapes &');
    });

    test('passes double quotes through (safe in text content)', () => {
        // DOM-based escapeHTML (textContent → innerHTML) does not escape quotes
        // because they are harmless in text content — only dangerous in attribute values.
        assertEqual(escapeHTML('"'), '"', 'double quote in text content');
    });

    test('passes single quotes through (safe in text content)', () => {
        assertEqual(escapeHTML("'"), "'", 'single quote in text content');
    });

    // --- Normal strings should pass through unchanged ---

    test('returns normal string unchanged', () => {
        assertEqual(escapeHTML('John Smith'), 'John Smith', 'normal string');
    });

    test('returns empty string unchanged', () => {
        assertEqual(escapeHTML(''), '', 'empty string');
    });

    test('returns string with only spaces unchanged', () => {
        assertEqual(escapeHTML('   '), '   ', 'spaces only');
    });

    test('returns string with numbers unchanged', () => {
        assertEqual(escapeHTML('12345'), '12345', 'numbers');
    });

    test('returns string with accented characters unchanged', () => {
        assertEqual(escapeHTML('José María'), 'José María', 'accented characters');
    });

    test('returns string with unicode characters unchanged', () => {
        assertEqual(escapeHTML('田中太郎'), '田中太郎', 'unicode characters');
    });

    // --- XSS prevention ---

    test('escapes script tags', () => {
        const result = escapeHTML('<script>alert("xss")</script>');
        assert(!result.includes('<script>'), 'should not contain raw <script> tag');
        assert(result.includes('&lt;script&gt;'), 'should contain escaped script tag');
    });

    test('escapes img onerror XSS', () => {
        const result = escapeHTML('<img src=x onerror=alert(1)>');
        assert(!result.includes('<img'), 'should not contain raw <img tag');
        assert(result.includes('&lt;img'), 'should contain escaped img tag');
    });

    test('renders event handler string as harmless text', () => {
        const result = escapeHTML('" onmouseover="alert(1)"');
        // When inserted as text content (not into an attribute), quotes are harmless.
        // The function is designed for text content insertion, not attribute values.
        assert(typeof result === 'string', 'should return a string');
        assert(result.includes('onmouseover'), 'plain text "onmouseover" is harmless in text content');
    });

    test('escapes iframe injection', () => {
        const result = escapeHTML('<iframe src="https://evil.com"></iframe>');
        assert(!result.includes('<iframe'), 'should not contain raw <iframe tag');
    });

    test('escapes SVG/onload XSS', () => {
        const result = escapeHTML('<svg onload=alert(1)>');
        assert(!result.includes('<svg'), 'should not contain raw <svg tag');
    });

    // --- Mixed content ---

    test('escapes mixed name with HTML', () => {
        const result = escapeHTML('John<script>alert("xss")</script>');
        assert(result.startsWith('John'), 'should start with John');
        assert(!result.includes('<script>'), 'should not contain raw script tag');
    });

    test('escapes ampersand in name', () => {
        const result = escapeHTML('Tom & Jerry');
        assertEqual(result, 'Tom &amp; Jerry', 'ampersand in name');
    });

    test('escapes angle brackets in name', () => {
        const result = escapeHTML('Name <Nickname> Last');
        assert(result.includes('&lt;Nickname&gt;'), 'should escape angle brackets');
    });

    // --- Edge cases ---

    test('handles multiple special characters together', () => {
        const result = escapeHTML('<>&');
        assert(result.includes('&lt;'), 'should contain &lt;');
        assert(result.includes('&gt;'), 'should contain &gt;');
        assert(result.includes('&amp;'), 'should contain &amp;');
    });

    test('handles nested HTML tags', () => {
        const result = escapeHTML('<div><span>text</span></div>');
        assert(!result.includes('<div>'), 'should not contain raw div');
        assert(!result.includes('<span>'), 'should not contain raw span');
    });

    test('handles string with newlines', () => {
        const result = escapeHTML('Line1\nLine2');
        assert(result.includes('Line1') && result.includes('Line2'), 'should preserve text content');
    });

    test('handles long strings', () => {
        const longStr = 'A'.repeat(10000);
        assertEqual(escapeHTML(longStr), longStr, 'long string');
    });

    test('return type is always a string', () => {
        assert(typeof escapeHTML('test') === 'string', 'should return a string');
        assert(typeof escapeHTML('') === 'string', 'empty string should return a string');
        assert(typeof escapeHTML('<>') === 'string', 'special chars should return a string');
    });

    // --- Summary ---
    console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${passed + failed} total ===`);
    return { passed, failed, total: passed + failed };
};
