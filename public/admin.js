const cfg = window.LAUNCH_CONFIG || {};

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loadError = document.getElementById('loadError');
const loginBtn = document.getElementById('loginBtn');
const userEmail = document.getElementById('userEmail');

let supabaseClient = null;

let allOrders = [];
let activeFilter = 'all';


/* =========================================================
   STATUS LABELS
========================================================= */

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


/* =========================================================
   SUPABASE INIT
========================================================= */

function initSupabase() {

  try {

    if (!window.supabase) {
      throw new Error(
        'Supabase-biblioteket laddades inte.'
      );
    }

    if (
      !cfg.supabaseUrl ||
      cfg.supabaseUrl.includes('YOUR_')
    ) {
      throw new Error(
        'supabaseUrl saknas i config.js.'
      );
    }

    if (
      !cfg.supabaseAnonKey ||
      cfg.supabaseAnonKey.includes('YOUR_')
    ) {
      throw new Error(
        'supabaseAnonKey saknas i config.js.'
      );
    }


    supabaseClient =
      window.supabase.createClient(
        cfg.supabaseUrl,
        cfg.supabaseAnonKey
      );


    console.log(
      'Supabase initialized successfully'
    );


    return true;

  } catch (error) {

    console.error(
      'LAUNCH admin init error:',
      error
    );


    loadError.textContent =
      `Sidan kunde inte starta: ${error.message}`;


    loadError.hidden = false;


    loginBtn.disabled = true;


    return false;
  }
}


/* =========================================================
   LOGIN / APP SCREEN
========================================================= */

function showLogin() {

  console.log(
    'Showing login screen'
  );


  /*
   * IMPORTANT:
   * admin.css sets .login-screen { display:flex }
   * which can override [hidden].
   *
   * Therefore we explicitly control display here.
   */

  loginScreen.hidden = false;
  loginScreen.style.display = 'flex';


  adminApp.hidden = true;
  adminApp.style.display = 'none';
}


function showApp(session) {

  console.log(
    'Showing admin app',
    session
  );


  if (
    !session ||
    !session.user
  ) {

    console.error(
      'showApp called without valid session'
    );

    showLogin();

    return;
  }


  /*
   * Explicitly hide login screen.
   */

  loginScreen.hidden = true;
  loginScreen.style.display = 'none';


  /*
   * Explicitly show admin app.
   */

  adminApp.hidden = false;
  adminApp.style.display = 'block';


  /*
   * Show logged in user.
   */

  userEmail.textContent =
    session.user.email || '';


  console.log(
    'Login screen hidden:',
    loginScreen.hidden
  );

  console.log(
    'Login screen display:',
    loginScreen.style.display
  );

  console.log(
    'Admin app hidden:',
    adminApp.hidden
  );

  console.log(
    'Admin app display:',
    adminApp.style.display
  );


  /*
   * Load orders after successful login.
   */

  loadOrders();
}


/* =========================================================
   CHECK EXISTING SESSION
========================================================= */

async function checkSession() {

  try {

    console.log(
      'Checking existing Supabase session...'
    );


    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        'getSession error:',
        error
      );

      showLogin();

      return;
    }


    const session =
      data?.session || null;


    if (session) {

      console.log(
        'Existing session found'
      );

      showApp(session);

    } else {

      console.log(
        'No existing session'
      );

      showLogin();
    }


  } catch (error) {

    console.error(
      'checkSession error:',
      error
    );

    showLogin();
  }
}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
  'submit',
  async function(event) {

    event.preventDefault();


    console.log(
      'LOGIN BUTTON PRESSED'
    );


    loginError.hidden = true;
    loginError.textContent = '';


    const email =
      loginForm.elements.email.value.trim();


    const password =
      loginForm.elements.password.value;


    if (!email) {

      loginError.textContent =
        'Fyll i e-post.';

      loginError.hidden = false;

      return;
    }


    if (!password) {

      loginError.textContent =
        'Fyll i lösenord.';

      loginError.hidden = false;

      return;
    }


    loginBtn.disabled = true;

    loginBtn.textContent =
      'Loggar in…';


    try {

      console.log(
        'Calling Supabase signInWithPassword...'
      );


      const {
        data,
        error
      } =
        await supabaseClient.auth
          .signInWithPassword({
            email,
            password
          });


      console.log(
        'Supabase login response:',
        {
          error:
            error?.message || null,

          hasSession:
            !!data?.session,

          hasUser:
            !!data?.user
        }
      );


      /*
       * Supabase returned an error.
       */

      if (error) {

        console.error(
          'Supabase login error:',
          error
        );


        loginError.textContent =
          getLoginErrorMessage(error);


        loginError.hidden = false;


        return;
      }


      /*
       * Supabase says login succeeded,
       * but make absolutely sure we have
       * a session and user.
       */

      if (
        !data ||
        !data.session ||
        !data.user
      ) {

        console.error(
          'Login returned no valid session:',
          data
        );


        loginError.textContent =
          'Inloggningen lyckades inte skapa en aktiv session.';


        loginError.hidden = false;


        return;
      }


      console.log(
        'AUTH SUCCESS — SWITCHING TO ADMIN'
      );


      /*
       * THIS IS THE IMPORTANT PART.
       *
       * The login screen is explicitly
       * hidden with display:none.
       */

      showApp(
        data.session
      );


    } catch (error) {

      console.error(
        'Unexpected login error:',
        error
      );


      loginError.textContent =
        'Något gick fel vid inloggningen. Försök igen.';


      loginError.hidden = false;


    } finally {

      loginBtn.disabled = false;

      loginBtn.textContent =
        'Logga in';
    }

  }
);


/* =========================================================
   AUTH STATE
========================================================= */

function setupAuthListener() {

  if (!supabaseClient) {
    return;
  }


  supabaseClient.auth.onAuthStateChange(
    function(event, session) {

      console.log(
        'Auth event:',
        event
      );


      if (
        event === 'SIGNED_IN' &&
        session
      ) {

        showApp(session);

        return;
      }


      if (
        event === 'SIGNED_OUT'
      ) {

        showLogin();

        return;
      }

    }
  );
}


/* =========================================================
   LOGOUT
========================================================= */

document
  .getElementById('logoutBtn')
  .addEventListener(
    'click',
    async function() {

      try {

        console.log(
          'Logging out...'
        );


        const {
          error
        } =
          await supabaseClient.auth.signOut();


        if (error) {

          console.error(
            'Logout error:',
            error
          );

        }

      } catch (error) {

        console.error(
          'Unexpected logout error:',
          error
        );

      } finally {

        showLogin();
      }

    }
  );


/* =========================================================
   LOGIN ERROR TEXT
========================================================= */

function getLoginErrorMessage(error) {

  const message =
    String(
      error?.message || ''
    ).toLowerCase();


  if (
    message.includes(
      'invalid login credentials'
    )
  ) {

    return 'Fel e-post eller lösenord.';
  }


  if (
    message.includes(
      'email not confirmed'
    )
  ) {

    return 'E-postadressen är inte bekräftad ännu.';
  }


  if (
    message.includes(
      'too many requests'
    )
  ) {

    return 'För många försök. Vänta en stund och försök igen.';
  }


  return (
    error?.message ||
    'Kunde inte logga in.'
  );
}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

  const tbody =
    document.getElementById(
      'ordersBody'
    );


  tbody.innerHTML = `
    <tr>
      <td
        colspan="7"
        class="empty-row"
      >
        Laddar beställningar…
      </td>
    </tr>
  `;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from('orders')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        'Orders error:',
        error
      );


      tbody.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="empty-row"
          >
            Kunde inte hämta beställningar:
            ${escapeHtml(error.message)}
          </td>
        </tr>
      `;

      return;
    }


    allOrders =
      Array.isArray(data)
        ? data
        : [];


    renderStats();

    renderTable();


  } catch (error) {

    console.error(
      'loadOrders error:',
      error
    );


    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-row"
        >
          Kunde inte hämta beställningar.
        </td>
      </tr>
    `;
  }
}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

  const total =
    allOrders.length;


  const paid =
    allOrders.filter(
      order =>
        order.payment_status === 'paid'
    ).length;


  const revenue =
    allOrders
      .filter(
        order =>
          order.payment_status === 'paid'
      )
      .reduce(
        (sum, order) =>
          sum +
          (Number(order.amount_kr) || 0),
        0
      );


  const active =
    allOrders.filter(
      order =>
        ![
          'completed',
          'cancelled'
        ].includes(order.status)
    ).length;


  const grow =
    allOrders.filter(
      order =>
        order.package === 'GROW'
    ).length;


  const scale =
    allOrders.filter(
      order =>
        order.package === 'SCALE'
    ).length;


  document
    .getElementById('adminStats')
    .innerHTML = [

      ['Totalt', total],

      ['Betalda', paid],

      ['Intäkt', `${revenue} kr`],

      ['Aktiva', active],

      [
        'GROW / SCALE',
        `${grow} / ${scale}`
      ]

    ]
      .map(
        function([label, value]) {

          return `
            <div class="mini-stat">
              <span class="num">
                ${escapeHtml(value)}
              </span>

              <span class="lbl">
                ${escapeHtml(label)}
              </span>
            </div>
          `;
        }
      )
      .join('');
}


/* =========================================================
   TABLE
========================================================= */

function renderTable() {

  const search =
    document
      .getElementById('searchInput')
      .value
      .trim()
      .toLowerCase();


  const rows =
    allOrders.filter(
      function(order) {

        if (
          activeFilter !== 'all' &&
          order.status !== activeFilter
        ) {

          return false;
        }


        if (!search) {
          return true;
        }


        return [
          order.order_number,
          order.company_name,
          order.email,
          order.contact_name
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);
      }
    );


  const tbody =
    document.getElementById(
      'ordersBody'
    );


  if (!rows.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-row"
        >
          Inga beställningar matchar.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    rows
      .map(
        function(order) {

          return `
            <tr
              data-id="${escapeHtml(order.id)}"
            >

              <td class="order-num">
                ${escapeHtml(
                  order.order_number
                )}
              </td>

              <td>
                ${escapeHtml(
                  order.company_name
                )}
              </td>

              <td>
                ${escapeHtml(
                  order.package
                )}
              </td>

              <td>
                ${badge(
                  order.payment_status,
                  PAYMENT_LABELS
                )}
              </td>

              <td>
                ${badge(
                  order.status,
                  STATUS_LABELS
                )}
              </td>

              <td>
                ${formatDate(
                  order.created_at
                )}
              </td>

              <td>
                →
              </td>

            </tr>
          `;
        }
      )
      .join('');


  tbody
    .querySelectorAll(
      'tr[data-id]'
    )
    .forEach(
      function(row) {

        row.addEventListener(
          'click',
          function() {

            openDrawer(
              row.dataset.id
            );

          }
        );

      }
    );
}


/* =========================================================
   BADGE
========================================================= */

function badge(
  value,
  labels
) {

  const safeValue =
    String(value || '');


  return `
    <span
      class="badge badge-${escapeHtml(
        safeValue
      )}"
    >

      <span class="badge-dot"></span>

      ${escapeHtml(
        labels[safeValue] ||
        safeValue
      )}

    </span>
  `;
}


/* =========================================================
   DATE
========================================================= */

function formatDate(iso) {

  if (!iso) {
    return '—';
  }


  const date =
    new Date(iso);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return '—';
  }


  return date.toLocaleDateString(
    'sv-SE',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value = '') {

  return String(value)
    .replace(
      /[&<>"']/g,
      function(character) {

        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[character];

      }
    );
}


/* =========================================================
   FILTER / SEARCH
========================================================= */

document
  .getElementById('refreshBtn')
  .addEventListener(
    'click',
    loadOrders
  );


document
  .getElementById('searchInput')
  .addEventListener(
    'input',
    renderTable
  );


document
  .getElementById('filterTabs')
  .addEventListener(
    'click',
    function(event) {

      const button =
        event.target.closest(
          '.filter-tab'
        );


      if (!button) {
        return;
      }


      document
        .querySelectorAll(
          '.filter-tab'
        )
        .forEach(
          function(tab) {

            tab.classList.remove(
              'active'
            );

          }
        );


      button.classList.add(
        'active'
      );


      activeFilter =
        button.dataset.status;


      renderTable();
    }
  );


/* =========================================================
   DRAWER
========================================================= */

const drawerOverlay =
  document.getElementById(
    'drawerOverlay'
  );


const drawerContent =
  document.getElementById(
    'drawerContent'
  );


function openDrawer(id) {

  const order =
    allOrders.find(
      function(item) {

        return String(item.id) ===
          String(id);

      }
    );


  if (!order) {
    return;
  }


  drawerContent.innerHTML = `

    <h2>
      ${escapeHtml(
        order.company_name
      )}
    </h2>


    <p class="order-meta">
      ${escapeHtml(
        order.order_number
      )}
      ·
      ${formatDate(
        order.created_at
      )}
    </p>


    <div class="badges-row">

      ${badge(
        order.status,
        STATUS_LABELS
      )}

      ${badge(
        order.payment_status,
        PAYMENT_LABELS
      )}

      <span class="badge">

        ${escapeHtml(
          order.package
        )}

        ${
          order.amount_kr
            ? ` · ${escapeHtml(
                order.amount_kr
              )} kr`
            : ''
        }

      </span>

    </div>


    ${
      order.logo_url
        ? `
          <img
            class="logo-preview"
            src="${escapeHtml(
              order.logo_url
            )}"
            alt="Logga för ${escapeHtml(
              order.company_name
            )}"
          >
        `
        : ''
    }


    <div class="detail-grid">

      <div>
        <span>Kontaktperson</span>
        <strong>
          ${escapeHtml(
            order.contact_name
          )}
        </strong>
      </div>


      <div>
        <span>E-post</span>
        <strong>
          ${escapeHtml(
            order.email
          )}
        </strong>
      </div>


      <div>
        <span>Telefon</span>
        <strong>
          ${escapeHtml(
            order.phone || '—'
          )}
        </strong>
      </div>


      <div>
        <span>Instagram</span>
        <strong>
          ${escapeHtml(
            order.instagram || '—'
          )}
        </strong>
      </div>


      <div>
        <span>TikTok</span>
        <strong>
          ${escapeHtml(
            order.tiktok || '—'
          )}
        </strong>
      </div>


      <div>
        <span>Stil</span>
        <strong>
          ${escapeHtml(
            order.style || '—'
          )}
        </strong>
      </div>


      <div>
        <span>Färger</span>
        <strong>
          ${escapeHtml(
            order.colors || '—'
          )}
        </strong>
      </div>


      <div>
        <span>Lanseringsdatum</span>
        <strong>
          ${escapeHtml(
            order.launch_date || '—'
          )}
        </strong>
      </div>

    </div>


    <div class="detail-block">

      <h4>
        Vad de säljer
      </h4>

      <p>
        ${escapeHtml(
          order.business_description || '—'
        )}
      </p>

    </div>


    ${
      order.website_feel
        ? `
          <div class="detail-block">

            <h4>
              Önskad känsla
            </h4>

            <p>
              ${escapeHtml(
                order.website_feel
              )}
            </p>

          </div>
        `
        : ''
    }


    ${
      order.pages
        ? `
          <div class="detail-block">

            <h4>
              Önskade sidor
            </h4>

            <p>
              ${escapeHtml(
                order.pages
              )}
            </p>

          </div>
        `
        : ''
    }


    ${
      order.references
        ? `
          <div class="detail-block">

            <h4>
              Referenser
            </h4>

            <p>
              ${escapeHtml(
                order.references
              )}
            </p>

          </div>
        `
        : ''
    }


    ${
      order.extra_information
        ? `
          <div class="detail-block">

            <h4>
              Övrig information
            </h4>

            <p>
              ${escapeHtml(
                order.extra_information
              )}
            </p>

          </div>
        `
        : ''
    }


    <div class="status-select-row">

      <label>
        Orderstatus
      </label>

      <select id="statusSelect">

        ${Object.entries(
          STATUS_LABELS
        )
          .map(
            function([
              value,
              label
            ]) {

              return `
                <option
                  value="${escapeHtml(
                    value
                  )}"
                  ${
                    order.status ===
                    value
                      ? 'selected'
                      : ''
                  }
                >
                  ${escapeHtml(
                    label
                  )}
                </option>
              `;

            }
          )
          .join('')}

      </select>

    </div>


    <div class="status-select-row">

      <label>
        Betalstatus
      </label>

      <select id="paymentSelect">

        ${Object.entries(
          PAYMENT_LABELS
        )
          .map(
            function([
              value,
              label
            ]) {

              return `
                <option
                  value="${escapeHtml(
                    value
                  )}"
                  ${
                    order.payment_status ===
                    value
                      ? 'selected'
                      : ''
                  }
                >
                  ${escapeHtml(
                    label
                  )}
                </option>
              `;

            }
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
              href="${escapeHtml(
                order.logo_url
              )}"
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
    .getElementById(
      'saveOrderBtn'
    )
    .addEventListener(
      'click',
      function() {

        saveOrder(
          order.id
        );

      }
    );


  drawerOverlay.classList.add(
    'open'
  );
}


/* =========================================================
   SAVE ORDER
========================================================= */

async function saveOrder(id) {

  const status =
    document.getElementById(
      'statusSelect'
    ).value;


  const payment_status =
    document.getElementById(
      'paymentSelect'
    ).value;


  const button =
    document.getElementById(
      'saveOrderBtn'
    );


  button.disabled = true;

  button.textContent =
    'Sparar…';


  try {

    const {
      error
    } =
      await supabaseClient
        .from('orders')
        .update({
          status,
          payment_status
        })
        .eq('id', id);


    if (error) {

      console.error(
        'saveOrder error:',
        error
      );


      alert(
        'Kunde inte spara: ' +
        error.message
      );

      return;
    }


    await loadOrders();


    drawerOverlay.classList.remove(
      'open'
    );


  } catch (error) {

    console.error(
      'Unexpected save error:',
      error
    );


    alert(
      'Kunde inte spara ändringarna.'
    );


  } finally {

    button.disabled = false;

    button.textContent =
      'Spara ändringar';
  }
}


/* =========================================================
   CLOSE DRAWER
========================================================= */

document
  .getElementById('closeDrawer')
  .addEventListener(
    'click',
    function() {

      drawerOverlay.classList.remove(
        'open'
      );

    }
  );


drawerOverlay.addEventListener(
  'click',
  function(event) {

    if (
      event.target ===
      drawerOverlay
    ) {

      drawerOverlay.classList.remove(
        'open'
      );
    }

  }
);


/* =========================================================
   START
========================================================= */

(async function startAdmin() {

  console.log(
    'Starting LAUNCH admin...'
  );


  const initialized =
    initSupabase();


  if (!initialized) {
    return;
  }


  /*
   * Listen for authentication changes.
   */

  setupAuthListener();


  /*
   * Check whether we already have
   * an authenticated session.
   */

  await checkSession();

})();
