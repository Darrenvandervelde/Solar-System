 import * as THREE from 'three';

      // ——— Scene Setup ———
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      document.body.appendChild(renderer.domElement);

      // ——— Lighting ———
      const sunLight = new THREE.PointLight(0xffffff, 150, 5000);
      sunLight.position.set(0, 0, 0);
      scene.add(sunLight);
      scene.add(new THREE.AmbientLight(0x404070, 0.4));

      // ——— Starfield ———
      const starsGeo = new THREE.BufferGeometry();
      const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true });
      const starsVertices = [];
      for (let i = 0; i < 25000; i++) {
        const x = (Math.random() - 0.5) * 6000;
        const y = (Math.random() - 0.5) * 6000;
        const z = (Math.random() - 0.5) * 6000;
        starsVertices.push(x, y, z);
      }
      starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
      scene.add(new THREE.Points(starsGeo, starsMat));

      // ——— Textures ———
      const t = new THREE.TextureLoader();
      const textures = {
        sun: await t.loadAsync('/textures/sun.png'),
        mercury: await t.loadAsync('/textures/mercury.png'),
        venus: await t.loadAsync('/textures/venus.png'),
        earth: await t.loadAsync('/textures/earth.png'),
        moon: await t.loadAsync('/textures/moon.png'),
        mars: await t.loadAsync('/textures/mars.png'),
        jupiter: await t.loadAsync('/textures/jupiter.png'),
        saturn: await t.loadAsync('/textures/saturn.png'),
        saturnRing: await t.loadAsync('/textures/saturn.png'),
        uranus: await t.loadAsync('/textures/uranus.png'),
        neptune: await t.loadAsync('/textures/neptune.png'),
      };

      // ——— Planet Data ———
      const planetData = [
        { n: "Sun",      r: 70,  d: 0,    s: 0,     tex: textures.sun,      glow: true },
        { n: "Mercury",  r: 6,   d: 120,  s: 0.047, tex: textures.mercury },
        { n: "Venus",    r: 9,   d: 180,  s: 0.035, tex: textures.venus },
        { n: "Earth",    r: 10,  d: 260,  s: 0.029, tex: textures.earth,    glow: true },
        { n: "Mars",     r: 7,   d: 380,  s: 0.024, tex: textures.mars },
        { n: "Jupiter",  r: 32,  d: 620,  s: 0.013, tex: textures.jupiter },
        { n: "Saturn",   r: 28,  d: 950,  s: 0.0097,tex: textures.saturn,   ring: true },
        { n: "Uranus",   r: 16,  d: 1400, s: 0.0068,tex: textures.uranus },
        { n: "Neptune",  r: 16,  d: 1800, s: 0.0054,tex: textures.neptune }
      ];

      const planets = [];

      planetData.forEach(p => {
        const geo = new THREE.SphereGeometry(p.r, 64, 64);
        const mat = p.n === "Sun" 
          ? new THREE.MeshBasicMaterial({ map: p.tex })
          : new THREE.MeshStandardMaterial({ map: p.tex });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { name: p.n, dist: p.d, speed: p.s, angle: Math.random() * Math.PI * 2 };
        mesh.position.x = p.d;
        scene.add(mesh);
        planets.push(mesh);

        // Glow (Earth & Sun)
        if (p.glow) {
          const glowGeo = new THREE.SphereGeometry(p.r * 1.3, 32, 32);
          const glowMat = new THREE.ShaderMaterial({
            uniforms: { color: { value: new THREE.Color(p.n === "Sun" ? 0xffaa00 : 0x0088ff) } },
            vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `uniform vec3 color; varying vec3 vNormal; void main() { float intensity = pow(0.7 - dot(vNormal, vec3(0,0,1)), 4.0); gl_FragColor = vec4(color, 0.3) * intensity; }`,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
          });
          mesh.add(new THREE.Mesh(glowGeo, glowMat));
        }

        // Saturn Ring
        if (p.ring) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(p.r * 1.3, p.r * 2.6, 64),
            new THREE.MeshBasicMaterial({ map: textures.saturnRing, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
          );
          ring.rotation.x = Math.PI / 2;
          mesh.add(ring);
        }

        // Label
        const label = createLabel(p.n, p.n === "Sun" ? "#ffff00" : "#ffffff");
        label.position.y = p.r + 20;
        mesh.add(label);
      });

      // Moon
      const earth = planets[3];
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(3, 32, 32),
        new THREE.MeshStandardMaterial({ map: textures.moon })
      );
      earth.add(moon);

      // ——— Spaceship ———
      const ship = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.ConeGeometry(2, 8, 12),
        new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.4 })
      );
      body.rotation.x = Math.PI / 2;
      ship.add(body);

      const wings = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.3, 3),
        new THREE.MeshStandardMaterial({ color: 0xff0066 })
      );
      ship.add(wings);

      ship.position.set(0, 20, 300);
      scene.add(ship);

      // Thruster
      const thruster = new THREE.PointLight(0x00ffff, 0, 50);
      thruster.position.set(0, 0, 4);
      ship.add(thruster);

      // ——— Controls ———
      const keys = { w:0, s:0, a:0, d:0, q:0, e:0 };
      let yaw = 0, pitch = 0, speed = 1;

      document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = 1);
      document.addEventListener('keyup',   e => keys[e.key.toLowerCase()] = 0);
      document.addEventListener('wheel',   e => speed = THREE.MathUtils.clamp(speed - e.deltaY * 0.001, 0.1, 20));

      document.addEventListener('mousemove', e => {
        if (document.pointerLockElement) {
          yaw -= e.movementX * 0.002;
          pitch -= e.movementY * 0.002;
          pitch = Math.max(-1.5, Math.min(1.5, pitch));
        }
      });

      // ——— Helpers ———
      function createLabel(text, color = "#fff") {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 48px Arial';
        const w = ctx.measureText(text).width + 40;
        canvas.width = w; canvas.height = 80;
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 8;
        ctx.strokeText(text, 20, 55);
        ctx.fillText(text, 20, 55);

        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true })
        );
        sprite.scale.set(w/50, 2, 1);
        return sprite;
      }

      // ——— Animation Loop ———
      const clock = new THREE.Clock();
      function animate() {
        const delta = clock.getDelta();
        const moveSpeed = 300 * speed * delta;

        // Ship rotation & movement
        ship.rotation.y = yaw;
        ship.rotation.x = pitch;

        const forward = new THREE.Vector3(0,0,-1).applyQuaternion(ship.quaternion);
        const right    = new THREE.Vector3(1,0,0).applyQuaternion(ship.quaternion);
        const up       = new THREE.Vector3(0,1,0);

        if (keys.w) ship.position.addScaledVector(forward, moveSpeed);
        if (keys.s) ship.position.addScaledVector(forward, -moveSpeed * 0.5);
        if (keys.a) ship.position.addScaledVector(right, -moveSpeed * 0.8);
        if (keys.d) ship.position.addScaledVector(right,  moveSpeed * 0.8);
        if (keys.q) ship.position.addScaledVector(up, -moveSpeed * 0.8);
        if (keys.e) ship.position.addScaledVector(up,  moveSpeed * 0.8);

        thruster.intensity = keys.w ? 4 : 1;

        // Camera follow
        const camOffset = new THREE.Vector3(0, 12, 40).applyQuaternion(ship.quaternion);
        const sway = new THREE.Vector3(Math.sin(clock.elapsedTime*2)*2, Math.sin(clock.elapsedTime*1.7)*1, 0);
        camera.position.lerp(ship.position.clone().add(camOffset).add(sway), 0.1);
        camera.lookAt(ship.position.clone().add(forward.clone().multiplyScalar(100)));

        // Planets orbit
        planets.forEach(p => {
          if (p.userData.dist > 0) {
            p.userData.angle += p.userData.speed * delta;
            p.position.x = Math.cos(p.userData.angle) * p.userData.dist;
            p.position.z = Math.sin(p.userData.angle) * p.userData.dist;
          }
          p.rotation.y += 0.006;
        });

        // Moon orbit
        moon.position.set(Math.cos(clock.elapsedTime * 3) * 25, 0, Math.sin(clock.elapsedTime * 3) * 25);

        // HUD Update
        document.getElementById('speed').textContent = speed.toFixed(1);
        let nearest = planets.reduce((a,b) => 
          ship.position.distanceTo(a.position) < ship.position.distanceTo(b.position) ? a : b
        );
        document.getElementById('nearest').textContent = nearest.userData.name;
        document.getElementById('dist').textContent = 
          (ship.position.distanceTo(nearest.position)).toFixed(0) + " AU";

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }

      // Resize
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      animate();