import * as THREE from 'https://esm.sh/three@0.161.0';
import { Terrain } from './Terrain.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.terrain = new Terrain();
    this.time = 0;

    this.islands = new THREE.Group();
    this.sunPivot = new THREE.Object3D();
    this.sun = null;
    this.ambientLight = null;
    this.skyColor = new THREE.Color(0x87b4d6);
    this.water = null;

    this.createEnvironment();
  }

  createEnvironment() {
    const terrainMesh = this.terrain.build();
    terrainMesh.castShadow = false;
    terrainMesh.receiveShadow = true;
    this.islands.add(terrainMesh);

    const water = this.createWaterPlane();
    water.position.y = -12;
    this.water = water;
    this.islands.add(water);

    const rocks = this.createRockFields();
    this.islands.add(rocks);

    const trees = this.createTrees();
    this.islands.add(trees);

    const campfires = this.createCampfires();
    this.islands.add(campfires);

    this.scene.add(this.islands);

    this.ambientLight = new THREE.AmbientLight(0xbfd3ff, 0.45);
    this.scene.add(this.ambientLight);

    this.sunPivot.position.set(0, 0, 0);
    this.scene.add(this.sunPivot);

    this.sun = new THREE.DirectionalLight(0xfff6d8, 1.6);
    this.sun.position.set(400, 600, 200);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 3000;
    const d = 500;
    this.sun.shadow.camera.left = -d;
    this.sun.shadow.camera.right = d;
    this.sun.shadow.camera.top = d;
    this.sun.shadow.camera.bottom = -d;

    this.sunPivot.add(this.sun);

    this.scene.background = this.skyColor;
    this.scene.fog = new THREE.FogExp2(0x86a6c9, 0.00035);
  }

  createWaterPlane() {
    const geometry = new THREE.PlaneGeometry(4000, 4000, 1, 1);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x245d8f,
      opacity: 0.85,
      transparent: true,
      roughness: 0.3,
      metalness: 0.1,
      transmission: 0.65,
      clearcoat: 0.7,
      clearcoatRoughness: 0.4,
    });

    const water = new THREE.Mesh(geometry, material);
    water.receiveShadow = true;

    const waveMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
    });

    const wave = new THREE.Mesh(geometry.clone(), waveMaterial);
    wave.scale.set(0.99, 0.99, 0.99);
    water.add(wave);

    return water;
  }

  createTrees() {
    const group = new THREE.Group();
    const treeCount = 450;
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5d3e1f, roughness: 0.9 });
    const leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b6f3e,
      emissive: 0x05280c,
      emissiveIntensity: 0.1,
      roughness: 0.8,
    });

    const trunkGeometry = new THREE.CylinderGeometry(1.5, 2.2, 18, 6);
    const leavesGeometry = new THREE.ConeGeometry(9, 24, 12);

    for (let i = 0; i < treeCount; i++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.castShadow = true;
      trunk.position.y = 9;

      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.castShadow = true;
      leaves.position.y = 22;

      tree.add(trunk, leaves);

      const { x, z } = this.randomXZOnTerrain();
      const height = this.terrain.sampleHeight(x, z);

      if (height < -5 || height > 140) continue; // avoid water & peaks

      tree.position.set(x, height, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.scale.setScalar(0.8 + Math.random() * 0.6);
      group.add(tree);
    }

    return group;
  }

  createRockFields() {
    const group = new THREE.Group();
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x77706b, roughness: 0.8 });

    for (let i = 0; i < 160; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(2 + Math.random() * 6);
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.castShadow = true;
      rock.scale.y = 0.7 + Math.random() * 0.4;

      const { x, z } = this.randomXZOnTerrain();
      const height = this.terrain.sampleHeight(x, z);
      if (height < -8) continue;

      rock.position.set(x, height + rock.geometry.parameters.radius * 0.2, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      group.add(rock);
    }

    return group;
  }

  createCampfires() {
    const group = new THREE.Group();
    const fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8c3a,
      emissive: 0xff4e00,
      emissiveIntensity: 0.9,
    });

    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x392618 });

    for (let i = 0; i < 12; i++) {
      const { x, z } = this.randomXZOnTerrain();
      const height = this.terrain.sampleHeight(x, z);

      if (height < 0 || height > 140) continue;

      const logs = new THREE.Group();
      for (let j = 0; j < 5; j++) {
        const logGeometry = new THREE.CylinderGeometry(0.6, 0.6, 6, 6);
        const log = new THREE.Mesh(logGeometry, baseMaterial);
        log.castShadow = true;
        log.rotation.z = Math.PI / 2;
        log.rotation.y = (Math.PI * 2 * j) / 5;
        log.position.y = 1.2;
        logs.add(log);
      }

      const flameGeometry = new THREE.ConeGeometry(2, 5, 8);
      const flame = new THREE.Mesh(flameGeometry, fireMaterial);
      flame.position.y = 3.8;
      flame.castShadow = true;

      const light = new THREE.PointLight(0xffa76c, 2.4, 120, 2);
      light.position.set(0, 5.2, 0);
      light.castShadow = true;

      const flickerData = {
        baseIntensity: light.intensity,
        flame,
        offset: Math.random() * Math.PI * 2,
      };
      light.userData.flicker = flickerData;

      const fire = new THREE.Group();
      fire.position.set(x, height, z);
      fire.add(logs, flame, light);
      group.add(fire);
    }

    return group;
  }

  randomXZOnTerrain() {
    const size = this.terrain.options.size * 0.5;
    const x = THREE.MathUtils.randFloatSpread(size * 2);
    const z = THREE.MathUtils.randFloatSpread(size * 2);
    return { x, z };
  }

  getHeight(x, z) {
    return this.terrain.sampleHeight(x, z);
  }

  update(delta) {
    this.time += delta;

    const dayDuration = 180; // seconds for full cycle
    const cycle = (this.time % dayDuration) / dayDuration;
    const angle = cycle * Math.PI * 2;

    this.sunPivot.rotation.x = angle;

    const daylight = Math.max(Math.sin(angle), 0.15);
    this.ambientLight.intensity = THREE.MathUtils.lerp(0.25, 0.65, daylight);
    this.sun.intensity = THREE.MathUtils.lerp(0.6, 2.0, daylight);

    this.skyColor.setHSL(0.6 - daylight * 0.15, 0.5, 0.7 - daylight * 0.25);
    this.scene.background = this.skyColor;
    this.scene.fog.color.copy(this.skyColor);

    if (this.water) {
      this.water.rotation.z = Math.sin(this.time * 0.05) * 0.002;
      const wave = this.water.children[0];
      if (wave && wave.material) {
        wave.material.opacity = 0.07 + Math.sin(this.time * 0.6) * 0.01;
      }
    }

    this.islands.traverse((child) => {
      if (child.isPointLight && child.userData.flicker) {
        const flicker = child.userData.flicker;
        const noise =
          Math.sin(this.time * 10 + flicker.offset) * 0.6 +
          Math.sin(this.time * 17 + flicker.offset * 1.3) * 0.4;
        child.intensity = flicker.baseIntensity + noise * 0.35;
        const scale = 0.9 + Math.abs(noise) * 0.12;
        flicker.flame.scale.setScalar(scale);
      }
    });
  }
}
