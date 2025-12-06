/**
 * Cloud Backup Service for AutoFill Plugin
 * Handles Google Drive and OneDrive authentication and file operations.
 */

const CloudBackup = {
  providers: {
    google: {
      scope: 'https://www.googleapis.com/auth/drive.file',
      // Explicitly using the Web Application Client ID for launchWebAuthFlow
      clientId: '{{GOOGLE_CLIENT_ID}}',
      clientSecret: '{{GOOGLE_CLIENT_SECRET}}',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      folderName: 'AutoFill',
      name: 'Google Drive'
    },
    onedrive: {
      scope: 'offline_access Files.ReadWrite.AppFolder',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      folderName: 'AutoFill',
      name: 'OneDrive'
    }
  },

  async getConfig() {
    const result = await chrome.storage.local.get('cloudConfig');
    return result.cloudConfig || {};
  },

  async saveConfig(provider, config) {
    const current = await this.getConfig();
    current[provider] = { ...(current[provider] || {}), ...config };
    await chrome.storage.local.set({ cloudConfig: current });
    return { success: true };
  },

  async getTokens() {
    const result = await chrome.storage.local.get('cloudTokens');
    return result.cloudTokens || {};
  },

  async saveTokens(provider, tokenData) {
    const tokens = await this.getTokens();
    tokens[provider] = tokenData;
    await chrome.storage.local.set({ cloudTokens: tokens });
  },

  async uploadBackup(provider, csvContent) {
    try {
      const filename = this.buildBackupFilename();
      const accessToken = await this.ensureToken(provider);
      const fileInfo = await this.uploadByProvider(provider, accessToken, filename, csvContent);
      return { success: true, provider, ...fileInfo };
    } catch (error) {
      console.error('Cloud backup failed:', error);
      return { success: false, error: error.message || 'upload_failed', provider };
    }
  },

  async listBackups(provider) {
    try {
      const accessToken = await this.ensureToken(provider);
      const files = await this.listByProvider(provider, accessToken);
      return { success: true, files };
    } catch (error) {
      console.error('List backups failed:', error);
      return { success: false, error: error.message || 'list_failed' };
    }
  },

  async downloadBackup(provider, fileId) {
    try {
      const accessToken = await this.ensureToken(provider);
      const csv = await this.downloadByProvider(provider, accessToken, fileId);
      return { success: true, csv };
    } catch (error) {
      console.error('Download backup failed:', error);
      return { success: false, error: error.message || 'download_failed' };
    }
  },

  async ensureToken(provider) {
    // Config variable injected during build: 'web_app' or 'chrome_extension'
    const authMethod = '{{GOOGLE_AUTH_METHOD}}';

    if (provider === 'google' && authMethod === 'chrome_extension') {
        return this.ensureGoogleTokenNative();
    }
    
    const config = await this.getConfig();
    const providerConfig = config[provider] || {};
    
    // Fallback to hardcoded ID if not in storage (for Google especially)
    if (!providerConfig.clientId && this.providers[provider].clientId) {
        providerConfig.clientId = this.providers[provider].clientId;
    }
    if (!providerConfig.clientSecret && this.providers[provider].clientSecret) {
        providerConfig.clientSecret = this.providers[provider].clientSecret;
    }

    if (!providerConfig || !providerConfig.clientId) {
      throw new Error('missing_client_id');
    }

    const tokens = await this.getTokens();
    const existing = tokens[provider];
    const now = Date.now();
    
    // Check if valid access token exists
    if (existing && existing.accessToken && existing.expiresAt && existing.expiresAt - 60000 > now) {
      return existing.accessToken;
    }

    // Try refresh
    if (existing && existing.refreshToken) {
      try {
        const refreshed = await this.refreshToken(provider, providerConfig, existing.refreshToken);
        await this.saveTokens(provider, refreshed);
        return refreshed.accessToken;
      } catch (error) {
        console.warn('Refresh token failed, falling back to auth flow:', error);
      }
    }

    // New auth
    const fresh = await this.authorize(provider, providerConfig);
    await this.saveTokens(provider, fresh);
    return fresh.accessToken;
  },

  // --- GOOGLE SPECIFIC (Native Chrome Identity for Prod) ---
  
  async ensureGoogleTokenNative() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(token);
        }
      });
    });
  },

  // --- GENERIC OAUTH2 (Used for Dev Google & OneDrive) ---

  async authorize(provider, providerConfig) {
    const meta = this.providers[provider];
    if (!meta) throw new Error('unknown_provider');

    const redirectUri = chrome.identity.getRedirectURL(); // Standard redirect URI
    const state = `${provider}-${Math.random().toString(36).slice(2)}`;
    const { verifier, challenge } = await this.createPkcePair();

    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: meta.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });

    let authUrlBase = meta.authUrl;
    let tokenUrlBase = meta.tokenUrl;

    if (provider === 'onedrive' && providerConfig.tenant) {
      authUrlBase = `https://login.microsoftonline.com/${providerConfig.tenant}/oauth2/v2.0/authorize`;
      tokenUrlBase = `https://login.microsoftonline.com/${providerConfig.tenant}/oauth2/v2.0/token`;
    }

    const authUrl = `${authUrlBase}?${params.toString()}`;
    
    // Launch Web Auth Flow
    const redirect = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (responseUrl) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(responseUrl);
            }
        });
    });

    if (!redirect) throw new Error('auth_cancelled');
    
    const redirectParams = new URL(redirect).searchParams;
    const returnedState = redirectParams.get('state');
    if (returnedState !== state) {
      throw new Error('state_mismatch');
    }
    const code = redirectParams.get('code');
    if (!code) throw new Error('missing_code');

    // Exchange code for token
    const tokenBody = new URLSearchParams({
      client_id: providerConfig.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    });

    if (providerConfig.clientSecret) {
      tokenBody.append('client_secret', providerConfig.clientSecret);
    }

    const tokenResponse = await fetch(tokenUrlBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString()
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`token_exchange_failed: ${errText}`);
    }

    const tokenJson = await tokenResponse.json();
    return {
      accessToken: tokenJson.access_token,
      refreshToken: tokenJson.refresh_token,
      expiresAt: Date.now() + ((tokenJson.expires_in || 3600) * 1000)
    };
  },

  async refreshToken(provider, providerConfig, refreshToken) {
    const meta = this.providers[provider];
    let tokenUrlBase = meta.tokenUrl;
    const body = new URLSearchParams({
      client_id: providerConfig.clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    if (providerConfig.clientSecret) {
      body.append('client_secret', providerConfig.clientSecret);
    }

    if (provider === 'onedrive' && providerConfig.tenant) {
      tokenUrlBase = `https://login.microsoftonline.com/${providerConfig.tenant}/oauth2/v2.0/token`;
    }

    const res = await fetch(tokenUrlBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`refresh_failed: ${text}`);
    }
    const json = await res.json();
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token || refreshToken,
      expiresAt: Date.now() + ((json.expires_in || 3600) * 1000)
    };
  },

  // --- FILE OPERATIONS ---

  async uploadByProvider(provider, accessToken, filename, csvContent) {
    if (provider === 'google') {
      const folderId = await this.ensureGoogleFolder(accessToken);

      const metadata = {
        name: filename,
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([csvContent], { type: 'text/csv' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`google_upload_failed: ${text}`);
      }

      const json = await res.json();
      return { fileId: json.id, fileName: metadata.name };
    }

    if (provider === 'onedrive') {
      await this.ensureOneDriveFolder(accessToken);
      const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/AutoFill/${filename}:/content`;
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/csv'
        },
        body: csvContent
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`onedrive_upload_failed: ${text}`);
      }

      const json = await res.json();
      return { fileId: json.id, fileName: filename };
    }

    throw new Error('unknown_provider');
  },

  async listByProvider(provider, accessToken) {
    if (provider === 'google') {
      const folderId = await this.ensureGoogleFolder(accessToken);
      const query = encodeURIComponent(`'${folderId}' in parents and mimeType='text/csv' and name contains 'AutoFill-' and trashed=false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=20&fields=files(id,name,modifiedTime,size)`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`google_list_failed: ${text}`);
      }
      const json = await res.json();
      return json.files || [];
    }

    if (provider === 'onedrive') {
      await this.ensureOneDriveFolder(accessToken);
      const listUrl = 'https://graph.microsoft.com/v1.0/me/drive/special/approot:/AutoFill:/children?$orderby=lastModifiedDateTime desc&$top=20';
      const res = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`onedrive_list_failed: ${text}`);
      }
      const json = await res.json();
      if (!json.value) return [];
      return json.value.map(item => ({
        id: item.id,
        name: item.name,
        modifiedTime: item.lastModifiedDateTime,
        size: item.size
      }));
    }

    throw new Error('unknown_provider');
  },

  async downloadByProvider(provider, accessToken, fileId) {
    if (provider === 'google') {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`google_download_failed: ${text}`);
      }
      return await res.text();
    }

    if (provider === 'onedrive') {
      const url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`onedrive_download_failed: ${text}`);
      }
      return await res.text();
    }

    throw new Error('unknown_provider');
  },

  async ensureGoogleFolder(accessToken) {
    const name = this.providers.google.folderName;
    const query = encodeURIComponent(`name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)`;
    const res = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`google_folder_list_failed: ${text}`);
    }
    const json = await res.json();
    if (json.files && json.files.length > 0) {
      return json.files[0].id;
    }

    // Create folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`google_folder_create_failed: ${text}`);
    }
    const folder = await createRes.json();
    return folder.id;
  },

  async ensureOneDriveFolder(accessToken) {
    const name = this.providers.onedrive.folderName;
    const listUrl = 'https://graph.microsoft.com/v1.0/me/drive/special/approot/children';
    const res = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (res.ok) {
      const json = await res.json();
      const exists = (json.value || []).some(item => item.name === name && item.folder);
      if (exists) return true;
    }

    const createUrl = 'https://graph.microsoft.com/v1.0/me/drive/special/approot/children';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      })
    });

    if (!createRes.ok && createRes.status !== 409) {
      const text = await createRes.text();
      throw new Error(`onedrive_folder_create_failed: ${text}`);
    }
    return true;
  },

  buildBackupFilename() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join('');
    return `AutoFill-${date}-${time}.csv`;
  },

  async createPkcePair() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = this.base64UrlEncode(array);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const challenge = this.base64UrlEncode(new Uint8Array(digest));
    return { verifier, challenge };
  },

  base64UrlEncode(buffer) {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
};
