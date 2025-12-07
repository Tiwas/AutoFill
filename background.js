/**
 * Background Service Worker for AutoFill Plugin
 * Håndterer context menus og koordinering mellom content scripts og popup
 */

// Importer nødvendige moduler
importScripts('utils.js', 'storage.js', 'pattern-matcher.js', 'rule-optimizer.js', 'translations.js', 'cloud.js');

// Aktiver debug-logging basert på storage
chrome.storage.local.get(['debugMode']).then(result => {
  if (result.debugMode) {
    Logger.enableDebug();
  }
});

const CONTEXT_MENU_SET_PROFILE_PARENT = 'autofill_set_profile_parent';
const CONTEXT_MENU_SET_PROFILE_PREFIX = 'autofill_set_profile_';

// Context menu IDs
const CONTEXT_MENU_ADD_FIELD = 'autofill_add_field';
const CONTEXT_MENU_ADD_ALL = 'autofill_add_all';

/**
 * Initialiser extension ved installasjon
 */
chrome.runtime.onInstalled.addListener(() => {
  Logger.info('Background', 'AutoFill Plugin installed');
  createContextMenus();
  initBadge();
  // Content script registreres via manifest.json - ingen dynamisk registrering nødvendig
});

/**
 * Initialiser extension ved oppstart
 */
chrome.runtime.onStartup.addListener(() => {
  Logger.info('Background', 'AutoFill Plugin started');
  initBadge();
  // Content script registreres via manifest.json - ingen dynamisk registrering nødvendig
});

/**
 * Lytt på tab-endringer for å oppdatere badge
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Valider tabId
    if (!activeInfo.tabId || typeof activeInfo.tabId !== 'number') return;

    const tab = await chrome.tabs.get(activeInfo.tabId);
    await updateBadgeForTab(activeInfo.tabId, tab.url);
  } catch (e) {
    // Ignorer "No tab with id" feil - tab kan ha blitt lukket
    if (e?.message?.includes('No tab with id')) return;
    ErrorHandler.handleChromeError(e, 'onActivated');
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    // Valider tabId
    if (!tabId || typeof tabId !== 'number') return;

    // Oppdater kun når URL endres eller siden er ferdig lastet
    if (changeInfo.url || changeInfo.status === 'complete') {
      await updateBadgeForTab(tabId, tab.url);
    }
  } catch (e) {
    // Ignorer "No tab with id" feil - tab kan ha blitt lukket
    if (e?.message?.includes('No tab with id')) return;
    ErrorHandler.handleChromeError(e, 'onUpdated');
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    await updateBadgeForCurrentTab();
  }
});

/**
 * Initialiser badge basert på innstillinger
 */
async function initBadge() {
  try {
    const result = await chrome.storage.local.get(['autofillEnabled']);
    const enabled = result.autofillEnabled !== false; // Default true
    await updateBadge(enabled);
  } catch (error) {
    ErrorHandler.handleChromeError(error, 'initBadge');
  }
}

/**
 * Oppdater extension badge
 * @param {boolean} autofillEnabled - Om autofill er aktivert
 */
async function updateBadge(autofillEnabled) {
  try {
    await updateBadgeForCurrentTab();
  } catch (error) {
    ErrorHandler.handleChromeError(error, 'updateBadge');
  }
}

/**
 * Opprett context menus
 */
async function createContextMenus() {
  const profiles = await Storage.getProfiles();
  const t = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS.current) || TRANSLATIONS?.en || {};
  const cm = t.contextMenu || {};

  // Fjern eksisterende menus først
  chrome.contextMenus.removeAll(() => {
    // Legg til enkeltfelt
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ADD_FIELD,
      title: cm.addField || 'Legg til dette feltet i AutoFill',
      contexts: ['editable']
    });

    // Legg til alle felt
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ADD_ALL,
      title: cm.addAll || 'Legg til alle utfylte felt',
      contexts: ['page']
    });

    // Fyll ut som profil (Parent)
    chrome.contextMenus.create({
        id: 'autofill_fill_as_parent',
        title: cm.fillAs || 'Fyll ut som...', 
        contexts: ['page', 'editable']
    });

    // Profiler (Children)
    profiles.forEach(p => {
        chrome.contextMenus.create({
            id: `autofill_profile_${p.id}`,
            parentId: 'autofill_fill_as_parent',
            title: p.name,
            contexts: ['page', 'editable']
        });
    });

    // Sett aktiv profil (Parent)
    chrome.contextMenus.create({
      id: CONTEXT_MENU_SET_PROFILE_PARENT,
      title: cm.setActive || 'Sett aktiv profil',
      contexts: ['page', 'editable']
    });
    profiles.forEach(p => {
      chrome.contextMenus.create({
        id: `${CONTEXT_MENU_SET_PROFILE_PREFIX}${p.id}`,
        parentId: CONTEXT_MENU_SET_PROFILE_PARENT,
        title: p.name,
        contexts: ['page', 'editable']
      });
    });
  });
}

/**
 * Håndter context menu klikk
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ADD_FIELD) {
    await handleAddFieldSafe(tab.id, info);
  } else if (info.menuItemId === CONTEXT_MENU_ADD_ALL) {
    await handleAddAllFieldsSafe(tab.id, info);
  } else if (info.menuItemId.startsWith('autofill_profile_')) {
      const profileId = info.menuItemId.replace('autofill_profile_', '');
      await sendMessageWithFallback(tab.id, {
          action: 'fillWithProfile',
          profileId: profileId
      }, info.frameId);
  } else if (info.menuItemId.startsWith(CONTEXT_MENU_SET_PROFILE_PREFIX)) {
      const profileId = info.menuItemId.replace(CONTEXT_MENU_SET_PROFILE_PREFIX, '');
      await chrome.storage.local.set({ currentProfileId: profileId });
      chrome.runtime.sendMessage({ action: 'setCurrentProfile', profileId });
  }
});

// Funksjon for å oppdatere badge basert på gjeldende side
async function updateBadgeForCurrentTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tabs || tabs.length === 0) return;

    const tab = tabs[0];
    await updateBadgeForTab(tab.id, tab.url);
  } catch (error) {
    if (error.message && error.message.includes('No tab with id')) return;
    console.error('Error updating badge for current tab:', error);
  }
}

// Hjelpefunksjon for å sette badge trygt (ignorer feil hvis tab er lukket)
async function safeBadgeUpdate(tabId, { text, color, title }) {
  try {
    if (text !== undefined) await chrome.action.setBadgeText({ text, tabId });
    if (color) await chrome.action.setBadgeBackgroundColor({ color, tabId });
    if (title) await chrome.action.setTitle({ title, tabId });
  } catch (e) {
    // Tab er sannsynligvis lukket - ignorer stille
  }
}

/**
 * Sjekk om en URL er blokkert av blacklist/whitelist
 *
 * Støtter følgende mønstre:
 * - "facebook.com" → matcher facebook.com OG *.facebook.com (smart domene-matching)
 * - "*.facebook.com" → matcher kun subdomener (www.facebook.com, m.facebook.com)
 * - "regex:pattern" → matcher med regex
 * - "example.com/path*" → matcher URL med wildcard
 */
async function isUrlBlocked(url) {
  try {
    const hostname = new URL(url).hostname;
    const { blacklist = [], whitelist = [] } = await chrome.storage.local.get(['blacklist', 'whitelist']);

    // Matching funksjon som støtter wildcards, regex og smart domene-matching
    const matchesPattern = (patterns, hostname, fullUrl) => {
      return patterns.some(pattern => {
        pattern = pattern.trim();
        if (!pattern) return false;

        // Regex-mønster (prefiks "regex:")
        if (pattern.startsWith('regex:')) {
          try {
            const regex = new RegExp(pattern.slice(6), 'i');
            return regex.test(hostname) || regex.test(fullUrl);
          } catch (e) {
            return false;
          }
        }

        // Eksakt match
        if (hostname === pattern || fullUrl === pattern) return true;

        // Wildcard-mønster (inneholder * eller ?)
        if (pattern.includes('*') || pattern.includes('?')) {
          const regexPattern = '^' + pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.') + '$';
          try {
            const regex = new RegExp(regexPattern, 'i');
            return regex.test(hostname) || regex.test(fullUrl);
          } catch (e) {
            return false;
          }
        }

        // Smart domene-matching: "facebook.com" matcher også "*.facebook.com"
        // Sjekk om hostname er eksakt match ELLER slutter med .pattern
        if (hostname === pattern || hostname.endsWith('.' + pattern)) {
          return true;
        }

        return false;
      });
    };

    // Whitelist har prioritet - hvis whitelist er satt og URL ikke matcher, blokker
    if (whitelist.length > 0 && !matchesPattern(whitelist, hostname, url)) {
      return true;
    }

    // Sjekk blacklist
    if (blacklist.length > 0 && matchesPattern(blacklist, hostname, url)) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

async function updateBadgeForTab(tabId, url) {
  try {
    // Valider tabId først
    if (!tabId || typeof tabId !== 'number') {
      return;
    }

    // Sjekk om tab fortsatt eksisterer før vi gjør noe
    try {
      await chrome.tabs.get(tabId);
    } catch (e) {
      // Tab eksisterer ikke lenger, ignorer stille
      return;
    }

    // Sjekk først om autofill er avslått
    const settings = await chrome.storage.local.get(['autofillEnabled']);
    if (settings.autofillEnabled === false) {
      await safeBadgeUpdate(tabId, { text: 'OFF', color: '#ef4444', title: 'AutoFill Plugin - Deaktivert' });
      return;
    }

    // Ignorer chrome:// og chrome-extension:// sider
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      await safeBadgeUpdate(tabId, { text: '', title: 'AutoFill Plugin' });
      return;
    }

    // Sjekk blacklist/whitelist
    if (await isUrlBlocked(url)) {
      await safeBadgeUpdate(tabId, { text: '', title: 'AutoFill Plugin - Blokkert' });
      return;
    }

    // Hent aktiv profil (hvis satt), ellers default
    const { currentProfileId } = await chrome.storage.local.get('currentProfileId');
    const profileId = currentProfileId && currentProfileId !== 'default' ? currentProfileId : null;

    // Hent regler som matcher denne siden (bruker getRulesForSite som håndterer profiler)
    const matchingRules = await Storage.getRulesForSite(url, profileId);

    if (matchingRules.length === 0) {
      await safeBadgeUpdate(tabId, { text: '', title: 'AutoFill Plugin' });
      return;
    }

    // Sett midlertidig "?" mens vi skanner felter
    await safeBadgeUpdate(tabId, { text: '?', color: '#667eea', title: 'AutoFill Plugin - scanning fields…' });

    // Prøv å hente felt fra siden for å kategorisere regler
    let fullMatches = 0;
    let partialMatches = matchingRules.length;

    try {
      let attempt = 0;
      let fieldsResponse = null;
      while (attempt < 3 && (!fieldsResponse || !fieldsResponse.success || !fieldsResponse.fields || fieldsResponse.fields.length === 0)) {
        fieldsResponse = await sendMessageWithFallback(tabId, { action: 'listFields' });
        if (fieldsResponse && fieldsResponse.success && fieldsResponse.fields && fieldsResponse.fields.length > 0) break;
        attempt++;
        await new Promise(res => setTimeout(res, 300));
      }

      if (fieldsResponse?.success && Array.isArray(fieldsResponse.fields)) {
        const fields = fieldsResponse.fields;

        // Kategoriser regler basert på om de matcher felt
        fullMatches = 0;
        partialMatches = 0;

        for (const rule of matchingRules) {
          if (checkRuleMatchesFields(rule, fields)) {
            fullMatches++;
          } else {
            partialMatches++;
          }
        }
      } else {
        // Ingen felter tilgjengelig enda; la popup/CS oppdatere senere
        await safeBadgeUpdate(tabId, { text: '?', color: '#667eea', title: 'AutoFill Plugin - scanning…' });
        return;
      }
    } catch (e) {
      // Content script ikke tilgjengelig ennå; behold '?' og la popup/CS oppdatere senere
      await safeBadgeUpdate(tabId, { text: '?', color: '#667eea', title: 'AutoFill Plugin - scanning…' });
      return;
    }

    // Vis kun full matches i badge
    if (fullMatches > 0) {
      const title = `AutoFill Plugin - ${fullMatches} ${fullMatches === 1 ? 'match' : 'matches'}${partialMatches > 0 ? `, ${partialMatches} partial` : ''}`;
      await safeBadgeUpdate(tabId, { text: fullMatches.toString(), color: '#667eea', title });
    } else {
      await safeBadgeUpdate(tabId, { text: '', title: 'AutoFill Plugin' });
    }
  } catch (error) {
    if (error.message && error.message.includes('No tab with id')) return;
    console.error('Error updating badge for tab:', error);
  }
}

/**
 * Sjekk om en regel matcher noen av feltene (helper for badge)
 */
function checkRuleMatchesFields(rule, fields) {
  if (!fields || fields.length === 0) return false;

  for (const field of fields) {
    // Sjekk elementtype
    if (rule.elementType && rule.elementType !== 'text' && rule.elementType !== field.fieldType) {
      continue;
    }

    // Sjekk felttype
    if (rule.fieldType !== field.type) {
      continue;
    }

    // Sjekk mønster
    const fieldValue = field.identifier;
    let matches = false;

    if (rule.fieldType === 'selector') {
      matches = true;
    } else if (rule.fieldUseRegex) {
      try {
        const regex = new RegExp(rule.fieldPattern, 'i');
        matches = regex.test(fieldValue);
      } catch (e) {
        matches = false;
      }
    } else {
      // Wildcard matching
      if (fieldValue === rule.fieldPattern) {
        matches = true;
      } else {
        const regexPattern = rule.fieldPattern
          .replace(/[.+^${}()|[\\]/g, '\\$&')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        try {
          const regex = new RegExp(`^${regexPattern}$`);
          matches = regex.test(fieldValue);
        } catch (error) {
          matches = false;
        }
      }
    }

    if (matches) {
      return true;
    }
  }

  return false;
}

/**
 * Oppdater badge med nøyaktig antall matches (fra popup)
 * @param {number} tabId - Tab ID
 * @param {number} fullMatches - Antall full matches (felt matcher)
 * @param {number} partialMatches - Antall partial matches (kun domene matcher)
 */
async function updateBadgeWithCounts(tabId, fullMatches, partialMatches) {
  try {
    // Valider tabId først
    if (!tabId || typeof tabId !== 'number') {
      return;
    }

    // Sjekk om tab fortsatt eksisterer
    try {
      await chrome.tabs.get(tabId);
    } catch (e) {
      // Tab eksisterer ikke lenger, ignorer stille
      return;
    }

    // Sjekk først om autofill er avslått
    const settings = await chrome.storage.local.get(['autofillEnabled']);
    if (settings.autofillEnabled === false) {
      await safeBadgeUpdate(tabId, { text: 'OFF', color: '#ef4444', title: 'AutoFill Plugin - Deaktivert' });
      return;
    }

    // Vis kun antall full matches
    if (fullMatches === 0) {
      await safeBadgeUpdate(tabId, { text: '', title: 'AutoFill Plugin' });
      return;
    }

    // Oppdater tooltip
    let title = 'AutoFill Plugin';
    if (fullMatches > 0 && partialMatches > 0) {
      title = `AutoFill Plugin - ${fullMatches} ${fullMatches === 1 ? 'match' : 'matches'}, ${partialMatches} partial`;
    } else if (fullMatches > 0) {
      title = `AutoFill Plugin - ${fullMatches} ${fullMatches === 1 ? 'match' : 'matches'}`;
    } else if (partialMatches > 0) {
      title = `AutoFill Plugin - ${partialMatches} partial ${partialMatches === 1 ? 'match' : 'matches'}`;
    }

    await safeBadgeUpdate(tabId, { text: fullMatches.toString(), color: '#667eea', title });
  } catch (error) {
    if (error.message && error.message.includes('No tab with id')) return;
    console.error('Error updating badge with counts:', error);
  }
}

/**
 * Vis dialog for å legge til enkeltfelt
 * @param {Object} field - Feltinformasjon
 * @param {number} tabId - Tab ID
 */
async function showAddFieldDialog(field, tabId) {
  try {
    // Hent gjeldende URL
    const tab = await chrome.tabs.get(tabId);
    let hostname = new URL(tab.url).hostname;

    // Bruk frame hostname hvis tilgjengelig (for iframes)
    if (field.hostname) {
      hostname = field.hostname;
    }

    // Opprett regel basert på feltinformasjon
    const rule = {
      sitePattern: hostname,
      siteMatchType: 'host',
      elementType: field.fieldType || 'text',
      fieldType: field.type || 'name',
      fieldPattern: field.identifier,
      fieldUseRegex: false,
      value: field.value
    };

    // Lagre regelen
    const savedRule = await Storage.addRule(rule);

    // Vis bekreftelse
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoFill - Regel lagt til',
      message: `Felt "${field.identifier}" på ${hostname} er lagt til`
    });

    console.log('Rule added:', savedRule);
  } catch (error) {
    if (error.message && error.message.includes('No tab with id')) return;
    console.warn('Could not add field (tab closed?):', error);
  }
}

/**
 * Vis dialog for å legge til flere felt
 * @param {Array} fields - Liste av felt
 * @param {number} tabId - Tab ID
 */
async function showAddMultipleFieldsDialog(fields, tabId) {
  try {
    // Hent gjeldende URL
    const tab = await chrome.tabs.get(tabId);
    let hostname = new URL(tab.url).hostname;

    // Bruk frame hostname hvis tilgjengelig (anta at alle felt er fra samme frame)
    if (fields.length > 0 && fields[0].hostname) {
      hostname = fields[0].hostname;
    }

    // Opprett regler for alle feltene
    const rules = fields.map(field => ({
      sitePattern: hostname,
      siteMatchType: 'host',
      elementType: field.fieldType || 'text',
      fieldType: field.type || 'name',
      fieldPattern: field.identifier,
      fieldUseRegex: false,
      value: field.value
    }));

    // Lagre alle reglene
    for (const rule of rules) {
      await Storage.addRule(rule);
    }

    // Vis bekreftelse
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoFill - Regler lagt til',
      message: `${fields.length} felt på ${hostname} er lagt til`
    });

    console.log(`${fields.length} rules added`);
  } catch (error) {
    if (error.message && error.message.includes('No tab with id')) return;
    console.warn('Could not add fields (tab closed?):', error);
  }
}

/**
 * Håndter meldinger fra content scripts og popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // --- Oppdater badge når regler endres ---
  if (['addRule', 'updateRule', 'deleteRule', 'importCSV', 'reorderRules'].includes(request.action)) {
    // Bruk timeout for å la lagringen bli ferdig først
    setTimeout(() => {
        updateBadgeForCurrentTab().catch(err => console.error('Error updating badge:', err));
    }, 100);
  }
  // --- SLUTT ---

  if (request.action === 'getRulesForSite') {
    handleGetRulesForSite(request.url, request.profileId).then(sendResponse);
    return true; // Indikerer at vi vil sende respons asynkront
  } else if (request.action === 'addRule') {
    Storage.addRule(request.rule).then(sendResponse);
    return true;
  } else if (request.action === 'updateRule') {
    Storage.updateRule(request.ruleId, request.updates).then(sendResponse);
    return true;
  } else if (request.action === 'deleteRule') {
    Storage.deleteRule(request.ruleId).then(sendResponse);
    return true;
  } else if (request.action === 'getAllRules') {
    Storage.getRules().then(sendResponse);
    return true;
  } else if (request.action === 'exportCSV') {
    Storage.exportToCSV().then(sendResponse);
    return true;
  } else if (request.action === 'importCSV') {
    Storage.importFromCSV(request.csv, request.merge).then(sendResponse);
    return true;
  } else if (request.action === 'reorderRules') {
    Storage.reorderRules(request.order || []).then(sendResponse);
    return true;
  } else if (request.action === 'pushSync') {
    Storage.pushToSync().then(sendResponse);
    return true;
  } else if (request.action === 'pullSync') {
    Storage.pullFromSync().then(sendResponse);
    return true;
  } else if (request.action === 'cloudBackup') {
    CloudBackup.uploadBackup(request.provider, request.csv).then(sendResponse);
    return true;
  } else if (request.action === 'cloudListBackups') {
    CloudBackup.listBackups(request.provider).then(sendResponse);
    return true;
  } else if (request.action === 'cloudDownloadBackup') {
    CloudBackup.downloadBackup(request.provider, request.fileId).then(sendResponse);
    return true;
  } else if (request.action === 'saveCloudConfig') {
    CloudBackup.saveConfig(request.provider, request.config).then(sendResponse);
    return true;
  } else if (request.action === 'getCloudConfig') {
    CloudBackup.getConfig().then((config) => sendResponse({ success: true, config }));
    return true;
  } else if (request.action === 'cloudAuth') {
    CloudBackup.ensureToken(request.provider)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message || 'auth_failed' }));
    return true;
  } else if (request.action === 'updateBadge') {
    updateBadge(request.autofillEnabled).then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'updateBadgeCount') {
    updateBadgeWithCounts(request.tabId, request.fullMatches, request.partialMatches).then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'refreshContextMenus') {
      createContextMenus();
      sendResponse({ success: true });
      return true;
  } else if (request.action === 'refreshBadge') {
      const tabId = sender?.tab?.id;
      const url = sender?.tab?.url;
      if (tabId && url) {
        updateBadgeForTab(tabId, url).then(() => sendResponse({ success: true })).catch(err => {
          console.error('Error refreshing badge:', err);
          sendResponse({ success: false, error: err?.message });
        });
        return true;
      }
      sendResponse({ success: false, error: 'No tab info' });
      return true;
  }
});

/** 
 * Hent regler for en spesifikk side
 * @param {string} url - URL til siden
 * @param {string} profileId - Valgfri profil ID
 * @returns {Promise<Array>} Matchende regler
 */
async function handleGetRulesForSite(url, profileId = null) {
  try {
    const rules = await Storage.getRulesForSite(url, profileId);
    return { success: true, rules };
  } catch (error) {
    console.error('Error fetching rules for page:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send melding til tab, injiser content script om nødvendig
 */
async function sendMessageWithFallback(tabId, message, frameId) {
  let tab = null;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch (e) {
    // Tab is likely closed or inaccessible
    return { success: false, error: 'Tab not found or closed' };
  }
  
  const url = tab && tab.url ? tab.url : '';

  if (!url || url.startsWith('chrome://') || url.startsWith('edge://')) {
    return { success: false, error: 'Siden er ikke støttet (chrome/edge).' };
  }
  if (url.startsWith('chrome-extension://') && !url.includes(chrome.runtime.id)) {
    return { success: false, error: 'Siden tilhører en annen utvidelse.' };
  }

  const trySend = async () => {
    const options = typeof frameId === 'number' ? { frameId } : undefined;
    try {
      return await chrome.tabs.sendMessage(tabId, message, options);
    } catch (error) {
      if (error && error.message && error.message.includes('Receiving end does not exist')) {
        return null; // Trigger fallback injection
      }
      return { success: false, error: error.message || 'Ukjent feil ved melding.' };
    }
  };

  let response = await trySend();
  if (response !== null) {
    return response;
  }

  const injectionResult = await injectContentScript(tabId, url);
  if (!injectionResult.success) {
    return { success: false, error: injectionResult.error || 'Fant ikke content script.' };
  }

  response = await trySend();
  if (response === null) {
    return { success: false, error: 'Fant ikke content script. Oppdater siden og prøv igjen.' };
  }
  return response;
}

async function injectContentScript(tabId, url) {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'file:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return { success: false, error: 'Siden støttes ikke for injeksjon.' };
    }

    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content.js']
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Klarte ikke å injisere content script.' };
  }
}

// FJERNET: ensureContentScriptRegistered()
// Content script registreres nå KUN via manifest.json for å unngå duplikat-injeksjon.
// Den gamle dynamiske registreringen kunne forårsake at content.js ble kjørt to ganger.

// Override with fallback-aware handlers
async function handleAddFieldSafe(tabId, info) {
  const response = await sendMessageWithFallback(tabId, {
    action: 'getFieldInfo',
    frameId: info.frameId
  }, info.frameId);

  if (response && response.success) {
    await showAddFieldDialog(response.field, tabId);
  } else {
    notifyCannotCapture(response && response.error ? response.error : 'Fant ikke feltet. Klikk i feltet og prøv igjen.');
  }
}

async function handleAddAllFieldsSafe(tabId, info) {
const response = await sendMessageWithFallback(tabId, {
    action: 'getAllFilledFields'
  }, info ? info.frameId : 0);

  if (response && response.success && response.fields && response.fields.length > 0) {
    await showAddMultipleFieldsDialog(response.fields, tabId);
  } else {
    notifyCannotCapture(response && response.error ? response.error : 'Ingen utfylte felt funnet på denne siden.');
  }
}

/**
 * Håndter globale feil
 */
self.addEventListener('error', (event) => {
  Logger.error('Background', 'Uncaught error:', event.error);
});

Logger.info('Background', 'Service worker initialized');

function notifyCannotCapture(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'AutoFill',
    message: message || 'Fant ikke feltet. Klikk i feltet og prøv igjen.'
  });
}