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
  private mesh: THREE.Group; // Changed to Group to hold bun and ingredients
  private bunBottom: THREE.Mesh;
  private bunTop: THREE.Mesh;
  private indicator: THREE.Mesh;
  private collectedIngredients: THREE.Mesh[] = [];
  private ingredientStackHeight: number = 0;

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

    // Create player group (cat)
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Create cat body (orange/brown sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff8c42, // Orange
      roughness: 0.7 
    });
    this.bunBottom = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bunBottom.position.y = 0;
    this.bunBottom.castShadow = true;
    this.mesh.add(this.bunBottom);

    // Create cat head (larger sphere)
    const headGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff8c42,
      roughness: 0.7 
    });
    this.bunTop = new THREE.Mesh(headGeometry, headMaterial);
    this.bunTop.position.y = 0.7;
    this.bunTop.castShadow = true;
    this.mesh.add(this.bunTop);

    // Create cat ears (two triangular ears)
    const earGeometry = new THREE.ConeGeometry(0.15, 0.5, 3);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c42 });
    
    const ear1 = new THREE.Mesh(earGeometry, earMaterial);
    ear1.position.set(-0.3, 1.0, 0);
    ear1.rotation.z = -0.4;
    ear1.castShadow = true;
    this.mesh.add(ear1);

    const ear2 = new THREE.Mesh(earGeometry, earMaterial);
    ear2.position.set(0.3, 1.0, 0);
    ear2.rotation.z = 0.4;
    ear2.castShadow = true;
    this.mesh.add(ear2);

    // Create cat eyes (yellow/green spheres with pupils)
    const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye1.position.set(-0.2, 0.75, 0.5);
    this.mesh.add(eye1);
    
    const pupil1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), pupilMaterial);
    pupil1.position.set(-0.2, 0.75, 0.55);
    this.mesh.add(pupil1);

    const eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye2.position.set(0.2, 0.75, 0.5);
    this.mesh.add(eye2);
    
    const pupil2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), pupilMaterial);
    pupil2.position.set(0.2, 0.75, 0.55);
    this.mesh.add(pupil2);

    // Create cat nose (pink triangle)
    const noseGeometry = new THREE.ConeGeometry(0.06, 0.12, 3);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xffb6c1 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.65, 0.55);
    nose.rotation.x = Math.PI;
    this.mesh.add(nose);

    // Create cat whiskers (white cylinders)
    const whiskerGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.35, 4);
    const whiskerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    // Left whiskers
    for (let i = 0; i < 3; i++) {
      const whisker = new THREE.Mesh(whiskerGeometry, whiskerMaterial);
      whisker.position.set(-0.35, 0.65 - i * 0.05, 0.45);
      whisker.rotation.z = (i - 1) * Math.PI / 6;
      this.mesh.add(whisker);
    }
    
    // Right whiskers
    for (let i = 0; i < 3; i++) {
      const whisker = new THREE.Mesh(whiskerGeometry, whiskerMaterial);
      whisker.position.set(0.35, 0.65 - i * 0.05, 0.45);
      whisker.rotation.z = -(i - 1) * Math.PI / 6;
      this.mesh.add(whisker);
    }

    // Create cat tail (curved cylinder)
    const tailGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.0, 8);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c42 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.2, -0.5);
    tail.rotation.x = Math.PI / 3;
    tail.castShadow = true;
    this.mesh.add(tail);

    // Create direction indicator (yellow cone) - keep for gameplay
    const indicatorGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.indicator.rotation.x = Math.PI / 2;
    this.indicator.position.z = 0.8;
    this.indicator.position.y = 0.7;
    this.mesh.add(this.indicator);

    console.log('[Player] Created as cat');
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
      const playerBottom = this.position.y - 0.5; // Adjusted for cat height
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
          this.position.y = bounds.max.y + 0.5;
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

  addIngredient(ingredientMesh: THREE.Mesh, height: number): void {
    // Position ingredient on top of current stack (stack starts at top of cat head, y=1.0)
    ingredientMesh.position.y = 1.0 + this.ingredientStackHeight + height / 2;
    this.mesh.add(ingredientMesh);
    this.collectedIngredients.push(ingredientMesh);
    this.ingredientStackHeight += height;
    
    // Move indicator higher to sit on top of ingredients
    this.indicator.position.y = 1.0 + this.ingredientStackHeight + 0.15;
    
    console.log(`[Player] Added ingredient. Stack height: ${this.ingredientStackHeight}`);
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRadius(): number {
    return 0.5;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.bunBottom.geometry.dispose();
    (this.bunBottom.material as THREE.Material).dispose();
    this.bunTop.geometry.dispose();
    (this.bunTop.material as THREE.Material).dispose();
    this.indicator.geometry.dispose();
    (this.indicator.material as THREE.Material).dispose();
    
    // Dispose collected ingredients
    for (const ingredient of this.collectedIngredients) {
      ingredient.geometry.dispose();
      (ingredient.material as THREE.Material).dispose();
    }
    
    console.log('[Player] Disposed');
  }
}
