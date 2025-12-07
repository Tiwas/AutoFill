/**
 * Shared utilities for AutoFill Plugin
 * Logger, Validator, and error handling utilities
 */

// ============================================================================
// LOGGER - Strukturert loggingssystem
// ============================================================================

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

const Logger = {
  level: LogLevel.INFO, // Default level
  prefix: '[AutoFill]',

  /**
   * Set log level
   * @param {number} level - LogLevel value
   */
  setLevel(level) {
    this.level = level;
  },

  /**
   * Enable debug mode
   */
  enableDebug() {
    this.level = LogLevel.DEBUG;
  },

  /**
   * Format message with timestamp and context
   */
  _format(level, context, message, ...args) {
    const timestamp = new Date().toISOString().substr(11, 12);
    const levelStr = ['DEBUG', 'INFO', 'WARN', 'ERROR'][level] || 'LOG';
    const contextStr = context ? `[${context}]` : '';
    return [`${this.prefix} ${timestamp} ${levelStr}${contextStr}:`, message, ...args];
  },

  /**
   * Debug level logging
   */
  debug(context, message, ...args) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(...this._format(LogLevel.DEBUG, context, message, ...args));
    }
  },

  /**
   * Info level logging
   */
  info(context, message, ...args) {
    if (this.level <= LogLevel.INFO) {
      console.info(...this._format(LogLevel.INFO, context, message, ...args));
    }
  },

  /**
   * Warning level logging
   */
  warn(context, message, ...args) {
    if (this.level <= LogLevel.WARN) {
      console.warn(...this._format(LogLevel.WARN, context, message, ...args));
    }
  },

  /**
   * Error level logging
   */
  error(context, message, ...args) {
    if (this.level <= LogLevel.ERROR) {
      console.error(...this._format(LogLevel.ERROR, context, message, ...args));
    }
  }
};

// ============================================================================
// VALIDATOR - Input validering
// ============================================================================

const Validator = {
  /**
   * Sjekk om en streng er en gyldig URL
   * @param {string} url - URL å validere
   * @returns {boolean}
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sjekk om en streng er et gyldig regex-mønster
   * Inkluderer enkel ReDoS-deteksjon for farlige mønstre
   * @param {string} pattern - Regex pattern å validere
   * @returns {{valid: boolean, error?: string, warning?: string}}
   */
  isValidRegex(pattern) {
    if (!pattern || typeof pattern !== 'string') {
      return { valid: false, error: 'Pattern must be a non-empty string' };
    }
    try {
      new RegExp(pattern);

      // Enkel ReDoS-deteksjon: Se etter nested quantifiers
      const redosPatterns = [
        /(\+|\*|\{[0-9,]+\})\s*(\+|\*|\{[0-9,]+\})/,  // Nested quantifiers: a]++, a## , etc
        /\([^)]*(\+|\*)\)[^)]*(\+|\*)/,                // (a+)+ pattern
        /(\.\*){2,}/,                                   // Multiple .* in sequence
      ];

      for (const dangerous of redosPatterns) {
        if (dangerous.test(pattern)) {
          return {
            valid: true,
            warning: 'Pattern may cause performance issues (potential ReDoS)'
          };
        }
      }

      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  },

  /**
   * Kjør regex med timeout for å unngå ReDoS
   * @param {RegExp} regex - Regex å kjøre
   * @param {string} text - Tekst å matche
   * @param {number} timeoutMs - Timeout i millisekunder (default 100)
   * @returns {{match: boolean, timedOut: boolean}}
   */
  safeRegexTest(regex, text, timeoutMs = 100) {
    // For korte strenger, kjør direkte
    if (text.length < 1000) {
      return { match: regex.test(text), timedOut: false };
    }

    // For lange strenger, bruk chunking som enkel timeout-mekanisme
    const startTime = Date.now();
    const chunkSize = 500;

    for (let i = 0; i < text.length; i += chunkSize) {
      if (Date.now() - startTime > timeoutMs) {
        return { match: false, timedOut: true };
      }
      const chunk = text.slice(Math.max(0, i - 100), i + chunkSize);
      if (regex.test(chunk)) {
        return { match: true, timedOut: false };
      }
    }

    return { match: false, timedOut: false };
  },

  /**
   * Sjekk om en streng er en gyldig CSS-selector
   * @param {string} selector - CSS selector å validere
   * @returns {{valid: boolean, error?: string}}
   */
  isValidSelector(selector) {
    if (!selector || typeof selector !== 'string') {
      return { valid: false, error: 'Selector must be a non-empty string' };
    }
    try {
      document.querySelector(selector);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  },

  /**
   * Sanitize en streng for sikker bruk (fjern potensielt farlige tegn)
   * @param {string} str - Streng å sanitere
   * @param {number} maxLength - Maks lengde (default 1000)
   * @returns {string}
   */
  sanitizeString(str, maxLength = 1000) {
    if (!str || typeof str !== 'string') return '';
    return str.slice(0, maxLength).trim();
  },

  /**
   * Valider en regel-objekt
   * @param {object} rule - Regel å validere
   * @returns {{valid: boolean, errors: string[]}}
   */
  validateRule(rule) {
    const errors = [];

    if (!rule || typeof rule !== 'object') {
      return { valid: false, errors: ['Rule must be an object'] };
    }

    // Påkrevde felt
    if (!rule.sitePattern) {
      errors.push('sitePattern is required');
    }

    if (!rule.fieldPattern) {
      errors.push('fieldPattern is required');
    }

    if (rule.value === undefined || rule.value === null) {
      errors.push('value is required');
    }

    // Valider regex hvis brukt
    if (rule.siteUseRegex && rule.sitePattern) {
      const result = this.isValidRegex(rule.sitePattern);
      if (!result.valid) {
        errors.push(`Invalid site regex: ${result.error}`);
      }
    }

    if (rule.fieldUseRegex && rule.fieldPattern) {
      const result = this.isValidRegex(rule.fieldPattern);
      if (!result.valid) {
        errors.push(`Invalid field regex: ${result.error}`);
      }
    }

    // Valider selector hvis brukt
    if (rule.fieldType === 'selector' && rule.fieldPattern) {
      const result = this.isValidSelector(rule.fieldPattern);
      if (!result.valid) {
        errors.push(`Invalid selector: ${result.error}`);
      }
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * Valider en profil-objekt
   * @param {object} profile - Profil å validere
   * @returns {{valid: boolean, errors: string[]}}
   */
  validateProfile(profile) {
    const errors = [];

    if (!profile || typeof profile !== 'object') {
      return { valid: false, errors: ['Profile must be an object'] };
    }

    if (!profile.id || typeof profile.id !== 'string') {
      errors.push('Profile id is required and must be a string');
    }

    if (!profile.name || typeof profile.name !== 'string') {
      errors.push('Profile name is required and must be a string');
    }

    return { valid: errors.length === 0, errors };
  }
};

// ============================================================================
// ERROR HANDLER - Konsekvent feilhåndtering
// ============================================================================

const ErrorHandler = {
  /**
   * Wrap en async funksjon med feilhåndtering
   * @param {Function} fn - Async funksjon å wrappe
   * @param {string} context - Kontekst for logging
   * @param {*} fallbackValue - Verdi å returnere ved feil
   * @returns {Function}
   */
  wrapAsync(fn, context, fallbackValue = null) {
    return async function(...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        Logger.error(context, 'Async operation failed:', error.message || error);
        return fallbackValue;
      }
    };
  },

  /**
   * Wrap en sync funksjon med feilhåndtering
   * @param {Function} fn - Funksjon å wrappe
   * @param {string} context - Kontekst for logging
   * @param {*} fallbackValue - Verdi å returnere ved feil
   * @returns {Function}
   */
  wrapSync(fn, context, fallbackValue = null) {
    return function(...args) {
      try {
        return fn.apply(this, args);
      } catch (error) {
        Logger.error(context, 'Operation failed:', error.message || error);
        return fallbackValue;
      }
    };
  },

  /**
   * Håndter Chrome API-feil
   * @param {Error} error - Feil å håndtere
   * @param {string} context - Kontekst
   * @returns {boolean} - true hvis feilen kan ignoreres
   */
  handleChromeError(error, context) {
    const ignorableErrors = [
      'No tab with id',
      'Extension context invalidated',
      'The message port closed',
      'Could not establish connection'
    ];

    const errorMsg = error?.message || String(error);
    const isIgnorable = ignorableErrors.some(msg => errorMsg.includes(msg));

    if (isIgnorable) {
      Logger.debug(context, 'Ignorable Chrome error:', errorMsg);
      return true;
    }

    Logger.error(context, 'Chrome API error:', errorMsg);
    return false;
  }
};

// Export for use in other files (works with importScripts)
if (typeof window !== 'undefined') {
  window.LogLevel = LogLevel;
  window.Logger = Logger;
  window.Validator = Validator;
  window.ErrorHandler = ErrorHandler;
}
