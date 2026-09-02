/**
 * NISC Student Election System - Frontend Anti-Inspection & Tamper Protection Deterrent
 *
 * Objectives:
 * 1. Discourage casual users from opening browser developer tools.
 * 2. Block common browser shortcuts used to open DevTools (F12, Ctrl+Shift+I/J/C, Meta+Alt+I/J/C, Ctrl/Meta+U).
 * 3. Block browser context menu / right-click.
 * 4. Detect likely DevTools presence & meaningful DOM tampering using lightweight heuristics.
 * 5. If DevTools or tampering is detected, DO NOT immediately reload; set frontendCompromised = true.
 * 6. The NEXT time the user interacts (clicks/taps) anywhere on the page, prevent the action and reload the application.
 * 7. Restore the original deployed application upon reload.
 *
 * IMPORTANT:
 * - This is a client-side deterrent and recovery mechanism only.
 * - Real security is strictly enforced by Firebase Auth, Firestore Security Rules, and backend endpoints.
 * - This mechanism NEVER resets, deletes, or modifies real election data, voter allowlists, or vote records.
 */

// Module State
let isInitialized = false;
let frontendCompromised = false;
let compromiseReason: string | null = null;
let lastResizeTime = 0;
let dimensionAnomalyCount = 0;
let checkIntervalTimer: ReturnType<typeof setInterval> | null = null;
let mutationObserverInstance: MutationObserver | null = null;

// Unique DOM token identifying pristine frontend layout
const INTEGRITY_TOKEN_ID = 'nisc-integrity-token';
const INTEGRITY_TOKEN_VALUE = 'nisc-elections-2026-voter-core';

/**
 * Checks whether the frontend has been flagged as tampered or compromised.
 */
export function isFrontendCompromised(): boolean {
  return frontendCompromised;
}

/**
 * Marks the frontend as tampered/compromised.
 * Does NOT reload immediately. Sets the flag so the next user interaction triggers recovery.
 */
export function markFrontendCompromised(reason: string = 'generic-tamper'): void {
  // Check if developer explicitly requested a bypass in this tab
  if (typeof window !== 'undefined') {
    try {
      if (
        sessionStorage.getItem('NISC_DEV_BYPASS_ANTI_INSPECT') === 'true' ||
        new URLSearchParams(window.location.search).get('nisc_dev_bypass') === '1'
      ) {
        return;
      }
    } catch {
      // Ignore storage access errors
    }
  }

  if (frontendCompromised) return;

  frontendCompromised = true;
  compromiseReason = reason;

  // Log only minimal non-sensitive telemetry internally if necessary
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
 * Resets the in-memory compromise flag (useful for testing).
 */
export function resetCompromisedState(): void {
  frontendCompromised = false;
  compromiseReason = null;
  dimensionAnomalyCount = 0;
}

/**
 * 1. Blocks context menu / right click.
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
  // Note: Only when not combined with Shift to avoid interfering with any other potential combinations
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
 * 3. Captures all user clicks / taps / pointerdowns.
 * If frontend is compromised:
 * - Prevents the suspicious action from executing
 * - Immediately triggers full application reload
 */
function handleInteractionCapture(e: Event): void {
  if (frontendCompromised) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    triggerFrontendRecovery();
  }
}

/**
 * 4. Lightweight Viewport & Docked DevTools Detection Heuristic.
 * Carefully accounts for browser zoom (devicePixelRatio) and ignores mobile screens & active window resizing.
 */
function checkDimensions(): void {
  if (typeof window === 'undefined') return;

  // Tolerates mobile devices, touch screens, and small screens
  if (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.innerWidth < 768
  ) {
    return;
  }

  // Avoid false positives during active user window resizing (within 2 seconds)
  if (Date.now() - lastResizeTime < 2000) {
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

  // When DevTools is docked vertically: innerWidth drops substantially while dpr is unchanged
  // When DevTools is docked horizontally: innerHeight drops substantially
  const effectiveInnerH = innerH * currentRatio;
  const heightGap = outerH - effectiveInnerH;

  // Discrepancy threshold:
  // Normal zoom maintains ratioDiff < 0.12.
  // Docked DevTools (>= 180px) produces ratioDiff >= 0.22 or heightGap >= 280px.
  if (ratioDiff > 0.24 || heightGap > 280) {
    dimensionAnomalyCount++;
    // Require 2 consecutive confirmations to prevent transient spikes
    if (dimensionAnomalyCount >= 2) {
      markFrontendCompromised('devtools-docked');
    }
  } else {
    dimensionAnomalyCount = 0;
  }
}

/**
 * 5. Console Probe Heuristic.
 * Modern DevTools consoles inspect object properties when rendered.
 */
function checkConsoleProbe(): void {
  try {
    const probe = {
      get [Symbol.toStringTag]() {
        markFrontendCompromised('devtools-console');
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
 */
function setupDomTamperObserver(): void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

  // Insert or verify integrity token element
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

  // Observe root and token modifications
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

    // Check for suspicious script injection (e.g., dynamic external scripts injected by browser extensions or devtools)
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName === 'SCRIPT') {
              const src = el.getAttribute('src') || '';
              // Flag arbitrary non-local injected scripts
              if (src && !src.startsWith('/') && !src.startsWith(window.location.origin) && !src.includes('apis.google.com') && !src.includes('gstatic.com')) {
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

  // 3. Reset on Next Page Click / Touch / Pointerdown (capture phase)
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
