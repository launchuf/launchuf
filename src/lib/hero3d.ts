/* eslint-disable */
// @ts-nocheck
// 3D-hjälten från den gamla sajten (three.js), portad till en init-funktion med städning.
export function initHero3d(THREE: any, canvas: HTMLCanvasElement): () => void {


  const scene =
    new THREE.Scene();


  scene.fog =
    new THREE.FogExp2(
      0x07080a,
      0.05
    );


  const camera =
    new THREE.PerspectiveCamera(
      38,
      1,
      0.1,
      100
    );


  camera.position.set(
    0,
    0.3,
    8.2
  );


  const renderer =
    new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });


  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      2
    )
  );


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  const group =
    new THREE.Group();

  scene.add(group);


  const core =
    new THREE.Mesh(

      new THREE.IcosahedronGeometry(
        1.6,
        2
      ),

      new THREE.MeshPhysicalMaterial({
        color: 0xcdae7d,
        metalness: .85,
        roughness: .22,
        clearcoat: .8,
        clearcoatRoughness: .18
      })

    );


  group.add(core);


  const wire =
    new THREE.Mesh(

      new THREE.IcosahedronGeometry(
        1.95,
        1
      ),

      new THREE.MeshBasicMaterial({
        color: 0xf3f1ea,
        wireframe: true,
        transparent: true,
        opacity: .1
      })

    );


  group.add(wire);


  const ring1 =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        2.5,
        .01,
        16,
        220
      ),

      new THREE.MeshBasicMaterial({
        color: 0xcdae7d,
        transparent: true,
        opacity: .5
      })

    );


  ring1.rotation.x =
    Math.PI * .46;

  ring1.rotation.z =
    .25;

  group.add(ring1);


  const ring2 =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        2.9,
        .006,
        12,
        220
      ),

      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: .12
      })

    );


  ring2.rotation.x =
    Math.PI * .2;

  ring2.rotation.y =
    .4;

  group.add(ring2);


  const particles =
    new THREE.Group();


  const pGeo =
    new THREE.SphereGeometry(
      .02,
      6,
      6
    );


  for (let i = 0; i < 90; i++) {

    const mat =
      new THREE.MeshBasicMaterial({

        color:
          i % 5 === 0
            ? 0xcdae7d
            : 0xffffff,

        transparent: true,
        opacity: .4

      });


    const p =
      new THREE.Mesh(
        pGeo,
        mat
      );


    const a =
      Math.random() *
      Math.PI *
      2;


    const r =
      3 +
      Math.random() *
      1.6;


    p.position.set(

      Math.cos(a) * r,

      (Math.random() - .5) * 3.2,

      Math.sin(a) * r

    );


    particles.add(p);

  }


  group.add(particles);


  scene.add(
    new THREE.AmbientLight(
      0xffffff,
      .65
    )
  );


  const key =
    new THREE.DirectionalLight(
      0xffe9c9,
      3
    );


  key.position.set(
    4,
    4,
    6
  );


  scene.add(key);


  const rim =
    new THREE.PointLight(
      0xffffff,
      18,
      20
    );


  rim.position.set(
    -4,
    -1,
    3
  );


  scene.add(rim);


  const resize = () => {

    const r =
      canvas.parentElement
        .getBoundingClientRect();


    renderer.setSize(
      r.width,
      r.height,
      false
    );


    camera.aspect =
      r.width / r.height;


    camera.updateProjectionMatrix();

  };


  window.addEventListener('resize', resize);


  resize();


  let mx = 0;
  let my = 0;


  const onMove = (e) => {

      mx =
        (e.clientX / innerWidth - .5) * .5;

      my =
        (e.clientY / innerHeight - .5) * .3;

    };
  window.addEventListener('pointermove', onMove, { passive: true });


  const clock =
    new THREE.Clock();


  let raf = 0;
  let stopped = false;
  const tick = () => {
    if (stopped) return;

    const t =
      clock.getElapsedTime();


    group.rotation.y +=
      0.0022;


    group.rotation.x +=
      (
        my * .22 -
        group.rotation.x
      ) * .025;


    group.rotation.z +=
      (
        mx * .16 -
        group.rotation.z
      ) * .025;


    core.scale.setScalar(
      1 +
      Math.sin(t * 1.5) * .02
    );


    wire.rotation.y =
      -t * .07;


    ring1.rotation.z =
      t * .1;


    ring2.rotation.y =
      -t * .08;


    particles.rotation.y =
      t * .02;


    renderer.render(
      scene,
      camera
    );


    raf = requestAnimationFrame(tick);

  };


  tick();
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    renderer.dispose();
  };
}
