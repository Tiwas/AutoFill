# Chrome Web Store - Privacy & Permissions Justifications

Use the following text to answer the justification questions in the "Privacy practices" tab of the Chrome Web Store developer dashboard.

## Single Purpose Description
Automate form filling on websites using user-defined rules and profiles.

## Permissions Justifications

### activeTab
**Justification:**
Required to access the current page's URL and content when the user clicks the extension icon or uses a keyboard shortcut. This allows the extension to identify the site and trigger the form-filling process or rule creation specific to that page without requiring constant background access in all cases.

### contextMenus
**Justification:**
Required to add options to the browser's right-click menu (e.g., "Add this field to AutoFill", "Fill as..."). This provides users with a quick and intuitive way to create new autofill rules for specific fields or force-fill forms directly from the webpage.

### downloads
**Justification:**
Required to allow users to export their autofill rules and settings as CSV files for backup purposes or to transfer them to another computer. The extension creates the file and triggers the download to the user's local machine.

### Host Permissions (<all_urls>)
**Justification:**
The core functionality of this extension is to autofill forms on *any* website the user visits. It matches the current website's domain against the user's saved rules. Without access to all URLs, the extension cannot detect when a user is on a page that requires autofilling, nor can it inject the necessary scripts to fill the forms.

### identity
**Justification:**
Required for the optional "Cloud Backup" feature. It allows users to securely authenticate with their own Google Drive or Microsoft OneDrive accounts to save and restore their rules backup files. The extension uses the `launchWebAuthFlow` to obtain an access token solely for this purpose.

### notifications
**Justification:**
Used to provide non-intrusive feedback to the user. For example, displaying a brief message when a rule is successfully saved, when fields have been autofilled, or if an error occurs during an operation (like a backup failure).

### Remote Code Use
**Justification:**
(This extension does **not** use remote code. All logic is bundled locally.)
*If asked if you use remote code:* No.

### scripting
**Justification:**
Required to programmatically inject the content script (`content.js`) into web pages. This is essential for:
1. Detecting form fields on the page to suggest rules.
2. Filling values into fields based on the user's rules.
3. Ensuring the content script is active even if the extension was installed/reloaded while the tab was already open (fallback mechanism).

### storage
**Justification:**
Crucial for the extension's operation. It is used to save the user's created autofill rules, profiles, variables, and configuration settings locally within the browser (`chrome.storage.local`). No data is sent to external servers unless the user explicitly uses the Cloud Backup feature.

## Data Usage Certification
**Usage:**
The extension stores user-provided data (rules, values, profiles) locally.
**Certification:**
Yes, I certify that my data usage complies with the Developer Program Policies.
