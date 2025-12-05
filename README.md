# AutoFill Plugin - Chrome Extension

Et kraftig Chrome-plugin for automatisk utfylling av feltdata på websider med støtte for regex og mønstermatching.

## 📋 Funksjoner

### Kjernefunksjonalitet
- **Automatisk utfylling**: Fyller automatisk ut felt basert på definerte regler
- **Intelligent matching**: Støtte for wildcard (`*`, `?`) og regex-mønstre
- **Kontekstmeny**: Høyreklikk for å legge til enkelt felt eller alle utfylte felt
- **Import/Export**: CSV-basert backup og synkronisering (semikolon-separert)

### Regeladministrasjon (v0.2.0)
- **Toggle Switch**: Aktiver/deaktiver regler direkte fra listen
- **Bulk Actions**: Velg flere regler og aktiver/deaktiver/slett samtidig
- **Sortering**: Sorter etter sist brukt, nyeste først, nettsted eller feltnavn
- **Søk og filter**: Finn regler raskt med søk og filtreringsalternativer
- **Duplikat-deteksjon**: Få varsel hvis du prøver å legge til en duplikat-regel

### Intelligent Optimalisering (v0.2.0)
- **Regelanalyse**: Analyser alle regler for optimaliseringsmuligheter
- **Duplikat-deteksjon**: Finn og fjern identiske regler
- **Regelkombinering**: Kombiner regler for samme felt på forskjellige siter
- **Forenklingsforslag**: Få forslag til hvordan regler kan forenkles
- **Overlapp-deteksjon**: Identifiser overlappende regler
- **Ubrukte regler**: Finn regler som aldri har blitt brukt

### Avanserte Felttyper (v0.3.0)
- **Select-felt (dropdown)**: Intelligent matching på både value og tekst
- **Checkbox**: Støtte for true/false, 1/0, checked/unchecked verdier
- **Radio buttons**: Automatisk valg av riktig radio button
- **Textarea**: Full støtte for flerlinjers tekstfelt
- **ContentEditable**: Støtte for redigerbart innhold
- **Type-spesifikk logikk**: Hver felttype håndteres korrekt

### Innstillinger og Debug (v0.3.1)
- **Global AutoFill Toggle**: Aktiver/deaktiver autofill globalt for alle sider
- **Debug-modus**: Visuell feedback med felt-highlighting og on-page notifikasjoner
- **Detaljert logging**: Console-logging av alle autofill-operasjoner i debug-modus
- **Status badge**: Ikonet viser "OFF" når autofill er deaktivert

## 🚀 Komme i gang

### Installasjon (Utviklingsmodus)

1. Last ned eller klon dette repositoriet
2. Åpne Chrome og gå til `chrome://extensions/`
3. Aktiver "Developer mode" (øverst til høyre)
4. Klikk "Load unpacked"
5. Velg mappen `autofill-plugin`
6. Pluginet er nå installert!

### Første bruk

1. **Legg til første regel:**
   - Gå til en webside med et skjema
   - Fyll ut et felt
   - Høyreklikk på feltet
   - Velg "Legg til dette feltet i AutoFill"

2. **Legg til flere felt samtidig:**
   - Fyll ut alle feltene du vil lagre
   - Høyreklikk hvor som helst på siden
   - Velg "Legg til alle utfylte felt"

3. **Administrer regler:**
   - Klikk på plugin-ikonet i verktøylinjen
   - Se, rediger eller slett regler
   - Bruk søk for å finne spesifikke regler

## 📖 Bruksanvisning

### Mønstermatching

#### Wildcards
- `*` matcher null eller flere tegn
  - Eksempel: `user*` matcher "username", "user_name", "user123"
- `?` matcher nøyaktig ett tegn
  - Eksempel: `user?` matcher "user1", "userA", men ikke "username"

#### Regex
Aktiver "Bruk regex" for avansert mønstermatching:
- `user\d+` matcher "user1", "user123"
- `(first|last)name` matcher "firstname" eller "lastname"
- `email|e-mail` matcher begge varianter

### Site Matching

- **Host**: Matcher eksakt hostname (f.eks. `www.example.com`)
- **Domain**: Matcher domene og alle subdomener (f.eks. `example.com` matcher også `www.example.com`)
- **URL**: Matcher full URL
- **Regex**: Bruk regex for avansert URL-matching

### Import/Export

#### Eksportere regler
1. Åpne plugin-popup
2. Klikk "Eksporter"
3. CSV-fil lastes ned automatisk

#### Importere regler
1. Åpne plugin-popup
2. Klikk "Importer"
3. Velg CSV-fil
4. Velg om du vil legge til eller erstatte eksisterende regler

#### CSV-format
```
id;sitePattern;siteMatchType;fieldType;fieldPattern;fieldUseRegex;value;enabled;created;lastUsed
123-abc;example.com;domain;name;username;false;myuser;true;1234567890;1234567890
```

## 🏗️ Prosjektstruktur

```
autofill-plugin/
├── manifest.json           # Extension manifest
├── background.js           # Background service worker
├── content.js              # Content script
├── storage.js              # Storage API
├── pattern-matcher.js      # Pattern matching
├── popup.html              # Popup UI
├── popup.css               # Popup styling
├── popup.js                # Popup logic
├── icons/                  # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── docs/
    ├── ROBOTS.md           # Detaljert dokumentasjon
    ├── ROADMAP.md          # Utviklingsplan
    └── SESSION.md          # Sesjonsdokumentasjon
```

## 🔧 Teknisk

### Teknologier
- Chrome Extension Manifest V3
- Vanilla JavaScript (ingen avhengigheter)
- Chrome Storage API
- Content Scripts
- Background Service Workers

### Kompatibilitet
- Chrome 88+
- Microsoft Edge 88+
- Andre Chromium-baserte nettlesere

## 📚 Dokumentasjon

- **[ROBOTS.md](ROBOTS.md)**: Fullstendig teknisk dokumentasjon
- **[ROADMAP.md](ROADMAP.md)**: Utviklingsplan og kommende funksjoner
- **[SESSION.md](SESSION.md)**: Utviklingslogg per sesjon

## 🐛 Feilsøking

### Regler fungerer ikke
1. Sjekk at regelen er aktivert (grønn toggle)
2. Verifiser at mønsteret matcher feltnavnet
3. Test mønsteret i en regex-tester hvis du bruker regex
4. Åpne Developer Tools (F12) og sjekk Console for feilmeldinger

### Ingen felt fylles ut
1. Sjekk at du har regler for gjeldende nettsted
2. Verifiser at feltene har `name` eller `id` attributter
3. Last inn siden på nytt etter å ha lagt til regler

### Import fungerer ikke
1. Sjekk at CSV-filen har riktig format
2. Verifiser at filen bruker semikolon (`;`) som separator
3. Sjekk konsollen for feilmeldinger

## 🔐 Sikkerhet og Personvern

- Alle data lagres lokalt i nettleseren
- Ingen data sendes til eksterne servere
- CSV-eksport kan inneholde sensitiv informasjon
- Bruk sterke passord og beskytt backup-filer

## 🛣️ Roadmap

Se [ROADMAP.md](ROADMAP.md) for detaljert utviklingsplan.

### Kommende funksjoner
- Intelligent regelforslag og optimalisering
- Støtte for select, checkbox og radio buttons
- Conditional autofill
- Kryptering av sensitive verdier
- Synkronisering via cloud

## 📝 Lisens

TBD

## 🤝 Bidrag

Dette er et personlig prosjekt, men forslag og forbedringer mottas gjerne!

## 📧 Support

For problemer eller spørsmål, vennligst opprett en issue i repositoriet.

---

**Versjon 0.4.0** - Innstillinger og Debug ✅

Nå med global autofill-toggle, debug-modus med visuell feedback, og status badge! Pluginet er i aktiv utvikling, men alle kjernefunksjoner er implementert og fungerer.
