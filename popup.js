/**
 * Popup UI Script for AutoFill Plugin v0.2.0
 * Håndterer all UI-logikk for popup-vinduet
 */

// Globale variabler
let allRules = [];
let pageRules = [];
let userVariables = {}; // Ny global for variabler
let currentProfileId = 'default'; // Ny global for profiler
let filteredRules = [];
let currentTab = null;
let editingRuleId = null;
let selectMode = false;
let selectedRules = new Set();
let currentSort = 'order';
let availableFields = [];
let draggingRuleId = null;
let cloudConfig = {};
let importPreviewState = null;
let logEnabled = false;
let logBuffer = [];
const LOG_KEY = 'debugLog';
const MAX_LOG_ENTRIES = 500;

const translationsLocal = { en: {}, no: {} };
const translations = typeof TRANSLATIONS !== "undefined" ? TRANSLATIONS : translationsLocal;
// DOM-elementer
const elements = {};

/**
 * Appliser oversettelser til UI
 */
function applyTranslations() {
  const t = translations.current || translations.en || {};
  const tEn = translations.en || {};
  const setText = (id, value) => {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  const setPlaceholder = (id, value) => {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.placeholder = value;
  };

  // Buttons
  if (elements.openFullViewBtn) elements.openFullViewBtn.textContent = t.buttons.openFullViewBtn;
  if (elements.exportBtn) elements.exportBtn.textContent = t.buttons.exportBtn;
  if (elements.importBtn) elements.importBtn.textContent = t.buttons.importBtn;
  if (elements.validateBtn) elements.validateBtn.textContent = t.buttons.validateBtn;
  if (elements.testMatchBtn) elements.testMatchBtn.textContent = t.buttons.testMatchBtn;
  if (elements.aiAssistBtn) elements.aiAssistBtn.textContent = t.buttons.aiAssistBtn;
  if (elements.optimizeBtn) elements.optimizeBtn.textContent = t.buttons.optimizeBtn;
  if (elements.variablesBtn) elements.variablesBtn.textContent = t.buttons.variablesBtn;
  if (elements.selectModeBtn) elements.selectModeBtn.textContent = t.buttons.selectModeBtn;
  if (elements.addRuleBtn) elements.addRuleBtn.textContent = t.buttons.addRuleBtn;
  
  // Bulk buttons
  if (elements.bulkEnable) elements.bulkEnable.textContent = t.buttons.bulkEnable;
  if (elements.bulkDisable) elements.bulkDisable.textContent = t.buttons.bulkDisable;
  if (elements.bulkDelete) elements.bulkDelete.textContent = t.buttons.bulkDelete;
  if (elements.bulkCancel) elements.bulkCancel.textContent = t.buttons.bulkCancel;

  // Sync buttons
  if (elements.pushSyncBtn) elements.pushSyncBtn.textContent = t.buttons.pushSyncBtn;
  if (elements.pullSyncBtn) elements.pullSyncBtn.textContent = t.buttons.pullSyncBtn;
  
  // AI buttons
  const copyBtn = document.getElementById('copyAiPrompt');
  const refreshBtn = document.getElementById('regenerateAiPrompt');
  if (copyBtn) copyBtn.textContent = t.buttons.copyAiPrompt;
  if (refreshBtn) refreshBtn.textContent = t.buttons.regenerateAiPrompt;
  if (elements.exportLogBtn && t.buttons.exportLog) elements.exportLogBtn.textContent = t.buttons.exportLog;
  if (elements.appTitle) elements.appTitle.textContent = t.appTitle || tEn.appTitle || 'AutoFill';
  if (elements.pageTitle) elements.pageTitle.textContent = t.appTitle || tEn.appTitle || 'AutoFill';
  if (elements.btnOpenFullViewLabel) elements.btnOpenFullViewLabel.textContent = t.buttons.openFullViewBtn || tEn.buttons?.openFullViewBtn || 'Open full view';
  if (elements.btnExportLabel) elements.btnExportLabel.textContent = t.buttons.exportBtn || tEn.buttons?.exportBtn || 'Export';
  if (elements.btnImportLabel) elements.btnImportLabel.textContent = t.buttons.importBtn || tEn.buttons?.importBtn || 'Import';
  if (elements.btnValidateLabel) elements.btnValidateLabel.textContent = t.buttons.validateBtn || tEn.buttons?.validateBtn || 'Validate';
  if (elements.manageProfilesBtn && t.profiles?.manage) elements.manageProfilesBtn.title = t.profiles.manage;
  if (elements.loadingText) elements.loadingText.textContent = t.rulesPage?.empty?.loading || t.pageRules?.loading || 'Loading...';

  // Placeholders
  if (elements.searchInput) elements.searchInput.placeholder = t.placeholders.searchInput || tEn.placeholders?.searchInput || '';
  if (elements.availableSearch) elements.availableSearch.placeholder = t.placeholders.availableSearch || tEn.placeholders?.availableSearch || '';
  setText('lblFilterEnabled', t.filters?.enabled || tEn.filters?.enabled || 'Only active');
  setText('lblFilterRegex', t.filters?.regex || tEn.filters?.regex || 'Only regex');
  setText('lblSort', t.filters?.sortLabel || tEn.filters?.sortLabel || 'Sort:');
  // Sort options with fallback
  const sortSelect = document.getElementById('sortBy');
  if (sortSelect) {
    Array.from(sortSelect.options).forEach(opt => {
      const label = t.sortOptions?.[opt.value] || tEn.sortOptions?.[opt.value];
      if (label) opt.textContent = label;
    });
  }

  // Stats labels
  const statLabels = document.querySelectorAll('.stat-label');
  if (statLabels.length >= 3) {
      statLabels[0].textContent = t.statLabels?.[0] || tEn.statLabels?.[0] || 'Total:';
      statLabels[1].textContent = t.statLabels?.[1] || tEn.statLabels?.[1] || 'Active:';
      statLabels[2].textContent = t.statLabels?.[2] || tEn.statLabels?.[2] || 'This page:';
  }

  // Available section
  const availHeader = document.querySelector('.available-header h3');
  if (availHeader) availHeader.textContent = t.available.title || tEn.available?.title || 'Available fields';
  
  const availSmall = document.querySelector('.available-header small');
  if (availSmall) availSmall.textContent = t.available.subtitle || tEn.available?.subtitle || '';

  if (elements.availableEmpty) elements.availableEmpty.textContent = t.available.empty || tEn.available?.empty || '';
  if (elements.availableTitle) elements.availableTitle.textContent = t.available.title || tEn.available?.title || '';
  if (elements.availableSubtitle) elements.availableSubtitle.textContent = t.available.subtitle || tEn.available?.subtitle || '';
  if (elements.availableSearchLabel) elements.availableSearchLabel.textContent = t.available.title || tEn.available?.title || '';

  // Profiles
  if (elements.manageProfilesBtn) elements.manageProfilesBtn.title = t.profiles.manage || tEn.profiles?.manage || '';
  const profHeader = document.querySelector('#profilesModal h2');
  const newProfInput = document.getElementById('newProfileName');
  const addProfBtn = document.querySelector('#addProfileForm button');
  
  if (profHeader) profHeader.textContent = t.profiles.manage || tEn.profiles?.manage || '';
  if (newProfInput) newProfInput.placeholder = t.profiles.namePlaceholder || tEn.profiles?.namePlaceholder || '';
  if (addProfBtn) addProfBtn.textContent = t.profiles.add || tEn.profiles?.add || '';

  const ruleProfileLabel = document.querySelector('label[for="ruleProfileSelect"]');
  if (ruleProfileLabel) ruleProfileLabel.textContent = t.profiles.label || tEn.profiles?.label || '';
  if (elements.variablesModalTitle) elements.variablesModalTitle.textContent = t.variables.title || tEn.variables?.title || '';
  if (elements.optimizerTitle) elements.optimizerTitle.textContent = t.optimizer?.title || tEn.optimizer?.title || '';

  // Rules header
  const rulesHeader = elements.pageRulesTitle || document.querySelector('.rules-header h2');
  if (rulesHeader) rulesHeader.textContent = (t.pageRules && t.pageRules.header) || t.rulesHeader || tEn.rulesHeader || 'Rules';
  if (elements.forceFillBtn && t.pageRules) {
    elements.forceFillBtn.textContent = t.pageRules.forceFill || tEn.pageRules?.forceFill || 'Force fill now';
    elements.forceFillBtn.title = t.pageRules.forceFillTitle || tEn.pageRules?.forceFillTitle || '';
  }
  if (elements.testMatchBtn && t.buttons?.testMatchBtn) elements.testMatchBtn.textContent = t.buttons.testMatchBtn;
  if (elements.optimizerTitle && (t.optimizer?.title || tEn.optimizer?.title)) {
    elements.optimizerTitle.textContent = t.optimizer?.title || tEn.optimizer?.title || 'Optimization suggestions';
  }

  // Empty state
  const emptyP = document.querySelector('.empty-state p');
  if (emptyP) emptyP.textContent = (t.pageRules && t.pageRules.empty) || t.emptyRules;
  const emptyHint = document.querySelector('.empty-state .empty-hint');
  if (emptyHint) emptyHint.textContent = (t.pageRules && t.pageRules.hint) || t.emptyHint || tEn.emptyHint || '';

  if (t.modalLabels) {
    setText('lblSitePattern', t.modalLabels.sitePattern);
    setText('lblSiteMatchType', t.modalLabels.siteMatchType);
    setText('lblElementType', t.modalLabels.elementType);
    setText('lblFieldType', t.modalLabels.fieldType);
    setText('lblFieldPattern', t.modalLabels.fieldPattern);
    setText('lblValue', t.modalLabels.value);
    setText('lblPriority', (t.ruleLabels && t.ruleLabels.priority) || '');
    setText('lblCondition', (t.ruleLabels && t.ruleLabels.condition) || '');
    setText('lblEnabled', (t.ruleLabels && t.ruleLabels.enabled) || '');
  }

  if (t.modalHints) {
    setText('siteHint', t.modalHints.site);
    setText('elementTypeHint', t.modalHints.elementType);
    setText('fieldTypeHint', t.modalHints.fieldType);
    setText('valueHint', t.modalHints.value);
    const regexInfo = document.getElementById('regexInfo');
    if (regexInfo && t.modalHints.regex) {
      regexInfo.title = t.modalHints.regex;
    }
  }

  setPlaceholder('sitePattern', t.placeholders.sitePattern);
  setPlaceholder('fieldPattern', t.placeholders.fieldPattern);
  setPlaceholder('value', t.placeholders.value);

  setText('lblUseRegex', (t.filters && t.filters.regex) || 'Use regex');

  // Select option labels
  const updateOptions = (selectId, map) => {
    const select = document.getElementById(selectId);
    if (!select || !map) return;
    Array.from(select.options).forEach(opt => {
      if (map[opt.value]) {
        opt.textContent = map[opt.value];
      }
    });
  };

  updateOptions('siteMatchType', t.matchTypes);
  updateOptions('elementType', t.elementTypes);
  updateOptions('fieldType', t.fieldTypes);
  updateOptions('conditionType', t.conditionTypes);
  updateOptions('autofillMode', t.autofillModes);

  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');
  if (cancelBtn && t.buttons.cancel) cancelBtn.textContent = t.buttons.cancel;
  if (saveBtn && t.buttons.save) saveBtn.textContent = t.buttons.save;

  // Settings labels
  const settingsItems = document.querySelectorAll('.settings-section .setting-item[data-setting]');
  settingsItems.forEach(item => {
    const key = item.getAttribute('data-setting');
    const label = item.querySelector('.setting-label');
    const desc = item.querySelector('.setting-description');
    const cfg = t.settings?.[key];
    if (label && cfg?.label) label.textContent = cfg.label;
    if (desc && cfg?.desc) desc.textContent = cfg.desc;
  });

  if (elements.settingsTitle && t.settingsPanel?.title) {
    elements.settingsTitle.textContent = t.settingsPanel.title;
  }
  updateAdvancedToggleLabel();

  if (t.cloud) {
    if (elements.cloudBackupLabel) elements.cloudBackupLabel.textContent = t.cloud.title;
    if (elements.cloudBackupDesc) elements.cloudBackupDesc.textContent = t.cloud.desc;
    if (elements.cloudBackupBtn) elements.cloudBackupBtn.textContent = t.cloud.backup;
    if (elements.cloudRestoreBtn) elements.cloudRestoreBtn.textContent = t.cloud.restore;
  }

  if (t.importPreview) {
    if (elements.importPreviewTitle) elements.importPreviewTitle.textContent = t.importPreview.title;
    if (elements.skipDuplicatesLabel) elements.skipDuplicatesLabel.textContent = t.importPreview.skipDuplicates;
    if (elements.skipInvalidLabel) elements.skipInvalidLabel.textContent = t.importPreview.skipInvalid;
    if (elements.duplicatesTitle) elements.duplicatesTitle.textContent = t.importPreview.duplicates;
    if (elements.invalidTitle) elements.invalidTitle.textContent = t.importPreview.invalid;
    if (elements.confirmImportPreview) elements.confirmImportPreview.textContent = t.importPreview.import;
    if (elements.cancelImportPreview) elements.cancelImportPreview.textContent = t.buttons.cancel;
  }

  // Variables Modal
  const varHeader = document.querySelector('#variablesModal h2');
  const varDesc = document.querySelector('#variablesModal .modal-body p');
  const varKey = document.getElementById('newVarKey');
  const varValue = document.getElementById('newVarValue');
  const varAddBtn = document.querySelector('#addVariableForm button');

  if (varHeader) varHeader.textContent = t.variables.title;
  if (varDesc) varDesc.innerHTML = t.variables.desc.replace('{variableName}', '<code>{variableName}</code>');
  if (varKey) varKey.placeholder = t.variables.placeholderKey;
  if (varValue) varValue.placeholder = t.variables.placeholderValue;
  if (varAddBtn) varAddBtn.textContent = t.variables.add;

  // AI modal
  const aiTitle = document.getElementById('aiModalTitle');
  const aiIntro = document.getElementById('aiModalIntro');
  const aiHintList = document.getElementById('aiModalHints');
  const aiHintWildcard = document.getElementById('aiHintWildcard');
  const aiHintRegex = document.getElementById('aiHintRegex');
  if (aiTitle) aiTitle.textContent = t.ai.title;
  if (aiIntro) aiIntro.textContent = t.ai.intro;
  if (aiHintWildcard) aiHintWildcard.textContent = t.ai.wildcard || '';
  if (aiHintRegex) aiHintRegex.textContent = t.ai.regex || '';
  if (aiHintList) {
    aiHintList.style.display = (t.ai.wildcard || t.ai.regex) ? 'block' : 'none';
  }
  
  // Refresh dynamic lists if open
  if (elements.variablesModal.style.display === 'flex') {
      renderVariables();
  }

}

/**
 * Initialiser popup
 */
document.addEventListener('DOMContentLoaded', async () => {
  initElements();
  attachEventListeners();
  await loadSettings();
  await loadCurrentTab();
  await loadCurrentProfileId();
  await loadProfiles(); // Ny
  await loadRules();
  await loadAvailableFields();
  await loadVariables(); // Ny funksjon
  applyTranslations(); // Apply translations after settings load
});

// Lytt til meldinger (f.eks. setCurrentProfile fra context menu)
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'setCurrentProfile' && request.profileId) {
    currentProfileId = request.profileId;
    if (elements.profileSelect) elements.profileSelect.value = currentProfileId;
    loadRules();
  }
});

/**
 * Initialiser DOM-elementer
 */
function initElements() {
  // Eksisterende elementer
  elements.rulesList = document.getElementById('rulesList');
  elements.pageRulesTitle = document.getElementById('pageRulesTitle');
  elements.pageTitle = document.getElementById('pageTitle');
  elements.appTitle = document.getElementById('appTitle');
  elements.btnOpenFullViewLabel = document.getElementById('btnOpenFullViewLabel');
  elements.btnExportLabel = document.getElementById('btnExportLabel');
  elements.btnImportLabel = document.getElementById('btnImportLabel');
  elements.btnValidateLabel = document.getElementById('btnValidateLabel');
  elements.availableTitle = document.getElementById('availableTitle');
  elements.availableSubtitle = document.getElementById('availableSubtitle');
  elements.availableSearchLabel = document.getElementById('availableSearchLabel');
  elements.searchInput = document.getElementById('searchInput');
  elements.filterEnabled = document.getElementById('filterEnabled');
  elements.filterRegex = document.getElementById('filterRegex');
  elements.totalRules = document.getElementById('totalRules');
  elements.activeRules = document.getElementById('activeRules');
  elements.currentSiteRules = document.getElementById('currentSiteRules');
  elements.emptyState = document.getElementById('emptyState');
  elements.loading = document.getElementById('loading');
  elements.loadingText = document.getElementById('loadingText');
  elements.editModal = document.getElementById('editModal');
  elements.editForm = document.getElementById('editForm');
  elements.addRuleBtn = document.getElementById('addRuleBtn');
  elements.testMatchBtn = document.getElementById('testMatchBtn');
  elements.forceFillBtn = document.getElementById('forceFillBtn');
  elements.exportBtn = document.getElementById('exportBtn');
  elements.importBtn = document.getElementById('importBtn');
  elements.validateBtn = document.getElementById('validateBtn');
  elements.fileInput = document.getElementById('fileInput');
  elements.validateFileInput = document.getElementById('validateFileInput');

  // Nye elementer for v0.2.0
  elements.sortBy = document.getElementById('sortBy');
  elements.selectModeBtn = document.getElementById('selectModeBtn');
  elements.optimizeBtn = document.getElementById('optimizeBtn');
  elements.variablesBtn = document.getElementById('variablesBtn'); // Ny
  elements.bulkActions = document.getElementById('bulkActions');
  elements.selectedCount = document.getElementById('selectedCount');
  elements.bulkEnable = document.getElementById('bulkEnable');
  elements.bulkDisable = document.getElementById('bulkDisable');
  elements.bulkDelete = document.getElementById('bulkDelete');
  elements.bulkMove = document.getElementById('bulkMove');
  elements.bulkCancel = document.getElementById('bulkCancel');
  elements.optimizerSection = document.getElementById('optimizerSection');
  elements.closeOptimizer = document.getElementById('closeOptimizer');
  
  // Move Modal
  elements.moveRulesModal = document.getElementById('moveRulesModal');
  elements.closeMoveModal = document.getElementById('closeMoveModal');
  elements.moveRulesForm = document.getElementById('moveRulesForm');
  elements.moveTargetProfile = document.getElementById('moveTargetProfile');

  elements.suggestionsList = document.getElementById('suggestionsList');
  elements.openFullViewBtn = document.getElementById('openFullViewBtn');
  elements.testMatchBtn = document.getElementById('testMatchBtn');
  elements.aiAssistBtn = document.getElementById('aiAssistBtn');
  elements.toggleAdvancedSettings = document.getElementById('toggleAdvancedSettings');
  elements.advancedSettings = document.getElementById('advancedSettings');
  elements.basicSettings = document.getElementById('basicSettings');
  elements.settingsTitle = document.getElementById('settingsTitle');

  // Profiler
  elements.profileSelect = document.getElementById('profileSelect');
  elements.manageProfilesBtn = document.getElementById('manageProfilesBtn');
  elements.profilesModal = document.getElementById('profilesModal');
  elements.closeProfilesModal = document.getElementById('closeProfilesModal');
  elements.profilesList = document.getElementById('profilesList');
  elements.addProfileForm = document.getElementById('addProfileForm');
  elements.ruleProfileSelect = document.getElementById('ruleProfileSelect'); // I edit modal

  // Variables modal
  elements.variablesModal = document.getElementById('variablesModal');
  elements.closeVariablesModal = document.getElementById('closeVariablesModal');
  elements.variablesModalTitle = document.getElementById('variablesModalTitle');
  elements.variablesList = document.getElementById('variablesList');
  elements.addVariableForm = document.getElementById('addVariableForm');

  // Nye elementer for v0.3.0
  elements.elementType = document.getElementById('elementType');
  elements.priority = document.getElementById('priority');
  elements.ruleDelay = document.getElementById('ruleDelay');
  elements.conditionType = document.getElementById('conditionType');
  elements.conditionValue = document.getElementById('conditionValue');
  elements.optimizerTitle = document.getElementById('optimizerTitle');
  elements.fieldTypeInput = document.getElementById('fieldType');
  elements.fieldUseRegex = document.getElementById('fieldUseRegex');

  // Settings toggles
  elements.autofillToggle = document.getElementById('autofillToggle');
  elements.debugToggle = document.getElementById('debugToggle');
  elements.scanToastToggle = document.getElementById('scanToastToggle');
  elements.autofillDelay = document.getElementById('autofillDelay');
  elements.autofillMode = document.getElementById('autofillMode');
  elements.blacklistPatterns = document.getElementById('blacklistPatterns');
  elements.fieldBlacklistPatterns = document.getElementById('fieldBlacklistPatterns');
  elements.whitelistPatterns = document.getElementById('whitelistPatterns');
  elements.languageSelect = document.getElementById('languageSelect');
  elements.logToFileToggle = document.getElementById('logToFileToggle');
  elements.exportLogBtn = document.getElementById('exportLogBtn');
  elements.pushSyncBtn = document.getElementById('pushSyncBtn');
  elements.pullSyncBtn = document.getElementById('pullSyncBtn');
  elements.cloudBackupBtn = document.getElementById('cloudBackupBtn');
  elements.cloudRestoreBtn = document.getElementById('cloudRestoreBtn');
  elements.cloudBackupLabel = document.getElementById('cloudBackupLabel');
  elements.cloudBackupDesc = document.getElementById('cloudBackupDesc');
  elements.settingsAccordion = document.querySelector('.settings-accordion');
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

  // Tilgjengelige felt
  elements.availableHeader = document.getElementById('availableHeader');
  elements.availableContent = document.getElementById('availableContent');
  elements.availableCount = document.getElementById('availableCount');
  elements.availableSearch = document.getElementById('availableSearch');
  elements.availableFieldsList = document.getElementById('availableFieldsList');
  elements.availableEmpty = document.getElementById('availableEmpty');

  // Sett default sort
  if (elements.sortBy) {
    elements.sortBy.value = currentSort;
  }
}

function initAccordion(header, content) {
  if (!header || !content) return;
  
  header.addEventListener('click', () => {
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      header.classList.add('active');
    } else {
      header.classList.remove('active');
    }
  });
}

function toggleAdvancedSettingsPanel() {
  if (!elements.advancedSettings || !elements.toggleAdvancedSettings) return;
  elements.advancedSettings.classList.toggle('collapsed');
  updateAdvancedToggleLabel();
}

function updateAdvancedToggleLabel() {
  const t = translations.current || translations.en;
  if (!elements.toggleAdvancedSettings) return;
  const collapsed = elements.advancedSettings?.classList.contains('collapsed');
  elements.toggleAdvancedSettings.dataset.collapsed = collapsed ? 'true' : 'false';
  elements.toggleAdvancedSettings.textContent = collapsed
    ? (t.settingsPanel?.showAdvanced || 'More settings')
    : (t.settingsPanel?.hideAdvanced || 'Hide advanced');
}

/**
 * Legg til event listeners
 */
function attachEventListeners() {
  // Accordions
  initAccordion(elements.availableHeader, elements.availableContent);

  // Søk og filtrering
  elements.searchInput.addEventListener('input', applyFilters);
  elements.filterEnabled.addEventListener('change', applyFilters);
  elements.filterRegex.addEventListener('change', applyFilters);
  elements.sortBy.addEventListener('change', handleSortChange);

  // Buttons
  if (elements.addRuleBtn) {
    elements.addRuleBtn.addEventListener('click', () => openEditModal());
  }
  if (elements.selectModeBtn) {
    elements.selectModeBtn.addEventListener('click', toggleSelectMode);
  }
  if (elements.optimizeBtn) {
    elements.optimizeBtn.addEventListener('click', showOptimizer);
  }
  if (elements.variablesBtn) {
      elements.variablesBtn.addEventListener('click', openVariablesModal);
  }
  if (elements.openFullViewBtn) {
    elements.openFullViewBtn.addEventListener('click', openFullView);
  }
  if (elements.testMatchBtn) {
    elements.testMatchBtn.addEventListener('click', handleTestMatch);
  }
  if (elements.aiAssistBtn) {
    elements.aiAssistBtn.addEventListener('click', openAiModal);
  }
  if (elements.testMatchBtn) {
    elements.testMatchBtn.addEventListener('click', handleTestMatch);
  }
  if (elements.forceFillBtn) {
    elements.forceFillBtn.addEventListener('click', handleForceFill);
  }
  const recordMacroBtn = document.getElementById('recordMacroBtn');
  if (recordMacroBtn) {
      recordMacroBtn.addEventListener('click', () => {
          if (currentTab && currentTab.id) {
              chrome.tabs.sendMessage(currentTab.id, { action: 'startRecording' }, (response) => {
                  if (chrome.runtime.lastError) {
                      console.warn('Start recording failed:', chrome.runtime.lastError);
                      alert('Could not start recording. Refresh page?');
                  } else {
                      window.close();
                  }
              });
          } else {
              alert('No active tab found');
          }
      });
  }
  if (elements.toggleAdvancedSettings) {
    elements.toggleAdvancedSettings.addEventListener('click', toggleAdvancedSettingsPanel);
  }
  if (elements.settingsAccordion) {
    elements.settingsAccordion.addEventListener('toggle', () => {
      const open = elements.settingsAccordion.hasAttribute('open');
      elements.settingsAccordion.dataset.open = open ? 'true' : 'false';
    });
  }

  // Profiler
  if (elements.profileSelect) elements.profileSelect.addEventListener('change', handleProfileChange);
  if (elements.manageProfilesBtn) elements.manageProfilesBtn.addEventListener('click', openProfilesModal);
  if (elements.closeProfilesModal) elements.closeProfilesModal.addEventListener('click', closeProfilesModal);
  if (elements.addProfileForm) elements.addProfileForm.addEventListener('submit', handleAddProfile);
  if (elements.profilesModal) {
      elements.profilesModal.addEventListener('click', (e) => {
        if (e.target === elements.profilesModal) closeProfilesModal();
      });
  }

  // Variables modal
  if (elements.closeVariablesModal) {
      elements.closeVariablesModal.addEventListener('click', closeVariablesModal);
  }
  if (elements.addVariableForm) {
      elements.addVariableForm.addEventListener('submit', handleAddVariable);
  }

  // Export/Import
  elements.exportBtn.addEventListener('click', handleExport);
  elements.importBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', (ev) => handleImport(ev, 'import'));
  if (elements.validateBtn) elements.validateBtn.addEventListener('click', () => elements.validateFileInput && elements.validateFileInput.click());
  if (elements.validateFileInput) elements.validateFileInput.addEventListener('change', (ev) => handleImport(ev, 'validate'));
  if (elements.closeImportPreview) elements.closeImportPreview.addEventListener('click', closeImportPreviewModal);
  if (elements.cancelImportPreview) elements.cancelImportPreview.addEventListener('click', closeImportPreviewModal);
  if (elements.confirmImportPreview) elements.confirmImportPreview.addEventListener('click', confirmImportPreview);

  // Bulk actions
  if (elements.bulkEnable) elements.bulkEnable.addEventListener('click', () => handleBulkAction('enable'));
  if (elements.bulkDisable) elements.bulkDisable.addEventListener('click', () => handleBulkAction('disable'));
  if (elements.bulkDelete) elements.bulkDelete.addEventListener('click', () => handleBulkAction('delete'));
  if (elements.bulkMove) elements.bulkMove.addEventListener('click', openMoveRulesModal);
  if (elements.bulkCancel) elements.bulkCancel.addEventListener('click', exitSelectMode);

  // Move Modal Listeners
  if (elements.closeMoveModal) elements.closeMoveModal.addEventListener('click', closeMoveRulesModal);
  if (elements.moveRulesModal) {
      elements.moveRulesModal.addEventListener('click', (e) => {
        if (e.target === elements.moveRulesModal) closeMoveRulesModal();
      });
  }
  if (elements.moveRulesForm) elements.moveRulesForm.addEventListener('submit', handleBulkMoveSubmit);

  // Optimizer
  elements.closeOptimizer.addEventListener('click', hideOptimizer);

  // Settings
  elements.autofillToggle.addEventListener('change', handleAutofillToggle);
  elements.debugToggle.addEventListener('change', handleDebugToggle);
  elements.scanToastToggle.addEventListener('change', handleScanToastToggle);
  elements.fieldTypeInput.addEventListener('change', handleFieldTypeChange);
  elements.autofillDelay.addEventListener('change', handleAutofillDelayChange);
  elements.autofillMode.addEventListener('change', handleAutofillModeChange);
  if (elements.blacklistPatterns) elements.blacklistPatterns.addEventListener('change', handleListChange);
  if (elements.fieldBlacklistPatterns) elements.fieldBlacklistPatterns.addEventListener('change', handleListChange);
  if (elements.whitelistPatterns) elements.whitelistPatterns.addEventListener('change', handleListChange);
  
  if (elements.logToFileToggle) {
    elements.logToFileToggle.addEventListener('change', handleLogToggle);
  }
  if (elements.exportLogBtn) {
    elements.exportLogBtn.addEventListener('click', handleExportLog);
  }
  if (elements.pushSyncBtn) {
    elements.pushSyncBtn.addEventListener('click', handlePushSync);
  }
  if (elements.pullSyncBtn) {
    elements.pullSyncBtn.addEventListener('click', handlePullSync);
  }
  if (elements.cloudBackupBtn) {
    elements.cloudBackupBtn.addEventListener('click', handleCloudBackup);
  }
  if (elements.cloudRestoreBtn) {
    elements.cloudRestoreBtn.addEventListener('click', handleLocalRestore);
  }

  // Tilgjengelige felt
  if (elements.availableSearch) {
    elements.availableSearch.addEventListener('input', renderAvailableFields);
  }

  // Modal
  document.getElementById('closeModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelBtn').addEventListener('click', closeEditModal);
  elements.editForm.addEventListener('submit', handleSaveRule);
  document.getElementById('closeAiModal').addEventListener('click', closeAiModal);
  document.getElementById('copyAiPrompt').addEventListener('click', copyAiPrompt);
  document.getElementById('regenerateAiPrompt').addEventListener('click', generateAiPrompt);

  // Lukk modal ved klikk utenfor
  elements.editModal.addEventListener('click', (e) => {
    if (e.target === elements.editModal) {
      closeEditModal();
    }
  });
  
  if (elements.variablesModal) {
    elements.variablesModal.addEventListener('click', (e) => {
        if (e.target === elements.variablesModal) {
            closeVariablesModal();
        }
    });
  }
}

/**
 * Last inn innstillinger
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['debugMode', 'autofillEnabled', 'scanToastEnabled', 'autofillDelay', 'autofillTrigger', 'blacklist', 'whitelist', 'language', 'fieldBlacklist', 'logToFile', LOG_KEY]);

    // Sett toggle states
    elements.debugToggle.checked = result.debugMode || false;
    elements.scanToastToggle.checked = result.scanToastEnabled !== false; // Default true
    elements.autofillToggle.checked = result.autofillEnabled !== false; // Default true
  elements.autofillDelay.value = result.autofillDelay || 0;
  elements.autofillMode.value = result.autofillTrigger || 'auto';
  logEnabled = !!result.logToFile;
  if (elements.logToFileToggle) elements.logToFileToggle.checked = logEnabled;
  logBuffer = Array.isArray(result[LOG_KEY]) ? result[LOG_KEY] : [];
  if (elements.blacklistPatterns) {
    elements.blacklistPatterns.value = Array.isArray(result.blacklist) ? result.blacklist.join('\n') : '';
  }
  if (elements.fieldBlacklistPatterns) {
    elements.fieldBlacklistPatterns.value = Array.isArray(result.fieldBlacklist) ? result.fieldBlacklist.join('\n') : '';
  }
      if (elements.whitelistPatterns) {
      elements.whitelistPatterns.value = Array.isArray(result.whitelist) ? result.whitelist.join('\n') : '';
    }
      
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  async function loadCurrentProfileId() {
  try {
    const res = await chrome.storage.local.get('currentProfileId');
    if (res.currentProfileId) {
      currentProfileId = res.currentProfileId;
      if (elements.profileSelect) elements.profileSelect.value = currentProfileId;
    }
  } catch (e) {
    console.error('Error loading current profile', e);
  }
}

/**
 * Vis toast melding
 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger reflow
  toast.offsetHeight;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2000);
}

/**
 * Håndter autofill toggle
 */
async function handleAutofillToggle(e) {
  const enabled = e.target.checked;

  try {
    // Lagre innstilling
    await chrome.storage.local.set({ autofillEnabled: enabled });

    // Oppdater badge
    await chrome.runtime.sendMessage({
      action: 'updateBadge',
      autofillEnabled: enabled
    });

    // Notifiser alle tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        autofillEnabled: enabled
      }).catch(() => {
        // Ignorer feil (tab har kanskje ikke content script)
      });
    }
    
    // Vis toast
    const t = translations.current || translations.en;
    showToast(t.toast.saved);
  } catch (error) {
    console.error('Error updating autofill:', error);
    // Reverter toggle ved feil
    e.target.checked = !enabled;
  }
}

/**
 * Håndter debug toggle
 */
async function handleDebugToggle(e) {
  const enabled = e.target.checked;

  try {
    // Lagre innstilling
    await chrome.storage.local.set({ debugMode: enabled });

    // Notifiser alle tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        debugMode: enabled
      }).catch(() => {
        // Ignorer feil (tab har kanskje ikke content script)
      });
    }
    
    // Vis toast
    const t = translations.current || translations.en;
    showToast(t.toast.saved);
  } catch (error) {
    console.error('Error updating debug:', error);
    // Reverter toggle ved feil
    e.target.checked = !enabled;
  }
}

/**
 * Håndter scan toast toggle
 */
async function handleScanToastToggle(e) {
  const enabled = e.target.checked;

  try {
    // Lagre innstilling
    await chrome.storage.local.set({ scanToastEnabled: enabled });

    // Notifiser alle tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        scanToastEnabled: enabled
      }).catch(() => {
        // Ignorer feil (tab har kanskje ikke content script)
      });
    }

    // Vis toast
    const t = translations.current || translations.en;
    showToast(t.toast.saved);
  } catch (error) {
    console.error('Error updating scan toast:', error);
    // Reverter toggle ved feil
    e.target.checked = !enabled;
  }
}

/**
 * Håndter delay-endring
 */
async function handleAutofillDelayChange(e) {
  const delay = parseInt(e.target.value) || 0;
  try {
    await chrome.storage.local.set({ autofillDelay: delay });
    broadcastSettings({ autofillDelay: delay });
    
    // Vis toast
    const t = translations.current || translations.en;
    showToast(t.toast.saved);
  } catch (error) {
    console.error('Error saving delay:', error);
  }
}

/**
 * Håndter modus for autofill
 */
async function handleAutofillModeChange(e) {
  const mode = e.target.value;
  try {
    await chrome.storage.local.set({ autofillTrigger: mode });
    broadcastSettings({ autofillTrigger: mode });
    
    // Vis toast
    const t = translations.current || translations.en;
    showToast(t.toast.saved);
  } catch (error) {
    console.error('Error saving mode:', error);
  }
}

/**
 * Håndter blacklist/whitelist endringer
 */
async function handleListChange() {
  if (!elements.blacklistPatterns || !elements.whitelistPatterns || !elements.fieldBlacklistPatterns) return;
  try {
    const blacklist = elements.blacklistPatterns.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const fieldBlacklist = elements.fieldBlacklistPatterns.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const whitelist = elements.whitelistPatterns.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    await chrome.storage.local.set({ blacklist, whitelist, fieldBlacklist });
    broadcastSettings({ blacklist, whitelist, fieldBlacklist });
    
    // Vis toast
    const t = translations.current || translations.en;
    showToast(t.toast.saved);
  } catch (error) {
    console.error('Error saving lists:', error);
  }
}

function openMoveRulesModal() {
    if (selectedRules.size === 0) return;
    
    // Populate profiles
    elements.moveTargetProfile.innerHTML = '';
    Storage.getProfiles().then(profiles => {
        for (const p of profiles) {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            elements.moveTargetProfile.appendChild(opt);
        }
    });

    elements.moveRulesModal.style.display = 'flex';
}

function closeMoveRulesModal() {
    elements.moveRulesModal.style.display = 'none';
}

async function handleBulkMoveSubmit(e) {
    e.preventDefault();
    const targetProfileId = elements.moveTargetProfile.value;
    if (!targetProfileId) return;
    
    const ruleIds = Array.from(selectedRules);
    const t = translations.current || translations.en;
    
    // Get profile name for toast
    const profiles = await Storage.getProfiles();
    const profile = profiles.find(p => p.id === targetProfileId);
    const profileName = profile ? profile.name : targetProfileId;

    showLoading(true);
    try {
        for (const ruleId of ruleIds) {
            await chrome.runtime.sendMessage({
                action: 'updateRule',
                ruleId: ruleId,
                updates: { profileId: targetProfileId }
            });
        }
        
        alert(t.profiles.moveSuccess.replace('{count}', ruleIds.length).replace('{profile}', profileName));
        closeMoveRulesModal();
        await loadRules(); // Will refresh list and remove moved items if current profile filter is active
        exitSelectMode();
        
    } catch (error) {
        console.error('Error moving rules:', error);
        alert('Error moving rules');
    } finally {
        showLoading(false);
    }
}

/**
 * Load variables from storage
 */
async function loadVariables() {
    try {
        const res = await chrome.storage.local.get('userVariables');
        userVariables = res.userVariables || {};
    } catch (e) {
        console.error("Error loading variables", e);
    }
}

function getBuiltInVariables() {
    const t = translations.current || translations.en;
    return Array.isArray(t.variables?.builtins) ? t.variables.builtins : [];
}

function renderVariables() {
    elements.variablesList.innerHTML = '';
    const t = translations.current || translations.en;
    const builtins = getBuiltInVariables();
    const emptyText = t.variables?.empty || 'No variables defined.';

    if (builtins.length) {
        builtins.forEach(b => {
            const div = document.createElement('div');
            div.className = 'variable-item builtin';
            div.innerHTML = `
                <div class="variable-info">
                    <span class="variable-key">{${escapeHtml(b.key)}}</span>
                    <span class="variable-value">${escapeHtml(b.desc || '')}</span>
                </div>
            `;
            elements.variablesList.appendChild(div);
        });
    }
    
    const keys = Object.keys(userVariables);
    if (keys.length === 0 && builtins.length === 0) {
        elements.variablesList.innerHTML = `<p class="empty-text">${emptyText}</p>`;
        return;
    }

    keys.sort().forEach(key => {
        const div = document.createElement('div');
        div.className = 'variable-item';
        div.innerHTML = `
            <div class="variable-info">
                <span class="variable-key">{${escapeHtml(key)}}</span>
                <span class="variable-value">${escapeHtml(userVariables[key])}</span>
            </div>
            <button class="btn btn-small btn-danger delete-var-btn" data-key="${escapeHtml(key)}">${t.variables?.delete || 'Delete'}</button>
        `;
        
        div.querySelector('.delete-var-btn').addEventListener('click', () => handleDeleteVariable(key));
        elements.variablesList.appendChild(div);
    });
}

function openVariablesModal() {
    renderVariables();
    elements.variablesModal.style.display = 'flex';
}

function closeVariablesModal() {
    elements.variablesModal.style.display = 'none';
}

async function handleAddVariable(e) {
    e.preventDefault();
    const key = document.getElementById('newVarKey').value.trim();
    const value = document.getElementById('newVarValue').value;
    
    if (!key || !value) return;

    userVariables[key] = value;
    
    try {
        await chrome.storage.local.set({ userVariables });
        // Notifiser tabs om oppdatering
        broadcastSettings({ userVariables });
        renderVariables();
        document.getElementById('addVariableForm').reset();
    } catch (e) {
        const t = translations.current || translations.en;
        alert(t.variables?.saveError || 'Could not save variable');
    }
}

async function handleDeleteVariable(key) {
    const t = translations.current || translations.en;
    if(!confirm(t.variables?.confirmDelete?.replace('{name}', key) || `Delete variable {${key}}?`)) return;
    
    delete userVariables[key];
    try {
        await chrome.storage.local.set({ userVariables });
        broadcastSettings({ userVariables });
        renderVariables();
    } catch (e) {
        alert(t.variables?.deleteError || 'Could not delete variable');
    }
}

// --- PROFILER START ---

async function loadProfiles() {
    try {
        const profiles = await Storage.getProfiles();
        // Sikre at currentProfileId er gyldig
        if (!profiles.find(p => p.id === currentProfileId)) {
            currentProfileId = 'default';
        }
        renderProfileSelector(profiles);
        renderProfilesList(profiles);
    } catch (e) {
        console.error('Error loading profiles:', e);
    }
}

function renderProfileSelector(profiles) {
    if (!elements.profileSelect) return;
    
    const t = translations.current || translations.en;
    elements.profileSelect.innerHTML = '';
    
    // Option for "All profiles" could be added here if desired, but for now strictly per profile
    // profiles.forEach...
    
    for (const p of profiles) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        if (p.id === currentProfileId) opt.selected = true;
        elements.profileSelect.appendChild(opt);
    }
}

function renderProfilesList(profiles) {
    if (!elements.profilesList) return;
    elements.profilesList.innerHTML = '';
    
    const t = translations.current || translations.en;

    for (const p of profiles) {
        const div = document.createElement('div');
        div.className = 'variable-item'; // Gjenbruk CSS fra variabler
        
        const isDefault = p.id === 'default';
        const deleteBtn = isDefault ? '' : `
            <button class="btn btn-small btn-danger delete-profile-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}">
                ${t.profiles.delete}
            </button>
        `;
        
        div.innerHTML = `
            <div class="variable-info">
                <span class="variable-key">${escapeHtml(p.name)}</span>
                <span class="variable-value">ID: ${p.id}</span>
            </div>
            ${deleteBtn}
        `;
        
        if (!isDefault) {
            div.querySelector('.delete-profile-btn').addEventListener('click', () => handleDeleteProfile(p.id, p.name));
        }
        
        elements.profilesList.appendChild(div);
    }
}

async function handleProfileChange(e) {
    currentProfileId = e.target.value;
    try {
      await chrome.storage.local.set({ currentProfileId });
      chrome.runtime.sendMessage({ action: 'setCurrentProfile', profileId: currentProfileId });
    } catch (err) {
      console.error('Could not persist profile selection', err);
    }
    await loadRules(); // Reload rules with new filter
}

function openProfilesModal() {
    loadProfiles(); // Refresh list
    elements.profilesModal.style.display = 'flex';
}

function closeProfilesModal() {
    elements.profilesModal.style.display = 'none';
}

async function handleAddProfile(e) {
    e.preventDefault();
    const nameInput = document.getElementById('newProfileName');
    const name = nameInput.value.trim();
    
    if (!name) return;
    
    try {
        await Storage.addProfile(name);
        nameInput.value = '';
        await loadProfiles();
        chrome.runtime.sendMessage({ action: 'refreshContextMenus' });
    } catch (e) {
        alert('Kunne ikke legge til profil: ' + e.message);
    }
}

async function handleDeleteProfile(id, name) {
    const t = translations.current || translations.en;
    
    if (id === 'default') {
        alert(t.profiles.cannotDeleteDefault);
        return;
    }
    
    if (!confirm(t.profiles.confirmDelete.replace('{name}', name))) return;
    
    try {
        await Storage.deleteProfile(id);
        if (currentProfileId === id) {
            currentProfileId = 'default';
            await loadRules();
        }
        await loadProfiles();
        chrome.runtime.sendMessage({ action: 'refreshContextMenus' });
    } catch (e) {
        alert('Kunne ikke slette profil: ' + e.message);
    }
}

// --- PROFILER SLUTT ---

async function handlePushSync() {
  const btn = elements.pushSyncBtn;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '...';
  
  try {
    const res = await Storage.pushToSync();
    alert(`Synkronisert ${res.count} regler til skyen.`);
  } catch (e) {
    alert('Feil ved synkronisering: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function handlePullSync() {
  const btn = elements.pullSyncBtn;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '...';
  
  try {
    // Hent remote regler først
    const result = await chrome.storage.sync.get('autofill_rules_sync');
    const remoteRules = result['autofill_rules_sync'] || [];
    
    if (remoteRules.length === 0) {
        alert('Ingen regler funnet i skyen.');
        return;
    }

    // Lag modal for valg
    const choice = prompt(
        `Fant ${remoteRules.length} regler i skyen.\n\n` +
        `Velg handling:\n` + 
        `1. Overskriv (Sletter lokale regler og erstatter med sky-regler)\n` +
        `2. Merge (Legger til nye regler, beholder lokale ved konflikt)\n` + 
        `3. Smart Merge (Legger til nye, og beholder BEGGE ved konflikt - duplikatvarsel)`
    , "3");

    if (!choice) return; // Avbryt

    if (choice === '1') {
        // Overskriv
         await Storage.saveRules(remoteRules);
         alert(`Erstattet lokale regler med ${remoteRules.length} regler fra skyen.`);
    } else if (choice === '2' || choice === '3') {
        // Merge
        const localRules = await Storage.getRules();
        const localMap = new Map(localRules.map(r => [r.id, r]));
        let added = 0;
        let conflicts = 0;

        for (const rRule of remoteRules) {
            if (localMap.has(rRule.id)) {
                // Konflikt på ID
                const lRule = localMap.get(rRule.id);
                // Sjekk om innhold er likt
                const isIdentical = JSON.stringify(lRule) === JSON.stringify(rRule);
                
                if (!isIdentical) {
                    if (choice === '3') {
                        // Smart merge: Behold begge (ny ID for remote)
                        const newRule = { ...rRule, id: Storage.generateId(), created: Date.now() };
                        localRules.push(newRule);
                        conflicts++;
                    } else {
                        // Choice 2: Behold lokal (gjør ingenting)
                    }
                }
            } else {
                // Ny regel
                localRules.push(rRule);
                added++;
            }
        }
        await Storage.saveRules(localRules);
        alert(`Merge fullført.\nLa til: ${added}\nKonflikter løst (duplikater opprettet): ${conflicts}`);
    }

    await loadRules();
  } catch (e) {
    console.error(e);
    alert('Feil ved henting: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function broadcastSettings(payload) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        ...payload
      }).catch(() => {});
    }
  });
}

/**
 * Last inn gjeldende tab
 */
async function loadCurrentTab() {
  // Bruk lastFocusedWindow for å få riktig vindu når popup åpnes
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  console.log('loadCurrentTab - active tabs:', tabs.length, tabs[0]?.url);

  if (tabs.length > 0) {
    const tab = tabs[0];

    // Sjekk om dette er popup selv (chrome-extension://)
    const isExtensionPage = !tab.url ||
                           tab.url.startsWith('chrome-extension://') ||
                           tab.url.startsWith('chrome://');

    if (!isExtensionPage) {
      // Aktiv tab er en vanlig webside
      currentTab = tab;
      console.log('loadCurrentTab - using active tab:', currentTab.id, currentTab.url);
    } else {
      // Vi er på en extension/chrome-side, sett currentTab til null
      // Dette signaliserer at vi ikke har en gyldig side å jobbe med
      currentTab = null;
      console.log('loadCurrentTab - active tab is extension/chrome page, no valid tab');
    }
  } else {
    console.log('loadCurrentTab - no active tabs found');
    currentTab = null;
  }
}

/**
 * Last inn alle regler
 */
async function loadRules() {
  showLoading(true);

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getAllRules' });
    allRules = response || [];
    await loadPageRules();
    applyFilters();
    updateStats();
  } catch (error) {
    console.error('Error loading rules:', error);
  } finally {
    showLoading(false);
  }
}

async function loadPageRules() {
  if (!currentTab || !currentTab.url) {
    pageRules = [];
    return;
  }

  try {
    // Hent regler som matcher dette nettstedet
    const response = await chrome.runtime.sendMessage({
      action: 'getRulesForSite',
      url: currentTab.url,
      profileId: (currentProfileId && currentProfileId !== 'default') ? currentProfileId : null
    });
    const siteRules = response?.rules || [];
    // Sett foreløpig liste slik at tellerne ikke står på 0 mens vi scanner
    pageRules = siteRules.map(rule => ({ ...rule, matchType: 'unknown' }));
    applyFilters();
    updateStats();

    // Hent faktiske felt på siden for å sjekke om reglene matcher
    // Men kun hvis det er en gyldig webside (ikke chrome:// eller chrome-extension://)
    let fieldsOnPage = [];
    const isValidWebPage = currentTab.url &&
      !currentTab.url.startsWith('chrome://') &&
      !currentTab.url.startsWith('chrome-extension://');

    if (isValidWebPage) {
      // Prøv å hente felt med retry-mekanisme (content script kan være treg å initialisere)
      fieldsOnPage = await getFieldsFromPage(currentTab.id, currentTab.url);
    } else {
      console.log('Not a valid webpage, skipping field detection. Tab:', currentTab?.url);
    }

    // Hvis vi ikke fant felter (eller scanning feilet), anta full match for nå
    if (fieldsOnPage.length === 0) {
      pageRules = siteRules.map(rule => ({ ...rule, matchType: 'full' }));
      const fullMatchCount = pageRules.length;
      const partialMatchCount = 0;
      applyFilters();
      updateStats();
      chrome.runtime.sendMessage({
        action: 'updateBadgeCount',
        tabId: currentTab.id,
        fullMatches: fullMatchCount,
        partialMatches: partialMatchCount
      }).catch(err => console.error('Failed to update badge:', err));
      return;
    }

    // Kategoriser regler i full match vs partial match
    console.log('Categorizing', siteRules.length, 'rules against', fieldsOnPage.length, 'fields');
    pageRules = siteRules.map(rule => {
      const matchesField = checkIfRuleMatchesAnyField(rule, fieldsOnPage);
      return {
        ...rule,
        matchType: matchesField ? 'full' : 'partial'
      };
    });

    // Oppdater badge med antall full matches
    const fullMatchCount = pageRules.filter(r => r.matchType === 'full').length;
    const partialMatchCount = pageRules.filter(r => r.matchType === 'partial').length;
    chrome.runtime.sendMessage({
      action: 'updateBadgeCount',
      tabId: currentTab.id,
      fullMatches: fullMatchCount,
      partialMatches: partialMatchCount
    }).catch(err => console.error('Failed to update badge:', err));

    applyFilters();
    updateStats();

  } catch (error) {
    console.error('Error loading page rules:', error);
    pageRules = [];
    applyFilters();
    updateStats();
  }
}

/**
 * Hent felt fra siden med retry-mekanisme
 */
async function getFieldsFromPage(tabId, url, retries = 5, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${retries}: Sending listFields to tab:`, tabId, url);
      const fieldsResponse = await chrome.tabs.sendMessage(tabId, { action: 'listFields' });
      const fields = fieldsResponse?.success ? fieldsResponse.fields || [] : [];
      console.log(`Fields from page (attempt ${i + 1}):`, fields.length, fields);

      // Hvis vi får 0 felt, prøv igjen (siden DOM kan være under lasting)
      if (fields.length === 0 && i < retries - 1) {
        console.log('Got 0 fields, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 2000); // Øk delay, maks 2 sek
        continue;
      }

      return fields;
    } catch (e) {
      console.log(`Attempt ${i + 1} failed:`, e.message);

      if (i < retries - 1) {
        // Vent litt før neste forsøk
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 2000);
      } else {
        // Siste forsøk feilet
        console.log('All attempts failed, giving up');
        return [];
      }
    }
  }
  return [];
}

/**
 * Sjekk om en regel matcher noen av feltene på siden
 */
function checkIfRuleMatchesAnyField(rule, fields) {
  if (!fields || fields.length === 0) return false;

  const debugMode = false; // Sett til true for debugging

  if (debugMode) {
    console.log('Checking rule:', rule.fieldPattern, '(', rule.elementType, ')');
  }

  for (const field of fields) {
    // 1. Sjekk elementtype først (mest restriktiv)
    if (rule.elementType && rule.elementType !== 'text' && rule.elementType !== field.fieldType) {
      continue; // Hopp over felt med feil elementtype (checkbox vs text osv)
    }

    // 2. Sjekk felttype (name, id, placeholder, selector)
    if (rule.fieldType !== field.type) {
      continue; // Hopp over felt med feil felttype
    }

    // 3. Sjekk om mønsteret matcher
    const fieldValue = field.identifier;
    let matches = false;

    if (rule.fieldType === 'selector') {
      // For selectors kan vi ikke sjekke uten DOM, så anta match
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
      matches = matchWildcard(fieldValue, rule.fieldPattern);
    }

    if (matches) {
      if (debugMode) console.log('  ✓ MATCH:', field.identifier);
      return true; // Early exit on first match
    }
  }

  return false;
}

/**
 * Wildcard matching helper
 */
function matchWildcard(text, pattern) {
  if (text === pattern) return true;

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
 * Last tilgjengelige felter fra aktiv fane
 */
async function loadAvailableFields() {
  if (!currentTab) {
    renderAvailableFields();
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'listFields' });
    availableFields = response && response.success ? response.fields || [] : [];
  } catch (error) {
    // Kan feile hvis fanen ikke har content script (chrome://)
    availableFields = [];
  }

  renderAvailableFields();
}

/**
 * Åpne fullskjermsvisningen av regler
 */
function openFullView() {
  const url = chrome.runtime.getURL('rules.html');
  chrome.tabs.create({ url });
}

/**
 * Håndter sorteringsendring
 */
function handleSortChange() {
  currentSort = elements.sortBy.value;
  renderRules();
}

/**
 * Appliser filtre
 */
function applyFilters() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const onlyEnabled = elements.filterEnabled.checked;
  const onlyRegex = elements.filterRegex.checked;

  const sourceRules = pageRules || [];

  filteredRules = sourceRules.filter(rule => {
    if (currentProfileId && rule.profileId && rule.profileId !== currentProfileId) return false;

    // Enabled filter
    if (onlyEnabled && !rule.enabled) return false;

    // Regex filter
    if (onlyRegex && !rule.fieldUseRegex) return false;

    // Søk
    if (searchTerm) {
      const searchableText = [
        rule.sitePattern,
        rule.fieldPattern,
        rule.value
      ].join(' ').toLowerCase();

      if (!searchableText.includes(searchTerm)) return false;
    }

    return true;
  });

  renderRules();
  updateStats();
}

/**
 * Render regler
 */
function renderRules() {
  elements.rulesList.innerHTML = '';

  if (filteredRules.length === 0) {
    elements.emptyState.style.display = 'block';
    return;
  }

  elements.emptyState.style.display = 'none';

  const conflictInfo = buildConflictInfo(filteredRules);
  const conflictSet = conflictInfo.conflictIds;
  const conflictWinners = conflictInfo.winners;

  // Separer regler i full matches og partial matches
  const fullMatches = filteredRules.filter(r => r.matchType === 'full');
  const partialMatches = filteredRules.filter(r => r.matchType === 'partial');

  // Sorter begge lister
  const sortedFullMatches = sortRules([...fullMatches], currentSort);
  const sortedPartialMatches = sortRules([...partialMatches], currentSort);

  // Render full matches først
  if (sortedFullMatches.length > 0) {
    for (const rule of sortedFullMatches) {
      const ruleElement = createRuleElement(rule, false, conflictSet.has(rule.id), conflictWinners);
      elements.rulesList.appendChild(ruleElement);
    }
  }

  // Render partial matches i eget panel hvis de finnes
  if (sortedPartialMatches.length > 0) {
    const t = translations.current || translations.en;
    const partialMatchesSection = document.createElement('div');
    partialMatchesSection.className = 'accordion partial-matches-accordion';
    
    const headerId = 'partialMatchesHeader';
    const contentId = 'partialMatchesContent';
    const titleText = t.pageRules?.partialHeader || 'Partial match (domain matches, but no fields found)';
    
    partialMatchesSection.innerHTML = `
      <div class="accordion-header" id="${headerId}">
        <h3>${escapeHtml(titleText)} <span class="partial-matches-count">(${sortedPartialMatches.length})</span></h3>
        <span class="arrow">▼</span>
      </div>
      <div class="accordion-content" id="${contentId}" style="display: none;">
        <!-- Rules injected here -->
      </div>
    `;
    
    const contentDiv = partialMatchesSection.querySelector(`#${contentId}`);
    const headerDiv = partialMatchesSection.querySelector(`#${headerId}`);

    for (const rule of sortedPartialMatches) {
      const ruleElement = createRuleElement(rule, true, conflictSet.has(rule.id), conflictWinners);
      contentDiv.appendChild(ruleElement);
    }

    elements.rulesList.appendChild(partialMatchesSection);
    
    // Activate accordion logic
    initAccordion(headerDiv, contentDiv);
  }
}

function buildConflictInfo(rules) {
  const map = new Map();
  const conflicts = new Set();
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

  map.forEach(ids => {
    if (ids.length > 1) {
      ids.forEach(id => conflicts.add(id));
      const matched = rules.filter(r => ids.includes(r.id));
      const sorted = matched.sort((a, b) => {
        const priA = typeof a.priority === 'number' ? a.priority : 0;
        const priB = typeof b.priority === 'number' ? b.priority : 0;
        if (priA !== priB) return priB - priA;
        return (b.created || 0) - (a.created || 0);
      });
      winners.set(ids.join('|'), sorted[0]?.id);
    }
  });

  return { conflictIds: conflicts, winners };
}

/**
 * Sorter regler
 */
function sortRules(rules, sortBy) {
  switch (sortBy) {
    case 'order':
      return rules.sort((a, b) => {
        const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : a.created;
        const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : b.created;
        return aOrder - bOrder;
      });
    case 'lastUsed':
      return rules.sort((a, b) => {
        if (a.lastUsed && b.lastUsed) return b.lastUsed - a.lastUsed;
        if (a.lastUsed) return -1;
        if (b.lastUsed) return 1;
        return b.created - a.created;
      });

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

/**
 * Opprett regel-element
 */
function createRuleElement(rule, isPartial = false, isConflict = false, conflictWinners = new Map()) {
  const div = document.createElement('div');
  const isDragEnabled = !selectMode && currentSort === 'order';
  const t = translations.current || translations.en;
  const labels = t.ruleLabels || {};
  const actions = t.ruleActions || {};

  // Sjekk for duplikater
  const isDuplicate = allRules.some(r =>
      r.id !== rule.id &&
      r.sitePattern === rule.sitePattern &&
      r.fieldType === rule.fieldType &&
      r.fieldPattern === rule.fieldPattern
  );

  div.className = `rule-item ${rule.enabled ? '' : 'disabled'} ${selectMode ? 'select-mode' : ''} ${selectedRules.has(rule.id) ? 'selected' : ''} ${isDuplicate ? 'duplicate-warning' : ''} ${isPartial ? 'partial-match' : ''} ${isConflict ? 'conflict' : ''}`;
  
  const badges = [];
  if (rule.fieldUseRegex) {
    badges.push('<span class="rule-badge badge-regex">Regex</span>');
  } else if (PatternMatcher.hasWildcards(rule.fieldPattern)) {
    badges.push('<span class="rule-badge badge-wildcard">Wildcard</span>');
  }
  
  if (isDuplicate) {
      badges.push(`<span class="rule-badge badge-duplicate">${t.alerts.duplicateBadge}</span>`);
  }
  if (isConflict) {
    const key = [
      rule.sitePattern || '',
      rule.fieldType || '',
      rule.fieldPattern || '',
      rule.profileId || 'default'
    ].join('|');
    const winnerId = conflictWinners.get(key);
    const isWinner = winnerId === rule.id;
    const conflictLabel = (translations.current?.conflict) || 'Conflict';
    const conflictWinner = (translations.current?.conflictWinner) || 'winner';
    badges.push(`<span class="rule-badge badge-conflict">${escapeHtml(conflictLabel)}${isWinner ? ` (${escapeHtml(conflictWinner)})` : ''}</span>`);
  }

  if (isDragEnabled) {
    div.setAttribute('draggable', 'true');
  }
  div.dataset.ruleId = rule.id;

  const checkbox = selectMode ? `
    <input type="checkbox" class="rule-checkbox" ${selectedRules.has(rule.id) ? 'checked' : ''} />
  ` : '';

  const dragHandle = isDragEnabled ? `
    <span class="drag-handle" title="Dra for å endre rekkefølge">⋮⋮</span>
  ` : '';

  const toggleSwitch = `
    <label class="toggle-switch">
      <input type="checkbox" class="toggle-enabled" ${rule.enabled ? 'checked' : ''} data-id="${rule.id}" />
      <span class="toggle-slider"></span>
    </label>
  `;

  const actionButtons = `
    <button class="btn btn-small btn-secondary edit-btn" data-id="${rule.id}">
      ${actions.edit || 'Edit'}
    </button>
    <button class="btn btn-small btn-danger delete-btn" data-id="${rule.id}">
      ${actions.delete || 'Delete'}
    </button>
  `;

  div.innerHTML = `
    ${checkbox}
    <div class="rule-content" style="flex: 1;">
      <div class="rule-header">
        <div>
          <span class="rule-site">${escapeHtml(rule.sitePattern)}</span>
          ${badges.join('')}
        </div>
        <div class="rule-actions">
          ${dragHandle}
          ${toggleSwitch}
        </div>
      </div>
      <div class="rule-body">
        <span class="rule-label">${labels.element || 'Element'}:</span>
        <span class="rule-value">${getElementIcon(rule.elementType || 'text')} ${getElementTypeLabel(rule.elementType || 'text')}</span>

        <span class="rule-label">${labels.field || 'Field'}:</span>
        <span class="rule-value">${escapeHtml(rule.fieldType)}: ${escapeHtml(rule.fieldPattern)}</span>

        <span class="rule-label">${labels.value || 'Value'}:</span>
        <span class="rule-value">${escapeHtml(rule.value)}</span>

        <span class="rule-label">${labels.priority || 'Priority'}:</span>
        <span class="rule-value">${rule.priority || 0}</span>

        ${rule.conditionType && rule.conditionType !== 'none' ? `
          <span class="rule-label">${labels.condition || 'Condition'}:</span>
          <span class="rule-value">${escapeHtml(rule.conditionType)} ${escapeHtml(rule.conditionValue || '')}</span>
        ` : ''}

        <span class="rule-label">${labels.site || 'Site'}:</span>
        <span class="rule-value">${getSiteMatchTypeLabel(rule.siteMatchType)}</span>

        ${rule.lastUsed ? `
          <span class="rule-label">${labels.lastUsed || 'Last used'}:</span>
          <span class="rule-value">${formatDate(rule.lastUsed)}</span>
        ` : ''}
      </div>
      <div class="rule-footer">
        <div class="rule-actions actions-inline">
          ${actionButtons}
        </div>
      </div>
    </div>
  `;

  // Event listeners
  if (selectMode) {
    const checkbox = div.querySelector('.rule-checkbox');
    if (checkbox) {
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleRuleSelection(rule.id);
      });
    }

    div.addEventListener('click', () => toggleRuleSelection(rule.id));
  } else {
    const editBtn = div.querySelector('.edit-btn');
    const deleteBtn = div.querySelector('.delete-btn');
    const toggleInput = div.querySelector('.toggle-enabled');
    const drag = div.querySelector('.drag-handle');

    if (editBtn) editBtn.addEventListener('click', () => openEditModal(rule.id));
    if (deleteBtn) deleteBtn.addEventListener('click', () => handleDeleteRule(rule.id));
    if (toggleInput) {
      toggleInput.addEventListener('click', (e) => e.stopPropagation());
      toggleInput.addEventListener('change', (e) => handleToggleEnabled(rule.id, e.target.checked));
    }
    if (drag && currentSort === 'order') {
      drag.addEventListener('mousedown', (e) => e.stopPropagation());
      div.addEventListener('dragstart', (e) => handleDragStart(e, rule.id));
      div.addEventListener('dragover', handleDragOver);
      div.addEventListener('drop', (e) => handleDrop(e, rule.id));
      div.addEventListener('dragend', handleDragEnd);
    }
  }

  return div;
}

/**
 * Toggle select mode
 */
function toggleSelectMode() {
  if (selectMode) {
    exitSelectMode();
  } else {
    enterSelectMode();
  }
}

/**
 * Enter select mode
 */
function enterSelectMode() {
  selectMode = true;
  selectedRules.clear();
  if (elements.selectModeBtn) {
    const t = translations.current || translations.en;
    elements.selectModeBtn.textContent = t.buttons?.bulkCancel || 'Cancel';
    elements.selectModeBtn.classList.add('active');
  }
  renderRules();
  updateBulkActions();
}

/**
 * Exit select mode
 */
function exitSelectMode() {
  selectMode = false;
  selectedRules.clear();
  if (elements.selectModeBtn) {
    const t = translations.current || translations.en;
    elements.selectModeBtn.textContent = t.buttons?.selectModeBtn || 'Select multiple';
    elements.selectModeBtn.classList.remove('active');
  }
  if (elements.bulkActions) {
    elements.bulkActions.style.display = 'none';
  }
  renderRules();
}

function handleDragStart(e, ruleId) {
  draggingRuleId = ruleId;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
  const target = e.currentTarget;
  target.classList.add('drag-over');
}

function handleDrop(e, targetId) {
  e.preventDefault();
  const target = e.currentTarget;
  target.classList.remove('drag-over');
  if (!draggingRuleId || draggingRuleId === targetId) return;

  const order = Array.from(elements.rulesList.querySelectorAll('.rule-item'))
    .map(el => el.dataset.ruleId);

  const from = order.indexOf(draggingRuleId);
  const to = order.indexOf(targetId);
  if (from === -1 || to === -1) return;

  order.splice(from, 1);
  order.splice(to, 0, draggingRuleId);

  persistOrder(order);
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  draggingRuleId = null;
}

async function persistOrder(visibleOrder) {
  const payload = visibleOrder.map((id, index) => ({ id, sortOrder: index }));
  try {
    await chrome.runtime.sendMessage({ action: 'reorderRules', order: payload });
    await loadRules();
  } catch (error) {
    console.error('Error saving order:', error);
  }
}

/**
 * Toggle rule selection
 */
function toggleRuleSelection(ruleId) {
  if (selectedRules.has(ruleId)) {
    selectedRules.delete(ruleId);
  } else {
    selectedRules.add(ruleId);
  }

  updateBulkActions();
  renderRules();
}

/**
 * Update bulk actions
 */
function updateBulkActions() {
  if (!elements.selectedCount || !elements.bulkActions) return;
  elements.selectedCount.textContent = selectedRules.size;

  if (selectedRules.size > 0) {
    elements.bulkActions.style.display = 'flex';
  } else {
    elements.bulkActions.style.display = 'none';
  }
}

/**
 * Handle bulk action
 */
async function handleBulkAction(action) {
  if (selectedRules.size === 0) return;

  const ruleIds = Array.from(selectedRules);

  let confirmMessage = '';
  switch (action) {
    case 'enable':
      confirmMessage = `Aktiver ${ruleIds.length} regler?`;
      break;
    case 'disable':
      confirmMessage = `Deaktiver ${ruleIds.length} regler?`;
      break;
    case 'delete':
      confirmMessage = `Slett ${ruleIds.length} regler? Dette kan ikke angres.`;
      break;
  }

  if (!confirm(confirmMessage)) return;

  showLoading(true);

  try {
    for (const ruleId of ruleIds) {
      if (action === 'delete') {
        await chrome.runtime.sendMessage({
          action: 'deleteRule',
          ruleId: ruleId
        });
      } else {
        await chrome.runtime.sendMessage({
          action: 'updateRule',
          ruleId: ruleId,
          updates: { enabled: action === 'enable' }
        });
      }
    }

    await loadRules();
    exitSelectMode();
  } catch (error) {
    console.error('Error executing bulk action:', error);
    alert('Kunne ikke utføre handlingen');
  } finally {
    showLoading(false);
  }
}

/**
 * Handle toggle enabled
 */
async function handleToggleEnabled(ruleId, enabled) {
  try {
    await chrome.runtime.sendMessage({
      action: 'updateRule',
      ruleId: ruleId,
      updates: { enabled: enabled }
    });

    // Oppdater lokal state
    const rule = allRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      renderRules();
      updateStats();
    }
  } catch (error) {
    console.error('Error toggling enabled:', error);
  }
}

/**
 * Show optimizer
 */
async function showOptimizer() {
  showLoading(true);

  try {
    const report = RuleOptimizer.generateReport(allRules);
    renderOptimizerStats(report);
    renderSuggestions(report.suggestions);
    elements.optimizerSection.style.display = 'block';
  } catch (error) {
    console.error('Error optimizing:', error);
    alert('Kunne ikke analysere regler');
  } finally {
    showLoading(false);
  }
}

/**
 * Hide optimizer
 */
function hideOptimizer() {
  elements.optimizerSection.style.display = 'none';
}

function renderOptimizerStats(report) {
  const el = document.getElementById('optimizerStats');
  if (!el) return;
  const t = translations.current || translations.en;

  const stats = report;
  el.innerHTML = `
    <div class="stat-row">
      <div><strong>${stats.totalRules}</strong><small>${t.optimizer.stats.total}</small></div>
      <div><strong>${stats.enabledRules}</strong><small>${t.optimizer.stats.active}</small></div>
      <div><strong>${stats.regexRules}</strong><small>${t.optimizer.stats.regex}</small></div>
      <div><strong>${stats.unusedRules}</strong><small>${t.optimizer.stats.unused}</small></div>
      <div><strong>${stats.suggestions.length}</strong><small>${t.optimizer.stats.suggestions}</small></div>
    </div>
  `;
}

/**
 * Render suggestions
 */
function renderSuggestions(suggestions) {
  elements.suggestionsList.innerHTML = '';
  const t = translations.current || translations.en;

  if (suggestions.length === 0) {
    elements.suggestionsList.innerHTML = `
      <div class="empty-suggestions">
        <p>${t.optimizer.empty.title}</p>
        <small>${t.optimizer.empty.desc}</small>
      </div>
    `;
    return;
  }

  for (const suggestion of suggestions) {
    const suggestionElement = createSuggestionElement(suggestion);
    elements.suggestionsList.appendChild(suggestionElement);
  }
}

/**
 * Create suggestion element
 */
function createSuggestionElement(suggestion) {
  const div = document.createElement('div');
  div.className = `suggestion-item priority-${suggestion.priority}`;
  const t = translations.current || translations.en;

  div.innerHTML = `
    <div class="suggestion-header">
      <span class="suggestion-title">${escapeHtml(suggestion.title)}</span>
      <span class="suggestion-type">${suggestion.type}</span>
    </div>
    <div class="suggestion-description">${escapeHtml(suggestion.description)}</div>
    <div class="suggestion-recommendation">${escapeHtml(suggestion.recommendation)}</div>
    <div class="suggestion-actions">
      <button class="btn btn-small btn-primary apply-btn">${t.optimizer.actions.apply}</button>
      <button class="btn btn-small btn-secondary dismiss-btn">${t.optimizer.actions.dismiss}</button>
      <!-- Ignore button legges til via JS under -->
    </div>
  `;

  // Event listeners
  div.querySelector('.apply-btn').addEventListener('click', () => applySuggestion(suggestion));
  div.querySelector('.dismiss-btn').addEventListener('click', () => div.remove());

  // --- NY START: Ignorer-knapp ---
  const ignoreBtn = document.createElement('button');
  ignoreBtn.className = 'btn btn-small btn-secondary';
  ignoreBtn.style.marginLeft = '8px';
  ignoreBtn.textContent = t.optimizer.actions.ignore;
  
  ignoreBtn.addEventListener('click', async () => {
      ignoreBtn.disabled = true;
      ignoreBtn.textContent = 'Lagrer...';
      try {
        for (const ruleId of suggestion.affectedRules) {
            await chrome.runtime.sendMessage({
                action: 'updateRule',
                ruleId: ruleId,
                updates: { ignoreOptimization: true } // Setter flagget
            });
        }
        div.remove();
        // Trigge ny sjekk i bakgrunnen for å oppdatere badge
        chrome.runtime.sendMessage({ action: 'triggerOptimizationCheck' });
      } catch (error) {
        console.error('Could not ignore rule:', error);
        ignoreBtn.textContent = 'Feil';
      }
  });

  // Legg knappen inn sammen med de andre
  div.querySelector('.suggestion-actions').appendChild(ignoreBtn);
  // --- NY SLUTT ---
  
  return div;
}

/**
 * Apply suggestion
 */
async function applySuggestion(suggestion) {
  showLoading(true);

  try {
    switch (suggestion.action) {
      case 'delete':
        // Slett alle affected rules
        for (const ruleId of suggestion.affectedRules) {
          await chrome.runtime.sendMessage({
            action: 'deleteRule',
            ruleId: ruleId
          });
        }
        break;

      case 'combine':
        // Kombiner regler
        const rules = allRules.filter(r => suggestion.affectedRules.includes(r.id));
        
        let combined;
        // Spesialhåndtering for regex-merge (type: simplify)
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
            // Legg til kombinert regel
            await chrome.runtime.sendMessage({
              action: 'addRule',
              rule: combined
            });

            // Slett gamle regler
            for (const ruleId of suggestion.affectedRules) {
              await chrome.runtime.sendMessage({
                action: 'deleteRule',
                ruleId: ruleId
              });
            }
        }
        break;

      case 'update':
        // Oppdater regel
        await chrome.runtime.sendMessage({
          action: 'updateRule',
          ruleId: suggestion.affectedRules[0],
          updates: suggestion.updates
        });
        break;
    }

    await loadRules();
    hideOptimizer();
  } catch (error) {
    console.error('Error applying suggestion:', error);
    alert('Kunne ikke anvende forslag');
  } finally {
    showLoading(false);
  }
}

/**
 * Oppdater statistikk
 */
function updateStats() {
  const profileRules = allRules.filter(r => !currentProfileId || r.profileId === currentProfileId);
  elements.totalRules.textContent = profileRules.length;
  elements.activeRules.textContent = profileRules.filter(r => r.enabled).length;
  elements.currentSiteRules.textContent = pageRules.length;
}

/**
 * Åpne redigeringsmodal
 */
function openEditModal(ruleId = null) {
  editingRuleId = ruleId;
  const t = translations.current || translations.en;

  // Populate profile select
  if (elements.ruleProfileSelect) {
      elements.ruleProfileSelect.innerHTML = '';
      // Re-use logic from loadProfiles but sync
      Storage.getProfiles().then(profiles => {
          for (const p of profiles) {
              const opt = document.createElement('option');
              opt.value = p.id;
              opt.textContent = p.name;
              elements.ruleProfileSelect.appendChild(opt);
          }
          // Set value
           if (ruleId) {
               const rule = allRules.find(r => r.id === ruleId);
               elements.ruleProfileSelect.value = rule ? rule.profileId : 'default';
           } else {
               elements.ruleProfileSelect.value = currentProfileId;
           }
      });
  }

  if (ruleId) {
    // Rediger eksisterende regel
    const rule = allRules.find(r => r.id === ruleId);
    if (!rule) return;

    document.getElementById('modalTitle').textContent = t.modalTitleEdit || 'Edit rule';
    document.getElementById('sitePattern').value = rule.sitePattern;
    document.getElementById('siteMatchType').value = rule.siteMatchType;
    document.getElementById('elementType').value = rule.elementType || 'text';
    document.getElementById('fieldType').value = rule.fieldType;
    document.getElementById('fieldPattern').value = rule.fieldPattern;
    document.getElementById('fieldUseRegex').checked = rule.fieldUseRegex;
    document.getElementById('value').value = rule.value;
    document.getElementById('enabled').checked = rule.enabled;
    document.getElementById('priority').value = rule.priority ?? 0;
    document.getElementById('conditionType').value = rule.conditionType || 'none';
    document.getElementById('conditionValue').value = rule.conditionValue || '';
  } else {
    // Ny regel
    document.getElementById('modalTitle').textContent = t.modalTitleNew || 'New rule';
    elements.editForm.reset();
    document.getElementById('priority').value = 0;
    document.getElementById('conditionType').value = 'none';
    document.getElementById('conditionValue').value = '';

    // Forhåndsutfyll med gjeldende side
    if (currentTab && currentTab.url) {
      try {
        const url = new URL(currentTab.url);
        document.getElementById('sitePattern').value = url.hostname;
      } catch (error) {
        // Ignorer feil
      }
    }
  }

  elements.editModal.style.display = 'flex';

  // Oppdater regex-toggle dersom selector er valgt
  handleFieldTypeChange();
}

/**
 * Lukk redigeringsmodal
 */
function closeEditModal() {
  elements.editModal.style.display = 'none';
  editingRuleId = null;
  elements.editForm.reset();
}

/**
 * Håndter bytte av felt-type
 */
function handleFieldTypeChange() {
  const isSelector = elements.fieldTypeInput.value === 'selector';

  if (elements.fieldUseRegex) {
    elements.fieldUseRegex.disabled = isSelector;
    if (isSelector) {
      elements.fieldUseRegex.checked = false;
    }
  }
}

/**
 * Håndter lagring av regel
 */
async function handleSaveRule(e) {
  e.preventDefault();
  const t = translations.current || translations.en;

  const ruleData = {
    sitePattern: document.getElementById('sitePattern').value.trim(),
    siteMatchType: document.getElementById('siteMatchType').value,
    elementType: document.getElementById('elementType').value,
    fieldType: document.getElementById('fieldType').value,
    fieldPattern: document.getElementById('fieldPattern').value.trim(),
    fieldUseRegex: document.getElementById('fieldUseRegex').checked,
    value: document.getElementById('value').value,
    enabled: document.getElementById('enabled').checked,
    priority: parseInt(document.getElementById('priority').value) || 0,
    conditionType: document.getElementById('conditionType').value,
    conditionValue: document.getElementById('conditionValue').value.trim(),
    profileId: document.getElementById('ruleProfileSelect').value
  };

  // CSS selectors bruker ikke regex-flagget
  if (ruleData.fieldType === 'selector') {
    ruleData.fieldUseRegex = false;
  }

  // Valider regex hvis brukt
  if (ruleData.fieldUseRegex) {
    const validation = PatternMatcher.validateRegex(ruleData.fieldPattern);
    if (!validation.valid) {
      alert(`${t.alerts.invalidRegex}${validation.error}`);
      return;
    }
  }

  // --- NY START: Sjekk om regel er dekket ---
  // Sjekk om regelen er dekket av en eksisterende (mer generell) regel
  const coveredBy = allRules.find(r => 
    r.id !== editingRuleId && // Ikke sjekk mot seg selv
    r.enabled &&
    r.fieldType === ruleData.fieldType &&
    // Sjekk om eksisterende site pattern dekker den nye
    PatternMatcher.match(ruleData.sitePattern, r.sitePattern, r.siteMatchType === 'regex') &&
    // Sjekk om eksisterende felt pattern dekker den nye
    PatternMatcher.match(ruleData.fieldPattern, r.fieldPattern, r.fieldUseRegex)
  );

  if (coveredBy) {
    const confirmMsg = t.alerts.coveredRule
        .replace('{site}', coveredBy.sitePattern)
        .replace('{field}', coveredBy.fieldPattern)
        .replace('{value}', coveredBy.value);
        
    if (!confirm(confirmMsg)) {
      return; // Avbryt lagring
    }
  }
  // --- NY SLUTT ---

  // Duplicate handling: if a matching rule exists, ask whether to replace it
  let targetRuleId = editingRuleId;
  if (!editingRuleId) {
    const duplicate = findDuplicateRule(ruleData);
    if (duplicate) {
      const msg = (t.alerts.duplicateChoice || 'A similar rule exists. OK = replace, Cancel = keep existing.')
        .replace('{site}', ruleData.sitePattern)
        .replace('{field}', ruleData.fieldPattern);
      const replace = confirm(msg);
      if (!replace) {
        return; // Keep existing rule, abort save
      }
      targetRuleId = duplicate.id; // Replace existing duplicate
    }
  }

  showLoading(true);

  try {
    if (targetRuleId) {
      // Oppdater
      await chrome.runtime.sendMessage({
        action: 'updateRule',
        ruleId: targetRuleId,
        updates: ruleData
      });
    } else {
      // Opprett ny
      await chrome.runtime.sendMessage({
        action: 'addRule',
        rule: ruleData
      });
    }

    // Reload regler
    await loadRules();

    // Lukk modal
    closeEditModal();

    // Fortell content scripts å laste inn regler på nytt
    if (currentTab) {
      chrome.tabs.sendMessage(currentTab.id, { action: 'reloadRules' }).catch(() => {
        // Ignorer feil (kan være at tab ikke har content script)
      });
    }
  } catch (error) {
    console.error('Error saving rule:', error);
    alert(t.alerts.saveError);
  } finally {
    showLoading(false);
  }
}

/**
 * Håndter sletting av regel
 */
async function handleDeleteRule(ruleId) {
  const t = translations.current || translations.en;
  if (!confirm(t.alerts.confirmDeleteRule)) {
    return;
  }

  showLoading(true);

  try {
    await chrome.runtime.sendMessage({
      action: 'deleteRule',
      ruleId: ruleId
    });

    await loadRules();
  } catch (error) {
    console.error('Error deleting rule:', error);
    alert(t.alerts.deleteError);
  } finally {
    showLoading(false);
  }
}

/**
 * Håndter eksport
 */
async function handleExport() {
  showLoading(true);
  const t = translations.current || translations.en;

  try {
    let rulesToExport = allRules;

    // Eksporter kun valgte dersom select mode er aktivt
    if (selectMode && selectedRules.size > 0) {
      const ids = new Set(selectedRules);
      rulesToExport = allRules.filter(r => ids.has(r.id));
    }

    const csv = buildCSV(rulesToExport);

    // Last ned fil
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `autofill-rules-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting:', error);
    alert(t.alerts.exportError);
  } finally {
    showLoading(false);
  }
}

/**
 * Håndter import
 */
async function handleImport(e, mode = 'import') {
  const file = e?.target?.files?.[0];
  if (!file) return;
  const t = translations.current || translations.en;

  if (e?.target) e.target.value = '';

  showLoading(true);

  try {
    await appendLog('import_file_selected', { mode, name: file.name, size: file.size });
    const content = await file.text();
    const processedCsv = await normalizeImportCSV(content);
    const analysis = analyzeCsvForImport(processedCsv, allRules, t);
    if (analysis.error) {
      alert(analysis.error);
      await appendLog('import_validation_error', { error: analysis.error });
      return;
    }
    await appendLog('import_validation_ready', { mode, total: analysis.totalRows, valid: analysis.validCount, dupes: analysis.duplicates.length, invalid: analysis.invalid.length });
    showImportPreviewModal(analysis, mode, t);
  } catch (error) {
    console.error('Error importing:', error);
    alert(t.alerts.importError);
    await appendLog('import_exception', { message: error.message });
  } finally {
    showLoading(false);
  }
}

/**
 * Håndter lokal logg toggle
 */
async function handleLogToggle(e) {
  const enabled = e.target.checked;
  try {
    logEnabled = enabled;
    await chrome.storage.local.set({ logToFile: enabled });
    await appendLog('log_toggle', { enabled });
    const t = translations.current || translations.en;
    showToast(t.toast.saved);
  } catch (error) {
    console.error('Error updating log setting:', error);
    e.target.checked = !enabled;
  }
}

function analyzeCsvForImport(content, existingRules, t) {
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
    const row = { lineNumber: offset + 2, cols, duplicate: false, error: null };

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

function showImportPreviewModal(analysis, mode = 'import', tOverride) {
  const t = tOverride || translations.current || translations.en;
  importPreviewState = { analysis, mode };
  if (elements.importPreviewModal) elements.importPreviewModal.style.display = 'flex';

  const summary = (t.importPreview?.summary || 'Lines: {total}. Valid: {valid}. Duplicates: {dupes}. Invalid: {invalid}.')
    .replace('{total}', analysis.totalRows)
    .replace('{valid}', analysis.validCount)
    .replace('{dupes}', analysis.duplicates.length)
    .replace('{invalid}', analysis.invalid.length);

  if (elements.importPreviewSummary) elements.importPreviewSummary.textContent = summary;
  if (elements.importPreviewTitle && t.importPreview?.title) elements.importPreviewTitle.textContent = t.importPreview.title;
  if (elements.skipDuplicatesLabel && t.importPreview?.skipDuplicates) elements.skipDuplicatesLabel.textContent = t.importPreview.skipDuplicates;
  if (elements.skipInvalidLabel && t.importPreview?.skipInvalid) elements.skipInvalidLabel.textContent = t.importPreview.skipInvalid;
  if (elements.duplicatesTitle && t.importPreview?.duplicates) elements.duplicatesTitle.textContent = t.importPreview.duplicates;
  if (elements.invalidTitle && t.importPreview?.invalid) elements.invalidTitle.textContent = t.importPreview.invalid;
  if (elements.confirmImportPreview) {
    elements.confirmImportPreview.textContent = mode === 'validate'
      ? (t.importPreview?.validateOnly || t.buttons?.cancel || 'Close')
      : (t.importPreview?.import || t.buttons?.importBtn || 'Import');
  }
  if (elements.cancelImportPreview && t.buttons?.cancel) elements.cancelImportPreview.textContent = t.buttons.cancel;

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
  const t = translations.current || translations.en;

  const skipDuplicates = elements.skipDuplicatesToggle ? elements.skipDuplicatesToggle.checked : true;
  const skipInvalid = elements.skipInvalidToggle ? elements.skipInvalidToggle.checked : true;
  const csv = buildCsvFromAnalysis(importPreviewState.analysis, { skipDuplicates, skipInvalid });

  if (importPreviewState.mode === 'validate') {
    await appendLog('import_validate_preview', { total: importPreviewState.analysis.totalRows, valid: importPreviewState.analysis.validCount, dupes: importPreviewState.analysis.duplicates.length, invalid: importPreviewState.analysis.invalid.length });
    closeImportPreviewModal();
    return;
  }

  const merge = confirm(
    'Vil du legge til disse reglene til eksisterende regler?\n\n' +
    'OK = Legg til\n' +
    'Avbryt = Erstatt alle eksisterende regler'
  );

  const result = await chrome.runtime.sendMessage({
    action: 'importCSV',
    csv,
    merge: merge
  });

  if (result.success) {
    alert(t.alerts.importSuccess.replace('{count}', result.imported));
    await loadRules();
    await appendLog('import_success', { imported: result.imported, merge, skippedDuplicates: !skipDuplicates ? 0 : importPreviewState.analysis.duplicates.length, skippedInvalid: !skipInvalid ? 0 : importPreviewState.analysis.invalid.length });
  } else {
    alert(t.alerts.importError + result.error);
    await appendLog('import_failed', { error: result.error });
  }
  closeImportPreviewModal();
}

async function handleCloudBackup() {
  const t = translations.current || translations.en;
  const providerLabel = t.cloud?.title || 'Backup';

  showLoading(true);
  try {
    const csv = buildCSV(allRules);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const useDefault = elements.useDefaultBackupDir?.checked;
    const saveAs = !useDefault;
    const downloadOpts = {
      url,
      filename: useDefault ? `AutoFill/${buildBackupFilename()}` : buildBackupFilename(),
      saveAs
    };
    await chrome.downloads.download(downloadOpts);
    if (!saveAs) {
      alert(t.cloud.backupSuccess.replace('{provider}', providerLabel));
    }
  } catch (error) {
    console.error('Cloud backup error:', error);
    alert(t.cloud.backupError.replace('{error}', error.message || 'unknown'));
  } finally {
    showLoading(false);
  }
}

async function handleCloudLogin() {
  // Legacy button now just informs user that no login is needed for local backups.
  const t = translations.current || translations.en;
  alert(t.cloud.noLoginNeeded || 'Login not required for local backup.');
}

function handleLocalRestore() {
  if (elements.fileInput) {
    elements.fileInput.click();
  }
}

async function openCloudRestoreFlow() {
  handleLocalRestore();
}

async function refreshCloudBackups() {
  const t = translations.current || translations.en;
  alert(t.cloud.noBackups || 'No backups listed. Use Restore to pick a CSV file.');
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(1)} ${units[exponent]}`;
}

function buildBackupFilename() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join('');
  return `AutoFill-${date}-${time}.csv`;
}

function findDuplicateRule(ruleData) {
  return allRules.find(r =>
    r.id !== editingRuleId &&
    r.sitePattern === ruleData.sitePattern &&
    (r.siteMatchType || 'host') === (ruleData.siteMatchType || 'host') &&
    (r.elementType || 'text') === (ruleData.elementType || 'text') &&
    r.fieldType === ruleData.fieldType &&
    r.fieldPattern === ruleData.fieldPattern &&
    (r.profileId || 'default') === (ruleData.profileId || 'default')
  );
}

/**
 * Vis/skjul loading
 */
function showLoading(show) {
  if (elements.loading) {
    elements.loading.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Bygg CSV-streng fra regler (støtter eksport av utvalg)
 */
function buildCSV(rules) {
  const headers = ['id', 'sitePattern', 'siteMatchType', 'elementType', 'fieldType', 'fieldPattern', 'fieldUseRegex', 'value', 'enabled', 'created', 'lastUsed', 'sortOrder', 'priority', 'conditionType', 'conditionValue'];
  const rows = rules.map(rule => [
    rule.id,
    rule.sitePattern,
    rule.siteMatchType,
    rule.elementType || 'text',
    rule.fieldType,
    rule.fieldPattern,
    rule.fieldUseRegex,
    rule.value,
    rule.enabled,
    rule.created,
    rule.lastUsed || '',
    rule.sortOrder ?? '',
    rule.priority ?? 0,
    rule.conditionType || 'none',
    rule.conditionValue || ''
  ].map(escapeCsv).join(';'));

  return [headers.join(';'), ...rows].join('\n');
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes(',')) {
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

/**
 * Normaliser CSV import (støtter komma/semikolon og manuell mapping)
 */
async function normalizeImportCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) return content;

  // Detekter separator
  const firstLine = lines[0];
  const separator = firstLine.includes(',') && !firstLine.includes(';') ? ',' : ';';

  const headers = firstLine.split(separator).map(h => h.trim());
  const required = ['id', 'sitePattern', 'siteMatchType', 'elementType', 'fieldType', 'fieldPattern', 'fieldUseRegex', 'value', 'enabled', 'created', 'lastUsed', 'sortOrder', 'priority', 'conditionType', 'conditionValue'];

  const hasAll = required.every(h => headers.includes(h));
  if (hasAll) {
    return content.replace(new RegExp(separator, 'g'), ';'); // normaliser til semikolon
  }

  // Spør bruker om mapping
  const mappingPrompt = `CSV kolonner oppdaget (${separator}-separert):\n\n${headers.map((h, i) => `${i}: ${h || '(tom)'}`).join('\n')}\n\nSkriv inn vår-kolonnenavn i samme rekkefølge, separert med komma.\nTillatte felter: ${required.join(', ')}\nDu kan la tomt for kolonner du ikke trenger.`;
  const mappingInput = prompt(mappingPrompt);
  if (!mappingInput) {
    return content.replace(new RegExp(separator, 'g'), ';');
  }

  const mapping = mappingInput.split(',').map(s => s.trim());
  const normalizedLines = [];
  normalizedLines.push(required.join(';'));

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator);
    const rowObj = {};
    mapping.forEach((target, idx) => {
      if (!target) return;
      rowObj[target] = cols[idx] || '';
    });

    const row = required.map(key => {
      return rowObj[key] !== undefined ? rowObj[key] : '';
    });
    normalizedLines.push(row.join(';'));
  }

  return normalizedLines.join('\n');
}

async function appendLog(event, data) {
  if (!logEnabled) return;
  try {
    const entry = { ts: Date.now(), event, data };
    logBuffer = Array.isArray(logBuffer) ? logBuffer : [];
    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOG_ENTRIES) {
      logBuffer = logBuffer.slice(-MAX_LOG_ENTRIES);
    }
    await chrome.storage.local.set({ [LOG_KEY]: logBuffer });
  } catch (err) {
    console.warn('appendLog failed', err);
  }
}

async function handleExportLog() {
  const t = translations.current || translations.en;
  try {
    const res = await chrome.storage.local.get(LOG_KEY);
    const buffer = Array.isArray(res[LOG_KEY]) ? res[LOG_KEY] : logBuffer;
    if (!buffer || buffer.length === 0) {
      alert(t.alerts?.noMatches || 'No entries');
      return;
    }
    const lines = buffer.map(entry => {
      const ts = new Date(entry.ts || Date.now()).toISOString();
      const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
      return `${ts} ${entry.event}${data}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({
      url,
      filename: `autofill-debuglog-${Date.now()}.txt`,
      saveAs: false
    });
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export log error', err);
    alert((t.alerts?.exportError || 'Could not export rules') + (err.message ? ` ${err.message}` : ''));
  }
}

function filterDuplicateCsv(content, existingRules) {
  const trimmed = content.trim();
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { csv: trimmed, skipped: 0 };

  const header = lines[0].split(';').map(h => h.trim());
  const required = ['sitePattern', 'fieldType', 'fieldPattern', 'profileId'];
  const hasAll = required.every(h => header.includes(h));
  if (!hasAll) return { csv: trimmed, skipped: 0 };

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

function buildImportPreview(content, existingRules, t) {
  const deduped = filterDuplicateCsv(content, existingRules);
  const skippedMsg = deduped.skipped > 0
    ? (t.alerts?.duplicateWarning || 'Skipped duplicates: {count}').replace('{count}', deduped.skipped)
    : '';
  const summary = `${skippedMsg}\n${t.alerts?.importConfirm || 'Proceed with import?'}`;
  return { csv: deduped.csv, summary };
}

/**
 * Få label for element type
 */
function getElementTypeLabel(type) {
  const t = translations.current || translations.en;
  return t.elementTypes[type] || type;
}

/**
 * Få label for site match type
 */
function getSiteMatchTypeLabel(type) {
  const t = translations.current || translations.en;
  return t.matchTypes[type] || type;
}

/**
 * Få ikon for element type
 */
function getElementIcon(type) {
    const icons = {
        text: '📝',
        checkbox: '☑️',
        radio: '🔘',
        select: '🔽',
        textarea: '📄',
        contenteditable: '✏️'
    };
    return icons[type] || '📝';
}

/**
 * Formater dato
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // TODO: Translate these relative time strings too if needed
  if (diffMins < 1) return 'Nå nettopp';
  if (diffMins < 60) return `${diffMins} min siden`;
  if (diffHours < 24) return `${diffHours} timer siden`;
  if (diffDays < 7) return `${diffDays} dager siden`;

  const locale = currentLanguage === 'no' ? 'no-NO' : 'en-US';
  return date.toLocaleDateString(locale);
}

/**
 * Test match på aktiv side (uten å fylle ut)
 */
async function handleTestMatch() {
  const t = translations.current || translations.en;
  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'testMatches', profileId: currentProfileId });
    if (!response || !response.success) {
      alert(t.alerts.noMatches);
      return;
    }

    const lines = response.matches.map(m =>
      `${m.field} (${m.elementType}) -> ${m.ruleId} = ${m.ruleValue}`
    );
    alert(t.alerts.testMatchResult.replace('{total}', response.totalFields).replace('{matches}', lines.join('\n') || 'Ingen'));
  } catch (error) {
    alert(t.alerts.testMatchError);
  }
}

/**
 * Åpne AI-modal og generer prompt
 */
function openAiModal() {
  generateAiPrompt();
  document.getElementById('aiModal').style.display = 'flex';
}

function closeAiModal() {
  document.getElementById('aiModal').style.display = 'none';
}

function copyAiPrompt() {
  const text = document.getElementById('aiPrompt').value;
  navigator.clipboard.writeText(text).catch(() => {});
}

function generateAiPrompt() {
  const t = translations.current || translations.en;
  const header = [
    'You are an expert at generating autofill rules for a browser extension.',
    'Return only CSV lines with these columns (semicolon-separated):',
    'id;sitePattern;siteMatchType;elementType;fieldType;fieldPattern;fieldUseRegex;value;enabled;created;lastUsed'
  ];

  const rulesCsv = buildCSV(allRules || []).split('\n');
  const rulesSection = (allRules && allRules.length)
    ? rulesCsv
    : [t.ai.none || '(none detected)'];

  const fields = availableFields.length ? availableFields : [];
  const fieldLines = fields.length
    ? fields.map(f => `- elementType=${f.fieldType}, identifierType=${f.type}, identifier=${f.identifier}, currentValue=${f.value || ''}`)
    : [t.ai.none || '(none detected)'];

  const tips = [
    t.ai.wildcard || 'Wildcards: * = any characters, ? = one character.',
    t.ai.regex || 'Enable regex for complex matches (examples: ^user.* , email|e-mail).',
    'Prefer siteMatchType=host unless regex/url is required.',
    'Set enabled=true; created/lastUsed can be empty or timestamps.'
  ];

  const prompt = [
    ...header,
    '',
    (t.ai.existingRules || 'Existing rules (context):'),
    ...rulesSection,
    '',
    (t.ai.detectedFields || 'Detected fields (current page):'),
    ...fieldLines,
    '',
    ...tips
  ].join('\n');

  document.getElementById('aiPrompt').value = prompt;
}

/**
 * Render tilgjengelige felter
 */
function renderAvailableFields() {
  const container = elements.availableFieldsList;
  const empty = elements.availableEmpty;
  
  // Update count in header regardless of search/display state
  if (elements.availableCount) {
      elements.availableCount.textContent = `(${availableFields.length})`;
  }

  if (!elements.availableSearch) return;
  const term = elements.availableSearch.value.toLowerCase();

  if (!container) return;

  container.innerHTML = '';

  const filtered = availableFields.filter(f => {
    const text = `${f.identifier} ${f.type} ${f.fieldType}`.toLowerCase();
    return !term || text.includes(term);
  });

  if (filtered.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  const groups = {};
  filtered.forEach(f => {
    const key = f.fieldType || 'text';
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  });

  Object.keys(groups).sort().forEach(type => {
    const header = document.createElement('div');
    header.className = 'available-group';
    header.innerHTML = `<div class="available-type">${getElementTypeLabel(type)}</div>`;
    container.appendChild(header);

    const list = document.createElement('div');
    list.className = 'available-items';

    for (const field of groups[type]) {
      const item = document.createElement('div');
      item.className = 'available-item';
      item.innerHTML = `
        <span class="pill">${escapeHtml(field.type)}</span>
        <strong>${escapeHtml(field.identifier)}</strong>
        ${field.value ? `<small>${escapeHtml(field.value)}</small>` : ''}
      `;
      list.appendChild(item);
    }

    container.appendChild(list);
  });
}

async function handleForceFill() {
  if (!currentTab) return;
  const t = translations.current || translations.en;

  showLoading(true);
  try {
    await chrome.tabs.sendMessage(currentTab.id, {
      action: 'forceFill',
      profileId: currentProfileId,
      force: true
    });
  } catch (error) {
    console.error('Error forcing fill:', error);
    alert(t.alerts.forceFillError || 'Could not force fill fields');
  } finally {
    showLoading(false);
  }
}

async function handleTestMatch() {
  if (!currentTab) {
    alert(currentLanguage === 'no'
      ? 'Ingen gyldig side åpen. Åpne en vanlig webside (ikke chrome://) og prøv igjen.'
      : 'No valid page open. Open a regular webpage (not chrome://) and try again.');
    return;
  }

  const t = translations.current || translations.en;
  showLoading(true);

  try {
    let response;
    try {
      response = await chrome.tabs.sendMessage(currentTab.id, { action: 'testMatches' });
    } catch (e) {
      // Content script not loaded - try to inject it
      console.warn('Content script not found, attempting to inject...', e);
      try {
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['content.js']
        });
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 500));
        response = await chrome.tabs.sendMessage(currentTab.id, { action: 'testMatches' });
      } catch (injectError) {
        console.error('Failed to inject content script:', injectError);
        alert(currentLanguage === 'no'
          ? 'Kunne ikke koble til siden. Last siden på nytt og prøv igjen.'
          : 'Could not connect to page. Reload the page and try again.');
        return;
      }
    }

    if (!response || !response.success) {
      alert(t.alerts?.testMatchError || 'Kunne ikke teste match');
      return;
    }

    const lines = (response.matches || []).map(m => `${m.field} (${m.elementType}) -> ${m.ruleValue}`);
    const msg = (t.alerts?.testMatchResult || 'Felt: {total}\nMatches:\n{matches}')
      .replace('{total}', response.totalFields)
      .replace('{matches}', lines.join('\n') || (currentLanguage === 'no' ? 'Ingen' : 'None'));
    alert(msg);
  } catch (e) {
    console.error('Test match error:', e);
    alert(t.alerts?.testMatchError || 'Kunne ikke teste match');
  } finally {
    showLoading(false);
  }
}


