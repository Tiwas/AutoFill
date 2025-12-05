/**
 * Popup UI Script for AutoFill Plugin
 * Håndterer all UI-logikk for popup-vinduet
 */

// Globale variabler
let allRules = [];
let filteredRules = [];
let currentTab = null;
let editingRuleId = null;

// DOM-elementer
const elements = {
  rulesList: null,
  searchInput: null,
  filterEnabled: null,
  filterRegex: null,
  totalRules: null,
  activeRules: null,
  currentSiteRules: null,
  emptyState: null,
  loading: null,
  editModal: null,
  editForm: null,
  addRuleBtn: null,
  exportBtn: null,
  importBtn: null,
  fileInput: null
};

/**
 * Initialiser popup
 */
document.addEventListener('DOMContentLoaded', async () => {
  initElements();
  attachEventListeners();
  await loadCurrentTab();
  await loadRules();
});

/**
 * Initialiser DOM-elementer
 */
function initElements() {
  elements.rulesList = document.getElementById('rulesList');
  elements.searchInput = document.getElementById('searchInput');
  elements.filterEnabled = document.getElementById('filterEnabled');
  elements.filterRegex = document.getElementById('filterRegex');
  elements.totalRules = document.getElementById('totalRules');
  elements.activeRules = document.getElementById('activeRules');
  elements.currentSiteRules = document.getElementById('currentSiteRules');
  elements.emptyState = document.getElementById('emptyState');
  elements.loading = document.getElementById('loading');
  elements.editModal = document.getElementById('editModal');
  elements.editForm = document.getElementById('editForm');
  elements.addRuleBtn = document.getElementById('addRuleBtn');
  elements.exportBtn = document.getElementById('exportBtn');
  elements.importBtn = document.getElementById('importBtn');
  elements.fileInput = document.getElementById('fileInput');
}

/**
 * Legg til event listeners
 */
function attachEventListeners() {
  // Søk og filtrering
  elements.searchInput.addEventListener('input', applyFilters);
  elements.filterEnabled.addEventListener('change', applyFilters);
  elements.filterRegex.addEventListener('change', applyFilters);

  // Legg til ny regel
  elements.addRuleBtn.addEventListener('click', () => openEditModal());

  // Export/Import
  elements.exportBtn.addEventListener('click', handleExport);
  elements.importBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleImport);

  // Modal
  document.getElementById('closeModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelBtn').addEventListener('click', closeEditModal);
  elements.editForm.addEventListener('submit', handleSaveRule);

  // Lukk modal ved klikk utenfor
  elements.editModal.addEventListener('click', (e) => {
    if (e.target === elements.editModal) {
      closeEditModal();
    }
  });
}

/**
 * Last inn gjeldende tab
 */
async function loadCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    currentTab = tabs[0];
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
    applyFilters();
    updateStats();
  } catch (error) {
    console.error('Feil ved lasting av regler:', error);
  } finally {
    showLoading(false);
  }
}

/**
 * Appliser filtre
 */
function applyFilters() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const onlyEnabled = elements.filterEnabled.checked;
  const onlyRegex = elements.filterRegex.checked;

  filteredRules = allRules.filter(rule => {
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

  // Sorter etter sist brukt (nyeste først), deretter etter opprettet
  const sortedRules = [...filteredRules].sort((a, b) => {
    if (a.lastUsed && b.lastUsed) {
      return b.lastUsed - a.lastUsed;
    } else if (a.lastUsed) {
      return -1;
    } else if (b.lastUsed) {
      return 1;
    }
    return b.created - a.created;
  });

  for (const rule of sortedRules) {
    const ruleElement = createRuleElement(rule);
    elements.rulesList.appendChild(ruleElement);
  }
}

/**
 * Opprett regel-element
 */
function createRuleElement(rule) {
  const div = document.createElement('div');
  div.className = `rule-item ${rule.enabled ? '' : 'disabled'}`;

  const badges = [];
  if (rule.fieldUseRegex) {
    badges.push('<span class="rule-badge badge-regex">Regex</span>');
  } else if (PatternMatcher.hasWildcards(rule.fieldPattern)) {
    badges.push('<span class="rule-badge badge-wildcard">Wildcard</span>');
  }

  div.innerHTML = `
    <div class="rule-header">
      <div>
        <span class="rule-site">${escapeHtml(rule.sitePattern)}</span>
        ${badges.join('')}
      </div>
      <div class="rule-actions">
        <button class="btn btn-small btn-secondary edit-btn" data-id="${rule.id}">
          Rediger
        </button>
        <button class="btn btn-small btn-danger delete-btn" data-id="${rule.id}">
          Slett
        </button>
      </div>
    </div>
    <div class="rule-body">
      <span class="rule-label">Felt:</span>
      <span class="rule-value">${escapeHtml(rule.fieldType)}: ${escapeHtml(rule.fieldPattern)}</span>

      <span class="rule-label">Verdi:</span>
      <span class="rule-value">${escapeHtml(rule.value)}</span>

      <span class="rule-label">Type:</span>
      <span class="rule-value">${getSiteMatchTypeLabel(rule.siteMatchType)}</span>

      ${rule.lastUsed ? `
        <span class="rule-label">Sist brukt:</span>
        <span class="rule-value">${formatDate(rule.lastUsed)}</span>
      ` : ''}
    </div>
  `;

  // Event listeners
  div.querySelector('.edit-btn').addEventListener('click', () => openEditModal(rule.id));
  div.querySelector('.delete-btn').addEventListener('click', () => handleDeleteRule(rule.id));

  return div;
}

/**
 * Oppdater statistikk
 */
function updateStats() {
  elements.totalRules.textContent = allRules.length;
  elements.activeRules.textContent = allRules.filter(r => r.enabled).length;

  // Tell regler for gjeldende side
  if (currentTab && currentTab.url) {
    try {
      const url = new URL(currentTab.url);
      const hostname = url.hostname;
      const domain = Storage.extractDomain(hostname);

      const matchingRules = allRules.filter(rule => {
        if (!rule.enabled) return false;
        return Storage.matchSite(currentTab.url, hostname, domain, rule);
      });

      elements.currentSiteRules.textContent = matchingRules.length;
    } catch (error) {
      elements.currentSiteRules.textContent = '0';
    }
  } else {
    elements.currentSiteRules.textContent = '0';
  }
}

/**
 * Åpne redigeringsmodal
 */
function openEditModal(ruleId = null) {
  editingRuleId = ruleId;

  if (ruleId) {
    // Rediger eksisterende regel
    const rule = allRules.find(r => r.id === ruleId);
    if (!rule) return;

    document.getElementById('modalTitle').textContent = 'Rediger regel';
    document.getElementById('sitePattern').value = rule.sitePattern;
    document.getElementById('siteMatchType').value = rule.siteMatchType;
    document.getElementById('fieldType').value = rule.fieldType;
    document.getElementById('fieldPattern').value = rule.fieldPattern;
    document.getElementById('fieldUseRegex').checked = rule.fieldUseRegex;
    document.getElementById('value').value = rule.value;
    document.getElementById('enabled').checked = rule.enabled;
  } else {
    // Ny regel
    document.getElementById('modalTitle').textContent = 'Ny regel';
    elements.editForm.reset();

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
 * Håndter lagring av regel
 */
async function handleSaveRule(e) {
  e.preventDefault();

  const ruleData = {
    sitePattern: document.getElementById('sitePattern').value.trim(),
    siteMatchType: document.getElementById('siteMatchType').value,
    fieldType: document.getElementById('fieldType').value,
    fieldPattern: document.getElementById('fieldPattern').value.trim(),
    fieldUseRegex: document.getElementById('fieldUseRegex').checked,
    value: document.getElementById('value').value,
    enabled: document.getElementById('enabled').checked
  };

  // Valider regex hvis brukt
  if (ruleData.fieldUseRegex) {
    const validation = PatternMatcher.validateRegex(ruleData.fieldPattern);
    if (!validation.valid) {
      alert(`Ugyldig regex: ${validation.error}`);
      return;
    }
  }

  showLoading(true);

  try {
    if (editingRuleId) {
      // Oppdater
      await chrome.runtime.sendMessage({
        action: 'updateRule',
        ruleId: editingRuleId,
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
    console.error('Feil ved lagring av regel:', error);
    alert('Kunne ikke lagre regel');
  } finally {
    showLoading(false);
  }
}

/**
 * Håndter sletting av regel
 */
async function handleDeleteRule(ruleId) {
  if (!confirm('Er du sikker på at du vil slette denne regelen?')) {
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
    console.error('Feil ved sletting av regel:', error);
    alert('Kunne ikke slette regel');
  } finally {
    showLoading(false);
  }
}

/**
 * Håndter eksport
 */
async function handleExport() {
  showLoading(true);

  try {
    const csv = await chrome.runtime.sendMessage({ action: 'exportCSV' });

    // Last ned fil
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `autofill-rules-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Feil ved eksport:', error);
    alert('Kunne ikke eksportere regler');
  } finally {
    showLoading(false);
  }
}

/**
 * Håndter import
 */
async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Reset file input
  e.target.value = '';

  showLoading(true);

  try {
    const content = await file.text();

    const merge = confirm(
      'Vil du legge til disse reglene til eksisterende regler?\n\n' +
      'OK = Legg til\n' +
      'Avbryt = Erstatt alle eksisterende regler'
    );

    const result = await chrome.runtime.sendMessage({
      action: 'importCSV',
      csv: content,
      merge: merge
    });

    if (result.success) {
      alert(`Importert ${result.imported} regler`);
      await loadRules();
    } else {
      alert(`Feil ved import: ${result.error}`);
    }
  } catch (error) {
    console.error('Feil ved import:', error);
    alert('Kunne ikke importere regler');
  } finally {
    showLoading(false);
  }
}

/**
 * Vis/skjul loading
 */
function showLoading(show) {
  elements.loading.style.display = show ? 'flex' : 'none';
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
 * Få label for site match type
 */
function getSiteMatchTypeLabel(type) {
  const labels = {
    host: 'Host',
    domain: 'Domene',
    url: 'URL',
    regex: 'Regex'
  };
  return labels[type] || type;
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

  if (diffMins < 1) return 'Nå nettopp';
  if (diffMins < 60) return `${diffMins} min siden`;
  if (diffHours < 24) return `${diffHours} timer siden`;
  if (diffDays < 7) return `${diffDays} dager siden`;

  return date.toLocaleDateString('no-NO');
}
