(function () {
  'use strict';

  const config = window.SOS_CONFIG;
  if (!config?.supabaseUrl || !config?.supabaseKey) {
    throw new Error('A configuração do Supabase não foi carregada.');
  }

  const sessionKey = 'sos-admin-session';
  const jsonHeaders = { 'Content-Type': 'application/json' };

  class ApiError extends Error {
    constructor(message, status, details) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.details = details;
    }
  }

  const readJson = (value) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  class SosApi {
    constructor({ supabaseUrl, supabaseKey }) {
      this.url = supabaseUrl.replace(/\/$/, '');
      this.key = supabaseKey;
    }

    getStoredSession() {
      const session = readJson(sessionStorage.getItem(sessionKey));
      return session?.accessToken && session?.refreshToken ? session : null;
    }

    saveSession(payload) {
      const expiresIn = Number(payload.expires_in) || 3600;
      const session = {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        expiresAt: payload.expires_at
          ? Number(payload.expires_at) * 1000
          : Date.now() + expiresIn * 1000,
        user: payload.user || null
      };
      sessionStorage.setItem(sessionKey, JSON.stringify(session));
      return session;
    }

    clearSession() {
      sessionStorage.removeItem(sessionKey);
    }

    async authFetch(path, { method = 'POST', body, token } = {}) {
      const response = await fetch(`${this.url}/auth/v1${path}`, {
        method,
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${token || this.key}`,
          ...jsonHeaders
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const text = await response.text();
      const payload = readJson(text) || text;
      if (!response.ok) {
        const message = payload?.msg || payload?.message || payload?.error_description || 'Falha na autenticação.';
        throw new ApiError(message, response.status, payload);
      }
      return payload;
    }

    async signIn(email, password) {
      const payload = await this.authFetch('/token?grant_type=password', {
        body: { email: email.trim().toLowerCase(), password }
      });
      return this.saveSession(payload);
    }

    async refreshSession() {
      const current = this.getStoredSession();
      if (!current) return null;
      try {
        const payload = await this.authFetch('/token?grant_type=refresh_token', {
          body: { refresh_token: current.refreshToken }
        });
        return this.saveSession(payload);
      } catch (error) {
        this.clearSession();
        throw error;
      }
    }

    async getSession() {
      const current = this.getStoredSession();
      if (!current) return null;
      if (current.expiresAt - Date.now() < 60_000) return this.refreshSession();
      return current;
    }

    async signOut() {
      const session = this.getStoredSession();
      try {
        if (session) await this.authFetch('/logout', { token: session.accessToken });
      } finally {
        this.clearSession();
      }
    }

    async getUser() {
      const session = await this.getSession();
      if (!session) return null;
      return this.authFetch('/user', { method: 'GET', token: session.accessToken });
    }

    async request(path, { method = 'GET', body, auth = false, prefer } = {}) {
      const session = auth ? await this.getSession() : null;
      if (auth && !session) throw new ApiError('Sua sessão expirou.', 401);
      const response = await fetch(`${this.url}/rest/v1/${path}`, {
        method,
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${session?.accessToken || this.key}`,
          Accept: 'application/json',
          ...(body === undefined ? {} : jsonHeaders),
          ...(prefer ? { Prefer: prefer } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const text = await response.text();
      const payload = readJson(text) ?? text;
      if (!response.ok) {
        const message = payload?.message || payload?.details || 'Não foi possível concluir a operação.';
        throw new ApiError(message, response.status, payload);
      }
      return payload;
    }

    async getPublicContent() {
      const [settingsRows, items] = await Promise.all([
        this.request('site_settings?select=brand,hero_title,hero_subtitle,whatsapp,customer_count,rating_value&id=eq.1'),
        this.request('catalog_items?select=id,type,icon,name,description,price,image_path,position&active=eq.true&order=position.asc,id.asc')
      ]);
      return { settings: settingsRows[0] || null, items };
    }

    async submitFeedback({ name, rating, message }) {
      return this.request('feedbacks', {
        method: 'POST',
        body: { name: name.trim(), rating: Number(rating), message: message.trim(), status: 'pending' },
        prefer: 'return=minimal'
      });
    }

    async isAdmin() {
      const result = await this.request('rpc/current_user_is_admin', {
        method: 'POST',
        body: {},
        auth: true
      });
      return result === true;
    }

    async getAdminContent() {
      const [settingsRows, items, feedbacks] = await Promise.all([
        this.request('site_settings?select=*&id=eq.1', { auth: true }),
        this.request('catalog_items?select=*&order=position.asc,id.asc', { auth: true }),
        this.request('feedbacks?select=*&order=created_at.desc', { auth: true })
      ]);
      return { settings: settingsRows[0] || null, items, feedbacks };
    }

    updateSettings(values) {
      return this.request('site_settings?id=eq.1', {
        method: 'PATCH',
        body: values,
        auth: true,
        prefer: 'return=representation'
      });
    }

    createCatalogItem(values) {
      return this.request('catalog_items', {
        method: 'POST',
        body: values,
        auth: true,
        prefer: 'return=representation'
      });
    }

    updateCatalogItem(id, values) {
      return this.request(`catalog_items?id=eq.${Number(id)}`, {
        method: 'PATCH',
        body: values,
        auth: true,
        prefer: 'return=representation'
      });
    }

    deleteCatalogItem(id) {
      return this.request(`catalog_items?id=eq.${Number(id)}`, {
        method: 'DELETE',
        auth: true,
        prefer: 'return=minimal'
      });
    }

    updateFeedback(id, status) {
      return this.request(`feedbacks?id=eq.${Number(id)}`, {
        method: 'PATCH',
        body: { status },
        auth: true,
        prefer: 'return=representation'
      });
    }

    deleteFeedback(id) {
      return this.request(`feedbacks?id=eq.${Number(id)}`, {
        method: 'DELETE',
        auth: true,
        prefer: 'return=minimal'
      });
    }

    getPublicImageUrl(path) {
      if (!path) return '';
      const encodedPath = String(path).split('/').map(encodeURIComponent).join('/');
      return `${this.url}/storage/v1/object/public/catalogo/${encodedPath}`;
    }

    async uploadCatalogImage(file) {
      const allowedTypes = new Map([
        ['image/jpeg', 'jpg'],
        ['image/png', 'png'],
        ['image/webp', 'webp']
      ]);
      if (!allowedTypes.has(file.type)) throw new ApiError('Use uma imagem JPG, PNG ou WEBP.', 400);
      if (file.size > 5 * 1024 * 1024) throw new ApiError('A imagem deve ter no máximo 5 MB.', 400);
      const session = await this.getSession();
      if (!session) throw new ApiError('Sua sessão expirou.', 401);
      const month = new Date().toISOString().slice(0, 7);
      const path = `itens/${month}/${crypto.randomUUID()}.${allowedTypes.get(file.type)}`;
      const response = await fetch(`${this.url}/storage/v1/object/catalogo/${path}`, {
        method: 'POST',
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': file.type,
          'x-upsert': 'false'
        },
        body: file
      });
      const text = await response.text();
      const payload = readJson(text) ?? text;
      if (!response.ok) {
        throw new ApiError(payload?.message || 'Não foi possível enviar a imagem.', response.status, payload);
      }
      return path;
    }
  }

  window.SosApiError = ApiError;
  window.SOS_API = new SosApi(config);
})();

