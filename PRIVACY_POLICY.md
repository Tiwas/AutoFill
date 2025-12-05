# Privacy Policy for AutoFill Plugin

**Last Updated:** December 5, 2025

This Privacy Policy describes how the **AutoFill Plugin** ("we", "us", or "our") collects, uses, and discloses your information when you use our browser extension (the "Service").

## 1. Information Collection and Use

The primary function of the AutoFill Plugin is to automate form filling on websites based on rules and profiles you define.

### Local Data Storage
All data you create or input into the extension, including:
*   Autofill rules
*   Form profiles
*   Variables and values
*   Configuration settings

is stored **locally** on your device using the browser's built-in storage capabilities (`chrome.storage.local`). We do not transmit this data to our own servers or any third-party servers for tracking, analytics, or advertising purposes.

### Cloud Backup (Optional)
If you choose to use the "Cloud Backup" feature to sync or back up your rules, the extension will interact with the cloud storage provider you select (e.g., Google Drive or Microsoft OneDrive).
*   **Authentication:** We use the `identity` permission to securely authenticate with your cloud provider.
*   **Data Transfer:** Your rules and settings are transferred directly between your browser and your cloud storage provider. We do not have access to your login credentials or the data being transferred.

## 2. Permissions and Access

To provide its functionality, the extension requires the following permissions:

*   **Read and change all your data on the websites you visit (`<all_urls>`, `scripting`, `activeTab`):** Required to detect form fields and inject the values you have defined into the web pages you visit. The extension only modifies forms based on your explicit rules.
*   **Downloads:** Required to allow you to export your rules and settings as a file to your computer.
*   **Notifications:** Used solely to provide feedback (e.g., "Rule saved", "Backup successful").
*   **Context Menus:** Adds options to the right-click menu to help you create rules easily.

## 3. Data Sharing and Disclosure

We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Your data remains on your device unless you explicitly choose to export it or use the optional cloud backup features described above.

## 4. Third-Party Services

If you use the Cloud Backup feature, your data will be subject to the privacy policies of the respective cloud storage providers:
*   [Google Privacy Policy](https://policies.google.com/privacy)
*   [Microsoft Privacy Statement](https://privacy.microsoft.com/en-us/privacystatement)

## 5. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

## 6. Contact Us

If you have any questions about this Privacy Policy, please contact us via the support tab on the Chrome Web Store listing.
