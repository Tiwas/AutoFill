/**
 * Storage API Wrapper for AutoFill Plugin
 * Håndterer all interaksjon med chrome.storage.local
 */

const Storage = {
  STORAGE_KEY: 'autofill_rules',
  SYNC_KEY: 'autofill_rules_sync',
  PROFILES_KEY: 'autofill_profiles',

  /**
   * Henter alle profiler
   */
  async getProfiles() {
    try {
      const result = await chrome.storage.local.get(this.PROFILES_KEY);
      let profiles = result[this.PROFILES_KEY] || [];
      
      // Migration: Create default profile if none exists
      if (profiles.length === 0) {
          profiles = [{
              id: 'default',
              name: 'Default',
              enabled: true,
              created: Date.now()
          }];
          await this.saveProfiles(profiles);
      }
      return profiles;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
  },

  /**
   * Lagre profiler
   */
  async saveProfiles(profiles) {
      await chrome.storage.local.set({ [this.PROFILES_KEY]: profiles });
  },

  async addProfile(name) {
      const profiles = await this.getProfiles();
      const newProfile = {
          id: this.generateId(),
          name: name,
          enabled: true,
          created: Date.now()
      };
      profiles.push(newProfile);
      await this.saveProfiles(profiles);
      return newProfile;
  },

  async deleteProfile(id) {
      const profiles = await this.getProfiles();
      // Kan ikke slette siste profil
      if (profiles.length <= 1) return false;
      
      const filtered = profiles.filter(p => p.id !== id);
      await this.saveProfiles(filtered);
      
      // Slett tilhørende regler? Eller flytt til default?
      // For nå: Slett regler
      const rules = await this.getRules();
      const rulesToKeep = rules.filter(r => r.profileId !== id);
      await this.saveRules(rulesToKeep);
      
      return true;
  },

  async toggleProfile(id, enabled) {
      const profiles = await this.getProfiles();
      const p = profiles.find(p => p.id === id);
      if (p) {
          p.enabled = enabled;
          await this.saveProfiles(profiles);
      }
  },

  /**
   * Henter alle regler fra storage
   * @returns {Promise<Array>} Array av regler
   */
  async getRules() {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const rules = result[this.STORAGE_KEY] || [];
      return this.normalizeRules(rules);
    } catch (error) {
      console.error('Error fetching rules:', error);
      return [];
    }
  },

  /**
   * Push alle regler til chrome.storage.sync (manuell sync)
   */
  async pushToSync() {
    const rules = await this.getRules();
    await chrome.storage.sync.set({ [this.SYNC_KEY]: rules });
    return { success: true, count: rules.length };
  },

  /**
   * Pull regler fra chrome.storage.sync og erstatt lokale
   */
  async pullFromSync() {
    const result = await chrome.storage.sync.get(this.SYNC_KEY);
    const rules = result[this.SYNC_KEY] || [];
    await this.saveRules(rules);
    return { success: true, count: rules.length };
  },

  /**
   * Lagrer alle regler til storage
   * @param {Array} rules - Array av regler
   * @returns {Promise<boolean>} Om lagring var vellykket
   */
  async saveRules(rules) {
    try {
      await chrome.storage.local.set({ [this.STORAGE_KEY]: rules });
      return true;
    } catch (error) {
      console.error('Error saving rules:', error);
      return false;
    }
  },

  /**
   * Legger til en ny regel
   * @param {Object} rule - Regelobjekt
   * @returns {Promise<Object>} Den nye regelen med ID
   */
  async addRule(rule) {
    const rules = await this.getRules();
    const newRule = {
      id: this.generateId(),
      created: Date.now(),
      lastUsed: null,
      enabled: true,
      elementType: 'text',
      sortOrder: this.getNextSortOrder(rules),
      priority: 0,
      conditionType: 'none',
      conditionValue: '',
      ...rule
    };
    rules.push(newRule);
    await this.saveRules(rules);
    return newRule;
  },

  /**
   * Oppdaterer en eksisterende regel
   * @param {string} ruleId - ID til regelen som skal oppdateres
   * @param {Object} updates - Oppdateringer
   * @returns {Promise<Object|null>} Oppdatert regel eller null
   */
  async updateRule(ruleId, updates) {
    const rules = await this.getRules();
    const index = rules.findIndex(r => r.id === ruleId);

    if (index === -1) {
      return null;
    }

    rules[index] = { ...rules[index], ...updates };
    await this.saveRules(rules);
    return rules[index];
  },

  /**
   * Oppdater rekkefolge (drag-and-drop)
   * @param {Array<{id: string, sortOrder: number}>} orderUpdates
   * @returns {Promise<Array>} Oppdaterte regler
   */
  async reorderRules(orderUpdates) {
    const rules = await this.getRules();
    const orderMap = new Map(orderUpdates.map(o => [o.id, o.sortOrder]));

    const updated = rules.map(rule => {
      if (orderMap.has(rule.id)) {
        return { ...rule, sortOrder: orderMap.get(rule.id) };
      }
      return rule;
    });

    await this.saveRules(updated);
    return updated;
  },

  /**
   * Sletter en regel
   * @param {string} ruleId - ID til regelen som skal slettes
   * @returns {Promise<boolean>} Om sletting var vellykket
   */
  async deleteRule(ruleId) {
    const rules = await this.getRules();
    const filtered = rules.filter(r => r.id !== ruleId);

    if (filtered.length === rules.length) {
      return false; // Ingen regel ble slettet
    }

    await this.saveRules(filtered);
    return true;
  },

  /**
   * Oppdaterer lastUsed timestamp for en regel
   * @param {string} ruleId - ID til regelen
   * @returns {Promise<void>}
   */
  async markRuleUsed(ruleId) {
    await this.updateRule(ruleId, { lastUsed: Date.now() });
  },

  /**
   * Henter regler som matcher en gitt side
   * @param {string} url - URL til siden
   * @param {string|null} profileId - Optional profile ID to filter by
   * @returns {Promise<Array>} Matchende regler
   */
  async getRulesForSite(url, profileId = null) {
    const rules = await this.getRules();
    const profiles = await this.getProfiles();
    const enabledProfileIds = new Set(profiles.filter(p => p.enabled).map(p => p.id));
    
    const hostname = new URL(url).hostname;
    const domain = this.extractDomain(hostname);

    const matched = rules.filter(rule => {
      if (!rule.enabled) return false;
      const ruleProfile = rule.profileId || 'default';
      
      // Check profile status
      if (profileId) {
          // When a specific profile is requested, match that profile (treat missing as default)
          if (ruleProfile !== profileId) return false;
      } else {
          // Standard autofill: only use rules from enabled profiles
          if (!enabledProfileIds.has(ruleProfile)) return false;
      }

      return this.matchSite(url, hostname, domain, rule);
    });

    return matched.sort((a, b) => {
      const specA = this.computeSpecificityScore(a);
      const specB = this.computeSpecificityScore(b);
      if (specA !== specB) return specB - specA;
      const priA = typeof a.priority === 'number' ? a.priority : 0;
      const priB = typeof b.priority === 'number' ? b.priority : 0;
      if (priA !== priB) return priB - priA;
      const sortA = typeof a.sortOrder === 'number' ? a.sortOrder : a.created || 0;
      const sortB = typeof b.sortOrder === 'number' ? b.sortOrder : b.created || 0;
      return sortA - sortB;
    });
  },

  /**
   * Matcher en URL mot en regel
   * @param {string} url - Full URL
   * @param {string} hostname - Hostname
   * @param {string} domain - Domene
   * @param {Object} rule - Regel å matche mot
   * @returns {boolean} Om regelen matcher
   */
  matchSite(url, hostname, domain, rule) {
    const pattern = rule.sitePattern;
    const matchType = rule.siteMatchType || 'host';

    switch (matchType) {
      case 'host':
        return PatternMatcher.match(hostname, pattern, false);

      case 'domain':
        return PatternMatcher.match(domain, pattern, false);

      case 'url':
        return PatternMatcher.match(url, pattern, false);

      case 'regex':
        return PatternMatcher.match(url, pattern, true);

      default:
        return false;
    }
  },

  computeSpecificityScore(rule) {
    const pattern = rule.sitePattern || '';
    const matchType = rule.siteMatchType || 'host';
    const matchWeight = {
      url: 4,
      host: 3,
      domain: 2,
      regex: 1
    };
    const wildcardCount = (pattern.match(/[\*\?]/g) || []).length;
    const base = matchWeight[matchType] || 0;
    return base * 1000 + (pattern.length - wildcardCount * 10);
  },

  /**
   * Trekker ut domene fra hostname
   * @param {string} hostname - Hostname (f.eks. "sub.example.com")
   * @returns {string} Domene (f.eks. "example.com")
   */
  extractDomain(hostname) {
    const parts = hostname.split('.');
    if (parts.length <= 2) {
      return hostname;
    }
    return parts.slice(-2).join('.');
  },

  /**
   * Genererer en unik ID
   * @returns {string} Unik ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Hent neste sorteringsnummer
   */
  getNextSortOrder(rules) {
    const maxOrder = rules.reduce((max, rule) => {
      return Math.max(max, typeof rule.sortOrder === 'number' ? rule.sortOrder : -Infinity);
    }, -Infinity);

    return maxOrder === -Infinity ? 0 : maxOrder + 1;
  },

  /**
   * Sikre at regler har alle nye felter og sortOrder
   */
  normalizeRules(rules) {
    let nextOrder = this.getNextSortOrder(rules);

    const normalized = rules.map(rule => {
      const merged = {
        elementType: 'text',
        priority: 0,
        conditionType: 'none',
        conditionValue: '',
        profileId: 'default', // Default profile ID
        ...rule
      };

      if (!merged.created) {
        merged.created = Date.now();
      }

      if (merged.sortOrder === undefined || merged.sortOrder === null || Number.isNaN(merged.sortOrder)) {
        merged.sortOrder = nextOrder++;
      }

      return merged;
    });

    // Sorter på sortOrder som default rekkefolge
    normalized.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return normalized;
  },

  /**
   * Eksporterer alle regler til CSV-format
   * @returns {Promise<string>} CSV-streng
   */
  async exportToCSV() {
    const rules = await this.getRules();
    const headers = 'id;sitePattern;siteMatchType;elementType;fieldType;fieldPattern;fieldUseRegex;value;enabled;created;lastUsed;sortOrder;priority;conditionType;conditionValue';
    const rows = rules.map(rule => {
      return [
        rule.id,
        rule.sitePattern,
        rule.siteMatchType,
        rule.elementType || 'text',
        rule.fieldType,
        rule.fieldPattern,
        rule.fieldUseRegex,
        this.escapeCSV(rule.value),
        rule.enabled,
        rule.created,
        rule.lastUsed || '',
        rule.sortOrder ?? '',
        rule.priority ?? 0,
        rule.conditionType || 'none',
        this.escapeCSV(rule.conditionValue || '')
      ].join(';');
    });

    return [headers, ...rows].join('\n');
  },

  // CSV validation constants
  CSV_MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB max
  CSV_MAX_RULES: 10000, // Max rules per import
  VALID_MATCH_TYPES: ['host', 'domain', 'url', 'regex'],
  VALID_FIELD_TYPES: ['name', 'id', 'data-name', 'data-id', 'placeholder', 'selector'],
  VALID_ELEMENT_TYPES: ['text', 'select', 'checkbox', 'radio', 'textarea', 'date', 'email', 'password', 'number', 'tel', 'url', 'macro'],
  VALID_CONDITION_TYPES: ['none', 'urlContains', 'urlRegex', 'selectorExists'],

  /**
   * Importerer regler fra CSV-format med utvidet validering
   * @param {string} csvContent - CSV-innhold
   * @param {boolean} merge - Om regler skal merges eller overskrive
   * @returns {Promise<Object>} Resultat med success, antall, og eventuelle valideringsfeil
   */
  async importFromCSV(csvContent, merge = true) {
    const validationErrors = [];
    const skippedRows = [];

    try {
      // Pre-validation: Sjekk filstørrelse
      const contentSize = new Blob([csvContent]).size;
      if (contentSize > this.CSV_MAX_SIZE_BYTES) {
        throw new Error(`CSV-fil for stor: ${Math.round(contentSize / 1024 / 1024)}MB (maks ${this.CSV_MAX_SIZE_BYTES / 1024 / 1024}MB)`);
      }

      if (!csvContent || typeof csvContent !== 'string' || csvContent.trim().length === 0) {
        throw new Error('Tom eller ugyldig CSV-innhold');
      }

      const lines = csvContent.trim().split('\n');

      if (lines.length < 2) {
        throw new Error('CSV må inneholde header og minst én rad med data');
      }

      if (lines.length - 1 > this.CSV_MAX_RULES) {
        throw new Error(`For mange regler: ${lines.length - 1} (maks ${this.CSV_MAX_RULES})`);
      }

      const headers = lines[0].split(';');

      if (!this.validateCSVHeaders(headers)) {
        throw new Error('Ugyldig CSV-format: Manglende påkrevde kolonner');
      }

      const headerIndex = {};
      headers.forEach((h, i) => { headerIndex[h] = i; });

      const newRules = [];
      for (let i = 1; i < lines.length; i++) {
        const lineNum = i + 1;
        const values = this.parseCSVLine(lines[i]);

        // Skip empty lines
        if (values.length === 1 && values[0].trim() === '') {
          continue;
        }

        if (values.length !== headers.length) {
          skippedRows.push({ line: lineNum, reason: `Feil antall kolonner (${values.length} vs ${headers.length})` });
          continue;
        }

        const get = (name) => headerIndex[name] !== undefined ? values[headerIndex[name]] : undefined;

        // Valider påkrevde felt
        const sitePattern = get('sitePattern');
        const fieldPattern = get('fieldPattern');

        if (!sitePattern || sitePattern.trim() === '') {
          skippedRows.push({ line: lineNum, reason: 'Mangler sitePattern' });
          continue;
        }

        if (!fieldPattern || fieldPattern.trim() === '') {
          skippedRows.push({ line: lineNum, reason: 'Mangler fieldPattern' });
          continue;
        }

        // Valider enum-felt
        const siteMatchType = get('siteMatchType');
        if (siteMatchType && !this.VALID_MATCH_TYPES.includes(siteMatchType)) {
          validationErrors.push({ line: lineNum, field: 'siteMatchType', value: siteMatchType, reason: 'Ugyldig verdi' });
        }

        const fieldType = get('fieldType');
        if (fieldType && !this.VALID_FIELD_TYPES.includes(fieldType)) {
          validationErrors.push({ line: lineNum, field: 'fieldType', value: fieldType, reason: 'Ugyldig verdi' });
        }

        const elementType = get('elementType') || 'text';
        if (!this.VALID_ELEMENT_TYPES.includes(elementType)) {
          validationErrors.push({ line: lineNum, field: 'elementType', value: elementType, reason: 'Ugyldig verdi' });
        }

        const conditionType = get('conditionType') || 'none';
        if (!this.VALID_CONDITION_TYPES.includes(conditionType)) {
          validationErrors.push({ line: lineNum, field: 'conditionType', value: conditionType, reason: 'Ugyldig verdi' });
        }

        // Valider regex hvis brukt
        if (get('fieldUseRegex') === 'true') {
          try {
            new RegExp(fieldPattern);
          } catch (e) {
            validationErrors.push({ line: lineNum, field: 'fieldPattern', value: fieldPattern, reason: 'Ugyldig regex: ' + e.message });
          }
        }

        const lastRaw = get('lastUsed');
        const lastUsedVal = (lastRaw !== undefined && lastRaw !== null && `${lastRaw}`.trim() !== '')
          ? parseInt(lastRaw)
          : null;

        const rule = {
          id: get('id') || this.generateId(),
          sitePattern: sitePattern,
          siteMatchType: siteMatchType || 'host',
          elementType: elementType,
          fieldType: fieldType || 'name',
          fieldPattern: fieldPattern,
          fieldUseRegex: get('fieldUseRegex') === 'true',
          value: this.unescapeCSV(get('value') || ''),
          enabled: get('enabled') !== 'false', // Default true
          created: parseInt(get('created')) || Date.now(),
          lastUsed: Number.isFinite(lastUsedVal) ? lastUsedVal : null,
          sortOrder: get('sortOrder') !== undefined ? parseInt(get('sortOrder')) : null,
          priority: get('priority') !== undefined ? parseInt(get('priority')) : 0,
          conditionType: conditionType,
          conditionValue: this.unescapeCSV(get('conditionValue') || '')
        };

        newRules.push(rule);
      }

      if (newRules.length === 0) {
        throw new Error('Ingen gyldige regler funnet i CSV');
      }

      if (merge) {
        const existingRules = await this.getRules();
        const mergedRules = this.normalizeRules([...existingRules, ...newRules]);
        await this.saveRules(mergedRules);
      } else {
        await this.saveRules(this.normalizeRules(newRules));
      }

      return {
        success: true,
        imported: newRules.length,
        total: newRules.length,
        skipped: skippedRows.length,
        skippedRows: skippedRows.length > 0 ? skippedRows : undefined,
        warnings: validationErrors.length,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      };
    } catch (error) {
      console.error('Error importing CSV:', error);
      return {
        success: false,
        error: error.message,
        skipped: skippedRows.length,
        skippedRows: skippedRows.length > 0 ? skippedRows : undefined,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      };
    }
  },

  /**
   * Validerer CSV-headers
   * @param {Array} headers - Headers fra CSV
   * @returns {boolean} Om headers er gyldige
   */
  validateCSVHeaders(headers) {
    const required = ['id', 'sitePattern', 'siteMatchType', 'fieldType', 'fieldPattern', 'fieldUseRegex', 'value', 'enabled', 'created', 'lastUsed'];
    return required.every(h => headers.includes(h));
  },

  /**
   * Parser en CSV-linje med støtte for quoted values
   * @param {string} line - CSV-linje
   * @returns {Array} Array av verdier
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  },

  /**
   * Escaper spesialtegn for CSV
   * @param {string} value - Verdi å escape
   * @returns {string} Escaped verdi
   */
  escapeCSV(value) {
    if (value.includes(';') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  },

  /**
   * Unescaper CSV-verdi
   * @param {string} value - Escaped verdi
   * @returns {string} Unescape verdi
   */
  unescapeCSV(value) {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/""/g, '"');
    }
    return value;
  }
};

// Eksporter for bruk i andre moduler
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
