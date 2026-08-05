'use strict';

const api = window.SOS_API;
document.body.innerHTML = `
  <header class="admin-topbar">
    <a class="admin-brand" href="./" aria-label="Administração S.O.S Filtros">
      <span class="brand-mark" aria-hidden="true">S</span>
      <span><strong>S.O.S Filtros</strong><small>Administração</small></span>
    </a>
    <div class="account-actions hidden" id="accountActions">
      <span id="adminEmail"></span>
      <button class="button subtle" id="logoutButton" type="button">Sair</button>
    </div>
  </header>

  <main class="admin-main">
    <section class="auth-layout" id="loginView">
      <div class="auth-copy">
        <p class="eyebrow">ACESSO DO PROPRIETÁRIO</p>
        <h1>Seu negócio,<br><em>sob seu controle.</em></h1>
        <p>Atualize textos, números, produtos, serviços, imagens e avaliações em um único lugar.</p>
        <div class="security-note"><span aria-hidden="true">✓</span> Acesso protegido por e-mail, senha e regras no banco de dados.</div>
      </div>
      <form class="panel auth-card" id="loginForm">
        <div>
          <p class="eyebrow">ENTRAR</p>
          <h2>Área administrativa</h2>
          <p class="muted">Use o e-mail autorizado para acessar.</p>
        </div>
        <label>E-mail<input name="email" type="email" autocomplete="username" required placeholder="seu@email.com"></label>
        <label>Senha<input name="password" type="password" autocomplete="current-password" required minlength="10" placeholder="Sua senha"></label>
        <button class="button primary" type="submit">Entrar com segurança</button>
        <p class="form-message" id="loginMessage" aria-live="polite"></p>
      </form>
    </section>

    <section class="dashboard hidden" id="dashboardView">
      <div class="dashboard-heading">
        <div><p class="eyebrow">PAINEL DE CONTROLE</p><h1>Gerencie o site</h1></div>
        <p>As alterações salvas aqui serão usadas pelo site quando ele voltar ao ar.</p>
      </div>

      <nav class="admin-tabs" aria-label="Seções do painel">
        <button class="active" type="button" data-tab="general">Informações</button>
        <button type="button" data-tab="catalog">Catálogo</button>
        <button type="button" data-tab="feedback">Avaliações <span id="pendingBadge">0</span></button>
      </nav>

      <section class="tab-panel active" id="tab-general">
        <form class="panel content-form" id="settingsForm">
          <div class="panel-heading"><div><p class="eyebrow">INFORMAÇÕES PRINCIPAIS</p><h2>Textos e números</h2></div><span class="save-state" id="settingsState"></span></div>
          <div class="form-grid">
            <label>Nome da empresa<input name="brand" required maxlength="80"></label>
            <label>WhatsApp com DDD e país<input name="whatsapp" inputmode="numeric" pattern="[0-9]{10,15}" required placeholder="5511999999999"></label>
            <label class="wide">Título principal<textarea name="hero_title" rows="2" required maxlength="180"></textarea></label>
            <label class="wide">Texto de apresentação<textarea name="hero_subtitle" rows="4" required maxlength="500"></textarea></label>
            <label>Clientes atendidos<input name="customer_count" required maxlength="24" placeholder="1.500"></label>
            <label>Avaliação média<input name="rating_value" type="number" min="0" max="5" step="0.1" required></label>
          </div>
          <div class="form-actions"><button class="button primary" type="submit">Salvar informações</button></div>
        </form>
      </section>

      <section class="tab-panel" id="tab-catalog">
        <div class="panel catalog-panel">
          <div class="panel-heading">
            <div><p class="eyebrow">SERVIÇOS E PRODUTOS</p><h2>Catálogo</h2><p class="muted">Altere preço, descrição, imagem, ordem e visibilidade.</p></div>
            <button class="button primary" id="addItemButton" type="button">+ Novo item</button>
          </div>
          <div class="catalog-admin-list" id="catalogAdminList"></div>
        </div>
      </section>

      <section class="tab-panel" id="tab-feedback">
        <div class="panel feedback-panel">
          <div class="panel-heading"><div><p class="eyebrow">OPINIÃO DOS CLIENTES</p><h2>Avaliações</h2><p class="muted">Analise os comentários antes de publicá-los ou arquivá-los.</p></div></div>
          <div class="feedback-admin-list" id="feedbackAdminList"></div>
        </div>
      </section>
    </section>
  </main>

  <div class="admin-toast" id="adminToast" role="status" aria-live="polite"></div>`;
let adminData = { settings: null, items: [], feedbacks: [] };

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
})[character]);

function showOnly(view) {
  ['#loginView', '#dashboardView'].forEach((selector) => $(selector).classList.add('hidden'));
  $(view).classList.remove('hidden');
  $('#accountActions').classList.toggle('hidden', view !== '#dashboardView');
}

function setMessage(element, message, type = '') {
  element.textContent = message;
  element.className = `form-message ${type}`.trim();
}

function toast(message) {
  const element = $('#adminToast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2800);
}

function friendlyError(error) {
  if (error?.status === 401 || /invalid login credentials/i.test(error?.message || '')) return 'E-mail ou senha inválidos.';
  if (error?.status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (/email not confirmed/i.test(error?.message || '')) return 'Confirme o e-mail antes de entrar.';
  return 'Não foi possível concluir agora. Tente novamente.';
}

function fillSettings() {
  const form = $('#settingsForm');
  if (!adminData.settings) return;
  for (const [name, value] of Object.entries(adminData.settings)) {
    if (form.elements[name]) form.elements[name].value = value ?? '';
  }
}

function itemPreview(item) {
  if (item.image_path) {
    return `<img src="${escapeHtml(api.getPublicImageUrl(item.image_path))}" alt="Imagem de ${escapeHtml(item.name)}">`;
  }
  return `<span>${escapeHtml(item.icon || '◆')}</span>`;
}

function renderCatalogAdmin() {
  const list = $('#catalogAdminList');
  list.innerHTML = adminData.items.map((item) => `<form class="catalog-admin-item" data-item-id="${Number(item.id)}">
    <div class="image-editor">
      <div class="admin-preview">${itemPreview(item)}</div>
      <label class="file-button">Alterar imagem<input name="image" type="file" accept="image/jpeg,image/png,image/webp"></label>
    </div>
    <div class="catalog-item-fields">
      <label>Nome<input name="name" required maxlength="120" value="${escapeHtml(item.name)}"></label>
      <label>Tipo<select name="type"><option value="servico"${item.type === 'servico' ? ' selected' : ''}>Serviço</option><option value="produto"${item.type === 'produto' ? ' selected' : ''}>Produto</option></select></label>
      <label>Preço<input name="price" type="number" min="0" step="0.01" required value="${Number(item.price).toFixed(2)}"></label>
      <label>Ordem<input name="position" type="number" min="0" step="1" required value="${Number(item.position)}"></label>
      <label class="description">Descrição<textarea name="description" rows="3" required maxlength="800">${escapeHtml(item.description)}</textarea></label>
      <label>Ícone<input name="icon" maxlength="12" required value="${escapeHtml(item.icon || '◆')}"></label>
      <label class="active-field"><input name="active" type="checkbox"${item.active ? ' checked' : ''}><span>Visível no site</span></label>
      <div class="catalog-item-actions"><button class="button subtle" type="submit">Salvar item</button><button class="button danger" type="button" data-delete-item="${Number(item.id)}">Excluir</button></div>
    </div>
  </form>`).join('') || '<div class="feedback-empty">Nenhum item no catálogo.</div>';

  list.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const preview = input.closest('.image-editor').querySelector('.admin-preview');
      preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Prévia da nova imagem">`;
    });
  });
}

const statusLabels = { pending: 'Pendente', published: 'Publicada', archived: 'Arquivada' };

function renderFeedbackAdmin() {
  const list = $('#feedbackAdminList');
  const pending = adminData.feedbacks.filter((feedback) => feedback.status === 'pending').length;
  $('#pendingBadge').textContent = String(pending);
  list.innerHTML = adminData.feedbacks.map((feedback) => {
    const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(feedback.created_at));
    return `<article class="feedback-card">
      <div><div class="feedback-meta"><span class="feedback-name">${escapeHtml(feedback.name)}</span><span class="feedback-stars">${'★'.repeat(Number(feedback.rating))}${'☆'.repeat(5 - Number(feedback.rating))}</span><span class="feedback-date">${escapeHtml(date)}</span><span class="status-pill">${statusLabels[feedback.status] || 'Pendente'}</span></div><p class="feedback-message">${escapeHtml(feedback.message)}</p></div>
      <div class="feedback-actions">
        ${feedback.status !== 'published' ? `<button class="button subtle" type="button" data-feedback-status="published" data-feedback-id="${Number(feedback.id)}">Publicar</button>` : `<button class="button subtle" type="button" data-feedback-status="archived" data-feedback-id="${Number(feedback.id)}">Arquivar</button>`}
        <button class="button danger" type="button" data-delete-feedback="${Number(feedback.id)}">Excluir</button>
      </div>
    </article>`;
  }).join('') || '<div class="feedback-empty">Ainda não há avaliações recebidas.</div>';
}

async function loadAdminData() {
  adminData = await api.getAdminContent();
  fillSettings();
  renderCatalogAdmin();
  renderFeedbackAdmin();
}

async function openDashboard() {
  const allowed = await api.isAdmin();
  if (!allowed) {
    await api.signOut();
    throw new Error('Conta sem permissão de administrador.');
  }
  const user = await api.getUser();
  $('#adminEmail').textContent = user?.email || 'Administrador';
  await loadAdminData();
  showOnly('#dashboardView');
}

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const message = $('#loginMessage');
  const values = new FormData(form);
  button.disabled = true;
  setMessage(message, 'Verificando acesso…');
  try {
    await api.signIn(values.get('email'), values.get('password'));
    await openDashboard();
    form.reset();
  } catch (error) {
    setMessage(message, error?.message === 'Conta sem permissão de administrador.' ? error.message : friendlyError(error), 'error');
  } finally {
    button.disabled = false;
  }
});

$('#logoutButton').addEventListener('click', async () => {
  await api.signOut();
  showOnly('#loginView');
  setMessage($('#loginMessage'), 'Sessão encerrada com segurança.', 'success');
});

document.querySelectorAll('[data-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach((tab) => tab.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
    button.classList.add('active');
    $(`#tab-${button.dataset.tab}`).classList.add('active');
  });
});

$('#settingsForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const values = new FormData(form);
  button.disabled = true;
  $('#settingsState').textContent = 'Salvando…';
  try {
    const rows = await api.updateSettings({
      brand: values.get('brand').trim(),
      hero_title: values.get('hero_title').trim(),
      hero_subtitle: values.get('hero_subtitle').trim(),
      whatsapp: values.get('whatsapp').replace(/\D/g, ''),
      customer_count: values.get('customer_count').trim(),
      rating_value: Number(values.get('rating_value'))
    });
    adminData.settings = rows[0];
    $('#settingsState').textContent = 'Alterações salvas';
    toast('Informações atualizadas.');
  } catch (error) {
    $('#settingsState').textContent = '';
    toast(friendlyError(error));
  } finally {
    button.disabled = false;
  }
});

$('#addItemButton').addEventListener('click', async () => {
  const button = $('#addItemButton');
  button.disabled = true;
  try {
    const highestPosition = adminData.items.reduce((highest, item) => Math.max(highest, Number(item.position) || 0), 0);
    await api.createCatalogItem({
      type: 'servico', icon: '◆', name: 'Novo item', description: 'Adicione aqui a descrição do item.', price: 0, position: highestPosition + 10, active: false
    });
    await loadAdminData();
    $('#catalogAdminList').lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Novo item criado como oculto.');
  } catch (error) {
    toast(friendlyError(error));
  } finally {
    button.disabled = false;
  }
});

$('#catalogAdminList').addEventListener('submit', async (event) => {
  const form = event.target.closest('.catalog-admin-item');
  if (!form) return;
  event.preventDefault();
  const id = Number(form.dataset.itemId);
  const values = new FormData(form);
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const image = form.elements.image.files[0];
    const current = adminData.items.find((item) => Number(item.id) === id);
    const imagePath = image ? await api.uploadCatalogImage(image) : current.image_path;
    const rows = await api.updateCatalogItem(id, {
      name: values.get('name').trim(),
      type: values.get('type'),
      price: Number(values.get('price')),
      position: Math.max(0, Math.trunc(Number(values.get('position')))),
      description: values.get('description').trim(),
      icon: values.get('icon').trim() || '◆',
      active: values.get('active') === 'on',
      image_path: imagePath || null
    });
    adminData.items = adminData.items.map((item) => Number(item.id) === id ? rows[0] : item);
    renderCatalogAdmin();
    toast('Item atualizado.');
  } catch (error) {
    toast(error?.message || friendlyError(error));
  } finally {
    button.disabled = false;
  }
});

$('#catalogAdminList').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-delete-item]');
  if (!button) return;
  const id = Number(button.dataset.deleteItem);
  const item = adminData.items.find((entry) => Number(entry.id) === id);
  if (!confirm(`Excluir “${item?.name || 'este item'}” do catálogo?`)) return;
  button.disabled = true;
  try {
    await api.deleteCatalogItem(id);
    adminData.items = adminData.items.filter((entry) => Number(entry.id) !== id);
    renderCatalogAdmin();
    toast('Item excluído.');
  } catch (error) {
    toast(friendlyError(error));
    button.disabled = false;
  }
});

$('#feedbackAdminList').addEventListener('click', async (event) => {
  const statusButton = event.target.closest('[data-feedback-status]');
  const deleteButton = event.target.closest('[data-delete-feedback]');
  if (!statusButton && !deleteButton) return;
  const button = statusButton || deleteButton;
  button.disabled = true;
  try {
    if (statusButton) {
      const id = Number(statusButton.dataset.feedbackId);
      const rows = await api.updateFeedback(id, statusButton.dataset.feedbackStatus);
      adminData.feedbacks = adminData.feedbacks.map((entry) => Number(entry.id) === id ? rows[0] : entry);
      toast('Avaliação atualizada.');
    } else {
      const id = Number(deleteButton.dataset.deleteFeedback);
      if (!confirm('Excluir esta avaliação permanentemente?')) {
        button.disabled = false;
        return;
      }
      await api.deleteFeedback(id);
      adminData.feedbacks = adminData.feedbacks.filter((entry) => Number(entry.id) !== id);
      toast('Avaliação excluída.');
    }
    renderFeedbackAdmin();
  } catch (error) {
    toast(friendlyError(error));
    button.disabled = false;
  }
});

async function initialize() {
  if (!api.getStoredSession()) {
    showOnly('#loginView');
    return;
  }
  try {
    await openDashboard();
  } catch {
    showOnly('#loginView');
  }
}

initialize();

