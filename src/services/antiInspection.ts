/**
 * NISC Student Election System - Frontend Anti-Inspection & Tamper Protection Deterrent
 *
 * Objectives:
 * 1. Discourage casual users from opening browser developer tools.
 * 2. Block common browser shortcuts used to open DevTools (F12, Ctrl+Shift+I/J/C, Meta+Alt+I/J/C, Ctrl/Meta+U).
 * 3. Block browser context menu / right-click.
 * 4. Detect likely DevTools presence & meaningful DOM tampering using conservative heuristics.
 * 5. If confirmed tampering is detected, set frontendCompromised = true.
 * 6. The next time the user interacts, prevent the unauthorized action and reload the application.
 * 7. Restore the original deployed application upon reload.
 *
 * IMPORTANT & ARCHITECTURAL INVARIANTS:
 * - This is a client-side deterrent and recovery mechanism only.
 * - Real security is strictly enforced by Firebase Auth, Firestore Security Rules, and backend endpoints.
 * - Normal legitimate clicks (Admin, Candidates, Results, Vote, Sign In, Sign Out, etc.) must NEVER reload on false positives.
 * - Heuristics are conservative, multi-stage, and dev-safe; normal React re-renders or browser resizes never trip reloads.
 * - This mechanism NEVER resets, deletes, or modifies real election data, voter allowlists, or vote records.
 */

// Module State
let isInitialized = false;
let frontendCompromised = false;
let compromiseReason: string | null = null;
let lastResizeTime = 0;
let dimensionAnomalyCount = 0;
let consoleProbeAnomalyCount = 0;
let checkIntervalTimer: ReturnType<typeof setInterval> | null = null;
let mutationObserverInstance: MutationObserver | null = null;

// Unique DOM token identifying pristine frontend layout
const INTEGRITY_TOKEN_ID = 'nisc-integrity-token';
const INTEGRITY_TOKEN_VALUE = 'nisc-elections-2026-voter-core';

/**
 * Checks whether the application is running in an explicit development or local environment.
 * Strictly checks build flags and localhost hostnames. No hidden localStorage/sessionStorage bypass.
 */
export function isDevelopmentEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  // Vite development mode flag
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    return true;
  }
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  );
}

/**
 * Ensures the pristine DOM integrity token exists in document.body.
 */
function ensureIntegrityToken(): HTMLElement | null {
  if (typeof document === 'undefined' || !document.body) return null;
  let tokenEl = document.getElementById(INTEGRITY_TOKEN_ID);
  if (!tokenEl) {
    tokenEl = document.createElement('div');
    tokenEl.id = INTEGRITY_TOKEN_ID;
    tokenEl.setAttribute('data-integrity', INTEGRITY_TOKEN_VALUE);
    tokenEl.setAttribute('aria-hidden', 'true');
    tokenEl.hidden = true;
    tokenEl.style.display = 'none';
    document.body.appendChild(tokenEl);
  }
  return tokenEl;
}

/**
 * Checks if the primary React DOM root and integrity token are structurally intact.
 */
export function checkDomIntegrity(): boolean {
  if (typeof document === 'undefined') return true;
  const rootEl = document.getElementById('root');
  if (!rootEl || !document.body.contains(rootEl)) {
    return false;
  }
  let tokenEl = document.getElementById(INTEGRITY_TOKEN_ID);
  if (!tokenEl) {
    tokenEl = ensureIntegrityToken();
  }
  if (!tokenEl || tokenEl.getAttribute('data-integrity') !== INTEGRITY_TOKEN_VALUE) {
    return false;
  }
  return true;
}

/**
 * Identifies whether a compromise reason stems from a soft environment heuristic
 * (which can produce false positives due to window geometry, DPI zoom, iframe embeddings, or console wrappers)
 * rather than verified structural DOM tampering or malicious script injection.
 */
export function isSoftHeuristic(reason: string | null): boolean {
  return reason === 'devtools-docked' || reason === 'devtools-console' || reason === 'generic-tamper';
}

/**
 * Checks whether the frontend has been flagged as tampered or compromised.
 * Includes automatic self-healing for soft heuristic false positives when DOM integrity is healthy.
 */
export function isFrontendCompromised(): boolean {
  if (!frontendCompromised) return false;

  // Self-heal if the flag was caused by a soft heuristic but DOM integrity is fully intact
  if (isSoftHeuristic(compromiseReason)) {
    if (checkDomIntegrity()) {
      resetCompromisedState();
      return false;
    }
  }

  return frontendCompromised;
}

/**
 * Marks the frontend as tampered/compromised.
 * Does NOT reload immediately. Sets the flag so confirmed compromises trigger recovery.
 */
export function markFrontendCompromised(reason: string = 'generic-tamper'): void {
  // In development environments, soft heuristics are never permitted to compromise the app
  if (isDevelopmentEnvironment() && isSoftHeuristic(reason)) {
    return;
  }

  if (frontendCompromised) return;

  frontendCompromised = true;
  compromiseReason = reason;

  // Log non-sensitive telemetry internally if auditing is enabled
  if (typeof window !== 'undefined' && (window as any).__NISC_SECURITY_AUDIT__) {
    (window as any).__NISC_SECURITY_AUDIT__.compromised = true;
    (window as any).__NISC_SECURITY_AUDIT__.reason = reason;
  }
}

/**
 * Triggers full application reload to restore original deployed frontend.
 */
export function triggerFrontendRecovery(): void {
  if (typeof window === 'undefined') return;
  try {
    window.location.reload();
  } catch {
    window.location.href = window.location.pathname;
  }
}

/**
 * Resets the in-memory compromise flag (clears soft state & counters).
 */
export function resetCompromisedState(): void {
  frontendCompromised = false;
  compromiseReason = null;
  dimensionAnomalyCount = 0;
  consoleProbeAnomalyCount = 0;
}

/**
 * 1. Blocks context menu / right click deterrent.
 */
function handleContextMenu(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * 2. Blocks common DevTools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Meta equivalents).
 * Strictly preserves normal typing, copy, paste, cut, select-all, enter, tab, and accessibility.
 */
function handleKeyDown(e: KeyboardEvent): void {
  const isCtrlOrMeta = e.ctrlKey || e.metaKey;
  const isShift = e.shiftKey;
  const isAlt = e.altKey;
  const key = e.key ? e.key.toUpperCase() : '';
  const code = e.code || '';

  // A. F12 shortcut
  if (key === 'F12' || code === 'F12' || e.keyCode === 123) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // B. Ctrl + Shift + I  OR  Meta + Alt + I  OR  Meta + Shift + I (DevTools Inspect)
  if (
    (isCtrlOrMeta && isShift && (key === 'I' || code === 'KeyI')) ||
    (e.metaKey && isAlt && (key === 'I' || code === 'KeyI'))
  ) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // C. Ctrl + Shift + J  OR  Meta + Alt + J  OR  Meta + Shift + J (DevTools Console)
  if (
    (isCtrlOrMeta && isShift && (key === 'J' || code === 'KeyJ')) ||
    (e.metaKey && isAlt && (key === 'J' || code === 'KeyJ'))
  ) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // D. Ctrl + Shift + C  OR  Meta + Alt + C  OR  Meta + Shift + C (Inspect Element)
  // Note: Standard Ctrl+C (Copy) is NOT blocked because isShift and isAlt are false.
  if (
    (isCtrlOrMeta && isShift && (key === 'C' || code === 'KeyC')) ||
    (e.metaKey && isAlt && (key === 'C' || code === 'KeyC'))
  ) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // E. Ctrl + U  OR  Meta + U (View Source)
  // Note: Only when not combined with Shift to avoid interfering with other combinations
  if (isCtrlOrMeta && !isShift && !isAlt && (key === 'U' || code === 'KeyU')) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // F. Additional browser dev shortcuts: Ctrl+Shift+K (Firefox Console), Ctrl+Shift+E (Network)
  if (isCtrlOrMeta && isShift && (key === 'K' || code === 'KeyK' || key === 'E' || code === 'KeyE')) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
}

/**
 * 3. Captures user clicks / taps / pointerdowns.
 * If frontend is compromised:
 * - Evaluates whether the compromise is a soft false positive on a healthy DOM.
 * - Legitimate clicks on buttons, links, and navigation inside #root NEVER trigger a reload
 *   if the application DOM is intact.
 * - Confirmed hard compromises (DOM tampering, root deletion, malicious script injection)
 *   halt the action and reload the application.
 */
function handleInteractionCapture(e: Event): void {
  if (!frontendCompromised) return;

  const isHealthyDom = checkDomIntegrity();

  // If the DOM is completely healthy and the event was triggered by a soft heuristic,
  // auto-heal and allow legitimate user interaction to proceed normally without reloading!
  if (isHealthyDom && isSoftHeuristic(compromiseReason)) {
    resetCompromisedState();
    return;
  }

  // If there is genuine hard compromise (tampered root, stripped token, or malicious script injection)
  if (!isHealthyDom || !isSoftHeuristic(compromiseReason)) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    triggerFrontendRecovery();
  }
}

/**
 * 4. Conservative Viewport & Docked DevTools Detection Heuristic.
 * Designed to strictly prevent false positives:
 * - Skipped in development / localhost mode.
 * - Skipped in iframes (window.self !== window.top) where outer vs inner dimensions
 *   mismatch naturally due to embedding layout.
 * - Skipped on mobile, touch screens, and smaller desktop displays (< 900px).
 * - Cooldown period of 5 seconds after any window resize event.
 * - Requires at least 6 consecutive sustained anomalous checks (12+ seconds) without resize.
 * - Uses generous thresholds that cannot be triggered by normal browser zoom, Windows scaling
 *   (125%, 150%), browser side panels, or maximized window chrome.
 */
function checkDimensions(): void {
  if (typeof window === 'undefined') return;

  // Development environment safety
  if (isDevelopmentEnvironment()) {
    dimensionAnomalyCount = 0;
    return;
  }

  // If running in an iframe (preview, embedded frame, simple browser), dimension ratios are not representative
  try {
    if (window.self !== window.top) {
      dimensionAnomalyCount = 0;
      return;
    }
  } catch {
    // Cross-origin iframe restriction
    dimensionAnomalyCount = 0;
    return;
  }

  // Skip mobile devices, touch screens, and small screens
  if (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.innerWidth < 900
  ) {
    dimensionAnomalyCount = 0;
    return;
  }

  // Avoid false positives during or within 5 seconds of active user window resizing
  if (Date.now() - lastResizeTime < 5000) {
    dimensionAnomalyCount = 0;
    return;
  }

  const outerW = window.outerWidth;
  const outerH = window.outerHeight;
  const innerW = window.innerWidth;
  const innerH = window.innerHeight;

  if (!outerW || !outerH || !innerW || !innerH) return;

  const dpr = window.devicePixelRatio || 1;
  const currentRatio = outerW / innerW;
  const ratioDiff = Math.abs(currentRatio - dpr);

  const effectiveInnerH = innerH * currentRatio;
  const heightGap = outerH - effectiveInnerH;
  const widthGap = outerW - innerW;

  // Conservative threshold: require both a massive dimensional gap (> 420px width or > 400px height)
  // and an extreme ratio difference (> 0.45) that cannot be produced by standard browser zoom or sidebars
  const isWidthAnomalous = widthGap > 420 && ratioDiff > 0.45;
  const isHeightAnomalous = heightGap > 400 && ratioDiff > 0.45;

  if (isWidthAnomalous || isHeightAnomalous) {
    dimensionAnomalyCount++;
    // Require 6 consecutive sustained checks (12+ seconds) before flagging
    if (dimensionAnomalyCount >= 6) {
      markFrontendCompromised('devtools-docked');
    }
  } else {
    dimensionAnomalyCount = 0;
  }
}

/**
 * 5. Console Probe Heuristic.
 * Strictly disabled in development / localhost mode where Vite, React DevTools,
 * IDE consoles, and terminal loggers inspect console arguments automatically.
 * In production, requires multiple confirmations before raising an alert.
 */
function checkConsoleProbe(): void {
  if (typeof window === 'undefined') return;

  // Disabled in development / localhost environments to prevent false positives
  if (isDevelopmentEnvironment()) {
    consoleProbeAnomalyCount = 0;
    return;
  }

  try {
    const probe = {
      get [Symbol.toStringTag]() {
        consoleProbeAnomalyCount++;
        // Require 3 consecutive confirmations
        if (consoleProbeAnomalyCount >= 3) {
          markFrontendCompromised('devtools-console');
        }
        return 'NISC_SECURITY';
      },
    };
    // Non-intrusive debug format probe
    // eslint-disable-next-line no-console
    console.debug('%o', probe);
  } catch {
    // Silently proceed
  }
}

/**
 * 6. DOM & Application Root Tampering Observer.
 * Ensures the critical React root (#root) and integrity token cannot be stripped or tampered with.
 * Accurately distinguishes between:
 * - Legitimate React application DOM rendering, route transitions, and UI state updates (allowed)
 * - Actual malicious removal/tampering of #root or the integrity token (compromise)
 * - Suspicious external script injection (compromise)
 */
function setupDomTamperObserver(): void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

  // Insert or verify integrity token element
  ensureIntegrityToken();

  // Trusted script hostnames and resource prefixes
  const isTrustedScript = (src: string): boolean => {
    if (!src) return true; // Inline script created by app or Vite
    if (src.startsWith('/') || src.startsWith('./') || src.startsWith(window.location.origin)) {
      return true;
    }
    const trustedDomains = [
      'apis.google.com',
      'gstatic.com',
      'firebaseapp.com',
      'googleapis.com',
      'google.com',
      'accounts.google.com',
      'localhost',
      '127.0.0.1',
    ];
    try {
      const parsedUrl = new URL(src, window.location.href);
      return trustedDomains.some(
        (domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
    } catch {
      // Blob or data URIs
      return src.startsWith('blob:') || src.startsWith('data:');
    }
  };

  mutationObserverInstance = new MutationObserver((mutations) => {
    // Check if root exists
    const rootEl = document.getElementById('root');
    if (!rootEl || !document.body.contains(rootEl)) {
      markFrontendCompromised('root-unmounted');
      return;
    }

    // Check if integrity token exists and is intact
    const currentToken = document.getElementById(INTEGRITY_TOKEN_ID);
    if (!currentToken || currentToken.getAttribute('data-integrity') !== INTEGRITY_TOKEN_VALUE) {
      markFrontendCompromised('integrity-token-tampered');
      return;
    }

    // In development mode, skip script injection checks (Vite injects client scripts)
    if (isDevelopmentEnvironment()) {
      return;
    }

    // Check for suspicious script injection (e.g. dynamic external scripts injected maliciously)
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName === 'SCRIPT') {
              const src = el.getAttribute('src') || '';
              if (src && !isTrustedScript(src)) {
                markFrontendCompromised('script-injected');
                return;
              }
            }
          }
        }
      }
    }
  });

  mutationObserverInstance.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['id', 'data-integrity'],
  });
}

/**
 * Initializes the Anti-Inspection and Frontend Tamper Protection Deterrent.
 * Must be called once during application startup.
 * Returns a cleanup function.
 */
export function initAntiInspection(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (isInitialized) return () => {};

  isInitialized = true;

  // Track window resize events to avoid false positives from active user dragging
  const handleResize = () => {
    lastResizeTime = Date.now();
  };
  window.addEventListener('resize', handleResize, { passive: true });

  // 1. Block Context Menu / Right-Click (capture phase)
  document.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });

  // 2. Block Common DevTools and View-Source Shortcuts (capture phase)
  window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });

  // 3. Reset on Next Page Click / Touch / Pointerdown (capture phase) - with false-positive protection
  window.addEventListener('click', handleInteractionCapture, { capture: true, passive: false });
  window.addEventListener('pointerdown', handleInteractionCapture, { capture: true, passive: false });
  window.addEventListener('touchstart', handleInteractionCapture, { capture: true, passive: false });

  // 4. Setup DOM integrity observer
  setupDomTamperObserver();

  // 5. Periodic lightweight heuristics check (every 2 seconds)
  checkIntervalTimer = setInterval(() => {
    checkDimensions();
    checkConsoleProbe();
  }, 2000);

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    window.removeEventListener('keydown', handleKeyDown, { capture: true });
    window.removeEventListener('click', handleInteractionCapture, { capture: true });
    window.removeEventListener('pointerdown', handleInteractionCapture, { capture: true });
    window.removeEventListener('touchstart', handleInteractionCapture, { capture: true });

    if (mutationObserverInstance) {
      mutationObserverInstance.disconnect();
      mutationObserverInstance = null;
    }

    if (checkIntervalTimer) {
      clearInterval(checkIntervalTimer);
      checkIntervalTimer = null;
    }

    isInitialized = false;
  };
}

