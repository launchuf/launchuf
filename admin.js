const cfg = window.LAUNCH_CONFIG || {};
const supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const userEmail = document.getElementById('userEmail');

const STATUS_LABELS = { new: 'Ny', contacted: 'Kontaktad', in_progress: 'Pågår', review: 'Granskning', completed: 'Klar', cancelled: 'Avbruten' };
const PAYMENT_LABELS = { unpaid: 'Obetald', pending: 'Väntar', paid: 'Betald', failed: 'Misslyckad', refunded: 'Återbetald' };

let allOrders = [];
let activeFilter = 'all';

/* ---------- auth ---------- */
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) showApp(session);
  else showLogin();
}
function showLogin() {
  loginScreen.hidden = false;
  adminApp.hidden = true;
}
function showApp(session) {
  loginScreen.hidden = true;
  adminApp.hidden = false;
  userEmail.textContent = session.user.email;
  loadOrders();
}
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginError.hidden = true;
  const fd = new FormData(loginForm);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: fd.get('email'), password: fd.get('password'),
  });
  if (error) {
    loginError.textContent = 'Fel e-post eller lösenord.';
    loginError.hidden = false;
    return;
  }
  showApp(data.session);
});
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  showLogin();
});

/* ---------- data ---------- */
async function loadOrders() {
  const tbody = document.getElementById('ordersBody');
  tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Laddar beställningar…</td></tr>`;
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Kunde inte hämta beställningar: ${escapeHtml(error.message)}</td></tr>`;
    return;
  }
  allOrders = data || [];
  renderStats();
  renderTable();
}

function renderStats() {
  const total = allOrders.length;
  const paid = allOrders.filter(o => o.payment_status === 'paid').length;
  const revenue = allOrders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.amount_kr || 0), 0);
  const active = allOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
  const grow = allOrders.filter(o => o.package === 'GROW').length;

  document.getElementById('adminStats').innerHTML = [
    ['Totalt', total],
    ['Betalda', paid],
    ['Intäkt', `${revenue} kr`],
    ['Aktiva', active],
    ['GROW / SCALE', `${grow} / ${total - grow}`],
  ].map(([lbl, num]) => `<div class="mini-stat"><span class="num">${num}</span><span class="lbl">${lbl}</span></div>`).join('');
}

function renderTable() {
  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  const rows = allOrders.filter(o => {
    if (activeFilter !== 'all' && o.status !== activeFilter) return false;
    if (!search) return true;
    return [o.order_number, o.company_name, o.email, o.contact_name].join(' ').toLowerCase().includes(search);
  });

  const tbody = document.getElementById('ordersBody');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Inga beställningar matchar.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(o => `
    <tr data-id="${o.id}">
      <td class="order-num">${escapeHtml(o.order_number)}</td>
      <td>${escapeHtml(o.company_name)}</td>
      <td>${escapeHtml(o.package)}</td>
      <td>${badge(o.payment_status, PAYMENT_LABELS)}</td>
      <td>${badge(o.status, STATUS_LABELS)}</td>
      <td>${formatDate(o.created_at)}</td>
      <td>→</td>
    </tr>`).join('');

  tbody.querySelectorAll('tr[data-id]').forEach(tr => {
    tr.addEventListener('click', () => openDrawer(tr.dataset.id));
  });
}
function badge(value, labels) {
  return `<span class="badge badge-${value}"><span class="badge-dot"></span>${labels[value] || value}</span>`;
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}
function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

document.getElementById('refreshBtn').addEventListener('click', loadOrders);
document.getElementById('searchInput').addEventListener('input', renderTable);
document.getElementById('filterTabs').addEventListener('click', e => {
  const btn = e.target.closest('.filter-tab');
  if (!btn) return;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = btn.dataset.status;
  renderTable();
});

/* ---------- drawer ---------- */
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerContent = document.getElementById('drawerContent');

function openDrawer(id) {
  const o = allOrders.find(x => x.id === id);
  if (!o) return;
  drawerContent.innerHTML = `
    <h2>${escapeHtml(o.company_name)}</h2>
    <p class="order-meta">${escapeHtml(o.order_number)} · ${formatDate(o.created_at)}</p>
    <div class="badges-row">${badge(o.status, STATUS_LABELS)}${badge(o.payment_status, PAYMENT_LABELS)}<span class="badge">${escapeHtml(o.package)}${o.amount_kr ? ' · ' + o.amount_kr + ' kr' : ''}</span></div>

    ${o.logo_url ? `<img class="logo-preview" src="${o.logo_url}" alt="Logga för ${escapeHtml(o.company_name)}">` : ''}

    <div class="detail-grid">
      <div><span>Kontaktperson</span><strong>${escapeHtml(o.contact_name)}</strong></div>
      <div><span>E-post</span><strong>${escapeHtml(o.email)}</strong></div>
      <div><span>Telefon</span><strong>${escapeHtml(o.phone || '—')}</strong></div>
      <div><span>Instagram</span><strong>${escapeHtml(o.instagram || '—')}</strong></div>
      <div><span>TikTok</span><strong>${escapeHtml(o.tiktok || '—')}</strong></div>
      <div><span>Stil</span><strong>${escapeHtml(o.style || '—')}</strong></div>
      <div><span>Färger</span><strong>${escapeHtml(o.colors || '—')}</strong></div>
      <div><span>Lanseringsdatum</span><strong>${o.launch_date || '—'}</strong></div>
    </div>

    <div class="detail-block"><h4>Vad de säljer</h4><p>${escapeHtml(o.business_description || '—')}</p></div>
    ${o.website_feel ? `<div class="detail-block"><h4>Önskad känsla</h4><p>${escapeHtml(o.website_feel)}</p></div>` : ''}
    ${o.pages ? `<div class="detail-block"><h4>Önskade sidor</h4><p>${escapeHtml(o.pages)}</p></div>` : ''}
    ${o.references ? `<div class="detail-block"><h4>Referenser</h4><p>${escapeHtml(o.references)}</p></div>` : ''}
    ${o.extra_information ? `<div class="detail-block"><h4>Övrig information</h4><p>${escapeHtml(o.extra_information)}</p></div>` : ''}

    <div class="status-select-row">
      <label>Orderstatus</label>
      <select id="statusSelect">
        ${Object.entries(STATUS_LABELS).map(([v, l]) => `<option value="${v}" ${o.status === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>
    <div class="status-select-row">
      <label>Betalstatus</label>
      <select id="paymentSelect">
        ${Object.entries(PAYMENT_LABELS).map(([v, l]) => `<option value="${v}" ${o.payment_status === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>

    <div class="drawer-actions">
      <button class="button button-primary" id="saveOrderBtn">Spara ändringar</button>
      ${o.logo_url ? `<a class="button button-ghost" href="${o.logo_url}" download target="_blank" rel="noopener">Ladda ner logga</a>` : ''}
    </div>
  `;

  document.getElementById('saveOrderBtn').addEventListener('click', () => saveOrder(o.id));
  drawerOverlay.classList.add('open');
}
async function saveOrder(id) {
  const status = document.getElementById('statusSelect').value;
  const payment_status = document.getElementById('paymentSelect').value;
  const btn = document.getElementById('saveOrderBtn');
  btn.disabled = true; btn.textContent = 'Sparar…';
  const { error } = await supabase.from('orders').update({ status, payment_status }).eq('id', id);
  btn.disabled = false; btn.textContent = 'Spara ändringar';
  if (error) { alert('Kunde inte spara: ' + error.message); return; }
  await loadOrders();
  drawerOverlay.classList.remove('open');
}
document.getElementById('closeDrawer').addEventListener('click', () => drawerOverlay.classList.remove('open'));
drawerOverlay.addEventListener('click', e => { if (e.target === drawerOverlay) drawerOverlay.classList.remove('open'); });

checkSession();
