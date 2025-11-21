/**
 * AI-EDITABLE: Player Controller
 *
 * This file contains the player character logic including movement,
 * camera controls, jumping, and collision detection.
 * The player is represented as a taco al pastor (tortilla with al pastor meat).
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';
import { IngredientType } from './Ingredient';

export class Player {
  private engine: Engine;
  private mesh: THREE.Group; // Changed to Group to hold tortilla, meat, and ingredients
  private tortilla: THREE.Mesh; // Bottom tortilla
  private carnePastor: THREE.Mesh; // Al pastor meat
  private indicator: THREE.Mesh;
  private collectedIngredients: THREE.Mesh[] = [];
  private collectedIngredientTypes: IngredientType[] = []; // Track ingredient types
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

    // Create player group (taco al pastor)
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Create tortilla (bottom - flat yellow/beige cylinder)
    const tortillaGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16);
    const tortillaMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf4e4bc, // Light yellow/beige tortilla color
      roughness: 0.8 
    });
    this.tortilla = new THREE.Mesh(tortillaGeometry, tortillaMaterial);
    this.tortilla.position.y = -0.075;
    this.tortilla.castShadow = true;
    this.mesh.add(this.tortilla);

    // Create carne al pastor (meat - reddish/orange cylinder)
    const carneGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16);
    const carneMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd2691e, // Orange-red al pastor meat color
      roughness: 0.6 
    });
    this.carnePastor = new THREE.Mesh(carneGeometry, carneMaterial);
    this.carnePastor.position.y = 0.075; // Will be adjusted as ingredients are added
    this.carnePastor.castShadow = true;
    this.mesh.add(this.carnePastor);

    // Create direction indicator (yellow cone)
    const indicatorGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.indicator.rotation.x = Math.PI / 2;
    this.indicator.position.z = 0.6;
    this.indicator.position.y = 0.3; // Positioned above meat
    this.mesh.add(this.indicator);

    console.log('[Player] Created as taco al pastor');
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
      const playerBottom = this.position.y - 0.15; // Adjusted for tortilla height
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

  addIngredient(ingredientMesh: THREE.Mesh, height: number, ingredientType: IngredientType): void {
    // Position ingredient on top of current stack (stack starts at top of carne al pastor, y=0.225)
    ingredientMesh.position.y = this.ingredientStackHeight + height / 2 + 0.225;
    ingredientMesh.position.x = 0;
    ingredientMesh.position.z = 0;
    this.mesh.add(ingredientMesh);
    this.collectedIngredients.push(ingredientMesh);
    this.collectedIngredientTypes.push(ingredientType);
    this.ingredientStackHeight += height;
    
    // Move indicator higher to sit on top of ingredients
    this.indicator.position.y = this.ingredientStackHeight + 0.225 + 0.15;
    
    console.log(`[Player] Added ingredient ${ingredientType}. Stack height: ${this.ingredientStackHeight}`);
  }

  getIngredientList(): IngredientType[] {
    return [...this.collectedIngredientTypes];
  }

  resetIngredients(): void {
    // Remove all ingredient meshes from the scene
    for (const ingredient of this.collectedIngredients) {
      this.mesh.remove(ingredient);
      ingredient.geometry.dispose();
      (ingredient.material as THREE.Material).dispose();
    }
    
    // Clear arrays
    this.collectedIngredients = [];
    this.collectedIngredientTypes = [];
    this.ingredientStackHeight = 0;
    
    // Reset indicator position
    this.indicator.position.y = 0.3;
    
    console.log('[Player] Ingredients reset - back to empty taco al pastor');
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRadius(): number {
    return 0.5;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.tortilla.geometry.dispose();
    (this.tortilla.material as THREE.Material).dispose();
    this.carnePastor.geometry.dispose();
    (this.carnePastor.material as THREE.Material).dispose();
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
