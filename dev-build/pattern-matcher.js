/**
 * Pattern Matcher for AutoFill Plugin
 * Håndterer matching av mønstre med støtte for wildcards og regex
 */

const PatternMatcher = {
  /**
   * Matcher en streng mot et mønster
   * @param {string} text - Tekst å matche
   * @param {string} pattern - Mønster
   * @param {boolean} useRegex - Om mønsteret er regex
   * @returns {boolean} Om det er match
   */
  match(text, pattern, useRegex = false) {
    if (!text || !pattern) return false;

    if (useRegex) {
      return this.matchRegex(text, pattern);
    } else {
      return this.matchWildcard(text, pattern);
    }
  },

  /**
   * Matcher med regex
   * @param {string} text - Tekst å matche
   * @param {string} pattern - Regex-mønster
   * @returns {boolean} Om det er match
   */
  matchRegex(text, pattern) {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(text);
    } catch (error) {
      console.error('Invalid regex pattern:', pattern, error);
      return false;
    }
  },

  /**
   * Matcher med wildcards (* og ?)
   * @param {string} text - Tekst å matche
   * @param {string} pattern - Wildcard-mønster
   * @returns {boolean} Om det er match
   */
  matchWildcard(text, pattern) {
    // Eksakt match
    if (text === pattern) return true;

    // Konverter wildcard-mønster til regex
    const regexPattern = this.wildcardToRegex(pattern);

    try {
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(text);
    } catch (error) {
      console.error('Error converting wildcard to regex:', pattern, error);
      return false;
    }
  },

  /**
   * Konverterer wildcard-mønster til regex
   * @param {string} pattern - Wildcard-mønster
   * @returns {string} Regex-mønster
   */
  wildcardToRegex(pattern) {
    // Escape spesialtegn unntatt * og ?
    let regex = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

    // Konverter wildcards
    regex = regex.replace(/\*/g, '.*');  // * matcher null eller flere tegn
    regex = regex.replace(/\?/g, '.');   // ? matcher nøyaktig ett tegn

    return regex;
  },

  /**
   * Validerer et regex-mønster
   * @param {string} pattern - Regex-mønster
   * @returns {Object} { valid: boolean, error: string|null }
   */
  validateRegex(pattern) {
    try {
      new RegExp(pattern);
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },

  /**
   * Tester om et mønster inneholder wildcards
   * @param {string} pattern - Mønster
   * @returns {boolean} Om mønsteret inneholder wildcards
   */
  hasWildcards(pattern) {
    return pattern.includes('*') || pattern.includes('?');
  },

  /**
   * Normaliserer et mønster (fjerner unødvendige wildcards)
   * @param {string} pattern - Mønster
   * @returns {string} Normalisert mønster
   */
  normalizePattern(pattern) {
    // Fjern gjentatte wildcards
    let normalized = pattern.replace(/\*+/g, '*');

    // Fjern wildcard på starten hvis det ikke gir mening
    // (dette er valgfritt og kan tilpasses)

    return normalized;
  },

  /**
   * Foreslår mønstre basert på en liste av strenger
   * @param {Array<string>} strings - Liste av strenger
   * @returns {Array<Object>} Foreslåtte mønstre med score
   */
  suggestPatterns(strings) {
    if (strings.length === 0) return [];
    if (strings.length === 1) return [{ pattern: strings[0], matches: 1, coverage: 1 }];

    const suggestions = [];

    // Finn felles prefix
    const commonPrefix = this.findCommonPrefix(strings);
    if (commonPrefix.length > 0) {
      const pattern = commonPrefix + '*';
      const matches = strings.filter(s => s.startsWith(commonPrefix)).length;
      suggestions.push({
        pattern,
        matches,
        coverage: matches / strings.length,
        type: 'prefix'
      });
    }

    // Finn felles suffix
    const commonSuffix = this.findCommonSuffix(strings);
    if (commonSuffix.length > 0) {
      const pattern = '*' + commonSuffix;
      const matches = strings.filter(s => s.endsWith(commonSuffix)).length;
      suggestions.push({
        pattern,
        matches,
        coverage: matches / strings.length,
        type: 'suffix'
      });
    }

    // Finn felles deler i midten
    const commonSubstrings = this.findCommonSubstrings(strings);
    for (const substring of commonSubstrings) {
      if (substring.length >= 3) { // Minimum lengde for å være relevant
        const pattern = '*' + substring + '*';
        const matches = strings.filter(s => s.includes(substring)).length;
        suggestions.push({
          pattern,
          matches,
          coverage: matches / strings.length,
          type: 'substring'
        });
      }
    }

    // Sorter etter coverage (høyest først)
    suggestions.sort((a, b) => b.coverage - a.coverage);

    return suggestions;
  },

  /**
   * Finner felles prefix i en liste av strenger
   * @param {Array<string>} strings - Liste av strenger
   * @returns {string} Felles prefix
   */
  findCommonPrefix(strings) {
    if (strings.length === 0) return '';

    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
      while (strings[i].indexOf(prefix) !== 0) {
        prefix = prefix.substring(0, prefix.length - 1);
        if (prefix === '') return '';
      }
    }

    return prefix;
  },

  /**
   * Finner felles suffix i en liste av strenger
   * @param {Array<string>} strings - Liste av strenger
   * @returns {string} Felles suffix
   */
  findCommonSuffix(strings) {
    if (strings.length === 0) return '';

    const reversed = strings.map(s => s.split('').reverse().join(''));
    const reversedPrefix = this.findCommonPrefix(reversed);

    return reversedPrefix.split('').reverse().join('');
  },

  /**
   * Finner felles substrings i en liste av strenger
   * @param {Array<string>} strings - Liste av strenger
   * @returns {Array<string>} Liste av felles substrings
   */
  findCommonSubstrings(strings) {
    if (strings.length === 0) return [];

    const substrings = new Map();
    const minLength = 3;

    // Ekstraher alle substrings fra første string
    for (let i = 0; i < strings[0].length - minLength + 1; i++) {
      for (let j = i + minLength; j <= strings[0].length; j++) {
        const substring = strings[0].substring(i, j);
        substrings.set(substring, 0);
      }
    }

    // Tell hvor mange strenger hver substring finnes i
    for (const [substring] of substrings) {
      let count = 0;
      for (const str of strings) {
        if (str.includes(substring)) count++;
      }
      substrings.set(substring, count);
    }

    // Filtrer og sorter
    const common = Array.from(substrings.entries())
      .filter(([_, count]) => count >= Math.ceil(strings.length * 0.5)) // Minst 50% coverage
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .map(([substring]) => substring);

    return common.slice(0, 5); // Returner topp 5
  },

  /**
   * Matcher en URL mot et site-mønster
   * @param {string} url - Full URL å matche
   * @param {string} sitePattern - Site-mønster
   * @param {string} siteMatchType - Matchtype: 'host', 'domain', 'url', 'regex'
   * @returns {boolean} Om URL-en matcher mønsteret
   */
  matchSite(url, sitePattern, siteMatchType) {
    if (!url || !sitePattern) return false;

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const fullUrl = url;

      switch (siteMatchType) {
        case 'host':
          // Eksakt match på hostname
          return this.match(hostname, sitePattern, false);

        case 'domain':
          // Match på domene (inkluderer subdomener)
          const domain = sitePattern.replace(/^\*\./, '');
          return hostname === domain || hostname.endsWith('.' + domain);

        case 'url':
          // Match på full URL
          return this.match(fullUrl, sitePattern, false);

        case 'regex':
          // Regex match på full URL
          return this.matchRegex(fullUrl, sitePattern);

        default:
          // Default til wildcard match på hostname
          return this.match(hostname, sitePattern, false);
      }
    } catch (error) {
      console.error('Error matching site:', error);
      return false;
    }
  }
};

// Eksporter for bruk i andre moduler
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PatternMatcher;
}
