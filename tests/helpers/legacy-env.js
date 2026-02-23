import { JSDOM } from 'jsdom';

const GLOBAL_KEYS = [
    'window',
    'document',
    'navigator',
    'localStorage',
    'sessionStorage',
    'CustomEvent',
    'Event',
    'HTMLElement',
    'Element',
    'Node',
    'MutationObserver',
    'crypto',
    'location'
];

export function createLegacyDom(options = {}) {
    const dom = new JSDOM(
        options.html || '<!doctype html><html><head></head><body></body></html>',
        {
            url: options.url || 'http://localhost/#daily-prayers',
            runScripts: 'dangerously',
            pretendToBeVisual: true
        }
    );

    const { window } = dom;
    window.__SALATK_TEST__ = true;

    if (!window.scrollTo) {
        window.scrollTo = () => { };
    }

    if (!window.focus) {
        window.focus = () => { };
    }

    if (!window.matchMedia) {
        window.matchMedia = () => ({
            matches: false,
            media: '',
            onchange: null,
            addListener: () => { },
            removeListener: () => { },
            addEventListener: () => { },
            removeEventListener: () => { },
            dispatchEvent: () => false
        });
    }

    if (!window.crypto || !window.crypto.randomUUID) {
        Object.defineProperty(window, 'crypto', {
            value: {
                randomUUID: () => '00000000-0000-4000-8000-000000000000'
            },
            configurable: true
        });
    }

    return {
        dom,
        window,
        document: window.document,
        close: () => dom.window.close()
    };
}

export function installWindowGlobals(window) {
    const previous = new Map();

    for (const key of GLOBAL_KEYS) {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
        previous.set(key, descriptor);

        Object.defineProperty(globalThis, key, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: window[key]
        });
    }

    return function restoreGlobals() {
        for (const key of GLOBAL_KEYS) {
            const oldDescriptor = previous.get(key);
            if (!oldDescriptor) {
                delete globalThis[key];
            } else {
                Object.defineProperty(globalThis, key, oldDescriptor);
            }
        }
    };
}
