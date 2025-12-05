let allRules = [];
let filteredRules = [];
let selectedRules = new Set();
let groupBySite = true;
let sortBy = 'order';
let editingRuleId = null;
let availableFields = []; // Added for renderAvailableFields
let currentProfileId = null;
let profiles = [];
let userVariables = {};
let selectMode = false;

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  initElements();
  attachEvents();
  loadSettings();
  loadProfiles();
  loadVariables();
  loadRules();
});

function initElements() {
  elements.searchInput = document.getElementById('searchInput');
  elements.searchMode = document.getElementById('searchMode');
  elements.activeProfileSelect = document.getElementById('activeProfileSelect');
  elements.filterEnabled = document.getElementById('filterEnabled');
  elements.filterRegex = document.getElementById('filterRegex');
  elements.groupBySite = document.getElementById('groupBySite');
  elements.sortBy = document.getElementById('sortBy');
  elements.rulesContainer = document.getElementById('rulesContainer');
  elements.totalRules = document.getElementById('totalRules');
  elements.activeRules = document.getElementById('activeRules');
  elements.regexRules = document.getElementById('regexRules');
  elements.selectedCount = document.getElementById('selectedCount');
  elements.searchRegex = document.getElementById('searchRegex');
  elements.searchMatchFields = document.getElementById('searchMatchFields');
  elements.searchMatchValues = document.getElementById('searchMatchValues');
  elements.exportSelectedBtn = document.getElementById('exportSelectedBtn');
  elements.importRulesBtn = document.getElementById('importRulesBtn');
  elements.validateRulesBtn = document.getElementById('validateRulesBtn');
  elements.refreshBtn = document.getElementById('refreshBtn');
  elements.importFile = document.getElementById('importFile');
  elements.validateFile = document.getElementById('validateFile');
  elements.openPopupBtn = document.getElementById('openPopupBtn');
  elements.mergeFilteredBtn = document.getElementById('mergeFilteredBtn');
  elements.cloudBackupBtn = document.getElementById('cloudBackupBtn');
  elements.cloudRestoreBtn = document.getElementById('cloudRestoreBtn');
  elements.floatingActions = document.getElementById('floatingActions');
  elements.aiAssistBtn = document.getElementById('aiAssistBtn');
  elements.optimizeBtn = document.getElementById('optimizeBtn');
  elements.variablesBtn = document.getElementById('variablesBtn');
  elements.selectModeBtn = document.getElementById('selectModeBtn');
  elements.addRuleBtn = document.getElementById('addRuleBtn');
  elements.selectionBar = document.getElementById('selectionBar');
  elements.selectionCount = document.getElementById('selectionCount');
  elements.bulkEnable = document.getElementById('bulkEnable');
  elements.bulkDisable = document.getElementById('bulkDisable');
  elements.bulkDelete = document.getElementById('bulkDelete');
  elements.exitSelectMode = document.getElementById('exitSelectMode');
  elements.optimizerSection = document.getElementById('optimizerSection');
  elements.closeOptimizer = document.getElementById('closeOptimizer');
  elements.optimizerStats = document.getElementById('optimizerStats');
  elements.suggestionsList = document.getElementById('suggestionsList');

  // LLM optimization elements
  elements.generateLLMPrompt = document.getElementById('generateLLMPrompt');
  elements.exportRulesForLLM = document.getElementById('exportRulesForLLM');
  elements.llmPromptOutput = document.getElementById('llmPromptOutput');
  elements.rulesExportOutput = document.getElementById('rulesExportOutput');
  elements.llmRulesInput = document.getElementById('llmRulesInput');
  elements.importLLMRules = document.getElementById('importLLMRules');
  elements.aiPromptLabel = document.getElementById('aiPromptLabel');
  elements.aiCsvLabel = document.getElementById('aiCsvLabel');
  elements.aiCsvInput = document.getElementById('aiCsvInput');
  elements.importAiCsvBtn = document.getElementById('importAiCsvBtn');
  elements.aiHintWildcard = document.getElementById('aiHintWildcard');
  elements.aiHintRegex = document.getElementById('aiHintRegex');
  elements.aiModalIntro = document.getElementById('aiModalIntro');
  elements.aiModalTitle = document.getElementById('aiModalTitle');

  elements.aiModal = document.getElementById('aiModal');
  elements.closeAiModal = document.getElementById('closeAiModal');
  elements.aiPrompt = document.getElementById('aiPrompt');
  elements.copyAiPrompt = document.getElementById('copyAiPrompt');
  elements.regenerateAiPrompt = document.getElementById('regenerateAiPrompt');
  elements.variablesModal = document.getElementById('variablesModal');
  elements.closeVariablesModal = document.getElementById('closeVariablesModal');
  elements.variableLists = Array.from(document.querySelectorAll('[data-variables-list]'));
  elements.variableForms = Array.from(document.querySelectorAll('[data-variable-form]'));
  elements.ruleProfileSelect = document.getElementById('ruleProfileSelect');
  elements.lblRuleProfile = document.getElementById('lblRuleProfile');

  // Nye elementer for v0.4.0+
  elements.selectAllCheckbox = document.getElementById('selectAllCheckbox');
  elements.blacklistRules = document.getElementById('blacklistRules');
  elements.saveBlacklistBtn = document.getElementById('saveBlacklistBtn');
  elements.notificationToggle = document.getElementById('notificationToggle');

  // Modal elementer
  elements.editModal = document.getElementById('editModal');
  elements.editForm = document.getElementById('editForm');
  elements.cancelBtn = document.getElementById('cancelBtn');
  elements.saveBtn = document.getElementById('saveBtn');
  elements.importPreviewModal = document.getElementById('importPreviewModal');
  elements.importPreviewTitle = document.getElementById('importPreviewTitle');
  elements.importPreviewSummary = document.getElementById('importPreviewSummary');
  elements.skipDuplicatesToggle = document.getElementById('skipDuplicatesToggle');
  elements.skipInvalidToggle = document.getElementById('skipInvalidToggle');
  elements.skipDuplicatesLabel = document.getElementById('skipDuplicatesLabel');
  elements.skipInvalidLabel = document.getElementById('skipInvalidLabel');
  elements.duplicatesTitle = document.getElementById('duplicatesTitle');
  elements.invalidTitle = document.getElementById('invalidTitle');
  elements.duplicateList = document.getElementById('duplicateList');
  elements.invalidList = document.getElementById('invalidList');
  elements.closeImportPreview = document.getElementById('closeImportPreview');
  elements.cancelImportPreview = document.getElementById('cancelImportPreview');
  elements.confirmImportPreview = document.getElementById('confirmImportPreview');

  if (elements.sortBy) {
    elements.sortBy.value = sortBy;
  }
}

function attachEvents() {
  // Floating actions
  if (elements.aiAssistBtn) elements.aiAssistBtn.addEventListener('click', openAiModal);
  if (elements.optimizeBtn) elements.optimizeBtn.addEventListener('click', showOptimizer);
  if (elements.variablesBtn) elements.variablesBtn.addEventListener('click', openVariablesModal);
  if (elements.selectModeBtn) elements.selectModeBtn.addEventListener('click', toggleSelectMode);
  if (elements.addRuleBtn) elements.addRuleBtn.addEventListener('click', () => openEditModal());
  if (elements.bulkEnable) elements.bulkEnable.addEventListener('click', () => handleBulkAction('enable'));
  if (elements.bulkDisable) elements.bulkDisable.addEventListener('click', () => handleBulkAction('disable'));
  if (elements.bulkDelete) elements.bulkDelete.addEventListener('click', () => handleBulkAction('delete'));
  if (elements.exitSelectMode) elements.exitSelectMode.addEventListener('click', toggleSelectMode);

  elements.searchInput.addEventListener('input', applyFilters);
  if (elements.searchRegex) elements.searchRegex.addEventListener('change', applyFilters);
  if (elements.searchMatchFields) elements.searchMatchFields.addEventListener('change', applyFilters);
  if (elements.searchMatchValues) elements.searchMatchValues.addEventListener('change', applyFilters);
  if (elements.searchMode) elements.searchMode.addEventListener('change', applyFilters);
  elements.filterEnabled.addEventListener('change', applyFilters);
  elements.filterRegex.addEventListener('change', applyFilters);
  syncSearchModeLock();
  elements.groupBySite.addEventListener('change', () => {
    groupBySite = elements.groupBySite.checked;
    renderRules();
  });
  if (elements.activeProfileSelect) {
    elements.activeProfileSelect.addEventListener('change', handleActiveProfileChange);
  }
  elements.sortBy.addEventListener('change', () => {
    sortBy = elements.sortBy.value;
    renderRules();
  });
  elements.exportSelectedBtn.addEventListener('click', exportSelected);
  elements.importRulesBtn.addEventListener('click', () => elements.importFile.click());
  elements.importFile.addEventListener('change', (ev) => handleImport(ev, 'import'));
  if (elements.cloudRestoreBtn) elements.cloudRestoreBtn.addEventListener('click', () => elements.importFile && elements.importFile.click());
  if (elements.validateRulesBtn) elements.validateRulesBtn.addEventListener('click', () => elements.validateFile && elements.validateFile.click());
  if (elements.validateFile) elements.validateFile.addEventListener('change', (ev) => handleImport(ev, 'validate'));
  elements.refreshBtn.addEventListener('click', loadRules);
  elements.openPopupBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  });
  if (elements.mergeFilteredBtn) {
    elements.mergeFilteredBtn.addEventListener('click', mergeFilteredRules);
  }
  if (elements.cloudBackupBtn) {
    elements.cloudBackupBtn.addEventListener('click', handleLocalBackup);
  }
  if (elements.closeOptimizer) elements.closeOptimizer.addEventListener('click', hideOptimizer);

  // LLM optimization
  if (elements.generateLLMPrompt) elements.generateLLMPrompt.addEventListener('click', generateLLMPrompt);
  if (elements.exportRulesForLLM) elements.exportRulesForLLM.addEventListener('click', exportRulesForLLM);
  if (elements.importLLMRules) elements.importLLMRules.addEventListener('click', importLLMRules);
  if (elements.importAiCsvBtn) elements.importAiCsvBtn.addEventListener('click', handleAiCsvImport);
  elements.variableForms.forEach(form => form.addEventListener('submit', handleAddVariable));
  if (elements.closeImportPreview) elements.closeImportPreview.addEventListener('click', closeImportPreviewModal);
  if (elements.cancelImportPreview) elements.cancelImportPreview.addEventListener('click', closeImportPreviewModal);
  if (elements.confirmImportPreview) elements.confirmImportPreview.addEventListener('click', confirmImportPreview);

  // Regex info icon
  const regexInfoIcon = document.getElementById('regexInfoRules');
  if (regexInfoIcon) {
    regexInfoIcon.addEventListener('click', showRegexHelp);
  }

  // Select All
  if (elements.selectAllCheckbox) {
      elements.selectAllCheckbox.addEventListener('change', handleSelectAll);
  }

  // Settings
  if (elements.saveBlacklistBtn) {
      elements.saveBlacklistBtn.addEventListener('click', saveBlacklist);
  }
  if (elements.notificationToggle) {
      elements.notificationToggle.addEventListener('change', saveNotificationSetting);
  }

  // Modal
  document.getElementById('closeModal').addEventListener('click', closeEditModal);
  elements.cancelBtn?.addEventListener('click', closeEditModal);
  elements.editForm.addEventListener('submit', handleSaveRule);
  document.getElementById('closeAiModal')?.addEventListener('click', closeAiModal);
  document.getElementById('copyAiPrompt')?.addEventListener('click', copyAiPrompt);
  document.getElementById('regenerateAiPrompt')?.addEventListener('click', generateAiPrompt);
  document.getElementById('closeVariablesModal')?.addEventListener('click', closeVariablesModal);
  elements.addVariableForm?.addEventListener('submit', handleAddVariable);
}

async function loadSettings() {
  const result = await chrome.storage.local.get(['blacklist', 'notificationsEnabled', 'language', 'userVariables', 'currentProfileId']);
  
  if (result.blacklist && Array.isArray(result.blacklist)) {
    if (elements.blacklistRules) {
        elements.blacklistRules.value = result.blacklist.join('\n');
    }
  }
  
  if (elements.notificationToggle) {
      elements.notificationToggle.checked = result.notificationsEnabled !== false; // Default true
  }

  userVariables = result.userVariables || {};
  currentProfileId = result.currentProfileId || 'default';
  applyTranslations();
}

async function saveBlacklist() {
  const text = elements.blacklistRules.value;
  const blacklist = text.split('\n').map(s => s.trim()).filter(Boolean);
  
  await chrome.storage.local.set({ blacklist });
  
  chrome.runtime.sendMessage({ 
    action: 'updateSettings', 
    blacklist 
  });
  
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  alert(t.toast?.saved || 'Settings saved');
}

async function saveNotificationSetting() {
  const enabled = elements.notificationToggle.checked;
  await chrome.storage.local.set({ notificationsEnabled: enabled });
  
  chrome.runtime.sendMessage({ 
    action: 'updateSettings', 
    notificationsEnabled: enabled 
  });
}

function handleSelectAll(e) {
  const checked = e.target.checked;
  selectedRules.clear();
  
  if (checked) {
    // Velg kun de som er synlige i filteret
    filteredRules.forEach(rule => selectedRules.add(rule.id));
  }

  renderRules();
  updateStats();
}

function toggleSelectMode() {
  selectMode = !selectMode;
  selectedRules.clear();
  if (elements.selectModeBtn && TRANSLATIONS.current) {
    elements.selectModeBtn.textContent = selectMode
      ? (TRANSLATIONS.current.buttons?.cancel || 'Avbryt')
      : (TRANSLATIONS.current.buttons?.selectModeBtn || 'Velg flere');
  }
  if (elements.selectionBar) {
    elements.selectionBar.style.display = selectMode ? 'flex' : 'none';
  }
  updateSelectionUi();
  renderRules();
  updateStats();
}

async function loadRules() {
  const loadingText = (TRANSLATIONS.current?.rulesPage?.empty?.loading) || 'Laster regler...';
  elements.rulesContainer.innerHTML = `<p class="empty">${escapeHtml(loadingText)}</p>`;
  const response = await chrome.runtime.sendMessage({ action: 'getAllRules' });
  allRules = response || [];
  applyFilters();
}

function applyFilters() {
  const sourceRules = currentProfileId ? allRules.filter(r => (r.profileId || 'default') === currentProfileId) : allRules;
  const rawTerm = elements.searchInput.value.trim();
  const useRegex = elements.searchRegex?.checked;
  const matchFields = elements.searchMatchFields?.checked !== false;
  const matchValues = elements.searchMatchValues?.checked === true;
  const searchMode = elements.searchMode?.value || 'strict';

  syncSearchModeLock();

  // Hvis regex er av, sett modus til loose og disable dropdown
  if (!useRegex && elements.searchMode) {
    elements.searchMode.value = 'loose';
    elements.searchMode.disabled = true;
  } else if (elements.searchMode) {
    elements.searchMode.disabled = false;
  }

  let regex = null;
  if (rawTerm && useRegex) {
    try {
      const hasAnchors = /^\^/.test(rawTerm) || /(^|[^\\])\$$/.test(rawTerm);
      let pattern = rawTerm;
      if (!hasAnchors) {
        pattern = searchMode === 'loose'
          ? `.*${rawTerm}.*`
          : `^${rawTerm}$`;
      }
      regex = new RegExp(pattern, 'i');
    } catch (e) {
      regex = null; // fallback to substring match
    }
  }
  const term = rawTerm.toLowerCase();
  const onlyEnabled = elements.filterEnabled.checked;
  const onlyRegex = elements.filterRegex.checked;

  filteredRules = sourceRules.filter(rule => {
    if (onlyEnabled && !rule.enabled) return false;
    if (onlyRegex && !rule.fieldUseRegex) return false;
    if (rawTerm) {
      const targets = [];
      // always include site/field as "fields" match
      if (matchFields) {
        targets.push(rule.sitePattern || '');
        targets.push(rule.fieldPattern || '');
      }
      if (matchValues) {
        targets.push(rule.value || '');
      }

      const matcher = (text) => {
        if (!text) return false;
        if (regex) return regex.test(text);
        return text.toLowerCase().includes(term);
      };

      const anyMatch = targets.some(matcher);
      if (!anyMatch) return false;
    }
    return true;
  });

  // Oppdater Select All status
  if (elements.selectAllCheckbox) {
      const allVisibleSelected = filteredRules.length > 0 && filteredRules.every(r => selectedRules.has(r.id));
      elements.selectAllCheckbox.checked = allVisibleSelected;
  }

  updateStats();
  renderRules();
}

function updateStats() {
  const base = currentProfileId ? allRules.filter(r => (r.profileId || 'default') === currentProfileId) : allRules;
  elements.totalRules.textContent = base.length;
  elements.activeRules.textContent = base.filter(r => r.enabled).length;
  elements.regexRules.textContent = base.filter(r => r.fieldUseRegex).length;
  if (elements.selectedCount) {
      elements.selectedCount.textContent = selectedRules.size;
  }
}

function updateSelectionUi() {
  if (elements.selectedCount) {
    elements.selectedCount.textContent = selectedRules.size;
  }
  if (elements.selectionCount) {
    elements.selectionCount.textContent = selectedRules.size;
  }
  if (elements.selectAllCheckbox) {
    const allVisibleSelected = filteredRules.length > 0 && filteredRules.every(r => selectedRules.has(r.id));
    elements.selectAllCheckbox.checked = allVisibleSelected;
  }
  if (elements.selectionBar) {
    elements.selectionBar.style.display = selectMode ? 'flex' : 'none';
  }
}

function syncSearchModeLock() {
  if (!elements.searchMode || !elements.searchRegex) return;
  const useRegex = elements.searchRegex.checked;
  if (!useRegex) {
    elements.searchMode.value = 'loose';
    elements.searchMode.disabled = true;
  } else {
    elements.searchMode.disabled = false;
  }
}

async function mergeFilteredRules() {
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  const term = elements.searchInput.value.trim();
  const mergeLabel = t.merge?.button || 'Merge filtered';

  if (!term) {
    alert(t.merge?.noTerm || `${mergeLabel}: Bruk søkefeltet for å angi filter før sammenslåing.`);
    return;
  }

  if (!filteredRules.length) {
    alert(t.merge?.noMatches || `${mergeLabel}: Ingen regler matcher filteret.`);
    return;
  }

  // Gruppér per elementType for å unngå å blande tekst/checkbox osv.
  const byElement = filteredRules.reduce((acc, rule) => {
    const type = rule.elementType || 'text';
    acc[type] = acc[type] || [];
    acc[type].push(rule);
    return acc;
  }, {});

  const created = [];
  for (const [elementType, rules] of Object.entries(byElement)) {
    const sitePatterns = Array.from(new Set(rules.map(r => r.sitePattern || '').filter(Boolean)));
    const singleDomain = sitePatterns.length === 1;
    const sitePattern = singleDomain ? sitePatterns[0] : '*';
    const siteMatchType = singleDomain ? (rules[0].siteMatchType || 'domain') : 'domain';

    const first = rules[0];
    const profileId = rules.every(r => (r.profileId || 'default') === (first.profileId || 'default'))
      ? (first.profileId || 'default')
      : 'default';

    const newRule = {
      sitePattern,
      siteMatchType,
      elementType,
      fieldType: 'name',
      fieldPattern: term,
      fieldUseRegex: false,
      value: first.value || '',
      enabled: true,
      created: Date.now(),
      lastUsed: null,
      sortOrder: null,
      priority: first.priority || 0,
      conditionType: 'none',
      conditionValue: '',
      profileId
    };

    try {
      await chrome.runtime.sendMessage({ action: 'addRule', rule: newRule });
      created.push(elementType);
      // Deaktiver originaler for denne element-typen
      for (const r of rules) {
        await chrome.runtime.sendMessage({ action: 'updateRule', ruleId: r.id, updates: { enabled: false } });
      }
    } catch (error) {
      console.error('Merge filtered failed for elementType=', elementType, error);
      alert((t.merge?.error || 'Kunne ikke slå sammen regler: ') + (error.message || 'unknown'));
      return;
    }
  }

  alert((t.merge?.success || 'Slo sammen regler for: {types}').replace('{types}', created.join(', ')));
  await loadRules();
}

function renderRules() {
  applyTranslations(); // ensure fresh labels on rerender
  const container = elements.rulesContainer;
  container.innerHTML = '';

  const sorted = sortRules([...filteredRules]);
  const conflictInfo = buildConflictSet(sorted);
  const conflictSet = conflictInfo.conflictIds;
  const conflictWinners = conflictInfo.winners;

  if (sorted.length === 0) {
    const emptyText = (TRANSLATIONS.current?.rulesPage?.empty?.none) || (TRANSLATIONS.current?.emptyRules) || 'Ingen regler funnet';
    container.innerHTML = `<p class="empty">${escapeHtml(emptyText)}</p>`;
    return;
  }

  if (groupBySite) {
    const bySite = {};
    sorted.forEach(rule => {
      const key = rule.sitePattern || 'Ukjent';
      if (!bySite[key]) bySite[key] = [];
      bySite[key].push(rule);
    });

    const hasSearch = !!(elements.searchInput.value.trim());
    Object.keys(bySite).sort().forEach(site => {
      const section = document.createElement('div');
      const shouldExpand = hasSearch; // åpne paneler når det er søk/filtrering aktivt
      section.className = `rule-group ${shouldExpand ? '' : 'collapsed'}`.trim();

      const header = document.createElement('div');
      header.className = 'rule-group-header';
      const title = document.createElement('h3');
      title.textContent = site;
      const toggle = document.createElement('span');
      toggle.className = 'rule-group-toggle';
      toggle.textContent = shouldExpand ? '−' : '+';
      header.appendChild(title);
      header.appendChild(toggle);
      header.addEventListener('click', () => {
        const isCollapsed = section.classList.contains('collapsed');
        section.classList.toggle('collapsed', !isCollapsed);
        toggle.textContent = isCollapsed ? '−' : '+';
      });

      const list = document.createElement('div');
      list.className = 'rule-list';
      bySite[site].forEach(rule => list.appendChild(createRuleRow(rule, false, conflictSet.has(rule.id), conflictWinners)));

      section.appendChild(header);
      section.appendChild(list);
      container.appendChild(section);
    });
  } else {
    sorted.forEach(rule => container.appendChild(createRuleRow(rule, true, conflictSet.has(rule.id), conflictWinners)));
  }
}

function sortRules(rules) {
  switch (sortBy) {
    case 'order':
      return rules.sort((a, b) => {
        const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : a.created;
        const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : b.created;
        return aOrder - bOrder;
      });
    case 'lastUsed':
      return rules.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    case 'created':
      return rules.sort((a, b) => b.created - a.created);
    case 'site':
      return rules.sort((a, b) => a.sitePattern.localeCompare(b.sitePattern));
    case 'field':
      return rules.sort((a, b) => a.fieldPattern.localeCompare(b.fieldPattern));
    default:
      return rules;
  }
}

function buildConflictSet(rules) {
  const map = new Map();
  const set = new Set();
  const winners = new Map();
  rules.forEach(r => {
    const key = [
      r.sitePattern || '',
      r.fieldType || '',
      r.fieldPattern || '',
      r.profileId || 'default'
    ].join('|');
    const arr = map.get(key) || [];
    arr.push(r.id);
    map.set(key, arr);
  });
  // Determine conflicts and winner per key (highest priority, then newest)
  map.forEach(ids => {
    if (ids.length > 1) {
      ids.forEach(id => set.add(id));
      const matchedRules = rules.filter(r => ids.includes(r.id));
      const sorted = matchedRules.sort((a, b) => {
        const priA = typeof a.priority === 'number' ? a.priority : 0;
        const priB = typeof b.priority === 'number' ? b.priority : 0;
        if (priA !== priB) return priB - priA;
        return (b.created || 0) - (a.created || 0);
      });
      winners.set(ids.join('|'), sorted[0]?.id);
    }
  });
  return { conflictIds: set, winners };
}

function createRuleRow(rule, allowDrag, isConflict = false, conflictWinners = new Map()) {
  const row = document.createElement('div');
  const isSelected = selectedRules.has(rule.id);
  row.className = `rule-row ${rule.enabled ? '' : 'disabled'} ${isSelected ? 'selected' : ''} ${isConflict ? 'conflict' : ''}`;
  row.dataset.id = rule.id;
  
  if (allowDrag && sortBy === 'order') {
    row.setAttribute('draggable', 'true');
    row.addEventListener('dragstart', onDragStart);
    row.addEventListener('dragover', onDragOver);
    row.addEventListener('drop', onDrop);
  }

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'checkbox';
  checkbox.checked = selectedRules.has(rule.id);
  checkbox.addEventListener('change', () => toggleSelected(rule.id, checkbox.checked));

  const main = document.createElement('div');
  main.className = 'rule-main';
  const rLabels = TRANSLATIONS.current?.ruleLabels || {};
  const typeLabels = TRANSLATIONS.current?.fieldTypes || {};
  const matchLabels = TRANSLATIONS.current?.matchTypes || {};
  main.innerHTML = `
    <div><strong>${escapeHtml(rule.sitePattern)}</strong></div>
    <div>${escapeHtml(typeLabels[rule.fieldType] || rule.fieldType)}: ${escapeHtml(rule.fieldPattern)}</div>
    <div>${escapeHtml(rLabels.element || 'Element')}: ${escapeHtml(rule.elementType || 'text')}</div>
    <div>${escapeHtml(rLabels.value || 'Verdi')}: ${escapeHtml(rule.value)}</div>
  `;

  const meta = document.createElement('div');
  meta.className = 'rule-meta';
  if (rule.fieldUseRegex) meta.innerHTML += '<span class="pill">Regex</span>';
  meta.innerHTML += `<span class="pill">${escapeHtml(matchLabels[rule.siteMatchType] || rule.siteMatchType)}</span>`;
  if (rule.lastUsed) {
    const lastLabel = TRANSLATIONS.current?.ruleLabels?.lastUsed || 'Sist';
    meta.innerHTML += `<span class="pill">${escapeHtml(lastLabel)}: ${formatDate(rule.lastUsed)}</span>`;
  }
  if (isConflict) {
    const conflictLabel = TRANSLATIONS.current?.conflict || 'Conflict';
    const key = [
      rule.sitePattern || '',
      rule.fieldType || '',
      rule.fieldPattern || '',
      rule.profileId || 'default'
    ].join('|');
    const winnerId = conflictWinners.get(key);
    const isWinner = winnerId === rule.id;
    const winnerTag = isWinner ? ` (${(TRANSLATIONS.current?.conflictWinner || 'winner')})` : '';
    const title = `${conflictLabel} - ${(TRANSLATIONS.current?.conflictHint || 'Multiple rules match this field; highest priority wins')}`;
    const label = `${conflictLabel}${winnerTag}`;
    meta.innerHTML += `<span class="pill pill-warning" title="${escapeHtml(title)}">${escapeHtml(label)}</span>`;
  }

  const actions = document.createElement('div');
  actions.className = 'rule-actions';
  
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-secondary';
  editBtn.style.padding = '4px 8px';
  editBtn.style.fontSize = '12px';
  editBtn.textContent = (TRANSLATIONS.current?.ruleActions?.edit) || 'Rediger';
  editBtn.onclick = () => openEditModal(rule.id);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-secondary';
  deleteBtn.style.backgroundColor = '#ef4444';
  deleteBtn.style.color = 'white';
  deleteBtn.style.padding = '4px 8px';
  deleteBtn.style.fontSize = '12px';
  deleteBtn.style.marginLeft = '5px';
  deleteBtn.textContent = TRANSLATIONS.current?.ruleActions?.delete || 'Slett';
  deleteBtn.onclick = async () => {
    if(confirm('Er du sikker på at du vil slette denne regelen?')) {
        await chrome.runtime.sendMessage({ action: 'deleteRule', ruleId: rule.id });
        await loadRules();
    }
  };

  const dragHandle = document.createElement('span');
  dragHandle.className = 'drag';
  dragHandle.textContent = '⋮⋮';

  if (isConflict) {
    const incBtn = document.createElement('button');
    incBtn.className = 'btn btn-small';
    incBtn.textContent = '+prio';
    incBtn.style.marginLeft = '6px';
    incBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const newPriority = (rule.priority || 0) + 1;
      await chrome.runtime.sendMessage({ action: 'updateRule', ruleId: rule.id, updates: { priority: newPriority } });
      await loadRules();
    });
    actions.appendChild(incBtn);
  }

  if (!(allowDrag && sortBy === 'order')) {
    dragHandle.style.opacity = 0.2;
    dragHandle.style.cursor = 'default';
  }

  const toggleLabel = document.createElement('label');
  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.checked = rule.enabled;
  toggleInput.addEventListener('change', () => updateRule(rule.id, { enabled: toggleInput.checked }));
  
  toggleLabel.appendChild(toggleInput);
  toggleLabel.append(` ${(TRANSLATIONS.current?.ruleLabels?.enabled) || 'Aktiv'}`);

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  actions.appendChild(dragHandle);
  actions.appendChild(toggleLabel);

  row.appendChild(checkbox);
  row.appendChild(main);
  row.appendChild(meta);
  row.appendChild(actions);
  if (selectMode) {
    row.addEventListener('click', () => {
      const newState = !selectedRules.has(rule.id);
      toggleSelected(rule.id, newState);
      renderRules();
    });
  }
  return row;
}

function toggleSelected(id, checked) {
  if (checked) selectedRules.add(id);
  else selectedRules.delete(id);
  
  updateSelectionUi();
}

async function updateRule(id, updates) {
  await chrome.runtime.sendMessage({ action: 'updateRule', ruleId: id, updates });
  await loadRules();
}

function exportSelected() {
  const ids = selectedRules.size ? new Set(selectedRules) : null;
  const rules = ids ? allRules.filter(r => ids.has(r.id)) : allRules;
  const csv = buildCSV(rules);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `autofill-rules-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function handleLocalBackup() {
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  let objectUrl;
  try {
    const csv = buildCSV(allRules);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    objectUrl = URL.createObjectURL(blob);

    const useDefaultDir = confirm(
      t.cloud?.useDefaultConfirm ||
      'Save directly to Downloads/AutoFill?\nOK = Save there\nCancel = Choose location'
    );

    const downloadOpts = {
      url: objectUrl,
      filename: useDefaultDir ? `AutoFill/${buildBackupFilename()}` : buildBackupFilename(),
      saveAs: !useDefaultDir
    };

    await chrome.downloads.download(downloadOpts);

    if (useDefaultDir) {
      alert((t.cloud?.backupSuccess || 'Backup saved.').replace('{provider}', t.cloud?.title || 'Backup'));
    }
  } catch (error) {
    console.error('Local backup error:', error);
    alert((t.cloud?.backupError || 'Backup failed: {error}').replace('{error}', error.message || 'unknown'));
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

async function handleImport(e, mode = 'import') {
  const file = e?.target?.files?.[0];
  if (!file) return;
  if (e?.target) e.target.value = '';
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};

  try {
    const content = await file.text();
    const analysis = analyzeCsvForImport(content, allRules);
    if (analysis.error) {
      alert(analysis.error);
      return;
    }
    showImportPreviewModal(analysis, mode);
  } catch (err) {
    console.error('Import read error', err);
    alert(t.alerts?.importError || 'Feil ved import');
  }
}

function analyzeCsvForImport(content, existingRules) {
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  const normalized = normalizeCsvSeparators(content || '');
  const lines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) {
    return { error: t.alerts?.importEmpty || 'No data found to import.' };
  }

  const header = lines[0].split(';').map(h => h.trim());
  const required = ['id', 'sitePattern', 'siteMatchType', 'elementType', 'fieldType', 'fieldPattern', 'fieldUseRegex', 'value', 'enabled', 'created', 'lastUsed'];
  const missing = required.filter(h => !header.includes(h));
  if (missing.length) {
    return { error: (t.alerts?.invalidColumns || 'Invalid CSV columns: {cols}').replace('{cols}', missing.join(', ')) };
  }

  const idx = {};
  header.forEach((h, i) => { idx[h] = i; });

  const existingKeys = new Set(
    (existingRules || []).map(r => [
      r.sitePattern || '',
      r.fieldType || '',
      r.fieldPattern || '',
      r.profileId || 'default'
    ].join('|'))
  );

  const rows = [];
  lines.slice(1).forEach((line, offset) => {
    const cols = line.split(';');
    const row = {
      lineNumber: offset + 2,
      cols,
      duplicate: false,
      error: null
    };

    if (cols.length !== header.length) {
      row.error = `Cols ${cols.length}/${header.length}`;
    }

    if (!row.error) {
      const key = [
        cols[idx.sitePattern] || '',
        cols[idx.fieldType] || '',
        cols[idx.fieldPattern] || '',
        idx.profileId !== undefined ? (cols[idx.profileId] || 'default') : 'default'
      ].join('|');

      if (existingKeys.has(key)) {
        row.duplicate = true;
      } else {
        existingKeys.add(key);
      }
    }

    rows.push(row);
  });

  const duplicates = rows.filter(r => r.duplicate);
  const invalid = rows.filter(r => r.error);
  const valid = rows.filter(r => !r.error && !r.duplicate);

  return {
    header,
    rows,
    duplicates,
    invalid,
    validCount: valid.length,
    totalRows: rows.length,
    normalized
  };
}

function buildCsvFromAnalysis(analysis, opts = {}) {
  if (!analysis) return '';
  const skipDuplicates = opts.skipDuplicates !== false;
  const skipInvalid = opts.skipInvalid !== false;
  const rows = analysis.rows.filter(r => {
    if (skipInvalid && r.error) return false;
    if (skipDuplicates && r.duplicate) return false;
    return true;
  });
  const body = rows.map(r => r.cols.join(';'));
  return [analysis.header.join(';'), ...body].join('\n');
}

function renderIssueList(list, target, t) {
  if (!target) return;
  target.innerHTML = '';
  if (!list || list.length === 0) {
    const li = document.createElement('li');
    li.textContent = t.importPreview?.none || 'None';
    target.appendChild(li);
    return;
  }

  const maxItems = 5;
  list.slice(0, maxItems).forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${(t.importPreview?.line || 'Line {num}').replace('{num}', item.lineNumber)}: ${item.cols.join(';')}`;
    target.appendChild(li);
  });

  if (list.length > maxItems) {
    const li = document.createElement('li');
    li.textContent = (t.importPreview?.andMore || '...and {count} more').replace('{count}', list.length - maxItems);
    target.appendChild(li);
  }
}

let importPreviewState = null;

function showImportPreviewModal(analysis, mode = 'import') {
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  importPreviewState = { analysis, mode };

  if (elements.importPreviewModal) elements.importPreviewModal.style.display = 'flex';
  if (elements.importPreviewTitle) elements.importPreviewTitle.textContent = t.importPreview?.title || 'Import & validation';

  const summary = (t.importPreview?.summary || 'Lines: {total}. Valid: {valid}. Duplicates: {dupes}. Invalid: {invalid}.')
    .replace('{total}', analysis.totalRows)
    .replace('{valid}', analysis.validCount)
    .replace('{dupes}', analysis.duplicates.length)
    .replace('{invalid}', analysis.invalid.length);

  if (elements.importPreviewSummary) elements.importPreviewSummary.textContent = summary;
  if (elements.skipDuplicatesLabel) elements.skipDuplicatesLabel.textContent = t.importPreview?.skipDuplicates || 'Skip duplicates';
  if (elements.skipInvalidLabel) elements.skipInvalidLabel.textContent = t.importPreview?.skipInvalid || 'Skip invalid rows';
  if (elements.duplicatesTitle) elements.duplicatesTitle.textContent = t.importPreview?.duplicates || 'Duplicates';
  if (elements.invalidTitle) elements.invalidTitle.textContent = t.importPreview?.invalid || 'Invalid rows';
  if (elements.confirmImportPreview) {
    elements.confirmImportPreview.textContent = mode === 'validate'
      ? (t.importPreview?.validateOnly || t.buttons?.cancel || 'Close')
      : (t.importPreview?.import || 'Import');
  }
  if (elements.cancelImportPreview) elements.cancelImportPreview.textContent = t.buttons?.cancel || 'Cancel';

  renderIssueList(analysis.duplicates, elements.duplicateList, t);
  renderIssueList(analysis.invalid, elements.invalidList, t);
}

function closeImportPreviewModal() {
  if (elements.importPreviewModal) elements.importPreviewModal.style.display = 'none';
  importPreviewState = null;
  if (elements.skipDuplicatesToggle) elements.skipDuplicatesToggle.checked = true;
  if (elements.skipInvalidToggle) elements.skipInvalidToggle.checked = true;
}

async function confirmImportPreview() {

  if (!importPreviewState) return;

  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};



  const skipDuplicates = elements.skipDuplicatesToggle ? elements.skipDuplicatesToggle.checked : true

;
  const skipInvalid = elements.skipInvalidToggle ? elements.skipInvalidToggle.checked : true;
  const csv = buildCsvFromAnalysis(importPreviewState.analysis, { skipDuplicates, skipInvalid });

  if (importPreviewState.mode === 'validate') {
    closeImportPreviewModal();
    return;
  }

  const merge = confirm('Vil du legge til disse reglene til eksisterende regler?\n\nOK = Legg til\nAvbryt = Erstatt alle eksisterende regler');
  const result = await chrome.runtime.sendMessage({ action: 'importCSV', csv, merge });
  if (result.success) {
    alert((t.alerts?.importSuccess || 'Imported {count} rules').replace('{count}', result.imported));
    await loadRules();
  } else {
    alert((t.alerts?.importError || 'Feil ved import: ') + result.error);
  }
  closeImportPreviewModal();
}

// Modal Logic
function openEditModal(ruleId) {
  editingRuleId = ruleId;
  const modalTitle = document.getElementById('modalTitle');
  if (ruleId) {
    const rule = allRules.find(r => r.id === ruleId);
    if (!rule) return;

    if (modalTitle) {
      modalTitle.textContent = (TRANSLATIONS.current?.modalTitleEdit) || 'Rediger regel';
    }
    document.getElementById('sitePattern').value = rule.sitePattern;
    document.getElementById('siteMatchType').value = rule.siteMatchType;
    document.getElementById('elementType').value = rule.elementType || 'text';
    document.getElementById('fieldType').value = rule.fieldType;
    document.getElementById('fieldPattern').value = rule.fieldPattern;
    document.getElementById('fieldUseRegex').checked = rule.fieldUseRegex;
    document.getElementById('value').value = rule.value;
    const commentEl = document.getElementById('comment');
    if (commentEl) commentEl.value = rule.comment || '';
    document.getElementById('priority').value = rule.priority || 0;
    document.getElementById('conditionType').value = rule.conditionType || 'none';
    document.getElementById('conditionValue').value = rule.conditionValue || '';
    document.getElementById('enabled').checked = rule.enabled;
    if (elements.ruleProfileSelect) elements.ruleProfileSelect.value = rule.profileId || 'default';
  } else {
    if (modalTitle) {
      modalTitle.textContent = (TRANSLATIONS.current?.modalTitleNew) || 'Ny regel';
    }
    elements.editForm.reset();
    document.getElementById('priority').value = 0;
    document.getElementById('conditionType').value = 'none';
    document.getElementById('conditionValue').value = '';
    const commentEl = document.getElementById('comment');
    if (commentEl) commentEl.value = '';
    if (elements.ruleProfileSelect) elements.ruleProfileSelect.value = profiles[0]?.id || 'default';
  }

  elements.editModal.style.display = 'flex';
}

function closeEditModal() {
  elements.editModal.style.display = 'none';
  editingRuleId = null;
  elements.editForm.reset();
}

async function handleSaveRule(e) {
  e.preventDefault();
  
  const ruleData = {
    sitePattern: document.getElementById('sitePattern').value.trim(),
    siteMatchType: document.getElementById('siteMatchType').value,
    elementType: document.getElementById('elementType').value,
    fieldType: document.getElementById('fieldType').value,
    fieldPattern: document.getElementById('fieldPattern').value.trim(),
    fieldUseRegex: document.getElementById('fieldUseRegex').checked,
    value: document.getElementById('value').value,
    comment: document.getElementById('comment')?.value || '',
    priority: parseInt(document.getElementById('priority').value) || 0,
    conditionType: document.getElementById('conditionType').value,
    conditionValue: document.getElementById('conditionValue').value.trim(),
    enabled: document.getElementById('enabled').checked,
    profileId: document.getElementById('ruleProfileSelect')?.value || 'default'
  };

  if (editingRuleId) {
    await chrome.runtime.sendMessage({
        action: 'updateRule',
        ruleId: editingRuleId,
        updates: ruleData
    });
  }
  
  closeEditModal();
  loadRules();
}

async function handleBulkAction(action) {
  if (selectedRules.size === 0) return;
  const ids = Array.from(selectedRules);
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  let confirmText = '';
  if (action === 'delete') confirmText = t.alerts?.confirmDeleteRule || 'Slette valgte regler?';
  if (confirmText && !confirm(confirmText)) return;

  for (const id of ids) {
    if (action === 'delete') {
      await chrome.runtime.sendMessage({ action: 'deleteRule', ruleId: id });
    } else {
      await chrome.runtime.sendMessage({ action: 'updateRule', ruleId: id, updates: { enabled: action === 'enable' } });
    }
  }
  selectedRules.clear();
  toggleSelectMode();
  await loadRules();
}

// Drag-and-drop
let draggedId = null;

function onDragStart(e) {
  draggedId = e.currentTarget.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
  e.preventDefault();
  const target = e.currentTarget;
  target.style.borderColor = '#667eea';
}

function onDrop(e) {
  e.preventDefault();
  const target = e.currentTarget;
  target.style.borderColor = '#e2e8f0';
  const targetId = target.dataset.id;
  if (!draggedId || draggedId === targetId) return;

  const order = Array.from(elements.rulesContainer.querySelectorAll('.rule-row'))
    .map(el => el.dataset.id);

  const fromIndex = order.indexOf(draggedId);
  const toIndex = order.indexOf(targetId);
  order.splice(fromIndex, 1);
  order.splice(toIndex, 0, draggedId);

  persistOrder(order);
}

async function persistOrder(visibleOrder) {
  const remaining = allRules
    .filter(r => !visibleOrder.includes(r.id))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(r => r.id);

  const newOrder = [...visibleOrder, ...remaining];
  const payload = newOrder.map((id, index) => ({ id, sortOrder: index }));
  await chrome.runtime.sendMessage({ action: 'reorderRules', order: payload });
  await loadRules();
}

// Utils
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function buildBackupFilename() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join('');
  return `AutoFill-${date}-${time}.csv`;
}

function buildCSV(rules) {
  const headers = ['id', 'sitePattern', 'siteMatchType', 'elementType', 'fieldType', 'fieldPattern', 'fieldUseRegex', 'value', 'enabled', 'created', 'lastUsed', 'sortOrder', 'priority', 'conditionType', 'conditionValue'];
  const rows = rules.map(rule => headers.map(h => escapeCsv(rule[h])).join(';'));
  return [headers.join(';'), ...rows].join('\n');
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function normalizeCsvSeparators(content) {
  if (!content) return '';
  const trimmed = content.trim();
  const firstLine = trimmed.split(/\r?\n/)[0] || '';
  if (firstLine.includes(',') && !firstLine.includes(';')) {
    return trimmed.replace(/,/g, ';');
  }
  return trimmed;
}

function prepareAiCsvForImport(input) {
  const normalized = normalizeCsvSeparators(input).replace(/;\s+(?=\S)/g, ';\n');
  const lines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return '';

  const first = lines[0].toLowerCase();
  const hasHeader = first.includes('sitepattern') || first.startsWith('id;');

  if (hasHeader) {
    return lines.join('\n');
  }

  const header = ['id', 'sitePattern', 'siteMatchType', 'elementType', 'fieldType', 'fieldPattern', 'fieldUseRegex', 'value', 'enabled', 'created', 'lastUsed', 'sortOrder', 'priority', 'conditionType', 'conditionValue'];

  const toBoolString = (val, fallback = false) => {
    if (val === undefined || val === null || val === '') return fallback ? 'true' : 'false';
    return String(val).trim().toLowerCase() === 'true' ? 'true' : 'false';
  };

  const rows = lines.map((line, idx) => {
    const parts = line.split(';').map(p => p.trim());
    while (parts.length && parts[parts.length - 1] === '') {
      parts.pop();
    }

    const get = (i, fallback = '') => (parts[i] !== undefined && parts[i] !== '' ? parts[i] : fallback);
    const id = get(0, `ai-${Date.now()}-${idx}`);
    const created = get(9, Date.now());

    return [
      id,
      get(1, ''),
      get(2, 'host'),
      get(3, 'text'),
      get(4, 'name'),
      get(5, ''),
      toBoolString(get(6, 'false')),
      get(7, ''),
      toBoolString(get(8, 'true'), true),
      created,
      get(10, ''),
      '', // sortOrder
      get(12, '0'),
      get(13, 'none'),
      get(14, '')
    ];
  });

  return [header.join(';'), ...rows.map(r => r.join(';'))].join('\n');
}

function filterDuplicateCsv(content, existingRules) {
  const cleaned = normalizeCsvSeparators(content);
  const lines = cleaned.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { csv: cleaned, skipped: 0 };

  const header = lines[0].split(';').map(h => h.trim());
  const required = ['sitePattern', 'fieldType', 'fieldPattern', 'profileId'];
  const hasAll = required.every(h => header.includes(h));
  if (!hasAll) {
    return { csv: cleaned, skipped: 0 };
  }

  const idx = {};
  header.forEach((h, i) => { idx[h] = i; });

  const existingKeys = new Set(
    (existingRules || []).map(r => [
      r.sitePattern || '',
      r.fieldType || '',
      r.fieldPattern || '',
      r.profileId || 'default'
    ].join('|'))
  );

  const out = [lines[0]];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const key = [
      cols[idx.sitePattern] || '',
      cols[idx.fieldType] || '',
      cols[idx.fieldPattern] || '',
      cols[idx.profileId] || 'default'
    ].join('|');
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    existingKeys.add(key);
    out.push(lines[i]);
  }

  return { csv: out.join('\n'), skipped };
}

function buildImportPreview(content, existingRules) {
  const deduped = filterDuplicateCsv(content, existingRules);
  const skippedMsg = deduped.skipped > 0 ? `Skipped duplicates: ${deduped.skipped}.\n` : '';
  const summary = `${skippedMsg}Proceed with import?`;
  return { csv: deduped.csv, summary };
}

// Placeholder for renderAvailableFields if called by mistake or future use
// Rules.js does not currently show available fields, so this can be empty or remove the call if it exists.
function renderAvailableFields() {
    // No-op for rules.html
}

// --- Variables modal ---
async function loadVariables() {
  try {
    const res = await chrome.storage.local.get('userVariables');
    userVariables = res.userVariables || {};
    renderVariables();
  } catch (e) {
    console.error('Error loading variables', e);
  }
}

function getBuiltInVariables() {
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  const fallback = [
    { key: 'date', desc: 'Current date (YYYY-MM-DD)' },
    { key: 'time', desc: 'Current time (HH:MM:SS)' },
    { key: 'timestamp', desc: 'Unix timestamp (ms)' },
    { key: 'random', desc: 'Random number (0-9999)' },
    { key: 'random:5', desc: 'Random number with 5 digits' }
  ];
  if (Array.isArray(t.variables?.builtins)) return t.variables.builtins;
  if (Array.isArray(TRANSLATIONS.en?.variables?.builtins)) return TRANSLATIONS.en.variables.builtins;
  return fallback;
}

function renderVariables() {
  if (!elements.variableLists || elements.variableLists.length === 0) return;
  const keys = Object.keys(userVariables).sort();
  const builtins = getBuiltInVariables();

  elements.variableLists.forEach(list => {
    list.innerHTML = '';

    if (builtins.length) {
      const heading = document.createElement('h4');
      heading.className = 'variables-heading-inline';
      heading.textContent = (TRANSLATIONS.current?.variables?.inlineHeading) || (TRANSLATIONS.en?.variables?.inlineHeading) || 'Variables you can use in the value field:';
      list.appendChild(heading);

      builtins.forEach(b => {
        const div = document.createElement('div');
        div.className = 'variable-item builtin';
        div.innerHTML = `
          <div class="variable-info">
            <span class="variable-key">{${escapeHtml(b.key)}}</span>
            <span class="variable-value">${escapeHtml(b.desc || '')}</span>
          </div>
        `;
        list.appendChild(div);
      });
    }

    if (keys.length === 0 && builtins.length === 0) {
      list.innerHTML = '<p class="empty-text">' + ((TRANSLATIONS.current?.variables?.empty) || 'Ingen variabler definert.') + '</p>';
      return;
    }

    keys.forEach(key => {
      const div = document.createElement('div');
      div.className = 'variable-item';
      div.innerHTML = `
        <div class="variable-info">
          <span class="variable-key">{${escapeHtml(key)}}</span>
          <span class="variable-value">${escapeHtml(userVariables[key])}</span>
        </div>
        <button class="btn btn-small btn-danger delete-var-btn" data-key="${escapeHtml(key)}">${(TRANSLATIONS.current?.variables?.delete) || 'Slett'}</button>
      `;

      div.querySelector('.delete-var-btn').addEventListener('click', () => handleDeleteVariable(key));
      list.appendChild(div);
    });
  });
}

function openVariablesModal() {
  renderVariables();
  if (elements.variablesModal) elements.variablesModal.style.display = 'flex';
}

function closeVariablesModal() {
  if (elements.variablesModal) elements.variablesModal.style.display = 'none';
}

async function handleAddVariable(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const keyInput = form.querySelector('[data-var-key]');
  const valueInput = form.querySelector('[data-var-value]');
  const key = keyInput?.value.trim();
  const value = valueInput?.value || '';
  if (!key) return;
  userVariables[key] = value;
  await chrome.storage.local.set({ userVariables });
  renderVariables();
  if (keyInput) keyInput.value = '';
  if (valueInput) valueInput.value = '';
}

function handleDeleteVariable(key) {
  delete userVariables[key];
  chrome.storage.local.set({ userVariables });
  renderVariables();
}

// --- AI modal ---
function openAiModal() {
  generateAiPrompt();
  if (elements.aiModal) elements.aiModal.style.display = 'flex';
}

function closeAiModal() {
  if (elements.aiModal) elements.aiModal.style.display = 'none';
}

function copyAiPrompt() {
  if (!elements.aiPrompt) return;
  navigator.clipboard.writeText(elements.aiPrompt.value).catch(() => {});
}

function generateAiPrompt() {
  if (!elements.aiPrompt) return;
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};

  const header = Array.isArray(t.ai?.promptText) ? t.ai.promptText : [
    'You are an expert at generating autofill rules for a browser extension.',
    'Return only CSV lines with these columns (semicolon-separated):',
    'id;sitePattern;siteMatchType;elementType;fieldType;fieldPattern;fieldUseRegex;value;enabled;created;lastUsed',
    '',
    '**IMPORTANT**: Return the header row with the data and separate lines with newline.',
    'Present the output in a code block/plain text with easy copy (no prose).',
    '',
    'Existing rules (context) below:',
  ];

  const rulesCsv = buildCSV(allRules || []).split('\n');
  const rulesSection = (allRules && allRules.length)
    ? rulesCsv
    : [t.ai?.none || '(none detected)'];

  const fields = availableFields.length ? availableFields : [];
  const fieldLines = fields.length
    ? fields.map(f => `- elementType=${f.fieldType}, identifierType=${f.type}, identifier=${f.identifier}, currentValue=${f.value || ''}`)
    : [t.ai?.none || '(none detected)'];

  const tips = [
    t.ai?.wildcard || 'Wildcards: * = any characters, ? = one character.',
    t.ai?.regex || 'Enable regex for complex matches (examples: ^user.* , email|e-mail).',
    'Prefer siteMatchType=host unless regex/url is required.',
    'Set enabled=true; created/lastUsed can be empty or timestamps.'
  ];

  const prompt = [
    ...header,
    '',
    (t.ai?.existingRules || 'Existing rules (context):'),
    ...rulesSection,
    '',
    (t.ai?.detectedFields || 'Detected fields (current page):'),
    ...fieldLines,
    '',
    ...tips
  ].join('\n');

  elements.aiPrompt.value = prompt;
}

async function handleAiCsvImport() {
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  const raw = elements.aiCsvInput?.value || '';
  const csv = prepareAiCsvForImport(raw);

  if (!csv.trim()) {
    alert(t.ai?.importMissing || 'Paste the CSV result from your LLM first.');
    return;
  }

  const merge = confirm(t.cloud?.restoreConfirm || 'Merge with existing rules? OK = Merge, Cancel = Replace.');

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'importCSV',
      csv,
      merge
    });

    if (result?.success) {
      const count = result.imported ?? 0;
      alert((t.alerts?.importSuccess || 'Imported {count} rules').replace('{count}', count));
      if (elements.aiCsvInput) elements.aiCsvInput.value = '';
      await loadRules();
    } else {
      const errText = result?.error || 'unknown';
      alert((t.alerts?.importError || 'Import error: ') + errText);
    }
  } catch (error) {
    console.error('AI CSV import error:', error);
    alert((t.alerts?.importError || 'Import error: ') + (error.message || 'unknown'));
  }
}

// --- Optimizer ---
function showOptimizer() {
  console.log('showOptimizer called', {
    hasOptimizerSection: !!elements.optimizerSection,
    hasRuleOptimizer: typeof RuleOptimizer !== 'undefined',
    rulesCount: allRules.length
  });

  if (!elements.optimizerSection) {
    console.error('optimizerSection element not found');
    alert('Optimizer UI not found. Please reload the page.');
    return;
  }

  if (typeof RuleOptimizer === 'undefined') {
    console.error('RuleOptimizer not loaded');
    alert((TRANSLATIONS.current
      ? 'Optimizer er ikke tilgjengelig. Last siden på nytt.'
      : 'Optimizer is not available. Please reload the page.'));
    return;
  }

  if (allRules.length === 0) {
    alert((TRANSLATIONS.current
      ? 'Ingen regler å optimalisere. Legg til noen regler først.'
      : 'No rules to optimize. Add some rules first.'));
    return;
  }

  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  try {
    console.log('Generating optimizer report...');
    const report = RuleOptimizer.generateReport(allRules);
    console.log('Optimizer report:', report);

    renderOptimizerStats(report, t);
    renderSuggestions(report.suggestions || [], t);

    elements.optimizerSection.style.display = 'block';
    console.log('Optimizer section displayed');

    // Scroll into view
    elements.optimizerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    console.error('Optimizer error:', e);
    alert(t.alerts?.optimizerError || 'Kunne ikke analysere regler: ' + e.message);
  }
}

function hideOptimizer() {
  if (elements.optimizerSection) elements.optimizerSection.style.display = 'none';
}

/**
 * Generer LLM prompt for regel-optimalisering
 */
function generateLLMPrompt() {
  const prompt = `You are an expert at optimizing autofill rules for a browser extension. Your task is to combine and optimize the following rules to make them as efficient as possible while maintaining all functionality.

**RULE FORMAT:**
Each rule is semicolon-separated with the following fields:
sitePattern;siteMatchType;elementType;fieldType;fieldPattern;fieldUseRegex;value;priority;enabled;profileId;conditionType;conditionValue

**FIELD DEFINITIONS:**
- sitePattern: URL/domain pattern to match (e.g., "example.com", "*.example.com")
- siteMatchType: "host" (exact hostname), "domain" (domain + subdomains), "url" (full URL match), or "regex" (regex pattern)
- elementType: "text" (input/textarea), "checkbox", "radio", "select", or "contenteditable"
- fieldType: "name" (name attribute), "id" (id attribute), "placeholder", or "selector" (CSS selector)
- fieldPattern: Pattern to match the field identifier
- fieldUseRegex: "true" or "false" - if true, fieldPattern is treated as regex; if false, wildcards (* and ?) are supported
- value: The value to fill in the field
- priority: Number (higher = higher priority)
- enabled: "true" or "false"
- profileId: Profile ID (use "default" for default profile)
- conditionType: "none", "urlContains", "urlRegex", or "selectorExists"
- conditionValue: Value for the condition (empty if conditionType is "none")

**WILDCARD PATTERNS (when fieldUseRegex=false):**
- * matches any number of characters
- ? matches exactly one character
- Examples: "user*" matches "username", "userId", "user_email"

**REGEX PATTERNS (when fieldUseRegex=true):**
- Use standard regex syntax
- Examples: "^user.*name$", "(email|mail).*address"

**OPTIMIZATION GUIDELINES:**
1. Combine rules with similar patterns using wildcards or regex
2. Use wildcards (*) for simple patterns when possible (more readable than regex)
3. Use regex only when necessary for complex patterns
4. Merge rules for the same site and field where possible
5. Keep the highest priority when merging rules
6. Remove duplicate or redundant rules
7. Ensure all unique functionality is preserved

**CURRENT RULES:**
(See exported rules below)

**INSTRUCTIONS:**
1. Analyze the rules and identify optimization opportunities
2. Combine similar rules where possible
3. Output ONLY the optimized rules in the same semicolon-separated format
4. Do not add explanations - just output the rules
5. One rule per line
6. Ensure all original functionality is preserved`;

  elements.llmPromptOutput.value = prompt;
  elements.llmPromptOutput.select();

  // Also export rules automatically
  exportRulesForLLM();

  alert('LLM prompt generated! Copy the prompt and the exported rules to your LLM.');
}

/**
 * Eksporter regler i semikolonseparert format for LLM
 */
function exportRulesForLLM() {
  const rules = allRules.map(rule => {
    return [
      rule.sitePattern || '',
      rule.siteMatchType || 'host',
      rule.elementType || 'text',
      rule.fieldType || 'name',
      rule.fieldPattern || '',
      rule.fieldUseRegex ? 'true' : 'false',
      rule.value || '',
      rule.priority || '0',
      rule.enabled !== false ? 'true' : 'false',
      rule.profileId || 'default',
      rule.conditionType || 'none',
      rule.conditionValue || ''
    ].join(';');
  }).join('\n');

  elements.rulesExportOutput.value = rules;
  elements.rulesExportOutput.select();

  alert(`${allRules.length} rules exported! Copy the rules to your LLM along with the prompt.`);
}

/**
 * Importer LLM-optimaliserte regler
 */
async function importLLMRules() {
  const input = elements.llmRulesInput.value.trim();

  if (!input) {
    alert('Please paste the optimized rules from the LLM first.');
    return;
  }

  const lines = input.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  if (lines.length === 0) {
    alert('No valid rules found in input.');
    return;
  }

  const confirmMsg = `This will REPLACE all ${allRules.length} existing rules with ${lines.length} optimized rules.\n\nAre you sure? This cannot be undone!\n\n(Tip: Export your current rules as backup first)`;

  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    const newRules = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split(';');

      if (parts.length < 7) {
        alert(`Invalid rule format at line ${i + 1}. Expected at least 7 fields, got ${parts.length}.`);
        return;
      }

      const rule = {
        sitePattern: parts[0],
        siteMatchType: parts[1] || 'host',
        elementType: parts[2] || 'text',
        fieldType: parts[3] || 'name',
        fieldPattern: parts[4],
        fieldUseRegex: parts[5] === 'true',
        value: parts[6],
        priority: parseInt(parts[7]) || 0,
        enabled: parts[8] !== 'false',
        profileId: parts[9] || 'default',
        conditionType: parts[10] || 'none',
        conditionValue: parts[11] || ''
      };

      newRules.push(rule);
    }

    // Delete all existing rules
    for (const rule of allRules) {
      await Storage.deleteRule(rule.id);
    }

    // Add new optimized rules
    for (const rule of newRules) {
      await Storage.addRule(rule);
    }

    alert(`Success! Imported ${newRules.length} optimized rules.`);

    // Reload rules
    await loadRules();

    // Clear input
    elements.llmRulesInput.value = '';

  } catch (error) {
    console.error('Error importing LLM rules:', error);
    alert(`Error importing rules: ${error.message}`);
  }
}

function renderOptimizerStats(report, t) {
  if (!elements.optimizerStats) return;
  const stats = t.optimizer?.stats || {};
  elements.optimizerStats.innerHTML = `
    <div class="stat-row">
      <div><strong>${report.totalRules}</strong><small>${stats.total || 'Totalt'}</small></div>
      <div><strong>${report.enabledRules}</strong><small>${stats.active || 'Aktive'}</small></div>
      <div><strong>${report.regexRules}</strong><small>${stats.regex || 'Regex'}</small></div>
      <div><strong>${report.unusedRules}</strong><small>${stats.unused || 'Ubrukt'}</small></div>
      <div><strong>${(report.suggestions || []).length}</strong><small>${stats.suggestions || 'Forslag'}</small></div>
    </div>
  `;
}

function renderSuggestions(suggestions, t) {
  if (!elements.suggestionsList) return;
  elements.suggestionsList.innerHTML = '';
  if (!suggestions || suggestions.length === 0) {
    const empty = t.optimizer?.empty || {};
    elements.suggestionsList.innerHTML = `
      <div class="empty">
        <strong>${empty.title || 'Ingen forslag'}</strong>
        <p>${empty.desc || ''}</p>
      </div>
    `;
    return;
  }

  for (const s of suggestions) {
    const item = document.createElement('div');
    item.className = 'suggestion';
    item.innerHTML = `
      <div class="suggestion-type">${escapeHtml(s.type || '')}</div>
      <div class="suggestion-desc">${escapeHtml(s.description || '')}</div>
      <div class="suggestion-actions">
        <button class="btn btn-small btn-secondary apply-suggestion">${t.optimizer?.actions?.apply || 'Apply'}</button>
        <button class="btn btn-small dismiss-suggestion">${t.optimizer?.actions?.dismiss || 'Dismiss'}</button>
      </div>
    `;
    item.querySelector('.apply-suggestion').addEventListener('click', () => applySuggestion(s));
    item.querySelector('.dismiss-suggestion').addEventListener('click', () => item.remove());
    elements.suggestionsList.appendChild(item);
  }
}

async function applySuggestion(suggestion) {
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  try {
    switch (suggestion.action) {
      case 'delete':
        for (const id of suggestion.affectedRules) {
          await chrome.runtime.sendMessage({ action: 'deleteRule', ruleId: id });
        }
        break;
      case 'combine': {
        const rules = allRules.filter(r => suggestion.affectedRules.includes(r.id));
        let combined;
        if (suggestion.type === 'simplify' && suggestion.newPattern && suggestion.fieldPattern) {
          combined = {
            sitePattern: suggestion.newPattern,
            siteMatchType: 'domain',
            fieldType: rules[0].fieldType,
            fieldPattern: suggestion.fieldPattern,
            fieldUseRegex: suggestion.fieldUseRegex || false,
            value: suggestion.value,
            enabled: true
          };
        } else {
          combined = RuleOptimizer.combineRules(rules, suggestion.newPattern);
        }
        if (combined) {
          await chrome.runtime.sendMessage({ action: 'addRule', rule: combined });
          for (const id of suggestion.affectedRules) {
            await chrome.runtime.sendMessage({ action: 'deleteRule', ruleId: id });
          }
        }
        break;
      }
      case 'update':
        await chrome.runtime.sendMessage({
          action: 'updateRule',
          ruleId: suggestion.affectedRules[0],
          updates: suggestion.updates
        });
        break;
    }
    await loadRules();
    hideOptimizer();
  } catch (e) {
    console.error('Could not apply suggestion', e);
    alert(t.alerts?.saveError || 'Could not apply suggestion');
  }
}

// --- Profiles ---
async function loadProfiles() {
  try {
    profiles = await Storage.getProfiles();
    renderProfileSelect();
    renderActiveProfileSelect();
    if (elements.activeProfileSelect && !currentProfileId && profiles.length) {
      currentProfileId = profiles[0].id;
      elements.activeProfileSelect.value = currentProfileId;
    }
  } catch (err) {
    console.error('Error loading profiles', err);
  }
}

function renderProfileSelect() {
  if (elements.ruleProfileSelect && profiles) {
    elements.ruleProfileSelect.innerHTML = '';
    profiles.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      elements.ruleProfileSelect.appendChild(opt);
    });
  }
}

function renderActiveProfileSelect() {
  if (!elements.activeProfileSelect || !profiles) return;
  elements.activeProfileSelect.innerHTML = '';
  profiles.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    elements.activeProfileSelect.appendChild(opt);
  });
  const target = currentProfileId || 'default';
  elements.activeProfileSelect.value = target;
}

function handleActiveProfileChange() {
  if (!elements.activeProfileSelect) return;
  currentProfileId = elements.activeProfileSelect.value || 'default';
  chrome.storage.local.set({ currentProfileId });
  chrome.runtime.sendMessage({ action: 'setCurrentProfile', profileId: currentProfileId }).catch(() => {});
  applyFilters();
}

// --- Test match passthrough ---
async function handleTestMatch() {
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  try {
    const tab = await getActiveContentTab();
    if (!tab) {
      alert((TRANSLATIONS.current
        ? 'Ingen gyldig side åpen. Åpne en vanlig webside (ikke chrome://) og prøv igjen.'
        : 'No valid page open. Open a regular webpage (not chrome://) and try again.'));
      return;
    }

    // Try to send message to content script
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: 'testMatches' });
    } catch (e) {
      // Content script not loaded - try to inject it
      console.warn('Content script not found, attempting to inject...', e);
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 500));
        response = await chrome.tabs.sendMessage(tab.id, { action: 'testMatches' });
      } catch (injectError) {
        console.error('Failed to inject content script:', injectError);
        alert((TRANSLATIONS.current
          ? 'Kunne ikke koble til siden. Last siden på nytt og prøv igjen.'
          : 'Could not connect to page. Reload the page and try again.'));
        return;
      }
    }

    if (!response || !response.success) {
      alert(t.alerts?.testMatchError || 'Kunne ikke teste match');
      return;
    }

    const lines = (response.matches || []).map(m => `${m.field} (${m.elementType}) -> ${m.ruleId} = ${m.ruleValue}`);
    const msg = (t.alerts?.testMatchResult || 'Fields: {total}\nMatches:\n{matches}')
      .replace('{total}', response.totalFields)
      .replace('{matches}', lines.join('\n') || 'Ingen');
    alert(msg);
  } catch (e) {
    console.error('Test match error:', e);
    alert(t.alerts?.testMatchError || 'Kunne ikke teste match');
  }
}

async function getActiveContentTab() {
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const isContent = active && active.url && !active.url.startsWith('chrome-extension://') && !active.url.startsWith('chrome://');
  if (isContent) return active;

  const candidates = await chrome.tabs.query({});
  return candidates.find(t =>
    t.url &&
    !t.url.startsWith('chrome-extension://') &&
    !t.url.startsWith('chrome://')
  ) || null;
}

// --- Regex Help ---
function showRegexHelp() {
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  const title = t.copy?.regexHelpTitle || 'Regex help';
  const helpText = t.copy?.regexHelp || '';
  alert(`${title}\n\n${helpText}`);
}

// --- Translations ---
function applyTranslations() {
  const t = TRANSLATIONS.current || TRANSLATIONS.en || {};
  syncSearchModeLock();
  
  const page = t.rulesPage || {};

  const setText = (el, value) => { if (el && value) el.textContent = value; };
  const setPlaceholder = (el, value) => { if (el && value) el.placeholder = value; };
  const updateOptions = (selectEl, map) => {
    if (!selectEl || !map) return;
    Array.from(selectEl.options).forEach(opt => {
      if (map[opt.value]) opt.textContent = map[opt.value];
    });
  };

  // Header
  setText(document.getElementById('pageTitle'), page.title);
  setText(document.getElementById('pageSubtitle'), page.subtitle);
  setText(document.getElementById('eyebrowLabel'), page.eyebrow);
  setText(document.getElementById('llmSectionTitle'), t.headings?.llmSection);
  setText(document.getElementById('llmSectionDesc'), t.headings?.llmSectionDesc);
  setText(document.getElementById('llmPromptLabelDisplay'), t.headings?.llmPromptLabel);
  setText(document.getElementById('llmExportLabel'), t.headings?.llmExportLabel);
  setText(document.getElementById('llmImportLabel'), t.headings?.llmImportLabel);
  setText(document.getElementById('blacklistTitle'), t.headings?.blacklistTitle);
  setText(document.getElementById('settingsTitle'), t.headings?.settingsTitle);
  setText(document.getElementById('variablesHeading'), t.headings?.variablesUsage);
  setText(elements.validateRulesBtn, t.buttons?.validateBtn);

  // Header actions
  if (page.actions) {
    setText(elements.refreshBtn, page.actions.refresh);
    setText(elements.exportSelectedBtn, page.actions.exportSelected);
    setText(elements.importRulesBtn, page.actions.import);
    setText(elements.cloudRestoreBtn, page.actions.restore || t.cloud?.restore);
    setText(elements.cloudBackupBtn, page.actions.backup || t.cloud?.backup);
    setText(elements.mergeFilteredBtn, page.actions.mergeFiltered);
    setText(elements.openPopupBtn, page.actions.openPopup);
  }
  setText(document.getElementById('lblSearchRegex'), page.search?.regex);
  setText(document.getElementById('lblSearchFields'), page.search?.fields);
  setText(document.getElementById('lblSearchValues'), page.search?.values);
  const searchMode = document.getElementById('searchMode');
  if (searchMode && page.search) {
    Array.from(searchMode.options).forEach(opt => {
      if (page.search?.modes?.[opt.value]) opt.textContent = page.search.modes[opt.value];
    });
    const lbl = document.getElementById('lblSearchMode');
    if (lbl && page.search.modeLabel) lbl.textContent = page.search.modeLabel;
  }

  // Controls
  if (page.controls) {
    setText(document.getElementById('lblActiveProfile'), page.controls.activeProfile);
    setText(document.getElementById('lblSelectAll'), page.controls.selectAll);
    setPlaceholder(elements.searchInput, page.controls.searchPlaceholder);
    setText(document.getElementById('lblEnabledOnly'), page.controls.enabledOnly);
    setText(document.getElementById('lblRegexOnly'), page.controls.regexOnly);
    setText(document.getElementById('lblGroupBy'), page.controls.groupBySite);
    setText(document.getElementById('lblSort'), page.controls.sortLabel);
  }

  // Sort options
  updateOptions(elements.sortBy, t.sortOptions);

  // Summary
  if (page.summary) {
    setText(document.getElementById('lblTotal'), page.summary.total);
    setText(document.getElementById('lblActive'), page.summary.active);
    setText(document.getElementById('lblRegex'), page.summary.regex);
    setText(document.getElementById('lblSelected'), page.summary.selected);
  }

  if (t.importPreview) {
    setText(elements.importPreviewTitle, t.importPreview.title);
    setText(elements.skipDuplicatesLabel, t.importPreview.skipDuplicates);
    setText(elements.skipInvalidLabel, t.importPreview.skipInvalid);
    setText(elements.duplicatesTitle, t.importPreview.duplicates);
    setText(elements.invalidTitle, t.importPreview.invalid);
    setText(elements.confirmImportPreview, t.importPreview.import);
    setText(elements.cancelImportPreview, t.buttons?.cancel);
  }

  // Empty/loading
  const emptyEl = elements.rulesContainer?.querySelector('.empty');
  if (emptyEl && page.empty) {
    emptyEl.textContent = page.empty.loading || page.empty.none || emptyEl.textContent;
  }

  // Settings/blacklist
  if (page.blacklist) {
    setText(document.getElementById('blacklistTitle'), page.blacklist.title);
    setText(document.getElementById('blacklistSubtitle'), page.blacklist.subtitle);
    setText(document.getElementById('blacklistLabel'), page.blacklist.label);
    setPlaceholder(document.getElementById('blacklistRules'), page.blacklist.placeholder);
    setText(document.getElementById('saveBlacklistBtn'), page.blacklist.save);
  }
  if (page.notifications) {
    setText(document.getElementById('notificationLabel'), page.notifications.label);
  }
  if (page.variables) {
    setText(document.getElementById('variablesHeading'), page.variables.heading);
  }
  setText(document.getElementById('settingsTitle'), page.settingsTitle);

  // Floating buttons
  if (elements.aiAssistBtn && t.buttons) {
    elements.aiAssistBtn.textContent = t.buttons.aiAssistBtn;
    elements.optimizeBtn.textContent = t.buttons.optimizeBtn;
    elements.variablesBtn.textContent = t.buttons.variablesBtn;
    elements.selectModeBtn.textContent = t.buttons.selectModeBtn;
    elements.addRuleBtn.textContent = t.buttons.addRuleBtn;
  }
  if (elements.bulkEnable && t.buttons) elements.bulkEnable.textContent = t.buttons.bulkEnable || 'Enable';
  if (elements.bulkDisable && t.buttons) elements.bulkDisable.textContent = t.buttons.bulkDisable || 'Disable';
  if (elements.bulkDelete && t.buttons) elements.bulkDelete.textContent = t.buttons.bulkDelete || 'Delete';
  if (elements.exitSelectMode && t.buttons) elements.exitSelectMode.textContent = t.buttons.bulkCancel || 'Cancel';

  // Modal labels/hints/placeholders
  if (t.modalLabels) {
    setText(document.querySelector('label[for="sitePattern"]'), t.modalLabels.sitePattern);
    setText(document.querySelector('label[for="siteMatchType"]'), t.modalLabels.siteMatchType);
    setText(document.querySelector('label[for="elementType"]'), t.modalLabels.elementType);
    setText(document.querySelector('label[for="fieldType"]'), t.modalLabels.fieldType);
    setText(document.querySelector('label[for="fieldPattern"]'), t.modalLabels.fieldPattern);
    setText(document.querySelector('label[for="value"]'), t.modalLabels.value);
    setText(document.querySelector('label[for="comment"]'), t.modalLabels.comment || 'Comment');
    setText(document.querySelector('label[for="conditionType"]'), t.modalLabels.conditionType || t.conditionTypes?.none);
    setText(document.querySelector('label[for="priority"]'), t.modalLabels.priority || 'Priority');
  }
  if (t.modalHints) {
    setText(document.querySelector('small[for=\"sitePattern\"], #siteHint'), t.modalHints.site);
    setText(document.querySelector('#elementTypeHint'), t.modalHints.elementType);
    setText(document.querySelector('#fieldTypeHint'), t.modalHints.fieldType);
    setText(document.querySelector('#valueHint'), t.modalHints.value);
  }
  setPlaceholder(document.getElementById('sitePattern'), t.placeholders?.sitePattern);
  setPlaceholder(document.getElementById('fieldPattern'), t.placeholders?.fieldPattern);
  setPlaceholder(document.getElementById('value'), t.placeholders?.value);
  setPlaceholder(document.getElementById('comment'), t.placeholders?.comment);

  // Options
  updateOptions(document.getElementById('siteMatchType'), t.matchTypes);
  updateOptions(document.getElementById('elementType'), t.elementTypes);
  updateOptions(document.getElementById('fieldType'), t.fieldTypes);
  updateOptions(document.getElementById('conditionType'), t.conditionTypes);
  const useRegexLabel = document.getElementById('lblUseRegex');
  if (useRegexLabel && t.filters?.regex) useRegexLabel.textContent = t.filters.regex;
  const regexInfoIcon = document.getElementById('regexInfoRules');
  if (regexInfoIcon && t.copy?.regexHelpTitle) regexInfoIcon.title = t.copy.regexHelpTitle;

  // Profile label
  if (elements.lblRuleProfile && t.profiles) {
    elements.lblRuleProfile.textContent = t.profiles.label;
  }

  // Modal title/buttons
  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle && !editingRuleId) {
    modalTitle.textContent = t.modalTitleNew || modalTitle.textContent;
  } else if (modalTitle && editingRuleId) {
    modalTitle.textContent = t.modalTitleEdit || modalTitle.textContent;
  }
  if (elements.copyAiPrompt && t.buttons) {
    elements.copyAiPrompt.textContent = t.buttons.copyAiPrompt;
    elements.regenerateAiPrompt.textContent = t.buttons.regenerateAiPrompt;
  }
  const aiTitle = document.getElementById('aiModalTitle');
  const aiIntro = document.getElementById('aiModalIntro');
  const aiHintWildcard = document.getElementById('aiHintWildcard');
  const aiHintRegex = document.getElementById('aiHintRegex');
  const aiHints = document.getElementById('aiModalHints');
  if (aiTitle) aiTitle.textContent = t.ai?.title || aiTitle.textContent;
  if (aiIntro && t.ai?.intro) aiIntro.textContent = t.ai.intro;
  if (aiHintWildcard && t.ai?.wildcard) aiHintWildcard.textContent = t.ai.wildcard;
  if (aiHintRegex && t.ai?.regex) aiHintRegex.textContent = t.ai.regex;
  if (aiHints) aiHints.style.display = (t.ai?.wildcard || t.ai?.regex) ? 'block' : 'none';
  if (elements.aiPromptLabel && t.ai?.promptLabel) elements.aiPromptLabel.textContent = t.ai.promptLabel;
  if (elements.aiCsvLabel && t.ai?.pasteCsvLabel) elements.aiCsvLabel.textContent = t.ai.pasteCsvLabel;
  setPlaceholder(elements.aiCsvInput, t.ai?.csvPlaceholder);
  if (elements.importAiCsvBtn && t.ai?.importBtn) elements.importAiCsvBtn.textContent = t.ai.importBtn;
  if (elements.cancelBtn && t.buttons) elements.cancelBtn.textContent = t.buttons.cancel;
  if (elements.saveBtn && t.buttons) elements.saveBtn.textContent = t.buttons.save;

  // Optimizer / AI / Variables titles
  setText(document.getElementById('optimizerTitle'), t.headings?.optimizer || t.optimizer?.title);

  const varsTitle = document.querySelector('#variablesModal h2');
  if (varsTitle) varsTitle.textContent = t.variables?.title || varsTitle.textContent;
  const varsDesc = document.querySelector('#variablesModalDesc');
  if (varsDesc && t.variables?.desc) varsDesc.innerHTML = t.variables.desc.replace('{variableName}', '<code>{variableName}</code>');

  // Variable inputs (modal + inline)
  elements.variableForms?.forEach(form => {
    const keyInput = form.querySelector('[data-var-key]');
    const valueInput = form.querySelector('[data-var-value]');
    const submitBtn = form.querySelector('[data-var-submit]');
    setPlaceholder(keyInput, t.variables?.placeholderKey);
    setPlaceholder(valueInput, t.variables?.placeholderValue);
    if (submitBtn && t.variables?.add) submitBtn.textContent = t.variables.add;
  });
}

