import * as THREE from 'https://esm.sh/three@0.161.0';
import { ImprovedNoise } from 'https://esm.sh/three@0.161.0/examples/jsm/math/ImprovedNoise.js';

const BIOME_COLORS = {
  low: new THREE.Color(0x2f6b35),
  high: new THREE.Color(0xd8d4c0),
  beach: new THREE.Color(0xcaba94),
  rock: new THREE.Color(0x6b655b),
  underwater: new THREE.Color(0x12384a),
};

const defaultOptions = {
  size: 2000,
  segments: 256,
  height: 180,
  noiseScale: 320,
  octaves: 5,
  persistence: 0.5,
  lacunarity: 2.2,
  seed: 42,
};

export class Terrain {
  constructor(options = {}) {
    this.options = { ...defaultOptions, ...options };
    this.noise = new ImprovedNoise();
    this.seedOffset = this.options.seed * 100;

    this.geometry = null;
    this.mesh = null;
    this.tmpColor = new THREE.Color();
  }

  build() {
    const { size, segments } = this.options;
    this.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    this.geometry.rotateX(-Math.PI / 2);

    const position = this.geometry.attributes.position;
    const colors = [];

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const y = this.sampleHeight(x, z);

      position.setY(i, y);

      const color = this.sampleColor(y);
      colors.push(color.r, color.g, color.b);
    }

    this.geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );

    this.geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      flatShading: false,
      vertexColors: true,
      roughness: 1,
      metalness: 0.05,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;

    return this.mesh;
  }

  sampleHeight(x, z) {
    const {
      noiseScale,
      height,
      octaves,
      persistence,
      lacunarity,
    } = this.options;

    let amplitude = 1;
    let frequency = 1;
    let value = 0;

    for (let i = 0; i < octaves; i++) {
      const nx = (x + this.seedOffset) / (noiseScale / frequency);
      const nz = (z + this.seedOffset) / (noiseScale / frequency);

      const noiseValue = this.noise.noise(nx, nz, this.seedOffset);
      value += noiseValue * amplitude;

      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value * height;
  }

  sampleColor(height) {
    const waterLevel = -15;
    const beachLevel = 10;
    const snowLevel = 120;

    if (height < waterLevel) {
      return BIOME_COLORS.underwater;
    }

    if (height < beachLevel) {
      return BIOME_COLORS.beach;
    }

    if (height > snowLevel) {
      return BIOME_COLORS.high;
    }

    // Blend between grass and rock depending on slope
    const t = THREE.MathUtils.smoothstep(height, beachLevel, snowLevel);
    return this.tmpColor.copy(BIOME_COLORS.low).lerp(BIOME_COLORS.rock, t * 0.5);
  }
}
