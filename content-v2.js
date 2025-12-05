/**
 * Content Script for AutoFill Plugin
 * Kjører på alle websider og håndterer felt-deteksjon og autofill
 */

// Globale variabler
let lastClickedElement = null;
let autoFillRules = [];

/**
 * Initialiser content script
 */
(async function init() {
  console.log('AutoFill Plugin content script lastet');

  // Hent regler for denne siden
  await loadRulesForCurrentSite();

  // Lytt til focus-events for å spore siste klikket element
  document.addEventListener('mousedown', handleMouseDown, true);

  // Kjør autofill når siden er ferdig lastet
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performAutoFill);
  } else {
    performAutoFill();
  }

  // Observer DOM-endringer for dynamiske sider (SPA)
  observeDOMChanges();
})();

/**
 * Håndter museklikk for å spore siste klikket element
 */
function handleMouseDown(event) {
  if (isEditableElement(event.target)) {
    lastClickedElement = event.target;
  }
}

/**
 * Sjekk om et element er redigerbart
 */
function isEditableElement(element) {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const type = element.type ? element.type.toLowerCase() : '';

  // Input-felt (unntatt submit, button, osv.)
  if (tagName === 'input') {
    const editableTypes = ['text', 'email', 'password', 'search', 'tel', 'url', 'number'];
    return editableTypes.includes(type);
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
 * Hent regler for gjeldende side
 */
async function loadRulesForCurrentSite() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getRulesForSite',
      url: window.location.href
    });

    if (response && response.success) {
      autoFillRules = response.rules;
      console.log(`Lastet ${autoFillRules.length} regler for denne siden`);
    }
  } catch (error) {
    console.error('Feil ved lasting av regler:', error);
  }
}

/**
 * Utfør automatisk utfylling
 */
function performAutoFill() {
  if (autoFillRules.length === 0) {
    return;
  }

  const fields = findAllEditableFields();
  let filledCount = 0;

  for (const field of fields) {
    const identifier = getFieldIdentifier(field);
    if (!identifier) continue;

    // Finn matchende regel
    const matchingRule = findMatchingRule(identifier);

    if (matchingRule && !field.value) {
      fillField(field, matchingRule.value);
      filledCount++;

      // Marker regelen som brukt
      markRuleAsUsed(matchingRule.id);
    }
  }

  if (filledCount > 0) {
    console.log(`AutoFill: Fylte ut ${filledCount} felt`);
  }
}

/**
 * Finn alle redigerbare felt på siden
 */
function findAllEditableFields() {
  const fields = [];

  // Input-felt
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], input[type="number"], input:not([type])');
  fields.push(...Array.from(inputs));

  // Textareas
  const textareas = document.querySelectorAll('textarea');
  fields.push(...Array.from(textareas));

  return fields;
}

/**
 * Hent identifikator for et felt
 */
function getFieldIdentifier(field) {
  // Prioriter: name > id > placeholder
  if (field.name) return { type: 'name', value: field.name };
  if (field.id) return { type: 'id', value: field.id };
  if (field.placeholder) return { type: 'placeholder', value: field.placeholder };

  return null;
}

/**
 * Finn matchende regel for et felt
 */
function findMatchingRule(identifier) {
  if (!identifier) return null;

  for (const rule of autoFillRules) {
    // Sjekk om felttype matcher
    if (rule.fieldType !== identifier.type) continue;

    // Match mønster
    if (matchPattern(identifier.value, rule.fieldPattern, rule.fieldUseRegex)) {
      return rule;
    }
  }

  return null;
}

/**
 * Match et mønster
 */
function matchPattern(text, pattern, useRegex) {
  if (useRegex) {
    try {
      const regex = new RegExp(pattern);
      return regex.test(text);
    } catch (error) {
      console.error('Ugyldig regex:', pattern, error);
      return false;
    }
  } else {
    // Wildcard matching
    return matchWildcard(text, pattern);
  }
}

/**
 * Match wildcard-mønster
 */
function matchWildcard(text, pattern) {
  // Eksakt match
  if (text === pattern) return true;

  // Konverter wildcard til regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  try {
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(text);
  } catch (error) {
    return false;
  }
}

/**
 * Fyll ut et felt
 */
function fillField(field, value) {
  // Sett verdi
  field.value = value;

  // Trigger events for å sikre at skjemaet registrerer endringen
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
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
    console.error('Feil ved oppdatering av regel:', error);
  }
}

/**
 * Observer DOM-endringer for dynamiske sider
 */
function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
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

    // Kjør autofill hvis nye felt ble funnet
    if (hasNewFields) {
      setTimeout(performAutoFill, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Håndter meldinger fra background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFieldInfo') {
    handleGetFieldInfo(sendResponse);
    return true;
  } else if (request.action === 'getAllFilledFields') {
    handleGetAllFilledFields(sendResponse);
    return true;
  } else if (request.action === 'reloadRules') {
    loadRulesForCurrentSite().then(() => {
      performAutoFill();
      sendResponse({ success: true });
    });
    return true;
  }
});

/**
 * Hent informasjon om siste klikket felt
 */
function handleGetFieldInfo(sendResponse) {
  if (!lastClickedElement) {
    sendResponse({ success: false, error: 'Ingen felt valgt' });
    return;
  }

  const identifier = getFieldIdentifier(lastClickedElement);
  if (!identifier) {
    sendResponse({ success: false, error: 'Kunne ikke identifisere felt' });
    return;
  }

  const field = {
    type: identifier.type,
    identifier: identifier.value,
    value: lastClickedElement.value,
    tagName: lastClickedElement.tagName.toLowerCase()
  };

  sendResponse({ success: true, field });
}

/**
 * Hent alle utfylte felt på siden
 */
function handleGetAllFilledFields(sendResponse) {
  const fields = findAllEditableFields();
  const filledFields = [];

  for (const field of fields) {
    if (!field.value) continue;

    const identifier = getFieldIdentifier(field);
    if (!identifier) continue;

    filledFields.push({
      type: identifier.type,
      identifier: identifier.value,
      value: field.value,
      tagName: field.tagName.toLowerCase()
    });
  }

  sendResponse({ success: true, fields: filledFields });
}
