/**
 * Rule Optimizer for AutoFill Plugin
 * Analyserer regler og foreslår forenklinger
 */

const RuleOptimizer = {
  /**
   * Analyser alle regler og finn optimaliseringsmuligheter
   * @param {Array} rules - Array av regler
   * @returns {Array} Array av optimaliseringsforslag
   */
  analyzeRules(rules) {
    // 1. Filtrer bort regler brukeren har ignorert
    const activeRules = rules.filter(r => !r.ignoreOptimization);

    const suggestions = [];

    // Finn duplikater
    suggestions.push(...this.findDuplicates(activeRules));

    // Finn regler som kan kombineres (samme felt, forskjellige siter)
    suggestions.push(...this.findCombinableRules(activeRules));

    // Finn kryss-site duplikater (samme felt/verdi, ulike sites)
    suggestions.push(...this.findCrossSiteDuplicates(activeRules));

    // Finn regler som kan forenkles med wildcards
    suggestions.push(...this.findSimplificationOpportunities(activeRules));

    // Finn overlappende regler
    suggestions.push(...this.findOverlappingRules(activeRules));

    // Finn ubrukte regler
    suggestions.push(...this.findUnusedRules(activeRules));

    // Finn verdibaserte sammenslåinger (sammenslåing av ulike feltnavn med lik verdi)
    suggestions.push(...this.findValueBasedMerges(activeRules));

    // Sorter etter viktighet
    return this.sortSuggestions(suggestions);
  },

  /**
   * Finn regler som har samme verdi og site, men ulike feltnavn
   * F.eks: "name"="Ola" og "full_name"="Ola" -> Suggest "(name|full_name)"
   */
  findValueBasedMerges(rules) {
    const suggestions = [];
    const valueGroups = new Map();

    for (const rule of rules) {
      // Vi ser kun på tekst-felt foreløpig
      if (rule.elementType !== 'text' && rule.elementType !== 'textarea') continue;
      
      // Grupper på Site + Verdi + Felttype
      const key = `${rule.sitePattern}|${rule.value}|${rule.fieldType}`;
      if (!valueGroups.has(key)) valueGroups.set(key, []);
      valueGroups.get(key).push(rule);
    }

    for (const [key, group] of valueGroups) {
      if (group.length < 2) continue;

      const fieldPatterns = group.map(r => r.fieldPattern);
      const uniquePatterns = new Set(fieldPatterns);
      
      // Hvis vi har flere ulike feltnavn for samme verdi på samme site
      if (uniquePatterns.size > 1) {
        const patternsArr = Array.from(uniquePatterns);
        
        // Prøv å finne fellesnevner (substring)
        const commonSubstring = PatternMatcher.findCommonSubstrings(patternsArr)[0];
        let newPatternSuggestion = "";
        
        if (commonSubstring && commonSubstring.length > 3) {
            newPatternSuggestion = `*${commonSubstring}*`;
        } else {
            // Foreslå en regex "OR" (name|user_name)
            newPatternSuggestion = `(${patternsArr.join('|')})`;
        }

        suggestions.push({
          type: 'simplify',
          priority: 'medium',
          title: 'Felt kan slås sammen (samme verdi)',
          description: `Feltene ${patternsArr.join(', ')} har samme verdi ("${group[0].value}") på dette nettstedet.`,
          affectedRules: group.map(r => r.id),
          action: 'combine', 
          recommendation: `Slå sammen til én regel med mønster: ${newPatternSuggestion}`,
          newPattern: group[0].sitePattern, // Beholder site
          fieldPattern: newPatternSuggestion, // Nytt feltmønster
          fieldUseRegex: !newPatternSuggestion.includes('*'), // Bruk regex hvis vi ikke fant wildcard
          value: group[0].value
        });
      }
    }
    return suggestions;
  },

  /**
   * Finn felt som er like på tvers av ulike sites
   * @param {Array} rules
   * @returns {Array}
   */
  findCrossSiteDuplicates(rules) {
    const suggestions = [];
    const groups = new Map();

    for (const rule of rules) {
      const key = `${rule.fieldPattern}__${rule.value || ''}__${rule.fieldType || ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(rule);
    }

    for (const [_, group] of groups) {
      if (group.length < 2) continue;

      // Hopper over hvis alle er på samme sitePattern allerede
      const uniqueSites = new Set(group.map(r => r.sitePattern));
      if (uniqueSites.size <= 1) continue;

      const combinedPattern = this.findCommonSitePattern(Array.from(uniqueSites));
      suggestions.push({
        type: 'cross-site-duplicate',
        priority: 'medium',
        title: 'Like regler på flere nettsteder',
        description: `Felt "${group[0].fieldPattern}" med samme verdi finnes på ${uniqueSites.size} nettsteder`,
        affectedRules: group.map(r => r.id),
        action: 'combine',
        recommendation: combinedPattern
          ? `Kombiner til ett site-mønster: "${combinedPattern}"`
          : 'Vurder å slå sammen med et bredere domene-mønster',
        newPattern: combinedPattern || '*',
        fieldPattern: group[0].fieldPattern,
        value: group[0].value
      });
    }

    return suggestions;
  },

  /**
   * Finn duplikat-regler (eksakt like)
   * @param {Array} rules - Array av regler
   * @returns {Array} Forslag om duplikater
   */
  findDuplicates(rules) {
    const suggestions = [];
    const seen = new Map();

    for (const rule of rules) {
      const key = this.getRuleKey(rule);

      if (seen.has(key)) {
        suggestions.push({
          type: 'duplicate',
          priority: 'high',
          title: 'Duplikat regel funnet',
          description: `Regel "${rule.fieldPattern}" for ${rule.sitePattern} er identisk med en annen regel`,
          affectedRules: [seen.get(key), rule.id],
          action: 'delete',
          recommendation: 'Slett én av de dupliserte reglene'
        });
      } else {
        seen.set(key, rule.id);
      }
    }

    return suggestions;
  },

  /**
   * Finn regler som kan kombineres
   * @param {Array} rules - Array av regler
   * @returns {Array} Forslag om kombinering
   */
  findCombinableRules(rules) {
    const suggestions = [];
    const fieldGroups = this.groupByField(rules);

    for (const [fieldKey, groupRules] of fieldGroups) {
      if (groupRules.length < 2) continue;

      // Ekstraher siter
      const sites = groupRules.map(r => r.sitePattern);

      // Finn felles domene
      const commonPattern = this.findCommonSitePattern(sites);

      if (commonPattern && commonPattern !== sites[0]) {
        suggestions.push({
          type: 'combine',
          priority: 'medium',
          title: 'Regler kan kombineres',
          description: `${groupRules.length} regler for felt "${groupRules[0].fieldPattern}" kan kombineres til én regel`,
          affectedRules: groupRules.map(r => r.id),
          action: 'combine',
          recommendation: `Bruk mønster "${commonPattern}" i stedet for ${groupRules.length} separate regler`,
          newPattern: commonPattern,
          fieldPattern: groupRules[0].fieldPattern,
          value: groupRules[0].value
        });
      }
    }

    return suggestions;
  },

  /**
   * Finn muligheter for forenkling med wildcards
   * @param {Array} rules - Array av regler
   * @returns {Array} Forslag om forenkling
   */
  findSimplificationOpportunities(rules) {
    const suggestions = [];

    for (const rule of rules) {
      // Sjekk om site pattern kan forenkles
      if (rule.siteMatchType === 'host' && rule.sitePattern.startsWith('www.')) {
        const withoutWww = rule.sitePattern.substring(4);

        suggestions.push({
          type: 'simplify',
          priority: 'low',
          title: 'Site-mønster kan forenkles',
          description: `Regel for ${rule.sitePattern} kan bruke domene i stedet`,
          affectedRules: [rule.id],
          action: 'update',
          recommendation: `Endre fra host "${rule.sitePattern}" til domain "${withoutWww}"`,
          updates: {
            siteMatchType: 'domain',
            sitePattern: withoutWww
          }
        });
      }

      // Sjekk om felt-pattern kan bruke wildcard
      if (!PatternMatcher.hasWildcards(rule.fieldPattern) && !rule.fieldUseRegex) {
        const parts = rule.fieldPattern.split(/[_-]/);
        if (parts.length > 1) {
          suggestions.push({
            type: 'simplify',
            priority: 'low',
            title: 'Felt-mønster kan bruke wildcard',
            description: `Felt "${rule.fieldPattern}" kan forenkles med wildcard`,
            affectedRules: [rule.id],
            action: 'update',
            recommendation: `Bruk wildcard som "*${parts[parts.length - 1]}" for å matche flere varianter`,
            updates: {
              fieldPattern: `*${parts[parts.length - 1]}`
            }
          });
        }
      }
    }

    return suggestions;
  },

  /**
   * Finn overlappende regler
   * @param {Array} rules - Array av regler
   * @returns {Array} Forslag om overlapp
   */
  findOverlappingRules(rules) {
    const suggestions = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];

        if (this.rulesOverlap(rule1, rule2)) {
          suggestions.push({
            type: 'overlap',
            priority: 'medium',
            title: 'Overlappende regler',
            description: `Regel for ${rule1.fieldPattern} overlapper med annen regel`,
            affectedRules: [rule1.id, rule2.id],
            action: 'review',
            recommendation: 'Gjennomgå reglene for å sikre at begge er nødvendige'
          });
        }
      }
    }

    return suggestions;
  },

  /**
   * Finn ubrukte regler
   * @param {Array} rules - Array av regler
   * @returns {Array} Forslag om ubrukte regler
   */
  findUnusedRules(rules) {
    const suggestions = [];
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    for (const rule of rules) {
      // Hvis regelen aldri er brukt eller ikke brukt på 30 dager
      if (!rule.lastUsed || rule.lastUsed < thirtyDaysAgo) {
        const daysSinceCreated = Math.floor((Date.now() - rule.created) / (24 * 60 * 60 * 1000));

        if (daysSinceCreated > 7) { // Minst en uke gammel
          suggestions.push({
            type: 'unused',
            priority: 'low',
            title: 'Ubrukt regel',
            description: rule.lastUsed
              ? `Regel for ${rule.fieldPattern} ikke brukt på over 30 dager`
              : `Regel for ${rule.fieldPattern} har aldri blitt brukt`,
            affectedRules: [rule.id],
            action: 'delete',
            recommendation: 'Vurder å slette regelen hvis den ikke lenger er nødvendig'
          });
        }
      }
    }

    return suggestions;
  },

  /**
   * Generer en unik nøkkel for en regel
   * @param {Object} rule - Regel
   * @returns {string} Unik nøkkel
   */
  getRuleKey(rule) {
    return `${rule.sitePattern}|${rule.siteMatchType}|${rule.fieldType}|${rule.fieldPattern}|${rule.value}`;
  },

  /**
   * Grupper regler etter felt
   * @param {Array} rules - Array av regler
   * @returns {Map} Map av felt -> regler
   */
  groupByField(rules) {
    const groups = new Map();

    for (const rule of rules) {
      const key = `${rule.fieldType}:${rule.fieldPattern}:${rule.value}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(rule);
    }

    return groups;
  },

  /**
   * Finn felles site-mønster
   * @param {Array} sites - Array av site-mønstre
   * @returns {string|null} Felles mønster eller null
   */
  findCommonSitePattern(sites) {
    if (sites.length === 0) return null;
    if (sites.length === 1) return sites[0];

    // Ekstraher domener
    const domains = sites.map(site => {
      // Fjern www. hvis det finnes
      let domain = site.replace(/^www\./, '');

      // Ekstraher hoveddomene (siste to deler)
      const parts = domain.split('.');
      if (parts.length > 2) {
        return parts.slice(-2).join('.');
      }
      return domain;
    });

    // Sjekk om alle har samme domene
    const firstDomain = domains[0];
    if (domains.every(d => d === firstDomain)) {
      return firstDomain;
    }

    // Sjekk om de har felles suffix
    const commonSuffix = PatternMatcher.findCommonSuffix(sites);
    if (commonSuffix.length > 4) { // Minimum lengde
      return '*' + commonSuffix;
    }

    return null;
  },

  /**
   * Sjekk om to regler overlapper
   * @param {Object} rule1 - Første regel
   * @param {Object} rule2 - Andre regel
   * @returns {boolean} Om reglene overlapper
   */
  rulesOverlap(rule1, rule2) {
    // Samme felt-type og mønster matcher hverandre
    if (rule1.fieldType !== rule2.fieldType) return false;

    // Sjekk om felt-mønstre overlapper
    const field1MatchesField2 = PatternMatcher.match(
      rule1.fieldPattern,
      rule2.fieldPattern,
      rule2.fieldUseRegex
    );

    const field2MatchesField1 = PatternMatcher.match(
      rule2.fieldPattern,
      rule1.fieldPattern,
      rule1.fieldUseRegex
    );

    if (!field1MatchesField2 && !field2MatchesField1) return false;

    // Sjekk om site-mønstre overlapper
    // Dette er forenklet - en mer komplett sjekk ville være kompleks
    const siteOverlap =
      rule1.sitePattern === rule2.sitePattern ||
      rule1.sitePattern.includes('*') ||
      rule2.sitePattern.includes('*');

    return siteOverlap;
  },

  /**
   * Sorter forslag etter prioritet
   * @param {Array} suggestions - Array av forslag
   * @returns {Array} Sorterte forslag
   */
  sortSuggestions(suggestions) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return suggestions.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Sekundær sortering etter type
      const typeOrder = { duplicate: 0, combine: 1, overlap: 2, simplify: 3, unused: 4 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
  },

  /**
   * Generer rapport over regler
   * @param {Array} rules - Array av regler
   * @returns {Object} Rapport-objekt
   */
  generateReport(rules) {
    const suggestions = this.analyzeRules(rules);

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      disabledRules: rules.filter(r => !r.enabled).length,
      unusedRules: rules.filter(r => !r.lastUsed).length,
      regexRules: rules.filter(r => r.fieldUseRegex).length,
      wildcardRules: rules.filter(r => PatternMatcher.hasWildcards(r.fieldPattern)).length,
      suggestions: suggestions,
      criticalIssues: suggestions.filter(s => s.priority === 'high').length,
      optimizationOpportunities: suggestions.filter(s => s.priority === 'medium').length,
      minorImprovements: suggestions.filter(s => s.priority === 'low').length
    };
  },

  /**
   * Kombiner flere regler til én
   * @param {Array} rules - Regler som skal kombineres
   * @param {string} newPattern - Nytt site-mønster
   * @returns {Object} Ny kombinert regel
   */
  combineRules(rules, newPattern) {
    if (rules.length === 0) return null;

    const firstRule = rules[0];

    return {
      sitePattern: newPattern,
      siteMatchType: 'domain',
      fieldType: firstRule.fieldType,
      fieldPattern: firstRule.fieldPattern,
      fieldUseRegex: firstRule.fieldUseRegex,
      value: firstRule.value,
      enabled: true
    };
  }
};

// Eksporter for bruk i andre moduler
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RuleOptimizer;
}