import * as THREE from 'https://esm.sh/three@0.161.0';
import { World } from './world/World.js';
import { Player } from './controls/Player.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 4000);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b4d6);

const world = new World(scene);

const overlay = document.getElementById('overlay');
const player = new Player(camera, renderer, world, overlay);
scene.add(player.controls.getObject());

const spawnX = 80;
const spawnZ = 80;
const spawnHeight = world.getHeight(spawnX, spawnZ) + player.heightOffset;
player.controls.getObject().position.set(spawnX, spawnHeight, spawnZ);
camera.lookAt(new THREE.Vector3(0, spawnHeight, 0));

const stars = createSkyDome();
scene.add(stars);

const aurora = createAuroraVeil();
scene.add(aurora);

const clock = new THREE.Clock();

window.addEventListener('resize', onWindowResize);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && player.controls.isLocked) {
    player.controls.unlock();
  }
});

animate();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);

  world.update(delta);
  updateSky(stars, world.time);
  updateAurora(aurora, world.time);
  player.update(delta);

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function createSkyDome() {
  const geometry = new THREE.SphereGeometry(1800, 32, 32);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      uniform float uTime;

      float starIntensity(vec3 p) {
        float noise = fract(sin(dot(p.xyz, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
        return smoothstep(0.96, 1.0, noise);
      }

      void main() {
        vec3 dir = normalize(vWorldPosition);
        float altitude = max(dir.y, -0.2);
        vec3 duskColor = mix(vec3(0.05, 0.08, 0.2), vec3(0.7, 0.65, 0.8), clamp(altitude * 0.5 + 0.5, 0.0, 1.0));

        float starField = starIntensity(dir * 120.0 + uTime * 0.05);
        vec3 starColor = vec3(starField) * 1.5;

        gl_FragColor = vec4(duskColor + starColor, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  return mesh;
}

function updateSky(sky, time) {
  const shader = sky.material;
  shader.uniforms.uTime.value = time;
}

function createAuroraVeil() {
  const geometry = new THREE.PlaneGeometry(1600, 420, 128, 16);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(0x58f6ff) },
      uColorB: { value: new THREE.Color(0x8866ff) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vDisplacement;
      uniform float uTime;

      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave = sin(pos.x * 0.004 + uTime * 0.3) * 20.0;
        wave += sin(pos.x * 0.009 - uTime * 0.6) * 12.0;
        pos.y += wave;
        vDisplacement = wave;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vDisplacement;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;

      void main() {
        float glow = smoothstep(0.0, 0.7, 1.0 - vUv.y);
        float shimmer = sin(vUv.x * 40.0 + uTime * 4.0) * 0.1;
        float alpha = clamp(glow * 0.45 + abs(vDisplacement) * 0.002 + shimmer * 0.05, 0.0, 0.8);
        vec3 color = mix(uColorA, uColorB, vUv.x + shimmer * 0.2);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 280, -420);
  mesh.rotation.x = Math.PI / 2.6;
  mesh.rotation.z = Math.PI * 0.08;
  return mesh;
}

function updateAurora(auroraMesh, time) {
  auroraMesh.material.uniforms.uTime.value = time;
}
