/**
 * Content Script for AutoFill Plugin
 * Kjører på alle websider og håndterer felt-deteksjon og autofill
 */

// Hindre dobbel-injeksjon (kan skje ved register + manifest)
if (window.__autofillContentLoaded) {
  console.debug('[AutoFill] Content script already loaded, skipping re-init.');
} else {
  window.__autofillContentLoaded = true;

// Globale variabler
let lastClickedElement = null;
let autoFillRules = [];
let executedMacros = new Set(); // Ny: Hindre loop ved makro-avspilling
let debugMode = false;
let autofillEnabled = true;
let autofillDelayMs = 0;
let autofillTrigger = 'auto'; // auto | interaction
let blacklist = [];
let whitelist = [];
let fieldBlacklist = []; // Ny
// ENDRING: Ny variabel for varslinger
let notificationsEnabled = true;
let scanToastEnabled = true; // Ny: Vis scan-toast i hjørnet
let userVariables = {};
let currentLanguage = 'en';
let currentProfileId = 'default';

// Observer references for cleanup (prevents memory leaks)
let domObserver = null;
let modalObserver = null;

// Regex compilation cache (prevents re-creating regex objects on every match)
const regexCache = new Map();
const REGEX_CACHE_MAX_SIZE = 100;

/**
 * Debounce utility - delays function execution until after wait ms have elapsed
 * since the last time it was invoked
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout = null;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Debounced version of triggerAutoFill for high-frequency events
const debouncedTriggerAutoFill = debounce(() => triggerAutoFill(), 150);

/**
 * Get or create a cached regex object
 * @param {string} pattern - The regex pattern
 * @param {string} flags - Regex flags (default 'i' for case-insensitive)
 * @returns {RegExp|null} - Compiled regex or null if invalid
 */
function getCachedRegex(pattern, flags = 'i') {
  const cacheKey = `${pattern}::${flags}`;

  if (regexCache.has(cacheKey)) {
    return regexCache.get(cacheKey);
  }

  try {
    const regex = new RegExp(pattern, flags);

    // Evict oldest entries if cache is full
    if (regexCache.size >= REGEX_CACHE_MAX_SIZE) {
      const firstKey = regexCache.keys().next().value;
      regexCache.delete(firstKey);
    }

    regexCache.set(cacheKey, regex);
    return regex;
  } catch (error) {
    console.error('Invalid regex pattern:', pattern, error);
    regexCache.set(cacheKey, null); // Cache the failure too
    return null;
  }
}

/**
 * Initialiser content script
 * Wrapped i try-catch for robust feilhåndtering
 */
(async function init() {
  try {
    debugLog('AutoFill Plugin content script lastet');

    // Last inn innstillinger (med fallback ved feil)
    await loadSettings().catch(err => {
      console.warn('[AutoFill] Failed to load settings, using defaults:', err);
    });

    await loadCurrentProfile().catch(err => {
      console.warn('[AutoFill] Failed to load profile, using default:', err);
    });

    const loc = getEffectiveLocation();

    // Sjekk blacklist/whitelist før vi gjør noe som helst (inkludert scanning)
    if (isBlockedSite(loc.hostname, loc.href)) {
      debugLog('Site blokkert av blacklist/whitelist, stopper init');
      return;
    }

    // Hent regler for denne siden
    await loadRulesForCurrentSite(currentProfileId).catch(err => {
      console.warn('[AutoFill] Failed to load rules:', err);
    });

    // Lytt til focus-events for å spore siste klikket element
    document.addEventListener('mousedown', handleMouseDown, true);

    // Kjor autofill når siden er ferdig lastet (hvis aktivert)
    if (autofillEnabled) {
      if (autofillTrigger === 'interaction') {
        attachInteractionTrigger();
      } else {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', triggerAutoFill);
        } else {
          triggerAutoFill();
        }
      }
    }

    // Observer DOM-endringer for dynamiske sider (SPA)
    observeDOMChanges();

    // Observer modals som åpnes
    observeModalChanges();

    // Fang høyreklikk slik at context menu-lagring alltid har et felt
    document.addEventListener('contextmenu', handleMouseDown, true);

  } catch (error) {
    console.error('[AutoFill] Critical initialization error:', error);
  }
})();

// --- MACRO RECORDER & PLAYER START ---

const MacroRecorder = {
  isRecording: false,
  startTime: 0,
  steps: [],
  overlay: null,
  lastEventTime: 0,

  start: function() {
    if (this.isRecording) return;
    this.isRecording = true;
    this.startTime = Date.now();
    this.lastEventTime = this.startTime;
    this.steps = [];
    this.createOverlay();
    
    // Attach listeners
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('change', this.handleChange, true);
    document.addEventListener('keydown', this.handleKeydown, true);
    
    debugLog('Macro recording started');
  },

  stop: function() {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.removeOverlay();
    
    // Remove listeners
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('change', this.handleChange, true);
    document.removeEventListener('keydown', this.handleKeydown, true);
    
    debugLog('Macro recording stopped', this.steps);
    return this.steps;
  },

  recordStep: function(type, target, value = null, extra = {}) {
    const now = Date.now();
    const delay = now - this.lastEventTime;
    this.lastEventTime = now;

    const selector = generateSelector(target);
    if (!selector && target !== document.body) {
        console.warn('Could not generate selector for', target);
        return;
    }

    const step = {
      type: type,
      selector: selector,
      delay: delay, // Delay før denne handlingen utføres
      ...extra
    };
    
    if (value !== null) step.value = value;

    this.steps.push(step);
    this.updateOverlayCount();
  },

  handleClick: function(e) {
    // Ikke ta opp klikk på vår egen overlay
    if (MacroRecorder.overlay && MacroRecorder.overlay.contains(e.target)) return;
    
    // Unngå doble klikk-registreringer (debounce)
    const lastStep = this.steps[this.steps.length - 1];
    const now = Date.now();
    if (lastStep && lastStep.type === 'click' && (now - this.lastEventTime < 500)) {
        // Sjekk om det er samme element (via selector)
        const currentSelector = generateSelector(e.target);
        if (lastStep.selector === currentSelector) {
            debugLog('Ignorerer dobbeltklikk i opptak');
            return;
        }
    }

    MacroRecorder.recordStep('click', e.target);
  },

  handleChange: function(e) {
    // Registrer endringer i input felt
    const val = getFieldValue(e.target);
    MacroRecorder.recordStep('type', e.target, val);
  },

  handleKeydown: function(e) {
    // Vi bryr oss primært om navigasjonstaster som Enter, Tab, piler
    const importantKeys = ['Enter', 'Tab', 'ArrowDown', 'ArrowUp', 'Escape'];
    if (importantKeys.includes(e.key)) {
       MacroRecorder.recordStep('key', e.target, null, { key: e.key, code: e.code });
    }
  },
  
  createOverlay: function() {
    if (!document.body) return; // Cannot create overlay without body
    const div = document.createElement('div');
    if (!div.style) return; // Safety check
    div.id = 'autofill-recorder-overlay';
    div.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: default;
    `;
    div.innerHTML = `
      <span>🔴 Recording... <span id="af-rec-count">(0)</span></span>
      <button id="af-rec-stop" style="
        background: white; 
        color: #ef4444; 
        border: none; 
        padding: 4px 8px; 
        border-radius: 4px; 
        cursor: pointer;
        font-weight: bold;
      ">Stop & Save</button>
    `;
    document.body.appendChild(div);
    this.overlay = div;

    document.getElementById('af-rec-stop').addEventListener('click', () => {
        const macro = this.stop();
        // Send macro til background for lagring
        const host = window.location.hostname;
        chrome.runtime.sendMessage({
            action: 'addRule',
            rule: {
                sitePattern: host,
                siteMatchType: 'host',
                fieldType: 'macro', // Ny type
                fieldPattern: 'Macro: ' + new Date().toLocaleString(),
                value: JSON.stringify(macro), // Lagre stegene som JSON-streng
                priority: 100
            }
        }, () => {
            alert('Macro saved! Reload page to test.');
        });
    });
  },
  
  updateOverlayCount: function() {
    const el = document.getElementById('af-rec-count');
    if (el) el.textContent = `(${this.steps.length})`;
  },

  removeOverlay: function() {
    if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
    }
  },
  
  // Sørg for at context (this) er riktig i event handlers
  bind: function() {
      this.handleClick = this.handleClick.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.handleKeydown = this.handleKeydown.bind(this);
  }
};
MacroRecorder.bind();


const MacroPlayer = {
  play: async function(macroJson) {
    let steps;
    try {
        steps = typeof macroJson === 'string' ? JSON.parse(macroJson) : macroJson;
    } catch (e) {
        console.error('Invalid macro JSON', e);
        return;
    }
    
    if (!Array.isArray(steps)) return;

    console.log('[AutoFill Macro] Starting playback with', steps.length, 'steps'); // Forced log

    for (const step of steps) {
        // Vent angitt delay (eller default 300ms for stabilitet)
        const delay = Math.max(step.delay || 300, 100); 
        await new Promise(r => setTimeout(r, delay));
        
        const el = document.querySelector(step.selector);
        if (!el) {
            debugLog('Macro element not found:', step.selector, 'Skipping step');
            continue;
        }
        
        debugLog('Executing step:', step.type, step.selector);
        
        try {
            // Sørg for at elementet er synlig og klart
            el.scrollIntoView({ block: 'center', inline: 'center' });
            
            if (step.type === 'click') {
                // Simuler full klikk-sekvens
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
                el.click(); 
            } else if (step.type === 'type') {
                el.focus();
                setNativeValue(el, processValue(step.value)); // Støtt variabler i makroer også!
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                // Blur er ofte lurt etter typing
                // el.blur(); 
            } else if (step.type === 'key') {
                el.dispatchEvent(new KeyboardEvent('keydown', { key: step.key, code: step.code, bubbles: true }));
                el.dispatchEvent(new KeyboardEvent('keyup', { key: step.key, code: step.code, bubbles: true }));
                // Spesialhåndtering: Hvis det er Enter på en form, kan det hende vi skal submitte?
                // Nei, la siden håndtere det.
            }
        } catch (err) {
            console.error('Error executing macro step', step, err);
        }
    }
    debugLog('Macro playback finished');
  }
};

// --- MACRO RECORDER & PLAYER END ---

/**
 * Last inn innstillinger
 */
  async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['debugMode', 'autofillEnabled', 'autofillDelay', 'autofillTrigger', 'blacklist', 'whitelist', 'notificationsEnabled', 'scanToastEnabled', 'userVariables', 'language', 'fieldBlacklist']);
    debugMode = result.debugMode || false;
    autofillEnabled = result.autofillEnabled !== false; // Default true
    autofillDelayMs = parseInt(result.autofillDelay) || 0;
    autofillTrigger = result.autofillTrigger || 'auto';
    blacklist = Array.isArray(result.blacklist) ? result.blacklist : [];
    whitelist = Array.isArray(result.whitelist) ? result.whitelist : [];
    fieldBlacklist = Array.isArray(result.fieldBlacklist) ? result.fieldBlacklist : [];
    // ENDRING: Last inn notification settings
    notificationsEnabled = result.notificationsEnabled !== false; // Default true
    scanToastEnabled = result.scanToastEnabled !== false; // Default true
    userVariables = result.userVariables || {};
    currentLanguage = result.language || 'en';
    if (result.currentProfileId) {
      currentProfileId = result.currentProfileId;
    }

    debugLog('Innstillinger lastet:', { debugMode, autofillEnabled, autofillDelayMs, autofillTrigger, blacklist, whitelist, fieldBlacklist, notificationsEnabled, scanToastEnabled, userVariables, currentLanguage });
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}
/**
 * Debug logging - kun når debug mode er på
 */
function debugLog(...args) {
  if (debugMode) {
    console.log('[AutoFill Debug]', ...args);
  }
}

/**
 * Sjekk blacklist/whitelist for gjeldende site
 */
function isBlockedSite(hostname, url) {
  const matchesPattern = (patterns, value) => {
    return patterns.some(p => matchPattern(value, p, false));
  };

  if (whitelist.length > 0 && !matchesPattern(whitelist, hostname) && !matchesPattern(whitelist, url)) {
    return true; // whitelist aktiv, men ingen treff
  }

  if (blacklist.length > 0 && (matchesPattern(blacklist, hostname) || matchesPattern(blacklist, url))) {
    return true;
  }

  return false;
}

/**
 * Sjekk om et felt er i blacklist (basert på ID)
 */
function isFieldBlocked(field) {
    if (!field.id || fieldBlacklist.length === 0) return false;
    
    return fieldBlacklist.some(pattern => {
        // Support explicit regex with prefix "regex:"
        if (pattern.startsWith('regex:')) {
            const regexStr = pattern.substring(6); // Remove "regex:"
            try {
                const regex = new RegExp(regexStr);
                return regex.test(field.id);
            } catch (e) {
                console.error('Invalid blacklist regex:', regexStr, e);
                return false;
            }
        }
        
        // Default to wildcard match
        return matchPattern(field.id, pattern, false);
    });
}

/**
 * Håndter museklikk for å spore siste klikket element
 */
function handleMouseDown(event) {
  if (isEditableElement(event.target)) {
    lastClickedElement = event.target;
  }
}

/**
 * Sjekk om et element er redigerbart eller fillbart
 */
function isEditableElement(element) {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const type = element.type ? element.type.toLowerCase() : '';

  // Input-felt (inkludert checkbox, radio, date, etc.)
  if (tagName === 'input') {
    const fillableTypes = [
      'text', 'email', 'password', 'search', 'tel', 'url', 'number',
      'checkbox', 'radio',
      'date', 'datetime-local', 'time', 'week', 'month',
      'color', 'range'
    ];
    return fillableTypes.includes(type);
  }

  // Select-felt (dropdown)
  if (tagName === 'select') {
    return true;
  }

  // Textarea
  if (tagName === 'textarea') {
    return true;
  }

  // ContentEditable
  if (element.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Hent effektiv URL/hostname (håndterer about:blank/srcdoc ved å sjekke parent)
 * Traverserer oppover i iframe-hierarkiet til vi finner en gyldig URL
 * Maks 10 nivåer for å unngå uendelig løkke
 */
function getEffectiveLocation() {
  let href = window.location.href;
  let hostname = window.location.hostname;
  let currentWindow = window;
  let depth = 0;
  const maxDepth = 10;

  // Traverser oppover til vi finner en gyldig URL
  while ((href === 'about:blank' || href === 'about:srcdoc' || !hostname) && depth < maxDepth) {
    try {
      if (currentWindow.parent && currentWindow.parent !== currentWindow) {
        currentWindow = currentWindow.parent;
        // Prøv å lese location - dette kan kaste SecurityError ved cross-origin
        href = currentWindow.location.href;
        hostname = currentWindow.location.hostname;
        depth++;
      } else {
        // Nådd toppen av hierarkiet
        break;
      }
    } catch (e) {
      // Cross-origin blokkering - prøv å bruke document.referrer som fallback
      if (document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer);
          href = document.referrer;
          hostname = referrerUrl.hostname;
          debugLog('Using document.referrer as fallback:', href);
        } catch (urlError) {
          // Ugyldig referrer URL
          debugLog('Could not parse referrer:', document.referrer);
        }
      }
      break;
    }
  }

  // Siste fallback - bruk top.location via postMessage eller aksepter tom
  if (!hostname) {
    debugLog('Warning: Could not determine effective hostname, using empty');
    hostname = '';
  }

  return { href, hostname, iframeDepth: depth };
}

/**
 * Hent regler for gjeldende side
 */
async function loadRulesForCurrentSite(profileId = null) {
  try {
    const loc = getEffectiveLocation();

    // Ikke scan hvis siden er blokkert
    if (isBlockedSite(loc.hostname, loc.href)) {
      debugLog('Site blokkert - hopper over regel-skann');
      const existing = document.getElementById('autofill-scan-toast');
      if (existing) existing.remove();
      return;
    }

    // Vis scan-toast: Stadium 1 - Scanning
    if (scanToastEnabled) {
      showScanToast('scanning');
    }

    const response = await chrome.runtime.sendMessage({
      action: 'getRulesForSite',
      url: loc.href,
      profileId: profileId
    });

    if (response && response.success) {
      autoFillRules = response.rules;
      console.log(`Loaded ${autoFillRules.length} rules for this page (Profile: ${profileId || 'auto'})`);

      // Vis scan-toast: Stadium 2 og 3
      if (scanToastEnabled) {
        if (autoFillRules.length > 0) {
          showScanToast('rules-found', autoFillRules.length);

          // Vent litt, deretter tell matches
          setTimeout(() => {
            const fields = findAllEditableFields();
            let fullMatches = 0;
            let partialMatches = 0;

            for (const field of fields) {
              const identifier = getFieldIdentifier(field);
              if (findMatchingRule(field, identifier)) {
                fullMatches++;
              }
            }

            partialMatches = autoFillRules.length - fullMatches;

            // Vis scan-toast: Stadium 3 - Match details
            showScanToast('match-details', autoFillRules.length, fullMatches, partialMatches);
            // Be background oppdatere badge med ferske tall
            chrome.runtime.sendMessage({ action: 'refreshBadge' }).catch(() => {});
          }, 500);
        } else {
          // Ingen regler funnet - skjul toast umiddelbart
          const existing = document.getElementById('autofill-scan-toast');
          if (existing) existing.remove();
        }
      }
    }
  } catch (error) {
    console.error('Error loading rules:', error);
    // Skjul scan-toast ved feil
    if (scanToastEnabled) {
      const existing = document.getElementById('autofill-scan-toast');
      if (existing) existing.remove();
    }
  }
}

/**
 * Utfør automatisk utfylling
 */
function performAutoFill(force = false) {
  if (!autofillEnabled && !force) {
    debugLog('AutoFill er deaktivert, hopper over');
    return;
  }

  const loc = getEffectiveLocation();
  if (isBlockedSite(loc.hostname, loc.href)) {
    debugLog('Site blokkert - hopper over autofill');
    return;
  }

  if (autoFillRules.length === 0) {
    debugLog('Ingen regler for denne siden');
    return;
  }

  debugLog(`Starter autofill med ${autoFillRules.length} regler`);

  // 1. Sjekk for makroer først
  for (const rule of autoFillRules) {
      if (rule.fieldType === 'macro') {
          if (!force && executedMacros.has(rule.id)) {
              continue;
          }

          if (matchesCondition(rule, window.location.href, document.body)) {
              // Sjekk om makroens start-element er synlig
              let steps;
              try {
                  steps = typeof rule.value === 'string' ? JSON.parse(rule.value) : rule.value;
              } catch(e) { continue; }

              if (steps && steps.length > 0) {
                  const firstSelector = steps[0].selector;
                  const el = document.querySelector(firstSelector);
                  
                  // Er elementet synlig? (offsetParent er null hvis hidden)
                  if (el && el.offsetParent !== null) {
                      console.log('[AutoFill] Macro start element found & visible, running:', firstSelector);
                      executedMacros.add(rule.id);
                      
                      const delay = parseInt(rule.delay) || 0;
                      if (delay > 0) {
                          console.log(`[AutoFill] Waiting ${delay}ms before executing macro...`);
                          setTimeout(() => {
                              MacroPlayer.play(steps);
                              markRuleAsUsed(rule.id);
                          }, delay);
                      } else {
                          MacroPlayer.play(steps);
                          markRuleAsUsed(rule.id);
                      }
                  } else {
                      // Debug log kun hvis vi er i debug mode for å unngå spam
                      debugLog('[AutoFill] Macro start element not visible yet:', firstSelector);
                  }
              }
          }
      }
  }

  let filledCount = 0;
  const filledFields = [];

  const fields = findAllEditableFields();
  debugLog(`Funnet ${fields.length} redigerbare felt`);

  for (const field of fields) {
    if (isFieldBlocked(field)) {
        debugLog(`Felt blokkert av field-blacklist: id="${field.id}"`);
        continue;
    }

    const identifier = getFieldIdentifier(field);
    if (!identifier) {
      debugLog('Felt uten identifikator, sjekker selector-regler', field);
    } else {
      debugLog(`Sjekker felt: ${identifier.type}="${identifier.value}" (${identifier.fieldType})`);
    }

    // Finn matchende regel
    const matchingRule = findMatchingRule(field, identifier);

    if (matchingRule) {
      debugLog(`Matchet regel:`, matchingRule);

      // Sjekk om feltet allerede har en verdi
      const currentValue = getFieldValue(field);
      const fieldElementType = identifier?.fieldType || getElementType(field);
      if (!force && currentValue && fieldElementType !== 'checkbox' && fieldElementType !== 'radio') {
        debugLog(`Felt har allerede verdi: "${currentValue}", hopper over`);
        continue;
      }

      // ENDRING: Prosesser verdi (variabler)
      const valueToFill = processValue(matchingRule.value);
      
      fillField(field, valueToFill);
      filledCount++;

      // Visuell feedback hvis debug mode
      if (debugMode) {
        highlightField(field);
      }

      filledFields.push({
        identifier: identifier ? identifier.value : matchingRule.fieldPattern,
        type: identifier ? identifier.fieldType : matchingRule.elementType || 'text',
        value: valueToFill
      });

      // Marker regelen som brukt
      markRuleAsUsed(matchingRule.id);
    } else {
      if (identifier) {
        debugLog(`Ingen matchende regel for: ${identifier.type}="${identifier.value}"`);
      } else {
        debugLog('Ingen matchende selector-regel for feltet');
      }
    }
  }

  if (filledCount > 0) {
    debugLog(`AutoFill fullført: Fylte ut ${filledCount} felt`, filledFields);

    // Vis notification hvis debug mode eller hvis varsling er aktivert
    // ENDRING: Viser notification hvis notificationsEnabled er true
    if (notificationsEnabled || debugMode) {
      showDebugNotification(`AutoFill: ${filledCount} felt fylt ut`);
    }
  } else {
    debugLog('Ingen felt ble fylt ut');
  }
}

// ENDRING: Prosesser variabler i verdi
function processValue(value) {
  if (!value || typeof value !== 'string') return value;
  
  const now = new Date();

  // Brukerdefinerte variabler
  value = value.replace(/{([a-zA-Z0-9_]+)}/g, (match, key) => {
      if (userVariables && userVariables[key] !== undefined) {
          return userVariables[key];
      }
      return match;
  });
  
  // {date} -> YYYY-MM-DD
  if (value.includes('{date}')) {
    value = value.replace(/{date}/g, now.toISOString().split('T')[0]);
  }
  
  // {time} -> HH:MM:SS
  if (value.includes('{time}')) {
    value = value.replace(/{time}/g, now.toTimeString().split(' ')[0]);
  }
  
  // {timestamp} -> Epoch
  if (value.includes('{timestamp}')) {
    value = value.replace(/{timestamp}/g, Date.now());
  }
  
  // {random} -> tilfeldig tall 0-9999
  if (value.includes('{random}')) {
    value = value.replace(/{random}/g, Math.floor(Math.random() * 10000));
  }
  
  // {random:N} -> tilfeldig tall med N siffer
  value = value.replace(/{random:(\d+)}/g, (match, digits) => {
    const n = parseInt(digits);
    if (isNaN(n)) return match;
    const min = Math.pow(10, n - 1);
    const max = Math.pow(10, n) - 1;
    return Math.floor(min + Math.random() * (max - min + 1));
  });

  return value;
}

/**
 * Trigger autofill med eventuell delay
 */
function triggerAutoFill() {
  if (autofillDelayMs > 0) {
    setTimeout(performAutoFill, autofillDelayMs);
  } else {
    performAutoFill();
  }
}

/**
 * Kjor autofill ved brukerinteraksjon
 */
function attachInteractionTrigger() {
  const runOnce = () => {
    triggerAutoFill();
    document.removeEventListener('focusin', onFocus, true);
    document.removeEventListener('click', onClick, true);
  };
  const onFocus = () => runOnce();
  const onClick = () => runOnce();

  document.addEventListener('focusin', onFocus, true);
  document.addEventListener('click', onClick, true);
}

/**
 * Highlight et felt visuelt (kun i debug mode)
 */
function highlightField(field) {
  const originalBorder = field.style.border;
  const originalBackground = field.style.backgroundColor;

  field.style.border = '2px solid #667eea';
  field.style.backgroundColor = '#f0f4ff';
  field.style.transition = 'all 0.3s ease';

  setTimeout(() => {
    field.style.border = originalBorder;
    field.style.backgroundColor = originalBackground;
  }, 2000);
}

/**
 * Vis debug notification på siden
 */
function showDebugNotification(message) {
  // Translate message if it is the specific autofill message
  if (message.startsWith('AutoFill:')) {
      const match = message.match(/\d+/);
      if (match) {
          const count = match[0];
          if (currentLanguage === 'no') {
              message = `AutoFill: ${count} felt fylt ut`;
          } else {
              message = `AutoFill: ${count} fields filled`;
          }
      }
  }

  // Fjern eksisterende varsel hvis det finnes
  const existing = document.getElementById('autofill-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  if (!notification.style) return; // Safety check for XML pages
  notification.id = 'autofill-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 2147483647; /* Max z-index */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
    pointer-events: none;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Vis scan-toast i øverste venstre hjørne
 * @param {string} stage - 'scanning', 'rules-found', eller 'match-details'
 * @param {number} rulesCount - Antall regler funnet
 * @param {number} fullMatches - Antall full matches
 * @param {number} partialMatches - Antall partial matches
 */
function showScanToast(stage, rulesCount = 0, fullMatches = 0, partialMatches = 0) {
  if (!scanToastEnabled) return;

  // Fjern eksisterende toast
  const existing = document.getElementById('autofill-scan-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'autofill-scan-toast';
  
  // Safety check for non-HTML pages (XML/SVG)
  if (!toast.style) return;

  let content = '';
  let autoHide = false;
  let hideDelay = 0;

  if (stage === 'scanning') {
    content = currentLanguage === 'no' ? 'Skanner...' : 'Scanning...';
  } else if (stage === 'rules-found') {
    const rulesText = currentLanguage === 'no' ?
      `${rulesCount} ${rulesCount === 1 ? 'regel' : 'regler'} funnet for denne siden` :
      `${rulesCount} ${rulesCount === 1 ? 'rule' : 'rules'} found for this page`;
    content = rulesText;
  } else if (stage === 'match-details') {
    const rulesText = currentLanguage === 'no' ?
      `${rulesCount} ${rulesCount === 1 ? 'regel' : 'regler'} funnet for denne siden` :
      `${rulesCount} ${rulesCount === 1 ? 'rule' : 'rules'} found for this page`;

    const matchesText = currentLanguage === 'no' ?
      `${fullMatches} ${fullMatches === 1 ? 'match' : 'matches'}` :
      `${fullMatches} ${fullMatches === 1 ? 'match' : 'matches'}`;

    const partialText = currentLanguage === 'no' ?
      `${partialMatches} partial ${partialMatches === 1 ? 'match' : 'matches'}` :
      `${partialMatches} partial ${partialMatches === 1 ? 'match' : 'matches'}`;

    content = `${rulesText}<br>${matchesText}<br>${partialText}`;
    autoHide = true;
    hideDelay = 4000;
  }

  toast.innerHTML = content;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.5;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  // Auto-hide hvis det er siste stadium
  if (autoHide) {
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 300);
    }, hideDelay);
  }
}

/**
 * Finn alle redigerbare felt på siden (inkludert Shadow DOM)
 * Optimalisert for ytelse ved å unngå querySelectorAll('*')
 */
function findAllEditableFields(root = document) {
  const fields = [];

  // Finn felter i gjeldende rot med spesifikk selector
  const inputs = root.querySelectorAll(
    'input, select, textarea, [contenteditable="true"]'
  );

  // Filtrer for sikkerhets skyld (querySelectorAll tar med alle input-typer)
  for (const input of inputs) {
    if (isEditableElement(input)) {
        fields.push(input);
    }
  }

  // Traverser Shadow DOM - optimalisert versjon
  // Custom elements (web components) har alltid bindestrek i navnet per spec
  // Dette er mye raskere enn querySelectorAll('*')
  findShadowRoots(root, fields);

  return fields;
}

/**
 * Rekursivt finn shadow roots og deres editable fields
 * Optimalisert med TreeWalker for bedre ytelse enn querySelectorAll('*')
 */
function findShadowRoots(root, fields, depth = 0) {
  // Begrens rekursjonsdybde for å unngå uendelig løkke
  if (depth > 5) return;

  // Bruk TreeWalker for effektiv DOM-traversering
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        // Custom elements har bindestrek i tag-navnet (W3C spec)
        // Bare aksepter elementer som kan ha shadow root
        if (node.tagName && node.tagName.includes('-')) {
          return NodeFilter.FILTER_ACCEPT;
        }
        // Fortsett å søke i children uansett
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  let el;
  while (el = walker.nextNode()) {
    if (el.shadowRoot) {
      // Finn editable fields i shadow root
      const shadowInputs = el.shadowRoot.querySelectorAll(
        'input, select, textarea, [contenteditable="true"]'
      );
      for (const input of shadowInputs) {
        if (isEditableElement(input)) {
          fields.push(input);
        }
      }
      // Rekursivt søk i nested shadow DOMs
      findShadowRoots(el.shadowRoot, fields, depth + 1);
    }
  }
}

/**
 * Generer en unik CSS-selector for et element
 */
function generateSelector(el) {
  if (!el || el.nodeType !== 1) return '';
  
  const path = [];
  while (el && el.nodeType === 1) {
    let selector = el.tagName.toLowerCase();
    
    if (el.id) {
      selector = '#' + el.id;
      path.unshift(selector);
      break; // ID er unikt nok, vi trenger ikke gå lenger opp
    }
    
    // Hvis elementet har søsken av samme type, legg til nth-of-type
    let sibling = el;
    let count = 1;
    while (sibling = sibling.previousElementSibling) {
      if (sibling.tagName.toLowerCase() === selector) count++;
    }
    
    if (count > 1) {
      selector += ':nth-of-type(' + count + ')';
    }
    
    path.unshift(selector);
    el = el.parentElement;
  }
  
  return path.join(' > ');
}

/**
 * Hent identifikator for et felt
 */
function getFieldIdentifier(field) {
  const fieldType = getElementType(field);

  // Prioriter: name > data-name > data-id > id > aria-label > placeholder
  if (field.name) return { type: 'name', value: field.name, fieldType: fieldType };
  if (field.getAttribute('data-name')) return { type: 'data-name', value: field.getAttribute('data-name'), fieldType: fieldType };
  if (field.getAttribute('data-id')) return { type: 'data-id', value: field.getAttribute('data-id'), fieldType: fieldType };
  if (field.id) return { type: 'id', value: field.id, fieldType: fieldType };
  if (field.getAttribute('aria-label')) return { type: 'aria-label', value: field.getAttribute('aria-label'), fieldType: fieldType };
  if (field.placeholder) return { type: 'placeholder', value: field.placeholder, fieldType: fieldType };

  // Fallback: Generer selector hvis ingen andre attributter finnes
  const selector = generateSelector(field);
  if (selector) return { type: 'selector', value: selector, fieldType: fieldType };

  return null;
}

/**
 * Returner elementtype (text, checkbox, radio, select, textarea, contenteditable)
 */
function getElementType(field) {
  const tagName = field.tagName.toLowerCase();
  const inputType = field.type ? field.type.toLowerCase() : '';

  if (tagName === 'select') return 'select';
  if (tagName === 'textarea') return 'textarea';
  if (inputType === 'checkbox') return 'checkbox';
  if (inputType === 'radio') return 'radio';
  if (field.isContentEditable) return 'contenteditable';
  return 'text';
}

/**
 * Finn matchende regel for et felt
 */

function findMatchingRule(field, identifier) {
  const fieldElementType = identifier?.fieldType || getElementType(field);
  let best = null;
  const currentUrl = window.location.href;

  for (const rule of autoFillRules) {
    const ruleElementType = rule.elementType || 'text';
    if (ruleElementType && fieldElementType && ruleElementType !== fieldElementType) {
      continue;
    }

    if (!matchesCondition(rule, currentUrl, field)) {
      continue;
    }

    // Sjekk selector-regler
    if (rule.fieldType === 'selector') {
      try {
        if (field.matches && field.matches(rule.fieldPattern)) {
          best = pickBetterRule(best, rule);
        }
      } catch (error) {
        debugLog('Ugyldig selector:', rule.fieldPattern, error);
      }
      continue;
    }

    // Sjekk attributt-baserte regler direkte på feltet
    let fieldValue = null;
    if (rule.fieldType === 'name') fieldValue = field.name;
    else if (rule.fieldType === 'id') fieldValue = field.id;
    else if (rule.fieldType === 'data-name') fieldValue = field.getAttribute('data-name');
    else if (rule.fieldType === 'data-id') fieldValue = field.getAttribute('data-id');
    else if (rule.fieldType === 'placeholder') fieldValue = field.placeholder;
    else if (rule.fieldType === 'aria-label') fieldValue = field.getAttribute('aria-label');

    if (fieldValue && matchPattern(fieldValue, rule.fieldPattern, rule.fieldUseRegex)) {
      best = pickBetterRule(best, rule);
    }
  }

  return best;
}


function pickBetterRule(current, candidate) {
  if (!current) return candidate;
  const currentPriority = current.priority || 0;
  const candidatePriority = candidate.priority || 0;
  if (candidatePriority !== currentPriority) {
    return candidatePriority > currentPriority ? candidate : current;
  }
  const currentOrder = current.sortOrder ?? 0;
  const candidateOrder = candidate.sortOrder ?? 0;
  return candidateOrder < currentOrder ? candidate : current;
}

function matchesCondition(rule, url, field) {
  const type = rule.conditionType || 'none';
  const value = rule.conditionValue || '';
  switch (type) {
    case 'urlContains':
      return value ? url.includes(value) : true;
    case 'urlRegex':
      if (!value) return true;
      const regex = getCachedRegex(value, '');
      return regex ? regex.test(url) : false;
    case 'selectorExists':
      try {
        return value ? !!document.querySelector(value) : false;
      } catch (error) {
        debugLog('Ugyldig selector i condition:', value, error);
        return false;
      }
    case 'none':
    default:
      return true;
  }
}

/**
 * Analyser matchende regler uten å fylle ut
 */
function analyzeMatches() {
  const fields = findAllEditableFields();
  const results = [];

  for (const field of fields) {
    const identifier = getFieldIdentifier(field);
    const matchingRule = findMatchingRule(field, identifier);
    if (matchingRule) {
      results.push({
        field: identifier ? `${identifier.type}:${identifier.value}` : 'selector',
        elementType: identifier?.fieldType || getElementType(field),
        ruleId: matchingRule.id,
        ruleValue: matchingRule.value
      });
    }
  }

  return { success: true, matches: results, totalFields: fields.length };
}

function matchPattern(text, pattern, useRegex) {
  if (useRegex) {
    const regex = getCachedRegex(pattern, 'i');
    return regex ? regex.test(text) : false;
  } else {
    // Wildcard matching
    return matchWildcard(text, pattern);
  }
}

/**
 * Match wildcard-mønster (med caching)
 */
function matchWildcard(text, pattern) {
  // Eksakt match - raskeste sjekk først
  if (text === pattern) return true;

  // Konverter wildcard til regex-pattern
  const regexPattern = '^' + pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.') + '$';

  // Bruk cached regex med prefix for å skille fra vanlige regex
  const regex = getCachedRegex('wildcard::' + regexPattern, '');
  return regex ? regex.test(text) : false;
}

/**
 * Hjelpefunksjon for å sette verdi på React/Vue-inputs slik at state oppdateres
 */
function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }
}

/**
 * Fyll ut et felt basert på type
 */
function fillField(field, value) {
  const tagName = field.tagName.toLowerCase();
  const inputType = field.type ? field.type.toLowerCase() : '';

  try {
    // Simuler et museklikk først for å "vekke" komponenten (hjelper med floating labels)
    field.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    field.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    field.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

    // Gi feltet fokus
    field.focus();

    if (tagName === 'select') {
      fillSelectField(field, value);
    } else if (inputType === 'checkbox') {
      fillCheckboxField(field, value);
    } else if (inputType === 'radio') {
      fillRadioField(field, value);
    } else if (inputType === 'range') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        field.value = numValue;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (field.isContentEditable) {
      field.textContent = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Standard input handling (Text, Email, osv.)
      
      // 1. Sett verdien på "native" måte for å trigge React/Frameworks
      setNativeValue(field, value);
      
      // 2. Send standard events
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));

      // 3. Spesialhåndtering for "smarte" søkefelter (comboboxes)
      const isCombobox = field.getAttribute('role') === 'combobox' || 
                         field.getAttribute('aria-autocomplete') === 'list' ||
                         field.getAttribute('aria-haspopup') === 'listbox';
                         
      if (isCombobox) {
        // Vent litt så søket rekker å kjøre, så velg første resultat
        setTimeout(() => {
            field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
            field.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
            
            setTimeout(() => {
                field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
                field.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
                // Blur etter valg
                field.blur(); 
            }, 100);
        }, 500);
        return; // Avslutt her, blur skjer i timeouten
      }
    }

    // Fjern fokus (blur) til slutt for å trigge validering
    field.blur();

  } catch (error) {
    console.error('Error filling field:', error);
    // Fallback til standard metode hvis noe feiler
    try {
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (e) {}
  }
}

/**
 * Fyll ut select-felt (inkludert multi-select støtte)
 * Håndterer optgroups, disabled options, og partial matching
 */
function fillSelectField(selectElement, value) {
  const options = Array.from(selectElement.options);

  // Filtrer ut disabled options
  const enabledOptions = options.filter(opt => !opt.disabled);

  // Sjekk om det er multi-select
  const isMultiple = selectElement.multiple;

  if (isMultiple && value.includes(',')) {
    // Multi-select: verdier separert med komma
    fillMultiSelect(selectElement, enabledOptions, value);
    return;
  }

  // Single select - finn beste match
  let matchingOption = findBestOptionMatch(enabledOptions, value);

  if (matchingOption) {
    selectElement.value = matchingOption.value;
    // Dispatch events for React/Vue compatibility
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    selectElement.dispatchEvent(new Event('input', { bubbles: true }));
    debugLog('Select filled:', selectElement.name || selectElement.id, '=', matchingOption.value);
  } else {
    debugLog('No matching option found for:', value, 'in', selectElement.name || selectElement.id);
  }
}

/**
 * Finn beste matchende option
 */
function findBestOptionMatch(options, value) {
  const valueLower = value.toLowerCase().trim();

  // Forsøk 1: Eksakt match på value
  let match = options.find(opt => opt.value === value);
  if (match) return match;

  // Forsøk 2: Eksakt match på text
  match = options.find(opt => opt.text.trim() === value);
  if (match) return match;

  // Forsøk 3: Case-insensitive match på value
  match = options.find(opt => opt.value.toLowerCase() === valueLower);
  if (match) return match;

  // Forsøk 4: Case-insensitive match på text
  match = options.find(opt => opt.text.toLowerCase().trim() === valueLower);
  if (match) return match;

  // Forsøk 5: Partial match (text inneholder value)
  match = options.find(opt => opt.text.toLowerCase().includes(valueLower));
  if (match) return match;

  // Forsøk 6: Value inneholder søketeksten
  match = options.find(opt => opt.value.toLowerCase().includes(valueLower));
  if (match) return match;

  // Forsøk 7: Numerisk match (for indeks-baserte values)
  if (/^\d+$/.test(value)) {
    const index = parseInt(value, 10);
    if (index >= 0 && index < options.length) {
      return options[index];
    }
  }

  return null;
}

/**
 * Fyll ut multi-select felt
 */
function fillMultiSelect(selectElement, enabledOptions, value) {
  const values = value.split(',').map(v => v.trim());

  // Reset alle valg først
  for (const opt of selectElement.options) {
    opt.selected = false;
  }

  // Velg matchende options
  let selectedCount = 0;
  for (const val of values) {
    const match = findBestOptionMatch(enabledOptions, val);
    if (match) {
      match.selected = true;
      selectedCount++;
    }
  }

  if (selectedCount > 0) {
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    debugLog('Multi-select filled:', selectElement.name || selectElement.id, selectedCount, 'options selected');
  }
}

/**
 * Fyll ut checkbox-felt
 */
function fillCheckboxField(checkboxElement, value) {
  // Verdien kan være "true"/"false", "checked"/"unchecked", "1"/"0", etc.
  const trueValues = ['true', 'checked', '1', 'yes', 'on'];
  const shouldCheck = trueValues.includes(value.toLowerCase());

  checkboxElement.checked = shouldCheck;
  checkboxElement.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Fyll ut radio button-felt
 */
function fillRadioField(radioElement, value) {
  // For radio buttons, value kan være verdien til den radio button som skal velges
  // eller "true" for å velge denne spesifikke radio button

  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'checked') {
    radioElement.checked = true;
    radioElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (radioElement.value === value) {
    radioElement.checked = true;
    radioElement.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Marker en regel som brukt
 */
async function markRuleAsUsed(ruleId) {
  try {
    await chrome.runtime.sendMessage({
      action: 'updateRule',
      ruleId: ruleId,
      updates: { lastUsed: Date.now() }
    });
  } catch (error) {
    // Service worker kan være invalidated; logg men ikke blokker autofill
    console.warn('Error updating rule (non-blocking):', error?.message || error);
  }
}

/**
 * Observer DOM-endringer for dynamiske sider
 * Lagrer observer-referanse for cleanup ved unload
 */
function observeDOMChanges() {
  // Disconnect existing observer if any (prevents duplicates)
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }

  domObserver = new MutationObserver((mutations) => {
    // Sjekk om nye felt er lagt til
    let hasNewFields = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (isEditableElement(node) || node.querySelector('input, textarea')) {
              hasNewFields = true;
              break;
            }
          }
        }
      }
      if (hasNewFields) break;
    }

    // Kjør autofill hvis nye felt ble funnet (debounced for ytelse)
    if (hasNewFields) {
      debouncedTriggerAutoFill();
    }
  });

  const target = document.body || document.documentElement;
  if (target) {
    domObserver.observe(target, {
      childList: true,
      subtree: true
    });
  }
}

/**
 * Observer modals som åpnes og kjør autofill når de er klare
 * Lagrer observer-referanse for cleanup ved unload
 */
function observeModalChanges() {
  // Disconnect existing observer if any (prevents duplicates)
  if (modalObserver) {
    modalObserver.disconnect();
    modalObserver = null;
  }

  modalObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = mutation.target;

        // Sjekk om et modal/dialog element ble synlig
        const isModal = target.hasAttribute('role') &&
                       (target.getAttribute('role') === 'dialog' ||
                        target.getAttribute('role') === 'modal');

        const isAriaModal = target.hasAttribute('aria-modal') &&
                           target.getAttribute('aria-modal') === 'true';

        const hasModalClass = target.classList.contains('modal') ||
                             target.classList.contains('Modal') ||
                             target.id.toLowerCase().includes('modal');

        const becameVisible = mutation.attributeName === 'style' ||
                             mutation.attributeName === 'class' ||
                             mutation.attributeName === 'aria-hidden';

        if ((isModal || isAriaModal || hasModalClass) && becameVisible) {
          // Sjekk om modalen faktisk er synlig nå
          const style = window.getComputedStyle(target);
          const isVisible = style.display !== 'none' &&
                          style.visibility !== 'hidden' &&
                          style.opacity !== '0';

          if (isVisible) {
            debugLog('Modal detected and visible, triggering autofill after delay...');
            // Gi modalen litt tid til å ferdiginitialisere feltene
            setTimeout(() => {
              triggerAutoFill();
            }, 300);
          }
        }
      } else if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Sjekk om nye modal-elementer ble lagt til
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const isModalElement = node.hasAttribute('role') &&
                                  (node.getAttribute('role') === 'dialog' ||
                                   node.getAttribute('role') === 'modal');

            const hasModalClass = node.classList.contains('modal') ||
                                 node.classList.contains('Modal') ||
                                 node.id.toLowerCase().includes('modal');

            if (isModalElement || hasModalClass) {
              debugLog('New modal element added to DOM, triggering autofill after delay...');
              setTimeout(() => {
                triggerAutoFill();
              }, 300);
            }
          }
        }
      }
    }
  });

  const target = document.body;
  if (target) {
    modalObserver.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'aria-modal', 'aria-hidden', 'role']
    });
  }
}

/**
 * Håndter meldinger fra background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debugLog('[Message Listener] Received message:', request.action, 'from:', sender);

  if (request.action === 'getFieldInfo') {
    handleGetFieldInfo(sendResponse);
    return true;
  } else if (request.action === 'getAllFilledFields') {
    handleGetAllFilledFields(sendResponse);
    return true;
  } else if (request.action === 'listFields') {
    debugLog('[Message Listener] Handling listFields request');
    handleListFields(sendResponse);
    return true;
  } else if (request.action === 'reloadRules') {
    if (request.profileId) currentProfileId = request.profileId;
    loadRulesForCurrentSite(request.profileId || currentProfileId).then(() => {
      performAutoFill(request.force === true);
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'testMatches') {
    if (request.profileId) currentProfileId = request.profileId;
    sendResponse(handleTestMatches(request.profileId || currentProfileId));
    return true;
  } else if (request.action === 'updateSettings') {
    if (request.debugMode !== undefined) {
      debugMode = request.debugMode;
      debugLog('Debug mode:', debugMode ? 'PÅ' : 'AV');
    }
    if (request.autofillEnabled !== undefined) {
      autofillEnabled = request.autofillEnabled;
      debugLog('AutoFill:', autofillEnabled ? 'AKTIVERT' : 'DEAKTIVERT');
      if (autofillEnabled) {
        triggerAutoFill();
      }
    }
    if (request.autofillDelay !== undefined) {
      autofillDelayMs = parseInt(request.autofillDelay) || 0;
    }
    if (request.autofillTrigger !== undefined) {
      autofillTrigger = request.autofillTrigger;
    }
    if (request.blacklist !== undefined) {
      blacklist = request.blacklist || [];
    }
    if (request.whitelist !== undefined) {
      whitelist = request.whitelist || [];
    }
    if (request.fieldBlacklist !== undefined) {
      fieldBlacklist = request.fieldBlacklist || [];
    }
    // ENDRING: Oppdater notification settings
    if (request.notificationsEnabled !== undefined) {
      notificationsEnabled = request.notificationsEnabled;
    }
    if (request.scanToastEnabled !== undefined) {
      scanToastEnabled = request.scanToastEnabled;
    }
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'fillWithProfile') {
      if (request.profileId) currentProfileId = request.profileId;
      loadRulesForCurrentSite(request.profileId || currentProfileId).then(() => {
          performAutoFill(request.force === true);
          sendResponse({ success: true });
      });
      return true;
  } else if (request.action === 'forceFill') {
      if (request.profileId) currentProfileId = request.profileId;
      loadRulesForCurrentSite(request.profileId || currentProfileId).then(() => {
          performAutoFill(true);
          sendResponse({ success: true });
      });
      return true;
  } else if (request.action === 'startRecording') {
      MacroRecorder.start();
      sendResponse({ success: true });
      return true;
  } else if (request.action === 'stopRecording') {
      const steps = MacroRecorder.stop();
      sendResponse({ success: true, steps: steps });
      return true;
  }
  return false;
});

/**
 * Test matchende regler uten † fylle ut
 */
function handleTestMatches(profileId = null) {
  if (profileId) currentProfileId = profileId;
  const fields = findAllEditableFields();
  const matches = [];

  for (const field of fields) {
    if (isFieldBlocked(field)) continue;

    const identifier = getFieldIdentifier(field);
    const match = findMatchingRule(field, identifier);

    if (match) {
      matches.push({
        field: identifier ? `${identifier.type}:${identifier.value}` : getElementType(field),
        elementType: identifier ? identifier.fieldType : getElementType(field),
        ruleId: match.id,
        ruleValue: match.value
      });
    }
  }

  return { success: true, totalFields: fields.length, matches };
}

/**
 * Hent informasjon om siste klikket felt
 */
function handleGetFieldInfo(sendResponse) {
  // Fallback til aktivt element hvis mousedown/contextmenu ikke ble fanget
  if (!lastClickedElement && document.activeElement && isEditableElement(document.activeElement)) {
    lastClickedElement = document.activeElement;
  }

  if (!lastClickedElement) {
    sendResponse({ success: false, error: 'Ingen felt valgt' });
    return;
  }

  if (isFieldBlocked(lastClickedElement)) {
      sendResponse({ success: false, error: 'Feltet er blokkert av innstillinger.' });
      return;
  }

  const identifier = getFieldIdentifier(lastClickedElement);
  if (!identifier) {
    sendResponse({ success: false, error: 'Kunne ikke identifisere felt' });
    return;
  }

  const loc = getEffectiveLocation();

  const field = {
    type: identifier.type,
    identifier: identifier.value,
    value: getFieldValue(lastClickedElement),
    fieldType: identifier.fieldType,
    tagName: lastClickedElement.tagName.toLowerCase(),
    hostname: loc.hostname,
    url: loc.href
  };

  sendResponse({ success: true, field });
}

/**
 * Hent verdi fra et felt basert på type
 */
function getFieldValue(field) {
  const tagName = field.tagName.toLowerCase();
  const inputType = field.type ? field.type.toLowerCase() : '';

  if (inputType === 'checkbox') {
    return field.checked ? 'true' : 'false';
  } else if (inputType === 'radio') {
    return field.checked ? field.value : '';
  } else if (tagName === 'select') {
    return field.value || field.options[field.selectedIndex]?.text || '';
  } else if (field.isContentEditable) {
    return field.textContent;
  } else {
    return field.value;
  }
}

/**
 * Hent alle utfylte felt på siden
 */
function handleGetAllFilledFields(sendResponse) {
  const fields = findAllEditableFields();
  const filledFields = [];

  for (const field of fields) {
    if (isFieldBlocked(field)) continue;

    const value = getFieldValue(field);

    // Skip tom felt, men inkluder checked checkboxes og radios
    const inputType = field.type ? field.type.toLowerCase() : '';
    if (!value && inputType !== 'checkbox' && inputType !== 'radio') continue;

    // For radio buttons, kun inkluder de som er checked
    if (inputType === 'radio' && !field.checked) continue;

    const identifier = getFieldIdentifier(field);
    if (!identifier) continue;

    filledFields.push({
      type: identifier.type,
      identifier: identifier.value,
      value: value,
      fieldType: identifier.fieldType,
      tagName: field.tagName.toLowerCase(),
      hostname: getEffectiveLocation().hostname,
      url: getEffectiveLocation().href
    });
  }

  sendResponse({ success: true, fields: filledFields });
}

/**
 * List opp alle redigerbare felt (for popup-oversikt)
 */
function handleListFields(sendResponse) {
  const fields = findAllEditableFields();
  debugLog('handleListFields: Found', fields.length, 'editable fields');
  const mapped = [];

  for (const field of fields) {
    const identifier = getFieldIdentifier(field);
    if (!identifier) {
      debugLog('handleListFields: No identifier for field', field.tagName, field.type);
      continue;
    }

    mapped.push({
      type: identifier.type,
      identifier: identifier.value,
      fieldType: identifier.fieldType,
      value: getFieldValue(field)
    });
  }

  debugLog('handleListFields: Returning', mapped.length, 'fields');
  sendResponse({ success: true, fields: mapped });
}

async function loadCurrentProfile() {
  try {
    const res = await chrome.storage.local.get('currentProfileId');
    if (res.currentProfileId) {
      currentProfileId = res.currentProfileId;
    }
  } catch (e) {
  console.error('Error loading current profile', e);
  }
}

/**
 * Cleanup function - disconnects observers to prevent memory leaks
 * Called on page unload/navigation
 */
function cleanup() {
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }
  if (modalObserver) {
    modalObserver.disconnect();
    modalObserver = null;
  }
  debugLog('AutoFill cleanup completed - observers disconnected');
}

// Register cleanup on page navigation to prevent memory leaks
// NOTE: 'unload' event is deprecated and blocked by Permissions-Policy on many sites
// Using 'pagehide' instead which is the modern replacement
window.addEventListener('pagehide', cleanup);

// End of content script

// --------------------------------------------------
// End of content script
// --------------------------------------------------

} // end duplicate-load guard
