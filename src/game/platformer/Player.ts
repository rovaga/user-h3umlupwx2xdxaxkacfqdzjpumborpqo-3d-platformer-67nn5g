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
  private wasSpacePressed: boolean = false;

  // Player settings (per second)
  private readonly speed = 6.0; // units per second
  private readonly jumpForce = 8.0; // units per second
  private readonly gravity = -20.0; // units per second squared

  // Camera settings
  private cameraDistance = 8;
  private cameraHeight = 4;
  private cameraRotationY = 0;
  private cameraRotationX = 0.3;

  constructor(engine: Engine) {
    this.engine = engine;
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.onGround = false; // Will be set by collision detection

    // Create player group (hamburger)
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Create bottom bun (brown cylinder)
    const bunBottomGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    const bunBottomMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd4a574, // Golden brown bun color
      roughness: 0.7 
    });
    this.bunBottom = new THREE.Mesh(bunBottomGeometry, bunBottomMaterial);
    this.bunBottom.position.y = -0.15;
    this.bunBottom.castShadow = true;
    this.mesh.add(this.bunBottom);

    // Create top bun (smaller, positioned above)
    const bunTopGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    const bunTopMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd4a574,
      roughness: 0.7 
    });
    this.bunTop = new THREE.Mesh(bunTopGeometry, bunTopMaterial);
    this.bunTop.position.y = 0.25; // Will be adjusted as ingredients are added
    this.bunTop.castShadow = true;
    this.mesh.add(this.bunTop);

    // Create direction indicator (yellow cone)
    const indicatorGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.indicator.rotation.x = Math.PI / 2;
    this.indicator.position.z = 0.6;
    this.indicator.position.y = 0.25;
    this.mesh.add(this.indicator);

    console.log('[Player] Created as hamburger');
  }

  update(deltaTime: number, platforms: Platform[]): void {
    this.handleInput(deltaTime);
    this.applyPhysics(deltaTime);
    this.checkCollisions(platforms);
    this.updateMesh();
    this.updateCamera();
  }

  private handleInput(deltaTime: number): void {
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

    // Apply movement (will be scaled by deltaTime in update method)
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

      // Move player (scaled by deltaTime for frame-rate independence)
      const clampedDeltaTime = Math.min(deltaTime, 0.1);
      this.position.x += worldMoveDirection.x * this.speed * clampedDeltaTime;
      this.position.z += worldMoveDirection.z * this.speed * clampedDeltaTime;

      // Rotate player to face movement direction
      this.rotation = Math.atan2(worldMoveDirection.x, worldMoveDirection.z);
    }

    // Jump (keyboard or mobile button)
    let shouldJump = false;
    if (isMobile) {
      shouldJump = mobileInput.consumeJump();
    } else {
      // For keyboard, detect key press (transition from not pressed to pressed)
      const isSpacePressed = input.isKeyPressed('Space');
      if (isSpacePressed && !this.wasSpacePressed) {
        shouldJump = true;
      }
      this.wasSpacePressed = isSpacePressed;
    }

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

  private applyPhysics(deltaTime: number): void {
    // Clamp deltaTime to prevent large jumps (e.g., when tab is inactive)
    const clampedDeltaTime = Math.min(deltaTime, 0.1);
    
    // Apply gravity (scaled by deltaTime for frame-rate independence)
    this.velocity.y += this.gravity * clampedDeltaTime;
    
    // Limit maximum fall speed to prevent tunneling through platforms
    const maxFallSpeed = 30.0;
    if (this.velocity.y < -maxFallSpeed) {
      this.velocity.y = -maxFallSpeed;
    }
    
    this.position.y += this.velocity.y * clampedDeltaTime;

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
      const playerBottom = this.position.y - 0.3; // Adjusted for bun height
      const playerTop = this.position.y + 0.3;
      const playerRadius = 0.5;

      // Check horizontal overlap
      const horizontalOverlap =
        this.position.x + playerRadius > bounds.min.x &&
        this.position.x - playerRadius < bounds.max.x &&
        this.position.z + playerRadius > bounds.min.z &&
        this.position.z - playerRadius < bounds.max.z;

      if (horizontalOverlap) {
        // Check if landing on top of platform (most common case)
        const platformTop = bounds.max.y;
        const distanceToTop = playerBottom - platformTop;
        const expectedY = platformTop + 0.3;
        
        // If player is close to platform top and falling or on it
        // Only adjust position if player is actually intersecting or very close
        if (
          distanceToTop <= 0.1 && // Within 0.1 units above platform (tighter tolerance)
          distanceToTop >= -0.2 && // Not too far below (tighter tolerance)
          this.velocity.y <= 0.1 // Falling or stationary (small tolerance for floating)
        ) {
          // Only snap if not already at the correct position (prevents bouncing)
          if (Math.abs(this.position.y - expectedY) > 0.01) {
            this.position.y = expectedY;
          }
          this.velocity.y = 0;
          this.onGround = true;
          break; // Only stand on one platform at a time
        }
        // Check side collisions (player inside platform horizontally but not on top)
        else if (
          playerTop > bounds.min.y &&
          playerBottom < bounds.max.y &&
          playerBottom < platformTop - 0.1 // Not on top
        ) {
          // Push player out horizontally
          const centerX = (bounds.min.x + bounds.max.x) / 2;
          const centerZ = (bounds.min.z + bounds.max.z) / 2;
          const dx = this.position.x - centerX;
          const dz = this.position.z - centerZ;
          
          if (Math.abs(dx) > Math.abs(dz)) {
            // Push out on X axis
            if (dx > 0) {
              this.position.x = bounds.max.x + playerRadius;
            } else {
              this.position.x = bounds.min.x - playerRadius;
            }
          } else {
            // Push out on Z axis
            if (dz > 0) {
              this.position.z = bounds.max.z + playerRadius;
            } else {
              this.position.z = bounds.min.z - playerRadius;
            }
          }
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
    // Position ingredient on top of current stack (stack starts at top of bottom bun, y=0)
    ingredientMesh.position.y = this.ingredientStackHeight + height / 2;
    this.mesh.add(ingredientMesh);
    this.collectedIngredients.push(ingredientMesh);
    this.ingredientStackHeight += height;
    
    // Move top bun and indicator higher to sit on top of ingredients
    this.bunTop.position.y = this.ingredientStackHeight + 0.1;
    this.indicator.position.y = this.ingredientStackHeight + 0.15;
    
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
