import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

(() => {
  const cfg = window.LAUNCH_CONFIG || {};
  const configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const supabaseClient = configured ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const overlay = document.getElementById('orderOverlay');
  const modal = document.querySelector('.order-modal');
  const form = document.getElementById('orderForm');
  const success = document.getElementById('formSuccess');
  const logoInput = document.getElementById('logoInput');
  const logoName = document.getElementById('logoName');
  let currentStep = 1;

  const setStep = step => { currentStep = step; form.querySelectorAll('.form-step').forEach(el => el.classList.toggle('active', Number(el.dataset.step) === step)); };
  const openOrder = (pkg='') => { overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; if(pkg){ const r=form.querySelector(`input[name="package"][value="${pkg}"]`); if(r) r.checked=true; } setStep(1); setTimeout(()=>modal.querySelector('input,select,textarea,button')?.focus(),80); };
  const closeOrder = () => { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
  document.querySelectorAll('[data-open-order]').forEach(b=>b.addEventListener('click',()=>openOrder(b.dataset.package||'')));
  document.getElementById('closeOrder').addEventListener('click',closeOrder); document.getElementById('closeSuccess').addEventListener('click',closeOrder); overlay.addEventListener('click',e=>{if(e.target===overlay)closeOrder()}); document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open'))closeOrder()});
  const validStep = step => { for(const field of form.querySelectorAll(`.form-step[data-step="${step}"] [required]`)){ if(field.type==='checkbox'&&!field.checked){field.focus();return false;} if(!field.value?.trim()){field.focus();return false;} if(field.type==='email'&&!field.validity.valid){field.focus();return false;} } return true; };
  form.querySelectorAll('.next-step').forEach(b=>b.addEventListener('click',()=>{if(validStep(currentStep)) setStep(Math.min(3,currentStep+1))}));
  form.querySelectorAll('.prev-step').forEach(b=>b.addEventListener('click',()=>setStep(Math.max(1,currentStep-1))));
  logoInput.addEventListener('change',()=>{const f=logoInput.files?.[0]; logoName.textContent=f?`${f.name} · ${(f.size/1024/1024).toFixed(2)} MB`:'Ingen fil vald'});
  const makeOrderNumber=()=>`LU-${crypto.randomUUID().slice(0,6).toUpperCase()}`;
  const dataFromForm=()=>{const d=Object.fromEntries(new FormData(form).entries()); delete d.logo; delete d.consent; return d;};
  async function submitSupabase(data){ let logo_url=null; const file=logoInput.files?.[0]; if(file){ if(file.size>5*1024*1024) throw new Error('Loggan är större än 5 MB.'); const clean=file.name.toLowerCase().replace(/[^a-z0-9.]+/g,'-'); const path=`${new Date().getFullYear()}/${crypto.randomUUID()}-${clean}`; const {error}=await supabaseClient.storage.from('launch-logos').upload(path,file,{upsert:false}); if(error) throw error; logo_url=supabaseClient.storage.from('launch-logos').getPublicUrl(path).data.publicUrl; } const payload={...data,logo_url,order_number:makeOrderNumber()}; const {error}=await supabaseClient.from('orders').insert(payload); if(error) throw error; return payload.order_number; }
  const saveDemo=data=>{const order={...data,order_number:makeOrderNumber(),created_at:new Date().toISOString()};const old=JSON.parse(localStorage.getItem('launch_orders_demo')||'[]');old.push(order);localStorage.setItem('launch_orders_demo',JSON.stringify(old));return order.order_number;};
  form.addEventListener('submit',async e=>{e.preventDefault(); if(!validStep(3)) return; const btn=form.querySelector('button[type="submit"]'),old=btn.innerHTML;btn.disabled=true;btn.innerHTML='Skickar…'; try{const n=supabaseClient?await submitSupabase(dataFromForm()):saveDemo(dataFromForm());document.getElementById('orderNumber').textContent=n;form.querySelectorAll('.form-step').forEach(el=>el.style.display='none');success.hidden=false;}catch(err){console.error(err);alert(`Beställningen kunde inte skickas. ${err.message||'Kontrollera inställningarna.'}`)}finally{btn.disabled=false;btn.innerHTML=old;}});
  overlay.addEventListener('transitionend',()=>{if(!overlay.classList.contains('open')&&!success.hidden){form.reset();success.hidden=true;form.querySelectorAll('.form-step').forEach(el=>el.style.display='');logoName.textContent='Ingen fil vald';setStep(1);}});

  // GSAP motion: restrained, premium, scroll-driven.
  if(window.gsap){ gsap.registerPlugin(ScrollTrigger); gsap.utils.toArray('.reveal').forEach(el=>{gsap.fromTo(el,{y:32,opacity:0},{y:0,opacity:1,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 86%',once:true}})}); gsap.to('.orb-a',{x:30,y:-18,rotate:18,duration:5,ease:'sine.inOut',repeat:-1,yoyo:true}); gsap.to('.orb-b',{x:-28,y:22,rotate:-22,duration:6.4,ease:'sine.inOut',repeat:-1,yoyo:true}); gsap.to('.device',{y:-12,rotateZ:-1,duration:3.8,ease:'sine.inOut',repeat:-1,yoyo:true}); }
  document.querySelectorAll('.magnetic').forEach(btn=>{btn.addEventListener('pointermove',e=>{const r=btn.getBoundingClientRect();btn.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.08}px, ${(e.clientY-r.top-r.height/2)*.08}px)`});btn.addEventListener('pointerleave',()=>btn.style.transform='');});
  const cursor=document.querySelector('.cursor-light');window.addEventListener('pointermove',e=>{cursor.style.left=`${e.clientX}px`;cursor.style.top=`${e.clientY}px`},{passive:true});

  // Three.js 3D hero object, built locally: no external model/assets.
  const canvas=document.getElementById('hero3d');
  if(canvas){
    const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x08090a,0.055);
    const camera=new THREE.PerspectiveCamera(35,1,0.1,100); camera.position.set(0,0.4,7.8);
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace;
    const group=new THREE.Group(); scene.add(group);
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.55,3),new THREE.MeshPhysicalMaterial({color:0xd2b887,metalness:.78,roughness:.2,clearcoat:.9,clearcoatRoughness:.16,transmission:.05})); group.add(core);
    const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(1.82,2),new THREE.MeshBasicMaterial({color:0xf2eadc,wireframe:true,transparent:true,opacity:.12})); group.add(wire);
    const ringGeo=new THREE.TorusGeometry(2.25,.012,16,220); const ring=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xcdb087,transparent:true,opacity:.45})); ring.rotation.x=Math.PI*.47; ring.rotation.z=.2; group.add(ring);
    const ring2=new THREE.Mesh(new THREE.TorusGeometry(2.58,.007,12,220),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.11})); ring2.rotation.x=Math.PI*.18; ring2.rotation.y=.45; group.add(ring2);
    const points=new THREE.Group(); const pGeo=new THREE.SphereGeometry(.018,8,8); for(let i=0;i<70;i++){const p=new THREE.Mesh(pGeo,new THREE.MeshBasicMaterial({color:i%4===0?0xcdb087:0xffffff,transparent:true,opacity:.45})); const a=Math.random()*Math.PI*2, r=2.8+Math.random()*1.2; p.position.set(Math.cos(a)*r,(Math.random()-.5)*2.7,Math.sin(a)*r); points.add(p);} group.add(points);
    scene.add(new THREE.AmbientLight(0xffffff,.7)); const key=new THREE.DirectionalLight(0xffecd2,3.2);key.position.set(4,4,6);scene.add(key);const rim=new THREE.PointLight(0xffffff,20,18);rim.position.set(-4,-1,3);scene.add(rim);
    const resize=()=>{const r=canvas.parentElement.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}; window.addEventListener('resize',resize);resize();
    let mx=0,my=0;window.addEventListener('pointermove',e=>{mx=(e.clientX/innerWidth-.5)*.45;my=(e.clientY/innerHeight-.5)*.28},{passive:true});
    const clock=new THREE.Clock();
    const tick=()=>{const t=clock.getElapsedTime();group.rotation.y += .0024; group.rotation.x += (my*.22-group.rotation.x)*.025;group.rotation.z += (mx*.18-group.rotation.z)*.025;core.scale.setScalar(1+Math.sin(t*1.6)*.018);wire.rotation.y=-t*.08;ring.rotation.z=t*.12;ring2.rotation.y=-t*.09;points.rotation.y=t*.025;renderer.render(scene,camera);requestAnimationFrame(tick)};tick();
  }
})();
