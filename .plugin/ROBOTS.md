# AutoFill Plugin - Chrome Extension

## Instrukser for AI (VIKTIG)

1. **Lever kun komplett kode:** Ikke bruk placeholders som `// ... rest of code` eller lignende. All kode som presenteres eller endres må være fullstendig.
2. **Bevar funksjonalitet:** Ingen eksisterende funksjonalitet skal fjernes uten eksplisitt godkjenning fra brukeren.
3. **Verifiser kode:** All kode skal verifiseres som fungerende (så langt det lar seg gjøre via tester eller analyse) før den leveres.
4. **Backup-rutine:** Før filer endres, skal det tas en backup av filen til `\backups`-mappen. Dette for å sikre at vi kan spore tilbake funksjonalitet som eventuelt forsvinner.
5. **Ingen hardkodet tekst:** All tekst som vises i brukergrensesnittet skal hentes fra oversettelsesfiler eller objekter. Hardkoding av tekst direkte i HTML eller JS er ikke tillatt.

## Prosjektbeskrivelse

Dette er et Chrome-plugin for automatisk utfylling av feltdata på websider. Pluginet lar brukere definere regler for automatisk utfylling basert på feltnavn, ID, og nettstedsadresse.

## Hovedfunksjoner

### 1. Automatisk Utfylling
- Fyller automatisk ut felt på websider basert på lagrede regler
- Støtter matching på:
  - Element navn (`name`-attributt)
  - Element ID (`id`-attributt)
  - Nettstedsadresse (host, domene, eller spesifikk URL)

### 2. Regeladministrasjon
- **Legg til enkeltfelt**: Høyreklikk på et felt for å legge til kun dette feltet
- **Legg til alle felt**: Legg til alle utfylte felt på siden samtidig
- **Rediger regler**: Administrer eksisterende regler via popup-grensesnittet
- **Slett regler**: Fjern regler som ikke lenger er nødvendige

### 3. Intelligent Regelforslag
- Foreslår forenklinger for å redusere antall regler
- Eksempel: Hvis "name" finnes på både `host1.domene.com` og `host2.domene.com`,
  foreslår systemet å kombinere disse til én regel for `domene.com`

### 4. Mønstermatching
- **Regex**: Fullstendig støtte for regulære uttrykk
- **Wildcards**:
  - `*` matcher null eller flere tegn
  - `?` matcher nøyaktig ett tegn
- Kan brukes både i feltnavn og nettstedsadresser

### 5. Import/Export
- **Eksporter**: Lag CSV-filer (semikolon-separert) for backup eller redigering
- **Importer**: Last inn regler fra CSV-filer
- Format: `site_pattern;field_type;field_identifier;value;use_regex`

## Teknisk Arkitektur

### Filstruktur
```
autofill-plugin/
├── manifest.json           # Chrome extension manifest
├── background.js           # Background service worker
├── content.js              # Content script (injiseres i websider)
├── popup.html              # Popup UI
├── popup.js                # Popup logikk
├── storage.js              # Storage API wrapper
├── pattern-matcher.js      # Pattern matching logikk
├── csv-handler.js          # CSV import/export
├── rule-optimizer.js       # Regelforslag og optimalisering
├── icons/                  # Ikoner for extension
├── styles/                 # CSS filer
└── docs/
    ├── ROBOTS.md           # Denne filen
    ├── ROADMAP.md          # Utviklingsplan
    └── SESSION.md          # Sesjonsdokumentasjon
```

### Datastruktur

#### Regel (Rule)
```javascript
{
  id: "uuid",                    // Unik identifikator
  sitePattern: "*.example.com",  // Nettstedsmønster
  siteMatchType: "domain",       // "host", "domain", "url", "regex"
  fieldType: "name",             // "name", "id", "class", "selector"
  fieldPattern: "username",      // Feltidentifikator/mønster
  fieldUseRegex: false,          // Bruk regex for feltmønster
  value: "myusername",           // Verdien som skal fylles inn
  enabled: true,                 // Om regelen er aktiv
  created: 1234567890,           // Timestamp
  lastUsed: 1234567890           // Siste gang brukt
}
```

### Chrome Storage
Bruker `chrome.storage.local` for å lagre regler. Dette gir:
- Synkronisering på tvers av økter
- Rask tilgang til data
- Ingen størrelsesbegrensning (utover 10MB)

### Context Menu
Registrerer to kontekstmeny-alternativer:
1. "Legg til dette feltet i AutoFill" - Legger til kun det valgte feltet
2. "Legg til alle utfylte felt" - Legger til alle felt med verdier på siden

## Sikkerhet og Personvern

- All data lagres lokalt i nettleseren
- Ingen data sendes til eksterne servere
- CSV-eksport inneholder sensitiv data - håndter forsiktig
- Brukeren har full kontroll over alle lagrede regler

## Utviklingsstatus

Se [ROADMAP.md](ROADMAP.md) for detaljert utviklingsplan.

## Sesjonsdokumentasjon

Se [SESSION.md](SESSION.md) for logg over hva som er gjort i hver utviklingsøkt.

## Installasjon (for utvikling)

1. Clone eller last ned prosjektet
2. Åpne Chrome og gå til `chrome://extensions/`
3. Aktiver "Developer mode" (øverst til høyre)
4. Klikk "Load unpacked" og velg prosjektmappen
5. Pluginet er nå installert og klart til bruk

## Bruksanvisning

### Legge til et felt
1. Høyreklikk på et tekstfelt på en webside
2. Velg "Legg til dette feltet i AutoFill"
3. En dialog vises hvor du kan redigere reglene
4. Klikk "Lagre"

### Legge til alle felt
1. Fyll ut alle felt du ønsker å lagre på en side
2. Høyreklikk hvor som helst på siden
3. Velg "Legg til alle utfylte felt"
4. Gjennomgå og bekreft feltene som skal legges til

### Administrere regler
1. Klikk på plugin-ikonet i Chrome-verktøylinjen
2. Se liste over alle regler
3. Rediger, slett eller deaktiver regler
4. Bruk søk for å finne spesifikke regler

### Eksportere regler
1. Åpne plugin-popup
2. Klikk "Eksporter"
3. CSV-fil lastes ned automatisk

### Importere regler
1. Åpne plugin-popup
2. Klikk "Importer"
3. Velg CSV-fil
4. Gjennomgå og bekreft reglene som skal importeres

## Bidrag

Dette er et personlig prosjekt. Forbedringer og forslag mottas gjerne!

## Lisens

TBD
