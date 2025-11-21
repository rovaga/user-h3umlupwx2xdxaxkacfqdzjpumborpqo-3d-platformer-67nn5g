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
  private mesh: THREE.Group; // Group to hold Francisco I. Madero character
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private hat: THREE.Mesh;
  private hatBrim: THREE.Mesh;
  private mustache: THREE.Mesh;
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

    // Create player group (Francisco I. Madero)
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Create body (torso - dark suit color)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2c2c2c, // Dark suit color
      roughness: 0.8 
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.1;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Create head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf4c2a1, // Skin tone
      roughness: 0.7 
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 0.6;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Create hat (sombrero/hat characteristic of the era)
    const hatGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.15, 16);
    const hatMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a, // Black hat
      roughness: 0.6 
    });
    this.hat = new THREE.Mesh(hatGeometry, hatMaterial);
    this.hat.position.y = 0.75;
    this.hat.castShadow = true;
    this.mesh.add(this.hat);

    // Create hat brim
    const brimGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16);
    const brimMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      roughness: 0.6 
    });
    this.hatBrim = new THREE.Mesh(brimGeometry, brimMaterial);
    this.hatBrim.position.y = 0.68;
    this.hatBrim.castShadow = true;
    this.mesh.add(this.hatBrim);

    // Create mustache (characteristic of Francisco I. Madero)
    const mustacheGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.05);
    const mustacheMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a, // Dark mustache
      roughness: 0.8 
    });
    this.mustache = new THREE.Mesh(mustacheGeometry, mustacheMaterial);
    this.mustache.position.y = 0.55;
    this.mustache.position.z = 0.2;
    this.mustache.castShadow = true;
    this.mesh.add(this.mustache);

    // Create direction indicator (yellow cone)
    const indicatorGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.indicator.rotation.x = Math.PI / 2;
    this.indicator.position.z = 0.6;
    this.indicator.position.y = 0.8;
    this.mesh.add(this.indicator);

    console.log('[Player] Created as Francisco I. Madero');
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
      const playerBottom = this.position.y - 0.4; // Adjusted for character height
      const playerRadius = 0.3;

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
          this.position.y = bounds.max.y + 0.3;
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
    // Position ingredient on top of current stack (stack starts at top of head, y=0.85)
    ingredientMesh.position.y = 0.85 + this.ingredientStackHeight + height / 2;
    this.mesh.add(ingredientMesh);
    this.collectedIngredients.push(ingredientMesh);
    this.ingredientStackHeight += height;
    
    // Move indicator higher to sit on top of ingredients
    this.indicator.position.y = 0.85 + this.ingredientStackHeight + 0.15;
    
    console.log(`[Player] Added ingredient. Stack height: ${this.ingredientStackHeight}`);
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRadius(): number {
    return 0.3;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.body.geometry.dispose();
    (this.body.material as THREE.Material).dispose();
    this.head.geometry.dispose();
    (this.head.material as THREE.Material).dispose();
    this.hat.geometry.dispose();
    (this.hat.material as THREE.Material).dispose();
    this.hatBrim.geometry.dispose();
    (this.hatBrim.material as THREE.Material).dispose();
    this.mustache.geometry.dispose();
    (this.mustache.material as THREE.Material).dispose();
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
