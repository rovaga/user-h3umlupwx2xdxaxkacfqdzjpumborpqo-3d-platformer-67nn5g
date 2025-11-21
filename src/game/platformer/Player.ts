/**
 * AI-EDITABLE: Player Controller
 *
 * This file contains the player character logic including movement,
 * camera controls, jumping, and collision detection.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';

export class Player {
  private engine: Engine;
  private mesh: THREE.Mesh;
  private indicator: THREE.Mesh;

  // Player state
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: number = 0;
  private onGround: boolean = false;

  // Player settings
  private readonly speed = 0.1;
  private readonly jumpForce = 0.4;
  private readonly gravity = -0.015;

  // Camera settings
  private cameraDistance = 8;
  private cameraHeight = 4;
  private cameraRotationY = 0;
  private cameraRotationX = 0.3;

  constructor(engine: Engine) {
    this.engine = engine;
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Create cat body (main capsule)
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 0.8, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 }); // Orange cat
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.castShadow = true;
    engine.scene.add(this.mesh);

    // Create cat head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.6;
    head.castShadow = true;
    this.mesh.add(head);

    // Create cat ears (two triangles)
    const earGeometry = new THREE.ConeGeometry(0.15, 0.3, 3);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.2, 0.8, 0);
    leftEar.rotation.z = -0.3;
    leftEar.castShadow = true;
    this.mesh.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.2, 0.8, 0);
    rightEar.rotation.z = 0.3;
    rightEar.castShadow = true;
    this.mesh.add(rightEar);

    // Create tail (elongated capsule)
    const tailGeometry = new THREE.CapsuleGeometry(0.08, 0.6, 8, 8);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0, -0.5);
    tail.rotation.x = Math.PI / 6;
    tail.castShadow = true;
    this.mesh.add(tail);

    // Create direction indicator (small yellow cone for nose direction)
    const indicatorGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.indicator.rotation.x = Math.PI / 2;
    this.indicator.position.z = 0.5;
    this.indicator.position.y = 0.6;
    this.mesh.add(this.indicator);

    console.log('[Player] Created');
  }

  update(deltaTime: number, platforms: Platform[]): void {
    this.handleInput();
    this.applyPhysics();
    this.checkCollisions(platforms);
    this.updateMesh();
    this.updateCamera();
  }

  private handleInput(): void {
    const input = this.engine.input;
    const mobileInput = this.engine.mobileInput;
    const isMobile = mobileInput.isMobileControlsActive();

    const moveDirection = new THREE.Vector3();

    // Get movement input (keyboard or mobile joystick)
    if (isMobile) {
      // Mobile joystick input
      const joystick = mobileInput.getJoystickVector();
      moveDirection.x = joystick.x;
      moveDirection.z = joystick.y;
    } else {
      // Keyboard input
      if (input.isKeyPressed('KeyW')) moveDirection.z += 1;
      if (input.isKeyPressed('KeyS')) moveDirection.z -= 1;
      if (input.isKeyPressed('KeyA')) moveDirection.x -= 1;
      if (input.isKeyPressed('KeyD')) moveDirection.x += 1;
    }

    // Apply movement
    if (moveDirection.length() > 0) {
      moveDirection.normalize();

      // Calculate movement relative to camera direction
      const angle = this.cameraRotationY;
      const forward = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
      const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));

      const worldMoveDirection = new THREE.Vector3();
      worldMoveDirection.addScaledVector(forward, moveDirection.z);
      worldMoveDirection.addScaledVector(right, moveDirection.x);
      worldMoveDirection.normalize();

      // Move player
      this.position.x += worldMoveDirection.x * this.speed;
      this.position.z += worldMoveDirection.z * this.speed;

      // Rotate player to face movement direction
      this.rotation = Math.atan2(worldMoveDirection.x, worldMoveDirection.z);
    }

    // Jump (keyboard or mobile button)
    const shouldJump = isMobile
      ? mobileInput.isJumpPressed()
      : input.isKeyPressed('Space');

    if (shouldJump && this.onGround) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }

    // Camera control (mouse or touch)
    if (isMobile) {
      // Mobile touch camera
      const touchDelta = mobileInput.getCameraDelta();
      this.cameraRotationY -= touchDelta.x * 0.005;
      this.cameraRotationX -= touchDelta.y * 0.005;
      this.cameraRotationX = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, this.cameraRotationX)
      );
    } else if (input.isPointerLocked()) {
      // Mouse camera
      const mouseDelta = input.getMouseDelta();
      this.cameraRotationY -= mouseDelta.x * 0.002;
      this.cameraRotationX -= mouseDelta.y * 0.002;
      this.cameraRotationX = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, this.cameraRotationX)
      );
    }
  }

  private applyPhysics(): void {
    // Apply gravity
    this.velocity.y += this.gravity;
    this.position.y += this.velocity.y;

    // Reset to spawn if fallen off the world
    if (this.position.y < -10) {
      this.position.set(0, 5, 0);
      this.velocity.set(0, 0, 0);
    }
  }

  private checkCollisions(platforms: Platform[]): void {
    this.onGround = false;

    for (const platform of platforms) {
      const bounds = platform.getBounds();
      const playerBottom = this.position.y - 1;
      const playerRadius = 0.5;

      // Check horizontal overlap
      if (
        this.position.x + playerRadius > bounds.min.x &&
        this.position.x - playerRadius < bounds.max.x &&
        this.position.z + playerRadius > bounds.min.z &&
        this.position.z - playerRadius < bounds.max.z
      ) {
        // Check vertical collision (landing on platform)
        if (
          playerBottom <= bounds.max.y &&
          playerBottom >= bounds.min.y &&
          this.velocity.y <= 0
        ) {
          this.position.y = bounds.max.y + 1;
          this.velocity.y = 0;
          this.onGround = true;
        }
      }
    }
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }

  private updateCamera(): void {
    const camera = this.engine.camera;
    const cameraOffset = new THREE.Vector3();

    cameraOffset.x =
      Math.sin(this.cameraRotationY) *
      Math.cos(this.cameraRotationX) *
      this.cameraDistance;
    cameraOffset.y =
      Math.sin(this.cameraRotationX) * this.cameraDistance + this.cameraHeight;
    cameraOffset.z =
      Math.cos(this.cameraRotationY) *
      Math.cos(this.cameraRotationX) *
      this.cameraDistance;

    camera.position.copy(this.position).add(cameraOffset);

    // Prevent camera from going below ground
    if (camera.position.y < 0.5) {
      camera.position.y = 0.5;
    }

    camera.lookAt(this.position);
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.indicator.geometry.dispose();
    (this.indicator.material as THREE.Material).dispose();
    console.log('[Player] Disposed');
  }
}
