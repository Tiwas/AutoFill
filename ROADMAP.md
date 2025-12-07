# AutoFill Plugin - Roadmap

## Versjon 0.1.0 - MVP (Minimum Viable Product) ✅ FULLFØRT

### Core Functionality
- [x] Prosjektoppsett og manifest
- [x] Grunnleggende datastruktur og storage API
- [x] Content script for felt-deteksjon
- [x] Enkel automatisk utfylling basert på navn/id
- [x] Context menu (høyreklikk) - legg til enkeltfelt
- [x] Grunnleggende popup UI for å se regler
- [x] Wildcard-støtte (`*` og `?`) i mønstre
- [x] Regex-støtte for felt og nettsteder
- [x] CSV-eksport og import
- [x] Site matching (host, domain, url, regex)
- [x] Popup UI for å redigere og slette regler
- [x] Søk og filtrering i regler
- [x] Context menu - legg til alle utfylte felt

### Milestone: Fungerende grunnfunksjonalitet ✅

## Versjon 0.2.0 - Forbedringer og Optimalisering ✅ FULLFØRT

### Features
- [x] Toggle switch for aktivere/deaktivere regler (visuell forbedring)
- [x] Bulk actions (velg flere regler, slett/aktiver/deaktiver samtidig)
- [x] Sorteringsalternativer (etter navn, dato, sist brukt)
- [x] Duplikat-deteksjon ved opprettelse
- [x] Regeloptimalisering UI (forslag til forenklinger)
- [x] Forbedret validering og feilmeldinger
- [x] SVG-ikon for extension
- [x] Rule Optimizer med intelligent analyse
  - [x] Duplikat-deteksjon
  - [x] Regelkombinering
  - [x] Forenklingsforslag
  - [x] Overlappende regel-deteksjon
  - [x] Ubrukte regel-deteksjon
- [x] Gruppering av regler per nettsted
- [x] Eksporter/importer kun valgte regler
- [x] Drag-and-drop for rekkefolge

### Milestone: Profesjonell regeladministrasjon ✅

## Versjon 0.3.0 - Avanserte Felttyper ✅ FULLFØRT

### Features
- [x] Støtte for select-felt (dropdown)
- [x] Støtte for checkbox-felt
- [x] Støtte for radio button-felt
- [x] Støtte for textarea (multiline)
- [x] Støtte for contentEditable-elementer
- [x] elementType felt i regler
- [x] Intelligent verdi-håndtering per felttype
- [x] Forbedret UI med elementtype-indikator
- [x] Custom selector-stotte (CSS selector)

### Milestone: Fullstendig feltstøtte ✅

## Versjon 0.3.1 - Innstillinger og Debug ✅ FULLFØRT

### Features
- [x] Global autofill toggle (aktivere/deaktivere autofill globalt)
- [x] Debug-modus med visuell feedback
- [x] Felt-highlighting ved autofill (debug)
- [x] On-page notifikasjoner (debug)
- [x] Detaljert console-logging (debug)
- [x] Status badge på extension-ikon (viser "OFF" når deaktivert)
- [x] Settings-section i popup
- [x] Toggle switches for innstillinger
- [x] Dynamic settings update (uten sideoppdatering)

### Milestone: Brukerinnstillinger og utviklerverktøy ✅

## Versjon 0.4.0 - Smart Autofill og Variabler ✅ FULLFØRT

### Features
- [x] Conditional autofill (hvis-betingelser)
- [x] Delay for autofill (for dynamiske sider)
- [x] Prioritering av regler
- [x] Autofill kun ved brukerinteraksjon
- [x] Blacklist/whitelist for automatisk kjoring
- [x] Variabel-støtte ({variabelNavn})
- [x] Språkstøtte (Norsk/Engelsk)
- [x] Forbedret Cloud Sync (Merge/Smart Merge)

### Milestone: Intelligent autofill

## Versjon 0.5.0 - Intelligent Regelforslag ✅ FULLFØRT

### Features
- [x] Analyse av eksisterende regler
- [x] Identifisere dupliserte monstre p† tvers av siter
- [x] Foresl† regelforenklinger
- [x] UI for † godta/avvise forslag
- [x] Automatisk konsolidering av regler
- [x] Statistikk over regelbruk

### Milestone: Smart regeloptimalisering

## Versjon 0.6.0 - Forbedret UI/UX ✅ FULLFØRT

### Features
- [x] Forbedret popup-design
- [x] Ikoner for regeltyper
- [x] Drag-and-drop for † reordne regler
- [x] Gruppering av regler per nettsted
- [x] Fargemarkering av regex-regler
- [x] Tooltips og hjelpetekst

### Milestone: Profesjonelt grensesnitt

## Versjon 0.7.0 - Avanserte Funksjoner ✅ FULLFØRT

### Features
- [x] Stotte for flere felttyper (select, checkbox, radio)
- [x] Conditional autofill (fyll bare ut hvis betingelse er oppfylt)
- [x] Delay for autofill (for dynamiske sider)
- [x] Stotte for iframes
- [x] Observere DOM-endringer (SPA-stotte)

### Milestone: Avansert feltutfylling

## Versjon 0.8.0 - Sikkerhet og Personvern ✅ FULLFØRT

### Features
- [ ] Kryptering av sensitive verdier (ikke prioritert)
- [ ] Passord-beskyttelse av regler (ikke prioritert)
- [x] Whitelist/blacklist for nettsted
- [x] Content Security Policy (CSP) i manifest
- [x] Konsekvent feilhåndtering (ErrorHandler)
- [x] Input-validering (Validator)
- [-] Automatisk sletting av gamle regler
- [-] Audit log for regelbruk

### Milestone: Sikker datahåndtering

## Versjon 0.9.0 - Profiler og Testing ✅ FULLFØRT

### Features
- [x] Profil-støtte (Jobb, Privat etc.)
- [x] Kontekstmeny for profil-spesifikk utfylling
- [x] Enhetstester for alle moduler
- [x] Integrasjonstester
- [x] End-to-end tester
- [x] Performance-optimalisering (regex-cache, TreeWalker, debouncing)
- [x] Minnelekkasje-fikset (MutationObserver cleanup ved unload)
- [-] Browser-kompatibilitet (Firefox, Edge) - utsatt til egen porting-økt

### Milestone: Fleksibilitet og Kvalitet

### Versjon 0.9.2 - Stabilisering og UX (Pågår)

### Fokus
- Fjerne resterende hardkodet tekst og encoding-feil (full i18n-pass).
- Forbedre filtreringsopplevelsen: regex strict/loose, synlig «Slå sammen filter».
- Gjøre variabler tilgjengelige: standardvariabler alltid tilstede i rules-visning.
- Popup UX: avanserte paneler/innstillinger skjules som default, bedre CTA-plassering.

### Oppgaver
- [ ] Fullfør i18n-opprydding i popup/rules (labels, tooltips, modaltekster) og encoding-sjekk (inkl. kontekstmeny og encoding-glitches).
- [x] Sikre standardvariabler ({date}, {time}, {timestamp}, {random}, {random:5}) lagres/vises alltid.
- [x] Plasser «Slå sammen filter» ved søk/filtrering (synlig) og i18n-bind.
- [x] Stramme opp regex-filter (strict/loose + ankere) med tydelige UI-valg.
- [x] Gjør avanserte innstillinger i popup collapsible m/ikon og god default.
- [x] Context menu: i18n-støtte og språkbytte-håndtering.
- [x] Paneler i rules.html for å redusere clutter; domenegrupper er collapsible by default.
- [x] Paneler i popup.html for å redusere clutter videre (finpuss).
- [x] Badge/match: profil-sensitive tellinger, retry ved felt-scan, og auto-refresh fra content-script uten popup.
- [ ] Manuell test: regex-filter/merge, contextmeny språkbytte, collapsible UI (popup/rules), encoding-gjennomgang.

## Versjon 0.9.3 - Kvalitet og konflikthåndtering (Planlagt)

### Fokus
- Konfliktdeteksjon per side/element med rask prioritet-justering.
- Deduplisering/validering ved import (previews og “skip duplikater”).
- Context-meny: “Sett aktiv profil” som hurtigvalg.
- Regelvalidering/QA med modal som viser ugyldige regler.
- (Lav prio) Opt-in debug-logging til fil.

### Oppgaver
- [x] Context-meny: legg til “Sett aktiv profil” hurtigvalg ved siden av “Fyll ut som…”.
- [x] Konfliktvarsling: viser konflikt-pill og +prio snarvei; utvidet “hvilken vinner”-visning gjenstår.
- [x] Import-dedupe: forhåndsvisning med duplikatliste og valg for å hoppe over før lagring.
- [x] Regelvalidering: egen “Valider” handling (import) med modal som viser ugyldige linjer/regler.
- [x] Opt-in logging til fil (lav prio): lokal debuglogg med eksport til fil.
- [ ] Manuell test: konfliktmarkering (+prio) inkl. vinner-tag, import-dedupe/valideringsmodal (rules/popup), context-meny “Sett aktiv profil”, collapsible domenegrupper/popup-paneler, logg-toggle/eksport.

### Manuelle tester (0.9.2/0.9.3)
- Badge: på sidelast uten popup skal badge starte “?” og oppdatere til antall full matches (aktiv profil) når felt er scannet.
- Verifiser regex-filter: strict/loose ankere, regex vs wildcard, og “Slå sammen filter”-knapp ved søk (rules.html).
- Sammenslå filtrerte regler: sjekk sitePattern=domene eller * når mixed, per elementType, originaler deaktivert.
- Contextmeny språkbytte + “Sett aktiv profil”: bytt språk og verifiser tekst; sett profil fra meny og se profil i popup/rules.
- Konfliktmarkering: se “Konflikt”-pill når samme site/field/profil, +prio-knapp øker prioritet og rerender; sjekk vinner-tag (høyest prioritet).
- Import/Validering: last en CSV med duplikater og en linje med feil kolonneantall; modalen skal vise duplikater/ugyldige linjer, hopp over-valg påvirker import. Test både popup og rules.
- Collapsible UI: domenegrupper (rules) og avanserte innstillinger (popup) starter lukket; åpne/lukke fungerer.
- Encoding/i18n: sjekk at ingen hardkodet tekst gjenstår i UI/kontekstmeny; bekreft at oversettelser vises riktig (NO/EN).
- Logging: skru på “Lokal debuglogg”, gjennomfør et importforsøk og eksporter loggfil; sjekk at innhold har tidsstempel og hendelser.
- Sublime lint (i18n-scan): opprett build system med `{"shell_cmd": "cd /mnt/c/dev/autofill-plugin && node scripts/i18n-scan.js", "working_dir": "${project_path:${folder}}", "selector": "source.js, text.html.basic"}` og kjør Ctrl+B/Cmd+B for å liste hardkodet tekst.

## Versjon 1.0.0 - Første Offisielle Release

### Features
- [ ] Fullstendig dokumentasjon
- [-] Brukerhåndbok med skjermbilder
- [-] Video-tutorial
- [ ] FAQ
- [ ] Chrome Web Store listing
- [-] Support-kanal

### Milestone: Offentlig lansering

## Notater

- 07.12.2025: Versjon 0.9.0 - Stabilisering og feilrettinger:
  - **Blacklist/Whitelist:** Forbedret håndtering - sider sjekkes mot lister *før* scanning/regel-lasting
  - **Feilrettinger:** "Permissions policy violation: unload" og "No tab with id" feil løst
  - **Ny safeBadgeUpdate():** Robust feilhåndtering for badge-operasjoner
  - **Fjernet deprecated 'unload' event:** Bruker nå kun 'pagehide' for cleanup
- 07.12.2025: Teknisk gjeld og kodekvalitet - FULLFØRT. Se ISSUES.md for detaljer:
  - **Fase 1 (Sikkerhet):** CSP i manifest, MutationObserver cleanup, verifisert JSON.parse/innerHTML
  - **Fase 2 (Ytelse):** Regex-cache, debouncing, TreeWalker DOM-traversering, forbedret feilhåndtering
  - **Fase 3 (Kodekvalitet):** Ny utils.js med Logger, Validator, ErrorHandler
  - **Fase 4 (Kompatibilitet):** Fjernet duplikat content script-registrering
  - **Fase 5 (Manglende funksjoner):** Skybackup-validering med checksum
  - **Fase 6 (Edge cases):** Iframe-håndtering, select multi-select, CSV-import validering
  - **Fase 7 (Beste praksis):** ReDoS-deteksjon, ARIA-tilgjengelighet, loggingsrammeverk
- 03.12.2025: Fikset fallback-injeksjon av content script for kontekstmenyen for å løse "Receiving end does not exist"-feil.
- Prioriteringer kan endres basert på tilbakemeldinger
- Hver versjon skal testes grundig før neste påbegynnes
- Bruker semantisk versjonering (MAJOR.MINOR.PATCH)
- Breaking changes kun i MAJOR-versjoner
