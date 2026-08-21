'use strict';

const defaults = {
  brand: 'S.O.S Filtros',
  title: 'Pureza e confiança em cada gota.',
  subtitle: 'Serviços rápidos e produtos selecionados para manter seu sistema de filtragem eficiente, seguro e confiável.',
  whatsapp: '5511999999999',
  customerCount: '1.500',
  ratingValue: '4.9',
  items: [
    { id: 1, type: 'servico', icon: '◆', name: 'Serviço cadastrado pelo administrador', description: 'Consulte a disponibilidade e solicite atendimento especializado.', price: 0 },
    { id: 2, type: 'produto', icon: '◎', name: 'Produto cadastrado pelo administrador', description: 'Consulte os produtos disponíveis e fale com nossa equipe.', price: 0 }
  ]
};

let data = { ...defaults, items: defaults.items.map((item) => ({ ...item })) };
let cart = [];
let currentFilter = 'todos';
let selectedRating = 0;

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
})[character]);
const money = (value) => Number(value || 0) > 0
  ? Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : 'Sob consulta';

const elements = {
  brandName: $('#brandName'),
  footerBrand: $('#footerBrand'),
  heroTitle: $('#heroTitle'),
  heroSubtitle: $('#heroSubtitle'),
  customerCount: $('#customerCount'),
  ratingValue: $('#ratingValue'),
  whatsappLink: $('#whatsappLink'),
  catalogGrid: $('#catalogGrid'),
  cartCount: $('#cartCount'),
  cartItems: $('#cartItems'),
  cartTotal: $('#cartTotal'),
  cartDrawer: $('#cartDrawer'),
  drawerBackdrop: $('#drawerBackdrop'),
  checkoutDialog: $('#checkoutDialog'),
  toast: $('#toast')
};

function whatsappUrl(message) {
  const url = new URL(`https://wa.me/${data.whatsapp}`);
  url.searchParams.set('text', message);
  return url.toString();
}

function renderHeroTitle(value) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  const accentStart = Math.max(1, words.length - 3);
  const regularText = words.slice(0, accentStart).join(' ');
  const accentText = words.slice(accentStart).join(' ');
  const accent = document.createElement('em');
  accent.textContent = accentText;
  elements.heroTitle.replaceChildren(document.createTextNode(`${regularText} `), accent);
}

function renderGeneral() {
  elements.brandName.textContent = data.brand;
  elements.footerBrand.textContent = data.brand;
  renderHeroTitle(data.title);
  elements.heroSubtitle.textContent = data.subtitle;
  elements.customerCount.textContent = `+${data.customerCount}`;
  elements.ratingValue.textContent = data.ratingValue;
  elements.whatsappLink.href = whatsappUrl('Olá! Gostaria de solicitar atendimento da S.O.S Filtros.');
  document.title = `${data.brand} | Manutenção, Serviços e Produtos`;
}

function renderCatalog() {
  const visibleItems = data.items.filter((item) => currentFilter === 'todos' || item.type === currentFilter);
  elements.catalogGrid.innerHTML = visibleItems.map((item) => {
    const name = escapeHtml(item.name);
    const description = escapeHtml(item.description);
    const type = item.type === 'produto' ? 'produto' : 'servico';
    const icon = escapeHtml(item.icon || '◆');
    const imageUrl = item.image_path ? window.SOS_API.getPublicImageUrl(item.image_path) : '';
    const visual = imageUrl
      ? `<img class="item-image" src="${escapeHtml(imageUrl)}" alt="${name}" loading="lazy">`
      : `<span class="card-icon">${icon}</span>`;
    return `<article class="catalog-card reveal">
      <div class="card-visual ${type}">${visual}<span class="type-tag">${type}</span></div>
      <div class="card-content"><h3>${name}</h3><p>${description}</p>
        <div class="card-bottom"><span class="price">${money(item.price)}</span>
          <button class="add-button" data-add="${Number(item.id)}" aria-label="Adicionar ${name}">+</button>
        </div>
      </div>
    </article>`;
  }).join('') || '<p>Nenhum item nesta categoria.</p>';
  document.dispatchEvent(new CustomEvent('catalog:rendered'));
}

function renderCart() {
  elements.cartCount.textContent = String(cart.length);
  elements.cartItems.innerHTML = cart.length
    ? cart.map((item, index) => `<div class="cart-item"><div><h4>${escapeHtml(item.name)}</h4><small>${item.type === 'servico' ? 'Contratação' : 'Produto'} · ${money(item.price)}</small></div><button class="remove" data-remove="${index}">Remover</button></div>`).join('')
    : '<div class="cart-empty">Seu carrinho está vazio.<br>Explore o catálogo para começar.</div>';
  elements.cartTotal.textContent = money(cart.reduce((total, item) => total + Number(item.price || 0), 0));
}

function toast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => elements.toast.classList.remove('show'), 2500);
}

function openCart() {
  elements.cartDrawer.classList.add('open');
  elements.drawerBackdrop.classList.add('open');
  elements.cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drawer-open');
  $('[data-close="cart"]').focus();
}

function closeCart() {
  elements.cartDrawer.classList.remove('open');
  elements.drawerBackdrop.classList.remove('open');
  elements.cartDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('drawer-open');
}

async function loadPublicContent() {
  try {
    const { settings, items } = await window.SOS_API.getPublicContent();
    if (settings) {
      data = {
        ...data,
        brand: settings.brand,
        title: settings.hero_title,
        subtitle: settings.hero_subtitle,
        whatsapp: settings.whatsapp,
        customerCount: settings.customer_count,
        ratingValue: Number(settings.rating_value).toFixed(1)
      };
    }
    if (Array.isArray(items) && items.length) {
      data.items = items.map((item) => ({ ...item, price: Number(item.price) }));
    }
    renderGeneral();
    renderCatalog();
  } catch {
    toast('O catálogo será atualizado quando a conexão voltar.');
  }
}

document.querySelectorAll('.filters button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filters button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.dataset.filter;
    renderCatalog();
  });
});

elements.catalogGrid.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add]');
  if (!addButton) return;
  const item = data.items.find((entry) => Number(entry.id) === Number(addButton.dataset.add));
  if (!item) return;
  cart.push({ ...item });
  renderCart();
  toast('Item adicionado ao carrinho');
});

elements.cartItems.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove]');
  if (!removeButton) return;
  cart.splice(Number(removeButton.dataset.remove), 1);
  renderCart();
});

$('#openCart').addEventListener('click', openCart);
elements.drawerBackdrop.addEventListener('click', closeCart);
$('[data-close="cart"]').addEventListener('click', closeCart);

$('#menuToggle').addEventListener('click', () => {
  const navigation = $('#mainNav');
  navigation.classList.toggle('open');
  const isOpen = navigation.classList.contains('open');
  $('#menuToggle').setAttribute('aria-expanded', isOpen);
  $('#menuToggle').setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
});
document.querySelectorAll('#mainNav a').forEach((link) => link.addEventListener('click', () => {
  $('#mainNav').classList.remove('open');
  $('#menuToggle').setAttribute('aria-expanded', 'false');
  $('#menuToggle').setAttribute('aria-label', 'Abrir menu');
}));

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (elements.cartDrawer.classList.contains('open')) {
    closeCart();
    $('#openCart').focus();
  }
  $('#mainNav').classList.remove('open');
  $('#menuToggle').setAttribute('aria-expanded', 'false');
  $('#menuToggle').setAttribute('aria-label', 'Abrir menu');
});

$('#contactForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const message = `Olá! Sou ${form.get('name')}.\n\n${form.get('subject')}\n${form.get('message')}\n\nE-mail: ${form.get('email')}`;
  $('#formStatus').textContent = 'Abrindo uma conversa no WhatsApp…';
  window.open(whatsappUrl(message), '_blank', 'noopener');
});

$('#checkoutButton').addEventListener('click', () => {
  if (!cart.length) return toast('Adicione um item antes de finalizar');
  closeCart();
  elements.checkoutDialog.showModal();
});

$('#checkoutForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const summary = cart.map((item) => `• ${item.name} — ${money(item.price)}`).join('\n');
  const total = money(cart.reduce((sum, item) => sum + Number(item.price || 0), 0));
  const message = `Olá! Sou ${form.get('name')} e quero confirmar este pedido:\n\n${summary}\n\nTotal: ${total}\nPagamento: ${form.get('payment')}`;
  window.open(whatsappUrl(message), '_blank', 'noopener');
  elements.checkoutDialog.close();
  cart = [];
  renderCart();
  toast('Pedido preparado com sucesso!');
});

document.querySelectorAll('#feedbackStars button').forEach((button) => {
  button.addEventListener('click', () => {
    selectedRating = Number(button.dataset.star);
    document.querySelectorAll('#feedbackStars button').forEach((star) => {
      star.classList.toggle('selected', Number(star.dataset.star) <= selectedRating);
    });
  });
});

$('#feedbackForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = $('#feedbackStatus');
  if (!selectedRating) {
    status.textContent = 'Escolha de 1 a 5 estrelas.';
    return;
  }
  const button = event.currentTarget.querySelector('[type="submit"]');
  const form = new FormData(event.currentTarget);
  button.disabled = true;
  status.textContent = 'Enviando…';
  try {
    await window.SOS_API.submitFeedback({
      name: form.get('name'),
      rating: selectedRating,
      message: form.get('message')
    });
    event.currentTarget.reset();
    selectedRating = 0;
    document.querySelectorAll('#feedbackStars button').forEach((star) => star.classList.remove('selected'));
    status.textContent = 'Obrigado! Sua avaliação foi enviada para análise.';
  } catch {
    status.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
  } finally {
    button.disabled = false;
  }
});

$('#year').textContent = String(new Date().getFullYear());
renderGeneral();
renderCatalog();
renderCart();
loadPublicContent();
