const fs = require('fs');
const path = require('path');

const messages = JSON.parse(fs.readFileSync('_locales/en/messages.json', 'utf8'));

function unflatten(flatObj) {
  const result = {};
  for (const key in flatObj) {
    const parts = key.split('_');
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // Leaf
        // Check if message has newlines -> was array
        const msg = flatObj[key].message;
        current[part] = msg.includes('\n') ? 'ARRAY_MARKER' : 'STRING_MARKER';
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }
  return result;
}

const structure = unflatten(messages);

function generateShim(obj, prefix = '') {
  let props = [];
  for (const key in obj) {
    const flatKey = prefix + key;
    if (obj[key] === 'ARRAY_MARKER') {
        props.push(`get ${key}() { return (chrome.i18n.getMessage("${flatKey}") || "").split('\n'); }`);
    } else if (obj[key] === 'STRING_MARKER') {
        props.push(`get ${key}() { return chrome.i18n.getMessage("${flatKey}"); }`);
    } else {
        props.push(`${key}: { ${generateShim(obj[key], flatKey + '_')} }`);
    }
  }
  return props.join(',\n');
}

const shimCode = `
/**
 * Translations shim for AutoFill Plugin
 * Maps old nested structure to chrome.i18n.getMessage()
 */
const t_proxy = {
${generateShim(structure)}
};

const TRANSLATIONS = {
  en: t_proxy,
  no: t_proxy,
  get current() { return t_proxy; }
};

if (typeof window !== "undefined") {
  window.TRANSLATIONS = TRANSLATIONS;
} else {
  globalThis.TRANSLATIONS = TRANSLATIONS;
}
`;

fs.writeFileSync('translations.js', shimCode);
console.log('Wrote translations.js shim from messages.json');