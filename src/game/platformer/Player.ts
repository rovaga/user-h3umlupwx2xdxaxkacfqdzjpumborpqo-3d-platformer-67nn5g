/**
 * AI-EDITABLE: Player Controller
 *
 * This file contains the player character logic including movement,
 * camera controls, jumping, and collision detection.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';
import type { Weapon, WeaponType } from './Weapon';
import type { Projectile } from './Projectile';

export class Player {
  private engine: Engine;
  private mesh: THREE.Group; // Changed to Group to hold bun and ingredients
  private bunBottom: THREE.Mesh;
  private bunTop: THREE.Mesh;
  private indicator: THREE.Mesh;
  private collectedIngredients: THREE.Mesh[] = [];
  private ingredientStackHeight: number = 0;
  private currentWeapon: Weapon | null = null;
  private weaponMesh: THREE.Group | null = null;
  private fireCooldown: number = 0;
  private lastMouseButtonState: boolean = false;
  private latestProjectile: Projectile | null = null;

  // Player state
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: number = 0;
  private onGround: boolean = false;
  private health: number = 100;
  private maxHealth: number = 100;
  private healthBarContainer: HTMLDivElement | null = null;
  private damageCooldown: number = 0;
  private damageCooldownTime: number = 0.5; // 0.5 seconds invincibility after taking damage

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

    // Create health bar
    this.createHealthBar();

    console.log('[Player] Created as hamburger');
  }

  private createHealthBar(): void {
    // Create health bar container
    this.healthBarContainer = document.createElement('div');
    this.healthBarContainer.style.position = 'fixed';
    this.healthBarContainer.style.top = '20px';
    this.healthBarContainer.style.left = '20px';
    this.healthBarContainer.style.width = '200px';
    this.healthBarContainer.style.height = '20px';
    this.healthBarContainer.style.backgroundColor = '#333';
    this.healthBarContainer.style.border = '2px solid #fff';
    this.healthBarContainer.style.borderRadius = '10px';
    this.healthBarContainer.style.overflow = 'hidden';
    this.healthBarContainer.style.pointerEvents = 'none';
    this.healthBarContainer.style.zIndex = '1000';
    
    // Create health fill
    const healthFill = document.createElement('div');
    healthFill.id = 'player-health-fill';
    healthFill.style.width = '100%';
    healthFill.style.height = '100%';
    healthFill.style.backgroundColor = '#00ff00';
    healthFill.style.transition = 'width 0.2s';
    
    // Create health text
    const healthText = document.createElement('div');
    healthText.id = 'player-health-text';
    healthText.style.position = 'absolute';
    healthText.style.top = '50%';
    healthText.style.left = '50%';
    healthText.style.transform = 'translate(-50%, -50%)';
    healthText.style.color = '#fff';
    healthText.style.fontSize = '12px';
    healthText.style.fontWeight = 'bold';
    healthText.style.textShadow = '1px 1px 2px #000';
    healthText.textContent = '100 / 100';
    
    this.healthBarContainer.appendChild(healthFill);
    this.healthBarContainer.appendChild(healthText);
    document.body.appendChild(this.healthBarContainer);
  }

  private updateHealthBar(): void {
    if (!this.healthBarContainer) return;
    
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    const healthFill = this.healthBarContainer.querySelector('#player-health-fill') as HTMLDivElement;
    const healthText = this.healthBarContainer.querySelector('#player-health-text') as HTMLDivElement;
    
    if (healthFill) {
      healthFill.style.width = `${healthPercent * 100}%`;
      // Change color based on health
      if (healthPercent > 0.6) {
        healthFill.style.backgroundColor = '#00ff00';
      } else if (healthPercent > 0.3) {
        healthFill.style.backgroundColor = '#ffff00';
      } else {
        healthFill.style.backgroundColor = '#ff0000';
      }
    }
    
    if (healthText) {
      healthText.textContent = `${Math.ceil(this.health)} / ${this.maxHealth}`;
    }
  }

  update(deltaTime: number, platforms: Platform[]): void {
    // Check if player is dead and respawn
    if (this.isDead()) {
      this.respawn();
    }

    this.handleInput();
    this.applyPhysics();
    this.checkCollisions(platforms);
    this.updateMesh();
    this.updateCamera();
    
    // Update fire cooldown
    if (this.fireCooldown > 0) {
      this.fireCooldown -= deltaTime;
    }

    // Update damage cooldown
    if (this.damageCooldown > 0) {
      this.damageCooldown -= deltaTime;
    }

    // Update health bar
    this.updateHealthBar();
  }

  private respawn(): void {
    // Reset position to spawn
    this.position.set(0, 2, 0);
    this.velocity.set(0, 0, 0);
    
    // Restore full health
    this.health = this.maxHealth;
    this.damageCooldown = 0;
    
    console.log('[Player] Respawned with full health');
  }

  getLatestProjectile(): Projectile | null {
    const projectile = this.latestProjectile;
    this.latestProjectile = null; // Consume the projectile
    return projectile;
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

    // Shooting (left mouse button)
    if (!isMobile && this.currentWeapon) {
      const mouseButtonPressed = input.isKeyPressed('Mouse0');
      if (mouseButtonPressed && !this.lastMouseButtonState && this.fireCooldown <= 0) {
        this.latestProjectile = this.shoot();
      }
      this.lastMouseButtonState = mouseButtonPressed;
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
      const playerBottom = this.position.y - 0.3; // Adjusted for bun height
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
    
    // Update weapon position and rotation
    if (this.weaponMesh && this.currentWeapon) {
      // Position weapon in front of player
      const weaponOffset = new THREE.Vector3(0, 0.5, 0.8);
      weaponOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
      this.weaponMesh.position.copy(weaponOffset);
      
      // Rotate weapon to face forward
      this.weaponMesh.rotation.y = this.rotation;
      
      // For ranged weapons, tilt slightly based on camera angle
      if (!this.currentWeapon.isMelee()) {
        this.weaponMesh.rotation.x = -this.cameraRotationX * 0.5;
      }
    }
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

  addWeapon(weapon: Weapon): void {
    // Remove old weapon if exists
    if (this.weaponMesh) {
      this.mesh.remove(this.weaponMesh);
      this.weaponMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }

    this.currentWeapon = weapon;
    this.weaponMesh = weapon.createMeshForPlayer();
    this.mesh.add(this.weaponMesh);
    
    console.log(`[Player] Equipped weapon: ${weapon.getType()}`);
  }

  getCurrentWeapon(): Weapon | null {
    return this.currentWeapon;
  }

  isMeleeAttacking(): boolean {
    // Melee attack is active if weapon is melee and fire cooldown was just triggered
    // We consider it attacking for a short duration after the cooldown starts
    if (!this.currentWeapon || !this.currentWeapon.isMelee()) {
      return false;
    }
    // Consider attacking if cooldown is active (within attack duration)
    const attackDuration = 1.0 / this.currentWeapon.getFireRate();
    return this.fireCooldown > attackDuration * 0.7; // Active for 70% of cooldown
  }

  shoot(): Projectile | null {
    if (!this.currentWeapon || this.fireCooldown > 0) {
      return null;
    }

    // Set fire cooldown based on weapon fire rate
    this.fireCooldown = 1.0 / this.currentWeapon.getFireRate();

    // Melee weapons don't shoot projectiles
    if (this.currentWeapon.isMelee()) {
      console.log(`[Player] Swung ${this.currentWeapon.getType()}`);
      return null;
    }

    // Calculate shooting direction based on camera rotation
    const direction = new THREE.Vector3();
    direction.x = -Math.sin(this.cameraRotationY) * Math.cos(this.cameraRotationX);
    direction.y = Math.sin(this.cameraRotationX);
    direction.z = -Math.cos(this.cameraRotationY) * Math.cos(this.cameraRotationX);
    direction.normalize();

    // Start position slightly in front of player
    const startPosition = this.position.clone();
    startPosition.y += 0.5;
    startPosition.add(direction.clone().multiplyScalar(0.5));

    // Create projectile
    const projectile = new Projectile(
      this.engine,
      startPosition,
      direction,
      this.currentWeapon.getDamage(),
      this.currentWeapon.getRange(),
      15.0 // bullet speed
    );

    console.log(`[Player] Shot ${this.currentWeapon.getType()}`);
    return projectile;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRadius(): number {
    return 0.5;
  }

  takeDamage(damage: number): void {
    if (this.damageCooldown > 0) return; // Invincibility frame
    
    this.health -= damage;
    if (this.health < 0) {
      this.health = 0;
    }
    this.damageCooldown = this.damageCooldownTime;
    
    console.log(`[Player] Took ${damage} damage. Health: ${this.health}/${this.maxHealth}`);
  }
  
  heal(amount: number): void {
    this.health += amount;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
    console.log(`[Player] Healed ${amount} HP. Health: ${this.health}/${this.maxHealth}`);
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  dispose(): void {
    if (this.healthBarContainer) {
      document.body.removeChild(this.healthBarContainer);
      this.healthBarContainer = null;
    }
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
    
    // Dispose weapon
    if (this.weaponMesh) {
      this.weaponMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }
    
    console.log('[Player] Disposed');
  }
}
