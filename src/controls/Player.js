import * as THREE from 'https://esm.sh/three@0.161.0';
import { PointerLockControls } from 'https://esm.sh/three@0.161.0/examples/jsm/controls/PointerLockControls.js';

const MOVEMENT_SPEED = 480;
const SPRINT_MULTIPLIER = 1.8;
const FRICTION = 8;
const JUMP_FORCE = 230;
const GRAVITY = 580;

export class Player {
  constructor(camera, renderer, world, overlay) {
    this.camera = camera;
    this.renderer = renderer;
    this.world = world;
    this.overlay = overlay;

    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.canJump = false;
    this.heightOffset = 8;
    this.isSprinting = false;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.initEvents();
  }

  initEvents() {
    const element = this.renderer.domElement;

    element.addEventListener('click', () => {
      this.controls.lock();
    });

    this.controls.addEventListener('lock', () => {
      this.overlay.classList.add('hidden');
    });

    this.controls.addEventListener('unlock', () => {
      this.overlay.classList.remove('hidden');
    });

    document.addEventListener('keydown', (event) => this.onKeyDown(event));
    document.addEventListener('keyup', (event) => this.onKeyUp(event));
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true;
        break;
      case 'Space':
        if (this.canJump) {
          this.velocity.y += JUMP_FORCE;
          this.canJump = false;
        }
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = true;
        break;
      default:
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = false;
        break;
      default:
        break;
    }
  }

  update(delta) {
    if (!this.controls.isLocked) return;

    const speed = MOVEMENT_SPEED * (this.isSprinting ? SPRINT_MULTIPLIER : 1);

    this.velocity.x -= this.velocity.x * FRICTION * delta;
    this.velocity.z -= this.velocity.z * FRICTION * delta;

    this.velocity.y -= GRAVITY * delta;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * speed * delta;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * speed * delta;
    }

    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);

    const position = this.controls.getObject().position;
    const groundHeight = this.world.getHeight(position.x, position.z) + this.heightOffset;

    if (position.y < groundHeight) {
      this.velocity.y = 0;
      position.y = groundHeight;
      this.canJump = true;
    } else {
      position.y += this.velocity.y * delta;
    }
  }
}
