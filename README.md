# AutoFill Plugin

**AutoFill Plugin** is a powerful, privacy-focused Chrome extension designed to automate form filling on websites. It offers granular control over how and where your data is filled, supporting everything from simple wildcard matches to complex regular expressions.

> **Note:** This plugin is designed to be **free and open-source**. It contains no ads, no tracking, and all your data stays locally on your device.

## Key Features

### 🚀 Smart Automation
*   **Flexible Site Matching:** Trigger rules based on Hostname, Domain, specific URLs, or Regex patterns.
*   **Precise Field Targeting:** Identify fields by `name`, `id`, `data-name`, `data-id`, `placeholder`, or advanced CSS `selectors`.
*   **Deep Scanning:** Works inside **iframes** (even `about:blank`) and **Shadow DOM** to find fields anywhere.
*   **Smart Fallback:** Automatically generates robust CSS selectors for fields that lack ID or names, ensuring even "unfillable" forms can be automated.
*   **Pattern Matching:** Use Wildcards (`*`, `?`) for simple matching or full **Regular Expressions** for power users.

### 👤 Profiles
*   Create multiple profiles (e.g., "Personal", "Work", "Testing").
*   Easily switch between profiles to fill forms with different sets of data.
*   Rules are scoped to profiles, keeping your data organized.

### 🛠️ Rule Management
*   **Context Menu Integration:** Right-click any field to add a rule for it instantly, or save all fields on the current page at once.
*   **Full Dashboard:** A comprehensive rules manager allows you to search, filter, sort, and edit your rules.
*   **Variables:** Define global variables (e.g., `{email}`, `{phone}`) to reuse across multiple rules. Update the variable once, and it updates everywhere.
*   **Optimization:** Built-in analysis to suggest merging duplicate rules or simplifying patterns.

### 🔒 Privacy & Security
*   **Local Storage:** All rules and profiles are stored in your browser's local storage (`chrome.storage.local`).
*   **No External Sync:** No data is sent to any external servers.
*   **Blacklist:** Explicitly prevent specific fields or sites from ever being autofilled.

### 💾 Import & Export
*   **CSV Support:** Import and export your rules to CSV for backup or sharing.
*   **Backup:** Built-in backup and restore functionality.

## Installation (Developer Mode)

Since this is a development version, you need to load it manually:

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the folder containing this project.

## Usage

### Adding Rules
1.  **Right-click** on any input field on a webpage.
2.  Select **AutoFill Plugin > Add this field**.
3.  Customize the rule (value, matching pattern) and save.
4.  Alternatively, fill out a whole form and select **Add all filled fields**.

### Managing Profiles
1.  Click the extension icon in your browser toolbar.
2.  Use the dropdown menu to switch between profiles.
3.  Click **Manage** to create, rename, or delete profiles.

### Advanced Configuration
Access the full dashboard by clicking **"Manage Rules"** in the popup or context menu. Here you can:
*   View and edit all stored rules.
*   Run optimization checks.
*   Manage your global variables.
*   Configure blacklisted sites/IDs.

## Support the Project

This plugin is maintained as a free, open-source hobby project. If you find it useful and want to support its development, you can buy me a coffee:

[**☕ Donate via PayPal**](https://www.paypal.com/paypalme/tiwasno)

## License

This project is licensed under the **Apache License 2.0**.

---
*Enjoy faster form filling!*