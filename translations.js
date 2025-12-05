const TRANSLATIONS = {
  en: {
    buttons: {
      openFullViewBtn: 'Open full view',
      exportBtn: 'Export',
      importBtn: 'Import',
      validateBtn: 'Validate',
      exportLog: 'Export log',
      testMatchBtn: 'Test match',
      aiAssistBtn: 'AI assist',
      optimizeBtn: 'Optimize',
      variablesBtn: 'Variables',
      selectModeBtn: 'Select multiple',
      addRuleBtn: '+ New rule',
      bulkEnable: 'Enable',
      bulkDisable: 'Disable',
      bulkDelete: 'Delete',
      bulkMove: 'Move to...',
      bulkCancel: 'Cancel',
      pushSyncBtn: 'Push',
      pullSyncBtn: 'Pull',
      copyAiPrompt: 'Copy',
      regenerateAiPrompt: 'Refresh',
      save: 'Save',
      cancel: 'Cancel',
      exportLog: 'Export log'
    },
    placeholders: {
      searchInput: 'Search rules...',
      availableSearch: 'Search fields...',
      sitePattern: 'example.com or *.example.com',
      fieldPattern: 'username or user*',
      value: 'Value to fill',
      comment: 'Optional comment for this rule'
    },
    statLabels: ['Total:', 'Active:', 'This page:'],
    available: { title: 'Available fields', subtitle: 'Based on the fields on the active tab', empty: 'No fields found. Open a page with a form to see suggestions.' },
    rulesHeader: 'Rules',
    appTitle: 'AutoFill',
    contextMenu: {
      addField: 'Add this field to AutoFill',
      addAll: 'Add all filled fields',
      fillAs: 'Fill as...',
      setActive: 'Set active profile'
    },
    headings: {
      optimizer: 'Optimization suggestions',
      llmSection: 'LLM-assisted optimization',
      llmSectionDesc: 'Use an LLM (ChatGPT, Claude, etc.) to combine and optimize your rules.',
      llmPromptLabel: 'LLM Prompt (copy to ChatGPT/Claude):',
      llmExportLabel: 'Exported rules (semicolon-separated):',
      llmImportLabel: 'Paste optimized rules from LLM:',
      blacklistTitle: 'Blacklist / Whitelist',
      settingsTitle: 'Settings & Variables',
      variablesUsage: 'Variables you can use in the value field:'
    },
    copy: {
      regexHelpTitle: 'Regex help',
      regexHelp: `Regular expressions (regex) allow powerful pattern matching:

Examples:
• ^user - matches fields starting with "user"
• name$ - matches fields ending with "name"
• (first|last)_name - matches "first_name" or "last_name"
• user.* - matches "user" followed by anything
• \\d{3} - matches exactly 3 digits

Common patterns:
• . = any character
• * = zero or more of previous
• + = one or more of previous
• ? = zero or one of previous
• [abc] = any of a, b, or c
• [0-9] = any digit
• \\w = word character (letter, digit, underscore)
• \\d = digit
• ^ = start of string
• $ = end of string

Use wildcards if you don't need regex power:
• * = matches anything
• ? = matches single character`
    },
    pageRules: {
      header: 'Rules for this page',
      forceFill: 'Force fill now',
      forceFillTitle: 'Fill matching fields even if they already have values',
      empty: 'No matching rules for this page',
      hint: 'Open full view to add or edit rules.',
      apply: 'Apply matching rules',
      partialHeader: 'Partial match (domain matches, but no fields found)'
    },
    ruleLabels: {
      element: 'Element',
      field: 'Field',
      value: 'Value',
      priority: 'Priority',
      condition: 'Condition',
      site: 'Site',
      lastUsed: 'Last used',
      profile: 'Profile',
      enabled: 'Rule active'
    },
    ruleActions: {
      edit: 'Edit',
      delete: 'Delete'
    },
    rulesPage: {
      title: 'AutoFill Rules',
      subtitle: 'Manage, group, and optimize all rules.',
      eyebrow: 'Full view',
      actions: {
        refresh: 'Refresh',
        exportSelected: 'Export selected',
        import: 'Import',
        restore: 'Restore backup',
        backup: 'Backup',
        mergeFiltered: 'Merge filtered',
        openPopup: 'Open popup'
      },
      search: {
        regex: 'Regex',
        fields: 'Match fields',
        values: 'Match values',
        modeLabel: 'Match mode:',
        modes: {
          strict: 'Strict (^pattern$)',
          loose: 'Loose (.*pattern.*)'
        }
      },
      controls: {
        selectAll: 'Select all',
        searchPlaceholder: 'Search rules...',
        groupBySite: 'Group per site',
        enabledOnly: 'Only active',
        regexOnly: 'Only regex',
        sortLabel: 'Sort:',
        activeProfile: 'Active profile:'
      },
      summary: {
        total: 'Total',
        active: 'Active',
        regex: 'Regex',
        selected: 'Selected'
      },
      settingsTitle: 'Settings & Variables',
      empty: {
        loading: 'Loading rules...',
        none: 'No rules found'
      },
      blacklist: {
        title: 'Blacklist / Whitelist',
        subtitle: 'Sites to ignore (Blacklist).',
        label: 'Blacklist (one pattern per line):',
        placeholder: '*.bank.no',
        save: 'Save blacklist'
      },
      notifications: {
        label: 'Show on-screen notification when filling'
      },
      variables: {
        heading: 'Variables you can use in the value field:'
      }
    },
    emptyRules: 'No rules found',
    emptyHint: 'Right-click a field on a web page to add a rule',
    modalTitleNew: 'New rule',
    modalTitleEdit: 'Edit rule',
    modalLabels: {
      sitePattern: 'Site pattern',
      siteMatchType: 'Matching type',
      elementType: 'Element type',
      fieldType: 'Identifier type',
      fieldPattern: 'Field pattern',
      value: 'Value',
      comment: 'Comment',
      conditionType: 'Condition',
      priority: 'Priority'
    },
    modalHints: {
      site: 'Use * for wildcard, ? for single character',
      elementType: 'HTML element type',
      fieldType: 'How the field is identified',
      value: 'For checkbox/radio: "true" or "false". For select: text or value.',
      regex: 'Use JavaScript regex (without /). Example: ^user.*'
    },
    settings: {
      language: { label: 'Language', desc: 'Select UI language' },
      autofillOn: { label: 'AutoFill Enabled', desc: 'Toggle autofill globally' },
      debug: { label: 'Debug mode', desc: 'Detailed logging and visual feedback' },
      logToFile: { label: 'Local debug log', desc: 'Store debug log locally; export as file when needed' },
      delay: { label: 'Autofill delay (ms)', desc: 'Delay filling on slow pages' },
      mode: { label: 'Autofill mode', desc: 'Auto on load or only after interaction' },
      whitelist: { label: 'Whitelist', desc: 'One pattern per line. Blank = allow all.' },
      blacklist: { label: 'Blacklist', desc: 'Overrides whitelist. One pattern per line.' },
      fieldBlacklist: { label: 'Ignored Fields (ID)', desc: 'Prevent autofill for these IDs. Wildcard (default) or "regex:...".' },
      sync: { label: 'Cloud Sync', desc: 'Push/pull rules via chrome.storage.sync' },
      scanToast: { label: 'Scan notification', desc: 'Show toast with scan status in the top-left corner' }
    },
    settingsPanel: {
      title: 'Settings',
      showAdvanced: 'More settings',
      hideAdvanced: 'Hide advanced'
    },
    cloud: {
      title: 'Local backup',
      desc: 'Save CSV to a chosen folder (use OneDrive/Drive folder if you like).',
      provider: 'Provider',
      providers: { google: 'Google Drive', onedrive: 'OneDrive' },
      backup: 'Backup (save as)',
      restore: 'Restore (choose file)',
      refresh: 'Refresh',
      clientId: 'Client ID',
      tenant: 'Tenant (optional)',
      saveConfig: 'Save cloud setup',
      clientIdHint: 'Google: https://console.cloud.google.com/apis/credentials (OAuth client ID). OneDrive: https://portal.azure.com → Entra App Registration → Application (client) ID.',
      tenantHint: 'OneDrive: Tenant ID from Entra (use "common" if empty).',
      login: 'Log in',
      loginSuccess: 'Login to {provider} OK. You can now run backup/restore.',
      loginError: 'Login failed: {error}',
      missingClientId: 'Add Client ID for {provider} first.',
      useDefaultDir: 'Save to Downloads/AutoFill (skip dialog if browser allows)',
      useDefaultConfirm: 'Save directly to Downloads/AutoFill? OK = Save there, Cancel = Choose location',
      backupSuccess: 'Backup saved.',
      backupError: 'Backup failed: {error}',
      downloadError: 'Could not read file: {error}',
      restoreConfirm: 'Merge with existing rules? OK = Merge, Cancel = Replace.',
      restoreSuccess: 'Imported {count} rules.',
      noBackups: 'No list. Choose a file to restore.',
      selectFile: 'Choose a backup to restore',
      noLoginNeeded: 'No login required for local backup.',
      listError: 'Could not fetch backup list: {error}'
    },
    ai: {
      title: 'AI field detection',
      copy: 'Copy',
      refresh: 'Refresh',
      intro: 'Copy the prompt below and use in any LLM to get autofill rules.',
      wildcard: 'Wildcards: * = any characters, ? = one character.',
      regex: 'Enable regex for complex matches (examples: ^user.* , email|e-mail).',
      promptText: [
        'You are an expert at generating autofill rules for our browser extension.',
        'Return CSV with this header:',
        'id;sitePattern;siteMatchType;elementType;fieldType;fieldPattern;fieldUseRegex;value;enabled;created;lastUsed',
        'One rule per line, semicolon-separated. Set enabled=true, use siteMatchType=host if unsure.'
      ],
      promptLabel: 'LLM prompt',
      pasteCsvLabel: 'Paste LLM result (CSV)',
      csvPlaceholder: 'Paste semicolon-separated CSV from the LLM here...',
      importBtn: 'Import',
      importMissing: 'Paste the CSV result from your LLM first.',
      existingRules: 'Existing rules (context):',
      detectedFields: 'Detected fields (current page):',
      none: '(none detected)'
    },
    merge: {
      noTerm: 'Use the search box to set a filter before merging.',
      noMatches: 'No rules match the current filter.',
      success: 'Merged rules for: {types}',
      error: 'Could not merge rules: '
    },
    conflict: 'Conflict',
    conflictHint: 'Multiple rules match this field; highest priority wins',
    conflictWinner: 'winner',
    toast: {
        saved: 'Settings saved',
        error: 'Error saving settings'
    },
    variables: {
        title: 'Variables',
        desc: 'Define variables to use in field values as {variableName}.',
        placeholderKey: 'Name (e.g., firstName)',
        placeholderValue: 'Value (e.g., John)',
        add: 'Add',
        delete: 'Delete',
        empty: 'No variables defined.',
        confirmDelete: 'Delete variable',
        saveError: 'Could not save variable',
        deleteError: 'Could not delete variable',
        builtins: [
          { key: 'date', desc: 'Current date (YYYY-MM-DD)' },
          { key: 'time', desc: 'Current time (HH:MM:SS)' },
          { key: 'timestamp', desc: 'Unix timestamp (ms)' },
          { key: 'random', desc: 'Random number (0-9999)' },
          { key: 'random:5', desc: 'Random number with 5 digits' }
        ],
        inlineHeading: 'Variables you can use in the value field:'
    },
    importPreview: {
      title: 'Import & validation',
      summary: 'Lines: {total}. Valid: {valid}. Duplicates: {dupes}. Invalid: {invalid}.',
      duplicates: 'Duplicates',
      invalid: 'Invalid rows',
      none: 'None',
      line: 'Line {num}',
      andMore: '...and {count} more',
      skipDuplicates: 'Skip duplicates',
      skipInvalid: 'Skip invalid rows',
      import: 'Import',
      validateOnly: 'Close'
    },
    alerts: {
        noRulesCloud: 'No rules found in the cloud.',
        cloudChoice: 'Found {count} rules in the cloud.\n\nSelect action:\n1. Overwrite (Replaces local rules)\n2. Merge (Adds new, keeps local on conflict)\n3. Smart Merge (Adds new, keeps BOTH on conflict)',
        overwriteSuccess: 'Replaced local rules with {count} rules from the cloud.',
        mergeSuccess: 'Merge complete.\nAdded: {added}\nConflicts resolved (duplicates created): {conflicts}',
        fetchError: 'Error fetching rules: ',
        duplicateWarning: 'Warning: This rule is a duplicate (same site and field)',
        duplicateBadge: 'Duplicate',
        duplicateChoice: 'A rule for {site} / {field} already exists.\nOK = Replace with new, Cancel = Keep existing.',
        similarRule: 'A similar rule already exists. Continue anyway?',
        coveredRule: 'NOTE: This rule is covered by an existing rule:\nSite: {site}\nField: {field}\nValue: {value}\n\nCreate anyway?',
        confirmDeleteRule: 'Are you sure you want to delete this rule?',
        deleteError: 'Could not delete rule',
        saveError: 'Could not save rule',
        exportError: 'Could not export rules',
      importSuccess: 'Imported {count} rules',
      importError: 'Error importing: ',
      importEmpty: 'No data found to import.',
      invalidColumns: 'Invalid CSV columns. Missing: {cols}',
      importInvalidRows: 'Some rows are invalid and will be skipped.',
      importConfirm: 'Proceed with import?',
      noMatches: 'No matches found',
        testMatchResult: 'Fields: {total}\nMatches:\n{matches}',
        testMatchError: 'Could not test match (missing content script?)',
        invalidRegex: 'Invalid regex: ',
        optimizerError: 'Could not analyze rules',
        forceFillError: 'Could not force fill fields'
    },
    optimizer: {
        title: 'Optimization Suggestions',
        stats: {
            total: 'Total',
            active: 'Active',
            regex: 'Regex',
            unused: 'Unused',
            suggestions: 'Suggestions'
        },
        empty: {
            title: 'No optimization suggestions',
            desc: 'Your rules look good!'
        },
        actions: {
            apply: 'Apply suggestion',
            dismiss: 'Dismiss',
            ignore: 'Ignore rule'
        }
    },
    elementTypes: {
        text: 'Text field',
        checkbox: 'Checkbox',
        radio: 'Radio button',
        select: 'Dropdown',
        textarea: 'Text area',
        contenteditable: 'Content editable'
    },
    fieldTypes: {
        name: 'Name attribute',
        id: 'ID attribute',
        placeholder: 'Placeholder',
        selector: 'CSS selector (advanced)'
    },
    matchTypes: {
        host: 'Host',
        domain: 'Domain',
        url: 'URL',
        regex: 'Regex'
    },
    conditionTypes: {
        none: 'No condition',
        urlContains: 'URL contains',
        urlRegex: 'URL regex',
        selectorExists: 'Selector exists'
    },
    autofillModes: {
        auto: 'Automatic on load',
        interaction: 'On interaction only'
    },
    sortOptions: {
        order: 'Custom order',
        lastUsed: 'Last used',
        created: 'Newest first',
        site: 'Site (A-Z)',
        field: 'Field (A-Z)'
    },
    filters: {
        enabled: 'Only active',
        regex: 'Only regex',
        sortLabel: 'Sort:'
    },
    profiles: {
        label: 'Profile',
        manage: 'Manage profiles',
        add: 'Add profile',
        delete: 'Delete',
        namePlaceholder: 'Profile name (e.g. Work)',
        confirmDelete: 'Delete profile "{name}"? All associated rules will be deleted!',
        cannotDeleteDefault: 'Cannot delete the default profile.',
        allProfiles: 'All profiles',
        moveTitle: 'Move rules',
        moveDesc: 'Select target profile:',
        moveSuccess: 'Moved {count} rules to "{profile}"'
    }
  },
  no: {
    buttons: {
      openFullViewBtn: 'Åpne full visning',
      exportBtn: 'Eksporter',
      importBtn: 'Importer',
      validateBtn: 'Valider',
      exportLog: 'Eksporter logg',
      testMatchBtn: 'Test match',
      aiAssistBtn: 'AI assist',
      optimizeBtn: 'Optimaliser',
      variablesBtn: 'Variabler',
      selectModeBtn: 'Velg flere',
      addRuleBtn: '+ Ny regel',
      bulkEnable: 'Aktiver',
      bulkDisable: 'Deaktiver',
      bulkDelete: 'Slett',
      bulkMove: 'Flytt til...',
      bulkCancel: 'Avbryt',
      pushSyncBtn: 'Push',
      pullSyncBtn: 'Pull',
      copyAiPrompt: 'Kopier',
      regenerateAiPrompt: 'Oppdater',
      save: 'Lagre',
      cancel: 'Avbryt',
      exportLog: 'Eksporter logg'
    },
    placeholders: {
      searchInput: 'Søk etter regler...',
      availableSearch: 'Søk i felter...',
      sitePattern: 'example.com eller *.example.com',
      fieldPattern: 'username eller user*',
      value: 'Verdien som skal fylles inn',
      comment: 'Valgfri kommentar for regelen'
    },
    statLabels: ['Totalt:', 'Aktive:', 'Denne siden:'],
    available: { title: 'Tilgjengelige felter', subtitle: 'Basert på feltene som finnes på aktiv fane', empty: 'Kunne ikke finne felter. Åpne en side med skjema for å se forslag.' },
    rulesHeader: 'Regler',
    appTitle: 'AutoFill',
    contextMenu: {
      addField: 'Legg til dette feltet i AutoFill',
      addAll: 'Legg til alle utfylte felt',
      fillAs: 'Fyll ut som...',
      setActive: 'Sett aktiv profil'
    },
    headings: {
      optimizer: 'Optimaliseringsforslag',
      llmSection: 'LLM-assistert optimalisering',
      llmSectionDesc: 'Bruk en LLM (ChatGPT, Claude, etc.) til å kombinere og optimalisere reglene dine.',
      llmPromptLabel: 'LLM Prompt (kopier til ChatGPT/Claude):',
      llmExportLabel: 'Eksporterte regler (semikolonseparert):',
      llmImportLabel: 'Lim inn optimaliserte regler fra LLM:',
      blacklistTitle: 'Blacklist / Whitelist',
      settingsTitle: 'Innstillinger & Variabler',
      variablesUsage: 'Variabler du kan bruke i verdi-feltet:'
    },
    copy: {
      regexHelpTitle: 'Regex-hjelp',
      regexHelp: `Regular expressions (regex) gir kraftig mønstermatching:

Eksempler:
• ^user - matcher felt som starter med "user"
• name$ - matcher felt som slutter med "name"
• (first|last)_name - matcher "first_name" eller "last_name"
• user.* - matcher "user" etterfulgt av hva som helst
• \\d{3} - matcher nøyaktig 3 sifre

Vanlige mønstre:
• . = hvilket som helst tegn
• * = null eller flere av forrige
• + = en eller flere av forrige
• ? = null eller én av forrige
• [abc] = ett av a, b eller c
• [0-9] = et siffer
• \\w = ordtegn (bokstav, siffer, underscore)
• \\d = siffer
• ^ = start på streng
• $ = slutt på streng

Bruk wildcards hvis du ikke trenger regex:
• * = matcher alt
• ? = matcher ett tegn`
    },
    pageRules: {
      header: 'Regler for denne siden',
      forceFill: 'Tving utfylling nå',
      forceFillTitle: 'Fyll felter selv om de allerede har verdier',
      empty: 'Ingen regler matcher denne siden',
      hint: 'Åpne full visning for å legge til eller redigere regler.',
      apply: 'Bruk matcher',
      partialHeader: 'Delvis match (domene matcher, men ingen felter funnet)'
    },
    ruleLabels: {
      element: 'Element',
      field: 'Felt',
      value: 'Verdi',
      priority: 'Prioritet',
      condition: 'Betingelse',
      site: 'Nettsted',
      lastUsed: 'Sist brukt',
      profile: 'Profil',
      enabled: 'Regel aktiv'
    },
    ruleActions: {
      edit: 'Rediger',
      delete: 'Slett'
    },
    rulesPage: {
      title: 'AutoFill Regler',
      subtitle: 'Administrer, grupper og optimaliser alle reglene.',
      eyebrow: 'Full visning',
      actions: {
        refresh: 'Oppdater',
        exportSelected: 'Eksporter valgte',
        import: 'Importer',
        restore: 'Gjenopprett backup',
        backup: 'Backup',
        mergeFiltered: 'Slå sammen filter',
        openPopup: 'Åpne popup'
      },
      search: {
        regex: 'Regex',
        fields: 'Match felter',
        values: 'Match verdier',
        modeLabel: 'Match-modus:',
        modes: {
          strict: 'Strict (^pattern$)',
          loose: 'Loose (.*pattern.*)'
        }
      },
      controls: {
        selectAll: 'Velg alle',
        searchPlaceholder: 'Søk i regler...',
        groupBySite: 'Grupper per nettsted',
        enabledOnly: 'Kun aktive',
        regexOnly: 'Kun regex',
        sortLabel: 'Sorter:',
        activeProfile: 'Aktiv profil:'
      },
      summary: {
        total: 'Totalt',
        active: 'Aktive',
        regex: 'Regex',
        selected: 'Valgte'
      },
      settingsTitle: 'Innstillinger & Variabler',
      empty: {
        loading: 'Laster regler...',
        none: 'Ingen regler funnet'
      },
      blacklist: {
        title: 'Blacklist / Whitelist',
        subtitle: 'Nettsteder som skal ignoreres (Blacklist).',
        label: 'Blacklist (ett mønster per linje):',
        placeholder: '*.bank.no',
        save: 'Lagre blacklist'
      },
      notifications: {
        label: 'Vis varsel på skjermen ved utfylling'
      },
      variables: {
        heading: 'Variabler du kan bruke i verdi-feltet:'
      }
    },
    emptyRules: 'Ingen regler funnet',
    emptyHint: 'Høyreklikk på et felt på en webside for å legge til en regel',
    modalTitleNew: 'Ny regel',
    modalTitleEdit: 'Rediger regel',
    modalLabels: {
      sitePattern: 'Nettstedsmønster',
      siteMatchType: 'Matching-type',
      elementType: 'Elementtype',
      fieldType: 'Identifikatortype',
      fieldPattern: 'Feltmønster',
      value: 'Verdi',
      comment: 'Kommentar',
      conditionType: 'Betingelse',
      priority: 'Prioritet'
    },
    modalHints: {
      site: 'Bruk * for wildcard, ? for enkelt tegn',
      elementType: 'Type HTML-element regelen gjelder for',
      fieldType: 'Hvordan feltet identifiseres',
      value: 'For checkbox/radio: \"true\" eller \"false\". For select: tekst eller value.',
      regex: 'Bruk JavaScript regex (uten /). Eksempel: ^user.*'
    },
    settings: {
      language: { label: 'Språk', desc: 'Velg språk for UI' },
      autofillOn: { label: 'AutoFill Aktivert', desc: 'Slå på/av automatisk utfylling globalt' },
      debug: { label: 'Debug-modus', desc: 'Vis detaljert logging og visuell feedback' },
      logToFile: { label: 'Lokal debuglogg', desc: 'Lagre debuglogg lokalt; eksporter ved behov' },
      delay: { label: 'Autofill delay (ms)', desc: 'Forsink utfylling for trege sider' },
      mode: { label: 'Autofill modus', desc: 'Auto ved last eller kun etter interaksjon' },
      whitelist: { label: 'Whitelist', desc: 'Et mønster per linje. Tom = alle tillatt.' },
      blacklist: { label: 'Blacklist', desc: 'Overstyrer whitelist. Et mønster per linje.' },
      fieldBlacklist: { label: 'Ignorerte Felt (ID)', desc: 'Unngå autofill av felt med disse ID-ene. Wildcard (default) eller "regex:...".' },
      sync: { label: 'Cloud Sync', desc: 'Push/pull regler via chrome.storage.sync' },
      scanToast: { label: 'Scan-notifikasjon', desc: 'Vis toast med scan-status i øvre venstre hjørne' }
    },
    settingsPanel: {
      title: 'Innstillinger',
      showAdvanced: 'Flere innstillinger',
      hideAdvanced: 'Skjul avansert'
    },
    cloud: {
      title: 'Skybackup',
      desc: 'Ta backup av regler til OneDrive eller Google Drive.',
      provider: 'Leverandør',
      providers: { google: 'Google Drive', onedrive: 'OneDrive' },
      backup: 'Backup',
      restore: 'Gjenopprett',
      refresh: 'Oppdater',
      clientId: 'Client ID',
      tenant: 'Tenant (valgfritt)',
      saveConfig: 'Lagre sky-oppsett',
      clientIdHint: 'Google: https://console.cloud.google.com/apis/credentials (OAuth client ID). OneDrive: https://portal.azure.com → Entra App Registration → Application (client) ID.',
      tenantHint: 'OneDrive: Tenant ID fra Entra (bruk \"common\" hvis tom).',
      login: 'Logg inn',
      loginSuccess: 'Innlogging mot {provider} OK. Du kan nå kjøre backup/restore.',
      loginError: 'Innlogging feilet: {error}',
      missingClientId: 'Legg til Client ID for {provider} forst.',
      backupSuccess: 'Backup lastet opp til {provider}.',
      backupError: 'Backup feilet: {error}',
      listError: 'Kunne ikke hente backup-liste: {error}',
      downloadError: 'Kunne ikke laste ned backup: {error}',
      restoreConfirm: 'Slå sammen med eksisterende regler? OK = Slå sammen, Avbryt = Erstatt.',
      restoreSuccess: 'Importerte {count} regler fra {name}.',
      noBackups: 'Ingen backups funnet.',
      selectFile: 'Velg en backup for gjenoppretting',
      useDefaultConfirm: 'Lagre direkte til Nedlastinger/AutoFill? OK = Lagre der, Avbryt = Velg mappe',
      useDefaultDir: 'Lagre til Nedlastinger/AutoFill (hopp over dialog hvis nettleseren tillater det)',
      noLoginNeeded: 'Ingen innlogging kreves for lokal backup.'
    },
    ai: {
      title: 'AI-feltgjenkjenning',
      copy: 'Kopier',
      refresh: 'Oppdater',
      intro: 'Kopier prompten under og bruk i valgfri LLM for å få forslag til autofill-regler.',
      wildcard: 'Wildcards: * = alle tegn, ? = ett tegn.',
      regex: 'Aktiver regex for avanserte matcher (eksempler: ^user.* , email|e-mail).',
      promptText: [
        'Du er ekspert på å generere autofill-regler for nettleserutvidelsen vår.',
        'Returner CSV med headeren:',
        'id;sitePattern;siteMatchType;elementType;fieldType;fieldPattern;fieldUseRegex;value;enabled;created;lastUsed',
        'Én regel per linje, semikolonseparert. Sett enabled=true, bruk siteMatchType=host hvis usikker.'
      ],
      promptLabel: 'LLM-prompt',
      pasteCsvLabel: 'Lim inn LLM-resultat (CSV)',
      csvPlaceholder: 'Lim inn semikolonseparert CSV fra LLM her...',
      importBtn: 'Importer',
      importMissing: 'Lim inn CSV-resultatet fra LLM først.',
      existingRules: 'Eksisterende regler (kontekst):',
      detectedFields: 'Oppdagede felter (aktiv side):',
      none: '(ingen)'
    },
    merge: {
      noTerm: 'Bruk søkefeltet for å angi filter før sammenslåing.',
      noMatches: 'Ingen regler matcher filteret.',
      success: 'Slo sammen regler for: {types}',
      error: 'Kunne ikke slå sammen regler: '
    },
    conflict: 'Konflikt',
    conflictHint: 'Flere regler matcher dette feltet; høyest prioritet vinner',
    conflictWinner: 'vinner',
    toast: {
        saved: 'Innstillinger lagret',
        error: 'Feil ved lagring'
    },
    variables: {
        title: 'Variabler',
        desc: 'Definer variabler som kan brukes i feltverdier som {variabelNavn}.',
        placeholderKey: 'Navn (f.eks. firstName)',
        placeholderValue: 'Verdi (f.eks. Lars)',
        add: 'Legg til',
        delete: 'Slett',
        empty: 'Ingen variabler definert.',
        confirmDelete: 'Slett variabel',
        saveError: 'Kunne ikke lagre variabel',
        deleteError: 'Kunne ikke slette variabel',
        builtins: [
          { key: 'date', desc: 'Dagens dato (YYYY-MM-DD)' },
          { key: 'time', desc: 'Nåværende klokkeslett (HH:MM:SS)' },
          { key: 'timestamp', desc: 'Unix timestamp (ms)' },
          { key: 'random', desc: 'Tilfeldig tall (0-9999)' },
          { key: 'random:5', desc: 'Tilfeldig tall med 5 siffer' }
        ],
        inlineHeading: 'Variabler du kan bruke i verdi-feltet:'
    },
    importPreview: {
      title: 'Import og validering',
      summary: 'Linjer: {total}. Gyldige: {valid}. Duplikater: {dupes}. Ugyldige: {invalid}.',
      duplicates: 'Duplikater',
      invalid: 'Ugyldige linjer',
      none: 'Ingen',
      line: 'Linje {num}',
      andMore: '...og {count} til',
      skipDuplicates: 'Hopp over duplikater',
      skipInvalid: 'Hopp over ugyldige linjer',
      import: 'Importer',
      validateOnly: 'Lukk'
    },
    alerts: {
        noRulesCloud: 'Ingen regler funnet i skyen.',
        cloudChoice: 'Fant {count} regler i skyen.\n\nVelg handling:\n1. Overskriv (Sletter lokale regler og erstatter med sky-regler)\n2. Merge (Legger til nye regler, beholder lokale ved konflikt)\n3. Smart Merge (Legger til nye, og beholder BEGGE ved konflikt - duplikatvarsel)',
        overwriteSuccess: 'Erstattet lokale regler med {count} regler fra skyen.',
        mergeSuccess: 'Merge fullført.\nLa til: {added}\nKonflikter løst (duplikater opprettet): {conflicts}',
        fetchError: 'Feil ved henting: ',
        duplicateWarning: 'Advarsel: Denne regelen er en duplikat (samme site og felt)',
        duplicateBadge: 'Duplikat',
        duplicateChoice: 'En regel for {site} / {field} finnes allerede.\nOK = Erstatt med ny, Avbryt = Behold eksisterende.',
        similarRule: 'En lignende regel eksisterer allerede. Fortsette likevel?',
        coveredRule: 'OBS: Denne regelen er allerede dekket av en eksisterende regel:\nSite: {site}\nFelt: {field}\nVerdi: {value}\n\nVil du opprette den likevel?',
        confirmDeleteRule: 'Er du sikker på at du vil slette denne regelen?',
        deleteError: 'Kunne ikke slette regel',
        saveError: 'Kunne ikke lagre regel',
        exportError: 'Kunne ikke eksportere regler',
      importSuccess: 'Importert {count} regler',
      importError: 'Feil ved import: ',
      importEmpty: 'Ingen data å importere.',
      invalidColumns: 'Ugyldige CSV-kolonner. Mangler: {cols}',
      importInvalidRows: 'Noen linjer er ugyldige og hoppes over.',
      importConfirm: 'Fortsette med import?',
      noMatches: 'Ingen matcher funnet',
        testMatchResult: 'Felt: {total}\nMatches:\n{matches}',
        testMatchError: 'Kunne ikke teste match (mangler content script?)',
        invalidRegex: 'Ugyldig regex: ',
        optimizerError: 'Kunne ikke analysere regler',
        forceFillError: 'Kunne ikke tvinge utfylling'
    },
    optimizer: {
        title: 'Optimaliseringsforslag',
        stats: {
            total: 'Totalt',
            active: 'Aktive',
            regex: 'Regex',
            unused: 'Aldri brukt',
            suggestions: 'Forslag'
        },
        empty: {
            title: 'Ingen optimaliseringsforslag',
            desc: 'Reglene dine ser bra ut!'
        },
        actions: {
            apply: 'Bruk forslag',
            dismiss: 'Avvis',
            ignore: 'Ignorer regel'
        }
    },
    elementTypes: {
        text: 'Tekstfelt',
        checkbox: 'Avkrysningsboks',
        radio: 'Radio button',
        select: 'Dropdown',
        textarea: 'Tekstområde',
        contenteditable: 'Redigerbart innhold'
    },
    fieldTypes: {
        name: 'Name-attributt',
        id: 'ID-attributt',
        placeholder: 'Placeholder',
        selector: 'CSS selector (avansert)'
    },
    matchTypes: {
        host: 'Host',
        domain: 'Domene',
        url: 'URL',
        regex: 'Regex'
    },
    conditionTypes: {
        none: 'Ingen betingelse',
        urlContains: 'URL inneholder',
        urlRegex: 'URL regex',
        selectorExists: 'Selector finnes'
    },
    autofillModes: {
        auto: 'Automatisk ved last',
        interaction: 'Kun ved interaksjon'
    },
    sortOptions: {
        order: 'Egendefinert rekkefølge',
        lastUsed: 'Sist brukt',
        created: 'Nyeste først',
        site: 'Nettsted (A-Å)',
        field: 'Felt (A-Å)'
    },
    filters: {
        enabled: 'Kun aktive',
        regex: 'Kun regex',
        sortLabel: 'Sorter:'
    },
    profiles: {
        label: 'Profil',
        manage: 'Administrer profiler',
        add: 'Legg til profil',
        delete: 'Slett',
        namePlaceholder: 'Profilnavn (f.eks. Jobb)',
        confirmDelete: 'Slett profil "{name}"? Alle tilhørende regler vil bli slettet!',
        cannotDeleteDefault: 'Kan ikke slette standardprofilen.',
        allProfiles: 'Alle profiler',
        moveTitle: 'Flytt regler',
        moveDesc: 'Velg mål-profil:',
        moveSuccess: 'Flyttet {count} regler til "{profile}"'
    }
  }
};

if (typeof window !== "undefined") {
  window.TRANSLATIONS = TRANSLATIONS;
} else {
  globalThis.TRANSLATIONS = TRANSLATIONS;
}


