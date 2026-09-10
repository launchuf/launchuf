import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

/* ---------- loader ---------- */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('done'), 700);
});

/* ---------- header state ---------- */
const header = document.getElementById('siteHeader');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- mobile nav ---------- */
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
navToggle.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
});
mobileNav.querySelectorAll('a,button').forEach(el => el.addEventListener('click', () => {
  mobileNav.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));

/* ---------- cursor glow ---------- */
const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', e => {
  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;
}, { passive: true });

/* ---------- magnetic buttons ---------- */
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('pointermove', e => {
    const r = btn.getBoundingClientRect();
    btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
  });
  btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
});

/* ---------- GSAP scroll reveals ---------- */
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger);

  // hero title split-reveal
  gsap.from('.hero-title .line', {
    y: '110%', duration: 1.1, ease: 'power4.out', stagger: .1, delay: .3
  });
  gsap.from('.hero-eyebrow, .hero-lead, .hero-actions', {
    y: 16, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, delay: .9
  });

  const revealTargets = [
    '.intro-grid h2', '.intro-side p',
    '.package-card', '.process-item',
    '.faq-list details', '.quote blockquote',
    '.cta h2', '.cta p', '.cta .button',
    '.section-heading', '.showcase-title', '.showcase-copy'
  ];
  revealTargets.forEach(sel => {
    gsap.utils.toArray(sel).forEach((el, i) => {
      gsap.fromTo(el, { y: 28, opacity: 0 }, {
        y: 0, opacity: 1, duration: .9, ease: 'power3.out', delay: (i % 4) * .06,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  });

  // stat counters
  gsap.utils.toArray('.stat-num').forEach(el => {
    const target = Number(el.dataset.count);
    if (!target) return;
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(obj, {
        val: target, duration: 1.6, ease: 'power2.out',
        onUpdate: () => el.textContent = Math.round(obj.val)
      })
    });
  });

  // showcase mock stagger parallax
  gsap.set('.mock-2', { zIndex: 3 });
  gsap.to('.mock-1', { y: -30, scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  gsap.to('.mock-2', { y: 20, scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  gsap.to('.mock-3', { y: -50, scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: 1 } });
}

/* ---------- Three.js hero scene ---------- */
const canvas = document.getElementById('hero3d');
if (canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07080a, 0.05);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.3, 8.2);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const group = new THREE.Group();
  scene.add(group);

  // faceted gold core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.6, 2),
    new THREE.MeshPhysicalMaterial({ color: 0xcdae7d, metalness: .85, roughness: .22, clearcoat: .8, clearcoatRoughness: .18 })
  );
  group.add(core);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.95, 1),
    new THREE.MeshBasicMaterial({ color: 0xf3f1ea, wireframe: true, transparent: true, opacity: .1 })
  );
  group.add(wire);

  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, .01, 16, 220),
    new THREE.MeshBasicMaterial({ color: 0xcdae7d, transparent: true, opacity: .5 })
  );
  ring1.rotation.x = Math.PI * .46; ring1.rotation.z = .25;
  group.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.9, .006, 12, 220),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .12 })
  );
  ring2.rotation.x = Math.PI * .2; ring2.rotation.y = .4;
  group.add(ring2);

  // floating particles
  const particles = new THREE.Group();
  const pGeo = new THREE.SphereGeometry(.02, 6, 6);
  for (let i = 0; i < 90; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? 0xcdae7d : 0xffffff, transparent: true, opacity: .4 });
    const p = new THREE.Mesh(pGeo, mat);
    const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 1.6;
    p.position.set(Math.cos(a) * r, (Math.random() - .5) * 3.2, Math.sin(a) * r);
    particles.add(p);
  }
  group.add(particles);

  scene.add(new THREE.AmbientLight(0xffffff, .65));
  const key = new THREE.DirectionalLight(0xffe9c9, 3);
  key.position.set(4, 4, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xffffff, 18, 20);
  rim.position.set(-4, -1, 3);
  scene.add(rim);

  const resize = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  let mx = 0, my = 0;
  window.addEventListener('pointermove', e => {
    mx = (e.clientX / innerWidth - .5) * .5;
    my = (e.clientY / innerHeight - .5) * .3;
  }, { passive: true });

  const clock = new THREE.Clock();
  const tick = () => {
    const t = clock.getElapsedTime();
    group.rotation.y += 0.0022;
    group.rotation.x += (my * .22 - group.rotation.x) * .025;
    group.rotation.z += (mx * .16 - group.rotation.z) * .025;
    core.scale.setScalar(1 + Math.sin(t * 1.5) * .02);
    wire.rotation.y = -t * .07;
    ring1.rotation.z = t * .1;
    ring2.rotation.y = -t * .08;
    particles.rotation.y = t * .02;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();
}

/* ---------- order modal + supabase ---------- */
(() => {
  const cfg = window.LAUNCH_CONFIG || {};
  const configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && !cfg.supabaseUrl.includes('YOUR_') && !cfg.supabaseAnonKey.includes('YOUR_'));
  const supabaseClient = configured && window.supabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const overlay = document.getElementById('orderOverlay');
  const modal = document.querySelector('.order-modal');
  const form = document.getElementById('orderForm');
  const success = document.getElementById('formSuccess');
  const logoInput = document.getElementById('logoInput');
  const logoName = document.getElementById('logoName');
  const progressFill = document.getElementById('progressFill');
  let currentStep = 1;

  function setStep(step) {
    currentStep = step;
    form.querySelectorAll('.form-step').forEach(el => el.classList.toggle('active', Number(el.dataset.step) === step));
    progressFill.style.width = `${(step / 3) * 100}%`;
  }
  function openOrder(pkg = '') {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (pkg) { const r = form.querySelector(`input[name="package"][value="${pkg}"]`); if (r) r.checked = true; }
    if (!form.querySelector('input[name="package"]:checked')) form.querySelector('input[value="GROW"]').checked = true;
    setStep(1);
    setTimeout(() => modal.querySelector('input,select,textarea,button')?.focus(), 80);
  }
  function closeOrder() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-open-order]').forEach(btn => btn.addEventListener('click', () => openOrder(btn.dataset.package || '')));
  document.getElementById('closeOrder').addEventListener('click', closeOrder);
  document.getElementById('closeSuccess').addEventListener('click', closeOrder);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOrder(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeOrder(); });

  function validStep(step) {
    for (const field of form.querySelectorAll(`.form-step[data-step="${step}"] [required]`)) {
      if (field.type === 'checkbox' && !field.checked) { field.focus(); return false; }
      if (!field.value?.trim()) { field.focus(); return false; }
      if (field.type === 'email' && !field.validity.valid) { field.focus(); return false; }
    }
    return true;
  }
  form.querySelectorAll('.next-step').forEach(btn => btn.addEventListener('click', () => { if (validStep(currentStep)) setStep(Math.min(3, currentStep + 1)); }));
  form.querySelectorAll('.prev-step').forEach(btn => btn.addEventListener('click', () => setStep(Math.max(1, currentStep - 1))));
  logoInput.addEventListener('change', () => {
    const f = logoInput.files?.[0];
    logoName.textContent = f ? `${f.name} · ${(f.size / 1024 / 1024).toFixed(2)} MB` : 'Ingen fil vald';
  });

  function makeOrderNumber() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    bytes.forEach(n => code += chars[n % chars.length]);
    return `LU-${code}`;
  }
  function dataFromForm() {
    const d = Object.fromEntries(new FormData(form).entries());
    delete d.logo; delete d.consent;
    return d;
  }
  async function submitSupabase(data) {
    let logo_url = null;
    const file = logoInput.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) throw new Error('Loggan är större än 5 MB.');
      const clean = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${clean}`;
      const { error } = await supabaseClient.storage.from('launch-logos').upload(path, file, { upsert: false });
      if (error) throw error;
      logo_url = supabaseClient.storage.from('launch-logos').getPublicUrl(path).data.publicUrl;
    }
    const payload = { ...data, logo_url, order_number: makeOrderNumber() };
    const { error } = await supabaseClient.from('orders').insert(payload);
    if (error) throw error;
    return payload.order_number;
  }
  function saveDemo(data) {
    const order = { ...data, order_number: makeOrderNumber(), created_at: new Date().toISOString() };
    const old = JSON.parse(localStorage.getItem('launch_orders_demo') || '[]');
    old.push(order);
    localStorage.setItem('launch_orders_demo', JSON.stringify(old));
    return order.order_number;
  }
  const stripeConfigured = Boolean(cfg.stripePublishableKey && !cfg.stripePublishableKey.includes('YOUR_'));

  async function goToStripeCheckout(order_number, data) {
    const res = await fetch('/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_number,
        package: data.package,
        email: data.email,
        company_name: data.company_name,
        origin: window.location.origin,
      }),
    });
    const out = await res.json();
    if (!res.ok || !out.url) throw new Error(out.error || 'Kunde inte starta betalningen.');
    window.location.href = out.url; // hand off to Stripe's hosted payment page
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validStep(3)) return;
    const btn = form.querySelector('button[type="submit"]');
    const old = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = 'Skickar…';
    const data = dataFromForm();
    try {
      const n = supabaseClient ? await submitSupabase(data) : saveDemo(data);

      if (supabaseClient && stripeConfigured) {
        btn.innerHTML = 'Går vidare till betalning…';
        await goToStripeCheckout(n, data);
        return; // browser is navigating away to Stripe
      }

      // Fallback (no Stripe configured yet / demo mode): show the old confirmation screen.
      document.getElementById('orderNumber').textContent = n;
      form.hidden = true;
      success.hidden = false;
    } catch (err) {
      console.error(err);
      alert(`Beställningen kunde inte skickas. ${err.message || 'Kontrollera Supabase-inställningarna.'}`);
    } finally {
      btn.disabled = false; btn.innerHTML = old;
    }
  });

  overlay.addEventListener('transitionend', () => {
    if (!overlay.classList.contains('open') && !success.hidden) {
      form.reset();
      form.hidden = false;
      success.hidden = true;
      logoName.textContent = 'Ingen fil vald';
      setStep(1);
    }
  });
})();
