/* ============================================================
   FASHION STORE — Security Shield & Anti-Console Protection
   ============================================================ */

/**
 * Initializes anti-console, anti-inspect, anti-devtools, and security protections.
 */
export function initSecurityShield() {
  if (typeof window === 'undefined') return;

  // 1. Console Silencing & Security Warning
  try {
    const noop = () => {};
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
      clear: console.clear,
    };

    // Override console methods to prevent leaking sensitive API data, tokens, or app state
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    console.warn = noop;
    console.error = noop;

    // Security Banner in case console is somehow accessed
    const printSecurityBanner = () => {
      try {
        originalConsole.clear?.();
        originalConsole.log?.(
          '%c🔒 FASHION STORE SECURITY SHIELD\n%cStop! This is a secure browser environment.\nInspecting, extracting code, or unauthorized console commands are strictly prohibited.',
          'color: #d4af37; font-size: 20px; font-weight: 800; text-shadow: 0 1px 2px rgba(0,0,0,0.4); padding: 6px;',
          'color: #ef4444; font-size: 13px; font-weight: 600; line-height: 1.5;'
        );
      } catch (_) {}
    };

    printSecurityBanner();
  } catch (_) {}

  // 2. Prevent Right-Click Context Menu (Inspect Element & View Page Source)
  // Exception: allow inside text fields (input, textarea) so users can paste phone numbers, addresses, etc.
  document.addEventListener(
    'contextmenu',
    (e) => {
      const target = e.target;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest?.('input, textarea, [contenteditable="true"]'));

      if (!isInput) {
        e.preventDefault();
        showSecurityAlert();
        return false;
      }
    },
    { capture: true }
  );

  // 3. Block Developer Tools & Source Inspection Keyboard Shortcuts
  document.addEventListener(
    'keydown',
    (e) => {
      const key = (e.key || '').toLowerCase();
      const code = e.keyCode || e.which;

      // F12 key (123)
      const isF12 = key === 'f12' || code === 123;

      // Ctrl+Shift+I / Cmd+Option+I (Inspect)
      const isInspect = (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'i' || code === 73);

      // Ctrl+Shift+J / Cmd+Option+J (Console)
      const isConsole = (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'j' || code === 74);

      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      const isInspectElement = (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'c' || code === 67);

      // Ctrl+U / Cmd+Option+U (View Page Source)
      const isViewSource = (e.ctrlKey || e.metaKey) && (key === 'u' || code === 85);

      // Ctrl+S / Cmd+S (Save Page Source)
      const isSavePage = (e.ctrlKey || e.metaKey) && !e.shiftKey && (key === 's' || code === 83);

      // Ctrl+Shift+K (Firefox Web Console)
      const isFirefoxConsole = (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'k' || code === 75);

      // Ctrl+Shift+E (Firefox Network Console)
      const isFirefoxNetwork = (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'e' || code === 69);

      if (isF12 || isInspect || isConsole || isInspectElement || isViewSource || isSavePage || isFirefoxConsole || isFirefoxNetwork) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityAlert();
        return false;
      }
    },
    { capture: true }
  );

  // 4. Anti-DevTools Detection & Console Clearing
  let devtoolsDetected = false;
  const checkDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;

    if (widthThreshold || heightThreshold) {
      if (!devtoolsDetected) {
        devtoolsDetected = true;
        try {
          console.clear?.();
        } catch (_) {}
      }
    } else {
      devtoolsDetected = false;
    }
  };

  window.addEventListener('resize', checkDevTools);
  setInterval(checkDevTools, 2000);

  // 5. Prevent Dragging Images to extract assets
  document.addEventListener(
    'dragstart',
    (e) => {
      if (e.target && e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    },
    { capture: true }
  );
}

// Rate-limited Security Toast Notification
let lastAlertTime = 0;
function showSecurityAlert() {
  const now = Date.now();
  if (now - lastAlertTime < 2500) return; // avoid toast spamming
  lastAlertTime = now;

  let isKm = true;
  try {
    isKm = localStorage.getItem('fs_lang') !== 'en';
  } catch (_) {}

  const message = isKm
    ? '🔒 សុវត្ថិភាពគេហទំព័រត្រូវបានការពារ (Security Protected)'
    : '🔒 Website Security Protected: Inspecting console is restricted';

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('fashionstore:toast', {
        detail: {
          message,
          type: 'error',
          duration: 2500,
        },
      })
    );
  }
}
