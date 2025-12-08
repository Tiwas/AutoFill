/**
 * Settings Modal - shared between popup.html and rules.html
 */

const SettingsModal = {
  elements: {},

  init() {
    this.initElements();
    this.attachEvents();
  },

  initElements() {
    this.elements = {
      modal: document.getElementById('settingsModal'),
      closeBtn: document.getElementById('closeSettingsModal'),
      closeBtnFooter: document.getElementById('closeSettingsModalBtn'),
      tabs: document.querySelectorAll('.settings-tab'),
      tabContents: document.querySelectorAll('.settings-tab-content'),

      // General
      languageSelect: document.getElementById('settingsLanguageSelect'),
      autofillToggle: document.getElementById('settingsAutofillToggle'),
      scanToastToggle: document.getElementById('settingsScanToastToggle'),
      autofillDelay: document.getElementById('settingsAutofillDelay'),
      autofillMode: document.getElementById('settingsAutofillMode'),

      // Filters
      whitelistPatterns: document.getElementById('settingsWhitelistPatterns'),
      blacklistPatterns: document.getElementById('settingsBlacklistPatterns'),
      fieldBlacklistPatterns: document.getElementById('settingsFieldBlacklistPatterns'),

      // Backup
      exportBtn: document.getElementById('settingsExportBtn'),
      importBtn: document.getElementById('settingsImportBtn'),
      validateBtn: document.getElementById('settingsValidateBtn'),
      pushSyncBtn: document.getElementById('settingsPushSyncBtn'),
      pullSyncBtn: document.getElementById('settingsPullSyncBtn'),
      cloudBackupBtn: document.getElementById('settingsCloudBackupBtn'),
      cloudRestoreBtn: document.getElementById('settingsCloudRestoreBtn'),

      // Advanced
      debugToggle: document.getElementById('settingsDebugToggle'),
      logToggle: document.getElementById('settingsLogToggle'),
      exportLogBtn: document.getElementById('settingsExportLogBtn'),

      // File inputs
      settingsFileInput: document.getElementById('settingsFileInput'),
      validateFileInput: document.getElementById('settingsValidateFileInput')
    };
  },

  attachEvents() {
    // Close buttons
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.elements.closeBtnFooter) {
      this.elements.closeBtnFooter.addEventListener('click', () => this.close());
    }

    // Click outside to close
    if (this.elements.modal) {
      this.elements.modal.addEventListener('click', (e) => {
        if (e.target === this.elements.modal) this.close();
      });
    }

    // Tabs
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // General settings
    if (this.elements.autofillToggle) {
      this.elements.autofillToggle.addEventListener('change', () => this.saveGeneralSettings());
    }
    if (this.elements.scanToastToggle) {
      this.elements.scanToastToggle.addEventListener('change', () => this.saveGeneralSettings());
    }
    if (this.elements.autofillDelay) {
      this.elements.autofillDelay.addEventListener('change', () => this.saveGeneralSettings());
    }
    if (this.elements.autofillMode) {
      this.elements.autofillMode.addEventListener('change', () => this.saveGeneralSettings());
    }
    if (this.elements.languageSelect) {
      this.elements.languageSelect.addEventListener('change', () => this.saveLanguage());
    }

    // Filter settings - debounced save
    let filterTimeout;
    const saveFiltersDebounced = () => {
      clearTimeout(filterTimeout);
      filterTimeout = setTimeout(() => this.saveFilterSettings(), 500);
    };
    if (this.elements.whitelistPatterns) {
      this.elements.whitelistPatterns.addEventListener('input', saveFiltersDebounced);
    }
    if (this.elements.blacklistPatterns) {
      this.elements.blacklistPatterns.addEventListener('input', saveFiltersDebounced);
    }
    if (this.elements.fieldBlacklistPatterns) {
      this.elements.fieldBlacklistPatterns.addEventListener('input', saveFiltersDebounced);
    }

    // Backup
    if (this.elements.exportBtn) {
      this.elements.exportBtn.addEventListener('click', () => this.exportSettings());
    }
    if (this.elements.importBtn) {
      this.elements.importBtn.addEventListener('click', () => this.elements.settingsFileInput?.click());
    }
    if (this.elements.settingsFileInput) {
      this.elements.settingsFileInput.addEventListener('change', (e) => this.importSettings(e));
    }
    if (this.elements.validateBtn) {
      this.elements.validateBtn.addEventListener('click', () => this.elements.validateFileInput?.click());
    }
    if (this.elements.validateFileInput) {
      this.elements.validateFileInput.addEventListener('change', (e) => this.validateRulesFile(e));
    }
    if (this.elements.pushSyncBtn) {
      this.elements.pushSyncBtn.addEventListener('click', () => this.pushSync());
    }
    if (this.elements.pullSyncBtn) {
      this.elements.pullSyncBtn.addEventListener('click', () => this.pullSync());
    }
    if (this.elements.cloudBackupBtn) {
      this.elements.cloudBackupBtn.addEventListener('click', () => this.cloudBackup());
    }
    if (this.elements.cloudRestoreBtn) {
      this.elements.cloudRestoreBtn.addEventListener('click', () => this.cloudRestore());
    }

    // Advanced
    if (this.elements.debugToggle) {
      this.elements.debugToggle.addEventListener('change', () => this.saveAdvancedSettings());
    }
    if (this.elements.logToggle) {
      this.elements.logToggle.addEventListener('change', () => this.saveLogSetting());
    }
    if (this.elements.exportLogBtn) {
      this.elements.exportLogBtn.addEventListener('click', () => this.exportLog());
    }
  },

  switchTab(tabName) {
    this.elements.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    this.elements.tabContents.forEach(content => {
      content.classList.toggle('active', content.dataset.tab === tabName);
    });
  },

  async open() {
    await this.loadSettings();
    if (this.elements.modal) {
      this.elements.modal.style.display = 'flex';
    }
  },

  close() {
    if (this.elements.modal) {
      this.elements.modal.style.display = 'none';
    }
  },

  async loadSettings() {
    try {
      // Load from sync storage
      let syncResult = {};
      try {
        syncResult = await chrome.storage.sync.get([
          'autofillEnabled', 'scanToastEnabled', 'autofillDelay', 'autofillTrigger',
          'blacklist', 'whitelist', 'fieldBlacklist', 'language', 'debugMode'
        ]);
      } catch (e) {
        syncResult = await chrome.storage.local.get([
          'autofillEnabled', 'scanToastEnabled', 'autofillDelay', 'autofillTrigger',
          'blacklist', 'whitelist', 'fieldBlacklist', 'language', 'debugMode'
        ]);
      }

      // Load local-only settings
      const localResult = await chrome.storage.local.get(['logToFile']);

      // General
      if (this.elements.autofillToggle) {
        this.elements.autofillToggle.checked = syncResult.autofillEnabled !== false;
      }
      if (this.elements.scanToastToggle) {
        this.elements.scanToastToggle.checked = syncResult.scanToastEnabled !== false;
      }
      if (this.elements.autofillDelay) {
        this.elements.autofillDelay.value = syncResult.autofillDelay || 0;
      }
      if (this.elements.autofillMode) {
        this.elements.autofillMode.value = syncResult.autofillTrigger || 'auto';
      }
      if (this.elements.languageSelect) {
        this.elements.languageSelect.value = syncResult.language || 'en';
      }

      // Filters
      if (this.elements.whitelistPatterns) {
        this.elements.whitelistPatterns.value = Array.isArray(syncResult.whitelist)
          ? syncResult.whitelist.join('\n') : '';
      }
      if (this.elements.blacklistPatterns) {
        this.elements.blacklistPatterns.value = Array.isArray(syncResult.blacklist)
          ? syncResult.blacklist.join('\n') : '';
      }
      if (this.elements.fieldBlacklistPatterns) {
        this.elements.fieldBlacklistPatterns.value = Array.isArray(syncResult.fieldBlacklist)
          ? syncResult.fieldBlacklist.join('\n') : '';
      }

      // Advanced
      if (this.elements.debugToggle) {
        this.elements.debugToggle.checked = syncResult.debugMode || false;
      }
      if (this.elements.logToggle) {
        this.elements.logToggle.checked = localResult.logToFile || false;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  async saveGeneralSettings() {
    try {
      const settings = {
        autofillEnabled: this.elements.autofillToggle?.checked ?? true,
        scanToastEnabled: this.elements.scanToastToggle?.checked ?? true,
        autofillDelay: parseInt(this.elements.autofillDelay?.value) || 0,
        autofillTrigger: this.elements.autofillMode?.value || 'auto'
      };

      await this.saveSyncSettings(settings);
      this.broadcastSettings(settings);
      this.showToast('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  async saveLanguage() {
    try {
      const language = this.elements.languageSelect?.value || 'en';
      await this.saveSyncSettings({ language });
      this.broadcastSettings({ language });
      // Reload page to apply language
      location.reload();
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },

  async saveFilterSettings() {
    try {
      const blacklist = (this.elements.blacklistPatterns?.value || '')
        .split('\n').map(s => s.trim()).filter(Boolean);
      const whitelist = (this.elements.whitelistPatterns?.value || '')
        .split('\n').map(s => s.trim()).filter(Boolean);
      const fieldBlacklist = (this.elements.fieldBlacklistPatterns?.value || '')
        .split('\n').map(s => s.trim()).filter(Boolean);

      await this.saveSyncSettings({ blacklist, whitelist, fieldBlacklist });
      this.broadcastSettings({ blacklist, whitelist, fieldBlacklist });
      this.showToast('Filters saved');
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  },

  async saveAdvancedSettings() {
    try {
      const debugMode = this.elements.debugToggle?.checked ?? false;
      await this.saveSyncSettings({ debugMode });
      this.broadcastSettings({ debugMode });
      this.showToast('Settings saved');
    } catch (error) {
      console.error('Error saving advanced settings:', error);
    }
  },

  async saveLogSetting() {
    try {
      const logToFile = this.elements.logToggle?.checked ?? false;
      await chrome.storage.local.set({ logToFile });
      this.showToast('Log setting saved');
    } catch (error) {
      console.error('Error saving log setting:', error);
    }
  },

  async saveSyncSettings(data) {
    try {
      await chrome.storage.sync.set(data);
    } catch (e) {
      await chrome.storage.local.set(data);
    }
  },

  broadcastSettings(payload) {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateSettings',
          ...payload
        }).catch(() => {});
      }
    });
  },

  async exportSettings() {
    try {
      const settingsJson = await Storage.exportSettings();
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autofill-settings-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Settings exported');
    } catch (e) {
      console.error('Export settings error:', e);
      alert('Error exporting settings: ' + e.message);
    }
  },

  async importSettings(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await Storage.importSettings(text);

      if (result.success) {
        this.showToast('Settings imported');
        await this.loadSettings();
        this.broadcastSettings(JSON.parse(text));
      } else {
        alert('Import error: ' + result.error);
      }
    } catch (e) {
      console.error('Import settings error:', e);
      alert('Error importing settings: ' + e.message);
    } finally {
      e.target.value = '';
    }
  },

  async validateRulesFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Use the existing handleImport function if available
      if (typeof handleImport === 'function') {
        await handleImport(e, 'validate');
      } else {
        alert('Validation is not available in this context');
      }
    } catch (error) {
      console.error('Validate error:', error);
      alert('Error validating file: ' + error.message);
    } finally {
      e.target.value = '';
    }
  },

  async pushSync() {
    const btn = this.elements.pushSyncBtn;
    if (!btn) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '...';

    try {
      const res = await Storage.pushToSync();
      alert(`Synced ${res.count} rules to cloud.`);
    } catch (e) {
      alert('Sync error: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  },

  async pullSync() {
    const btn = this.elements.pullSyncBtn;
    if (!btn) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '...';

    try {
      // This delegates to the existing handlePullSync if available
      if (typeof handlePullSync === 'function') {
        await handlePullSync();
      } else {
        // Fallback implementation
        const result = await chrome.storage.sync.get('autofill_rules_sync');
        const remoteRules = result['autofill_rules_sync'] || [];
        if (remoteRules.length === 0) {
          alert('No rules found in cloud.');
        } else {
          alert(`Found ${remoteRules.length} rules in cloud. Use popup for full sync options.`);
        }
      }
    } catch (e) {
      alert('Pull error: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  },

  async cloudBackup() {
    if (typeof handleCloudBackup === 'function') {
      await handleCloudBackup();
    } else if (typeof handleSmartBackup === 'function') {
      await handleSmartBackup();
    } else {
      alert('Cloud backup is not available in this context');
    }
  },

  async cloudRestore() {
    if (typeof handleLocalRestore === 'function') {
      await handleLocalRestore();
    } else if (typeof handleSmartRestore === 'function') {
      await handleSmartRestore();
    } else {
      alert('Cloud restore is not available in this context');
    }
  },

  async exportLog() {
    if (typeof handleExportLog === 'function') {
      await handleExportLog();
    } else {
      // Fallback implementation
      try {
        const LOG_KEY = 'debug_log_buffer';
        const res = await chrome.storage.local.get(LOG_KEY);
        const logs = res[LOG_KEY] || [];
        if (logs.length === 0) {
          alert('No logs to export');
          return;
        }
        const text = logs.map(l => `[${l.ts}] ${l.action}: ${JSON.stringify(l.data)}`).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `autofill-debug-log-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Log exported');
      } catch (e) {
        alert('Error exporting log: ' + e.message);
      }
    }
  },

  showToast(message) {
    if (typeof showToast === 'function') {
      showToast(message);
    } else {
      // Simple fallback
      const toast = document.createElement('div');
      toast.className = 'toast-notification show';
      toast.textContent = message;
      toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:12px 24px;border-radius:8px;z-index:10000;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SettingsModal.init());
} else {
  SettingsModal.init();
}
