# AutoFill Plugin - The Ultimate Form Automation Tool (Beta)

**AutoFill Plugin** is a powerful, privacy-focused browser extension designed to automate form filling on websites. Whether you're a developer testing forms, a power user filling out repetitive data, or just want to save time, AutoFill has you covered.

> **🚧 BETA NOTICE & COMMUNITY REQUEST 🚧**
> This plugin is a free, open-source hobby project developed in my spare time. It is currently in **Beta**.
>
> **Before giving a low rating:** If you encounter a bug or a feature doesn't work as expected (e.g., a specific website isn't filling correctly), please **contact me** or open an issue on GitHub.
>
> Negative ratings discourage development. Constructive feedback, bug reports, and code contributions help keep this project alive and free for everyone!
>
> [**Report Issues & Contribute on GitHub**](https://github.com/Tiwas/AutoFill)

## 🆕 What's New in v0.9.0

### 🛡️ Improved Blacklist/Whitelist Handling
*   **Smart Domain Matching:** Just type `facebook.com` to block the entire domain including all subdomains (www, m, etc.)
*   **Multiple Pattern Types:** Use simple domains, wildcards (`*.example.com`), or regex (`regex:pattern`)
*   **Smarter Blocking:** Sites are checked against blacklist/whitelist *before* any scanning occurs.
*   **Field-Level Blacklist:** Exclude specific fields by ID pattern (supports wildcards and regex).

### 🐛 Bug Fixes & Stability
*   **Fixed:** "Permissions policy violation: unload" errors on modern websites.
*   **Fixed:** "No tab with id" errors when switching tabs quickly.
*   **Improved:** More robust error handling throughout the extension.
*   **Improved:** Better accessibility with ARIA attributes for screen readers.

## 🌟 Key Features

### 🎥 Macro Recorder
Struggling with complex forms, dynamic menus, or "smart" search fields (like React/Vue dropdowns)?
*   **Record:** Click "Record", perform your actions (click, type, select), and stop.
*   **Replay:** The plugin will repeat your exact steps automatically when the form appears.
*   **Smart Wait:** The macro waits for elements to become visible before running, ensuring stability on slow-loading pages.

### ☁️ Cloud Sync & Backup
*   **Google Drive & OneDrive Support:** Backup your rules to your personal cloud storage.
*   **Sync:** Keep your rules synchronized across multiple computers.
*   **Manual Control:** You decide when to push or pull data. No hidden background syncing.

### 🎯 More Features
*   **Flexible Matching:** Match sites by Hostname, Domain, exact URL, or Regex.
*   **Precise Targeting:** Target fields by `name`, `id`, `data-attributes`, `placeholder`, or CSS Selectors.
*   **Profiles:** Switch easily between "Work", "Personal", or "Testing" profiles.
*   **Variables:** Define global variables (e.g., `{email}`, `{phone}`) to update multiple rules at once.
*   **Privacy First:** All data is stored locally on your device (unless you explicitly use Cloud Backup). No tracking, no ads.
*   **Developer Friendly:** "Force Fill" mode to bypass checks, and detailed debug logging.

## 🤝 Support the Project

If you find this tool useful, consider supporting its development:

*   **Code:** Contribute fixes or features on GitHub.
*   **Feedback:** Tell me what works and what doesn't.
*   **Donate:** [Buy me a coffee](https://www.paypal.com/paypalme/tiwasno) to fuel late-night coding sessions.

---
*Happy Autofilling!*