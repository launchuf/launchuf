const cfg = window.LAUNCH_CONFIG || {};

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loadError = document.getElementById('loadError');
const loginBtn = document.getElementById('loginBtn');
const userEmail = document.getElementById('userEmail');

let supabaseClient;

const STATUS_LABELS = {
  new: 'Ny',
  contacted: 'Kontaktad',
  in_progress: 'Pågår',
  review: 'Granskning',
  completed: 'Klar',
  cancelled: 'Avbruten'
};

const PAYMENT_LABELS = {
  unpaid: 'Obetald',
  pending: 'Väntar',
  paid: 'Betald',
  failed: 'Misslyckad',
  refunded: 'Återbetald'
};

let allOrders = [];
let activeFilter = 'all';

/* =========================================================
   SUPABASE INIT
   ========================================================= */

function initSupabase() {
  try {
    if (!window.supabase) {
      throw new Error('Supabase-biblioteket kunde inte laddas.');
    }

    if (!cfg.supabaseUrl || cfg.supabaseUrl.includes('YOUR_')) {
      throw new Error('supabaseUrl saknas i config.js.');
    }

    if (!cfg.supabaseAnonKey || cfg.supabaseAnonKey.includes('YOUR_')) {
      throw new Error('supabaseAnonKey saknas i config.js.');
    }

    supabaseClient = window.supabase.createClient(
      cfg.supabaseUrl,
      cfg.supabaseAnonKey
    );

    return true;
  } catch (err) {
    console.error('LAUNCH admin init error:', err);

    loadError.textContent = `Sidan kunde inte starta: ${err.message}`;
    loadError.hidden = false;

    if (loginBtn) {
      loginBtn.disabled = true;
    }

    return false;
  }
}

/* =========================================================
   UI
   ========================================================= */

function showLogin() {
  loginScreen.hidden = false;
  adminApp.hidden = true;
}

function showApp(session) {
  if (!session || !session.user) {
    showLogin();
    return;
  }

  loginScreen.hidden = true;
  adminApp.hidden = false;

  userEmail.textContent = session.user.email || '';

  loadOrders();
}

/* =========================================================
   AUTH
   ========================================================= */

async function checkSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error('getSession error:', error);
      showLogin();
      return;
    }

    const session = data?.session || null;

    if (session) {
      showApp(session);
    } else {
      showLogin();
    }
  } catch (err) {
    console.error('checkSession error:', err);
    showLogin();
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  loginError.hidden = true;
  loginError.textContent = '';

  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;

  if (!email || !password) {
    loginError.textContent = 'Fyll i e-post och lösenord.';
    loginError.hidden = false;
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Loggar in…';

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    console.log('Supabase login response:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message || null
    });

    if (error) {
      console.error('Login error:', error);

      loginError.textContent = getLoginErrorMessage(error);
      loginError.hidden = false;

      return;
    }

    /*
     * IMPORTANT:
     * Supabase should return both user and session after a
     * successful password login.
     */
    if (!data?.user || !data?.session) {
      loginError.textContent =
        'Inloggningen lyckades inte skapa en session. Försök igen.';
      loginError.hidden = false;

      console.error('Login succeeded without session:', data);

      return;
    }

    /*
     * Explicitly verify the session before changing the screen.
     * This prevents the UI from getting stuck on the login page.
     */
    const {
      data: sessionData,
      error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError) {
      console.error('Session verification error:', sessionError);

      loginError.textContent =
        'Inloggningen lyckades, men sessionen kunde inte verifieras.';
      loginError.hidden = false;

      return;
    }

    if (!sessionData?.session) {
      loginError.textContent =
        'Inloggningen lyckades, men ingen aktiv session hittades.';
      loginError.hidden = false;

      return;
    }

    showApp(sessionData.session);

  } catch (err) {
    console.error('Unexpected login error:', err);

    loginError.textContent =
      'Något gick fel vid inloggningen. Kontrollera internetanslutningen och försök igen.';
    loginError.hidden = false;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Logga in';
  }
});

supabaseClient?.auth?.onAuthStateChange?.((event, session) => {
  console.log('Auth state changed:', event);

  if (event === 'SIGNED_IN' && session) {
    showApp(session);
  }

  if (event === 'SIGNED_OUT') {
    showLogin();
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await supabaseClient.auth.signOut();
  } catch (err) {
    console.error('Logout error:', err);
  }

  showLogin();
});

/* =========================================================
   ERROR MESSAGES
   ========================================================= */

function getLoginErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Fel e-post eller lösenord.';
  }

  if (message.includes('email not confirmed')) {
    return 'E-postadressen är inte bekräftad ännu.';
  }

  if (message.includes('too many requests')) {
    return 'För många försök. Vänta en stund och försök igen.';
  }

  return error?.message || 'Kunde inte logga in.';
}

/* =========================================================
   DATA
   ========================================================= */

async function loadOrders() {
  const tbody = document.getElementById('ordersBody');

  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="empty-row">
        Laddar beställningar…
      </td>
    </tr>
  `;

  try {
    const {
      data,
      error
    } = await supabaseClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Orders error:', error);

      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-row">
            Kunde inte hämta beställningar:
            ${escapeHtml(error.message)}
          </td>
        </tr>
      `;

      return;
    }

    allOrders = data || [];

    renderStats();
    renderTable();

  } catch (err) {
    console.error('loadOrders error:', err);

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-row">
          Kunde inte hämta beställningar.
        </td>
      </tr>
    `;
  }
}

function renderStats() {
  const total = allOrders.length;

  const paid = allOrders.filter(
    o => o.payment_status === 'paid'
  ).length;

  const revenue = allOrders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (Number(o.amount_kr) || 0), 0);

  const active = allOrders.filter(
    o => !['completed', 'cancelled'].includes(o.status)
  ).length;

  const grow = allOrders.filter(
    o => o.package === 'GROW'
  ).length;

  document.getElementById('adminStats').innerHTML = [
    ['Totalt', total],
    ['Betalda', paid],
    ['Intäkt', `${revenue} kr`],
    ['Aktiva', active],
    ['GROW / SCALE', `${grow} / ${total - grow}`]
  ]
    .map(
      ([label, value]) => `
        <div class="mini-stat">
          <span class="num">${escapeHtml(value)}</span>
          <span class="lbl">${escapeHtml(label)}</span>
        </div>
      `
    )
    .join('');
}

function renderTable() {
  const search =
    document.getElementById('searchInput').value.trim().toLowerCase();

  const rows = allOrders.filter(o => {
    if (
      activeFilter !== 'all' &&
      o.status !== activeFilter
    ) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      o.order_number,
      o.company_name,
      o.email,
      o.contact_name
    ]
      .join(' ')
      .toLowerCase()
      .includes(search);
  });

  const tbody = document.getElementById('ordersBody');

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-row">
          Inga beställningar matchar.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = rows
    .map(
      o => `
        <tr data-id="${escapeHtml(o.id)}">
          <td class="order-num">
            ${escapeHtml(o.order_number)}
          </td>

          <td>
            ${escapeHtml(o.company_name)}
          </td>

          <td>
            ${escapeHtml(o.package)}
          </td>

          <td>
            ${badge(o.payment_status, PAYMENT_LABELS)}
          </td>

          <td>
            ${badge(o.status, STATUS_LABELS)}
          </td>

          <td>
            ${formatDate(o.created_at)}
          </td>

          <td>→</td>
        </tr>
      `
    )
    .join('');

  tbody
    .querySelectorAll('tr[data-id]')
    .forEach(tr => {
      tr.addEventListener('click', () => {
        openDrawer(tr.dataset.id);
      });
    });
}

function badge(value, labels) {
  return `
    <span class="badge badge-${escapeHtml(value)}">
      <span class="badge-dot"></span>
      ${escapeHtml(labels[value] || value)}
    </span>
  `;
}

function formatDate(iso) {
  if (!iso) return '—';

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function escapeHtml(value = '') {
  return String(value).replace(
    /[&<>"']/g,
    char =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]
  );
}

/* =========================================================
   FILTERS / SEARCH
   ========================================================= */

document
  .getElementById('refreshBtn')
  .addEventListener('click', loadOrders);

document
  .getElementById('searchInput')
  .addEventListener('input', renderTable);

document
  .getElementById('filterTabs')
  .addEventListener('click', event => {
    const button = event.target.closest('.filter-tab');

    if (!button) {
      return;
    }

    document
      .querySelectorAll('.filter-tab')
      .forEach(b => b.classList.remove('active'));

    button.classList.add('active');

    activeFilter = button.dataset.status;

    renderTable();
  });

/* =========================================================
   DRAWER
   ========================================================= */

const drawerOverlay = document.getElementById('drawerOverlay');
const drawerContent = document.getElementById('drawerContent');

function openDrawer(id) {
  const order = allOrders.find(item => String(item.id) === String(id));

  if (!order) {
    return;
  }

  drawerContent.innerHTML = `
    <h2>
      ${escapeHtml(order.company_name)}
    </h2>

    <p class="order-meta">
      ${escapeHtml(order.order_number)}
      ·
      ${formatDate(order.created_at)}
    </p>

    <div class="badges-row">
      ${badge(order.status, STATUS_LABELS)}
      ${badge(order.payment_status, PAYMENT_LABELS)}

      <span class="badge">
        ${escapeHtml(order.package)}
        ${
          order.amount_kr
            ? ` · ${escapeHtml(order.amount_kr)} kr`
            : ''
        }
      </span>
    </div>

    ${
      order.logo_url
        ? `
          <img
            class="logo-preview"
            src="${escapeHtml(order.logo_url)}"
            alt="Logga för ${escapeHtml(order.company_name)}"
          >
        `
        : ''
    }

    <div class="detail-grid">
      <div>
        <span>Kontaktperson</span>
        <strong>${escapeHtml(order.contact_name)}</strong>
      </div>

      <div>
        <span>E-post</span>
        <strong>${escapeHtml(order.email)}</strong>
      </div>

      <div>
        <span>Telefon</span>
        <strong>${escapeHtml(order.phone || '—')}</strong>
      </div>

      <div>
        <span>Instagram</span>
        <strong>${escapeHtml(order.instagram || '—')}</strong>
      </div>

      <div>
        <span>TikTok</span>
        <strong>${escapeHtml(order.tiktok || '—')}</strong>
      </div>

      <div>
        <span>Stil</span>
        <strong>${escapeHtml(order.style || '—')}</strong>
      </div>

      <div>
        <span>Färger</span>
        <strong>${escapeHtml(order.colors || '—')}</strong>
      </div>

      <div>
        <span>Lanseringsdatum</span>
        <strong>${escapeHtml(order.launch_date || '—')}</strong>
      </div>
    </div>

    <div class="detail-block">
      <h4>Vad de säljer</h4>
      <p>
        ${escapeHtml(order.business_description || '—')}
      </p>
    </div>

    ${
      order.website_feel
        ? `
          <div class="detail-block">
            <h4>Önskad känsla</h4>
            <p>${escapeHtml(order.website_feel)}</p>
          </div>
        `
        : ''
    }

    ${
      order.pages
        ? `
          <div class="detail-block">
            <h4>Önskade sidor</h4>
            <p>${escapeHtml(order.pages)}</p>
          </div>
        `
        : ''
    }

    ${
      order.references
        ? `
          <div class="detail-block">
            <h4>Referenser</h4>
            <p>${escapeHtml(order.references)}</p>
          </div>
        `
        : ''
    }

    ${
      order.extra_information
        ? `
          <div class="detail-block">
            <h4>Övrig information</h4>
            <p>${escapeHtml(order.extra_information)}</p>
          </div>
        `
        : ''
    }

    <div class="status-select-row">
      <label>Orderstatus</label>

      <select id="statusSelect">
        ${Object.entries(STATUS_LABELS)
          .map(
            ([value, label]) => `
              <option
                value="${escapeHtml(value)}"
                ${
                  order.status === value
                    ? 'selected'
                    : ''
                }
              >
                ${escapeHtml(label)}
              </option>
            `
          )
          .join('')}
      </select>
    </div>

    <div class="status-select-row">
      <label>Betalstatus</label>

      <select id="paymentSelect">
        ${Object.entries(PAYMENT_LABELS)
          .map(
            ([value, label]) => `
              <option
                value="${escapeHtml(value)}"
                ${
                  order.payment_status === value
                    ? 'selected'
                    : ''
                }
              >
                ${escapeHtml(label)}
              </option>
            `
          )
          .join('')}
      </select>
    </div>

    <div class="drawer-actions">
      <button
        class="button button-primary"
        id="saveOrderBtn"
        type="button"
      >
        Spara ändringar
      </button>

      ${
        order.logo_url
          ? `
            <a
              class="button button-ghost"
              href="${escapeHtml(order.logo_url)}"
              download
              target="_blank"
              rel="noopener"
            >
              Ladda ner logga
            </a>
          `
          : ''
      }
    </div>
  `;

  document
    .getElementById('saveOrderBtn')
    .addEventListener('click', () => {
      saveOrder(order.id);
    });

  drawerOverlay.classList.add('open');
}

async function saveOrder(id) {
  const status =
    document.getElementById('statusSelect').value;

  const payment_status =
    document.getElementById('paymentSelect').value;

  const button =
    document.getElementById('saveOrderBtn');

  button.disabled = true;
  button.textContent = 'Sparar…';

  try {
    const { error } =
      await supabaseClient
        .from('orders')
        .update({
          status,
          payment_status
        })
        .eq('id', id);

    if (error) {
      alert('Kunde inte spara: ' + error.message);
      return;
    }

    await loadOrders();

    drawerOverlay.classList.remove('open');

  } catch (err) {
    console.error('saveOrder error:', err);

    alert('Kunde inte spara ändringarna.');
  } finally {
    button.disabled = false;
    button.textContent = 'Spara ändringar';
  }
}

document
  .getElementById('closeDrawer')
  .addEventListener('click', () => {
    drawerOverlay.classList.remove('open');
  });

drawerOverlay.addEventListener('click', event => {
  if (event.target === drawerOverlay) {
    drawerOverlay.classList.remove('open');
  }
});

/* =========================================================
   START
   ========================================================= */

(async function startAdmin() {
  const ok = initSupabase();

  if (!ok) {
    return;
  }

  /*
   * Listen for auth changes AFTER Supabase has been initialized.
   */
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);

    if (event === 'SIGNED_IN' && session) {
      showApp(session);
    }

    if (event === 'SIGNED_OUT') {
      showLogin();
    }
  });

  await checkSession();
})();
