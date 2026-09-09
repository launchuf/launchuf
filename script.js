(() => {
  'use strict';
  const cfg = window.LAUNCH_CONFIG || {};
  const configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && !cfg.supabaseUrl.includes('YOUR_') && !cfg.supabaseAnonKey.includes('YOUR_'));
  const supabaseClient = configured && window.supabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const overlay = document.getElementById('orderOverlay');
  const modal = document.querySelector('.order-modal');
  const form = document.getElementById('orderForm');
  const success = document.getElementById('formSuccess');
  const logoInput = document.getElementById('logoInput');
  const logoName = document.getElementById('logoName');
  let currentStep = 1;

  function setStep(step){
    currentStep = step;
    form.querySelectorAll('.form-step').forEach(el => el.classList.toggle('active', Number(el.dataset.step) === step));
  }
  function openOrder(pkg=''){
    overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    if(pkg){ const r=form.querySelector(`input[name="package"][value="${pkg}"]`); if(r) r.checked=true; }
    if(!form.querySelector('input[name="package"]:checked')) form.querySelector('input[value="GROW"]').checked=true;
    setStep(1);
    setTimeout(()=>modal.querySelector('input,select,textarea,button')?.focus(),80);
  }
  function closeOrder(){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  document.querySelectorAll('[data-open-order]').forEach(btn=>btn.addEventListener('click',()=>openOrder(btn.dataset.package||'')));
  document.getElementById('closeOrder').addEventListener('click',closeOrder);
  document.getElementById('closeSuccess').addEventListener('click',closeOrder);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeOrder()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open'))closeOrder()});

  function validStep(step){
    for(const field of form.querySelectorAll(`.form-step[data-step="${step}"] [required]`)){
      if(field.type==='checkbox'&&!field.checked){field.focus();return false;}
      if(!field.value?.trim()){field.focus();return false;}
      if(field.type==='email'&&!field.validity.valid){field.focus();return false;}
    }
    return true;
  }
  form.querySelectorAll('.next-step').forEach(btn=>btn.addEventListener('click',()=>{if(validStep(currentStep))setStep(Math.min(3,currentStep+1))}));
  form.querySelectorAll('.prev-step').forEach(btn=>btn.addEventListener('click',()=>setStep(Math.max(1,currentStep-1))));
  logoInput.addEventListener('change',()=>{const f=logoInput.files?.[0];logoName.textContent=f?`${f.name} · ${(f.size/1024/1024).toFixed(2)} MB`:'Ingen fil vald'});

  function makeOrderNumber(){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code=''; const bytes=new Uint8Array(6); crypto.getRandomValues(bytes); bytes.forEach(n=>code+=chars[n%chars.length]); return `LU-${code}`;
  }
  function dataFromForm(){const d=Object.fromEntries(new FormData(form).entries());delete d.logo;delete d.consent;return d;}
  async function submitSupabase(data){
    let logo_url=null; const file=logoInput.files?.[0];
    if(file){
      if(file.size>5*1024*1024)throw new Error('Loggan är större än 5 MB.');
      const clean=file.name.toLowerCase().replace(/[^a-z0-9.]+/g,'-'); const path=`${new Date().getFullYear()}/${crypto.randomUUID()}-${clean}`;
      const {error}=await supabaseClient.storage.from('launch-logos').upload(path,file,{upsert:false}); if(error)throw error;
      logo_url=supabaseClient.storage.from('launch-logos').getPublicUrl(path).data.publicUrl;
    }
    const payload={...data,logo_url,order_number:makeOrderNumber()};
    const {error}=await supabaseClient.from('orders').insert(payload); if(error)throw error; return payload.order_number;
  }
  function saveDemo(data){const order={...data,order_number:makeOrderNumber(),created_at:new Date().toISOString()};const old=JSON.parse(localStorage.getItem('launch_orders_demo')||'[]');old.push(order);localStorage.setItem('launch_orders_demo',JSON.stringify(old));return order.order_number;}
  form.addEventListener('submit',async e=>{
    e.preventDefault(); if(!validStep(3))return;
    const btn=form.querySelector('button[type="submit"]'), old=btn.innerHTML; btn.disabled=true; btn.innerHTML='Skickar…';
    try{const n=supabaseClient?await submitSupabase(dataFromForm()):saveDemo(dataFromForm());document.getElementById('orderNumber').textContent=n;form.querySelectorAll('.form-step').forEach(el=>el.style.display='none');success.hidden=false}
    catch(err){console.error(err);alert(`Beställningen kunde inte skickas. ${err.message||'Kontrollera Supabase-inställningarna.'}`)}
    finally{btn.disabled=false;btn.innerHTML=old}
  });

  const glow=document.querySelector('.cursor-glow');
  window.addEventListener('pointermove',e=>{if(innerWidth>=800){glow.style.left=`${e.clientX}px`;glow.style.top=`${e.clientY}px`}}, {passive:true});
  const observer=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('is-visible');observer.unobserve(x.target)}}),{threshold:.13});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  overlay.addEventListener('transitionend',()=>{if(!overlay.classList.contains('open')&&!success.hidden){form.reset();success.hidden=true;form.querySelectorAll('.form-step').forEach(el=>el.style.display='');logoName.textContent='Ingen fil vald';setStep(1)}});
})();
