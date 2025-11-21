/**
 * AI-EDITABLE: Enemy
 *
 * This file defines enemy entities that spawn and attack the player.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';

export class Enemy {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private health: number = 100;
  private maxHealth: number = 100;
  private onGround: boolean = false;
  private attackCooldown: number = 0;
  private attackRange: number = 1.5;
  private attackDamage: number = 5;
  private attackCooldownTime: number = 1.0; // 1 second between attacks
  private speed: number = 0.05;
  private gravity: number = -0.015;
  private healthBarContainer: HTMLDivElement | null = null;
  private static enemyCounter: number = 0;
  private enemyId: number;

  constructor(engine: Engine, spawnPosition: THREE.Vector3) {
    this.engine = engine;
    this.position = spawnPosition.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.enemyId = Enemy.enemyCounter++;

    // Create enemy mesh (red cube/sphere)
    this.mesh = new THREE.Group();
    
    // Main body (red sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000, // Red color for enemies
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    this.mesh.add(body);

    // Eyes (white spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.1, 0.35);
    this.mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.1, 0.35);
    this.mesh.add(rightEye);

    this.mesh.position.copy(this.position);
    engine.scene.add(this.mesh);

    // Create health bar
    this.createHealthBar();

    console.log('[Enemy] Created at', spawnPosition);
  }

  private createHealthBar(): void {
    // Create health bar container
    this.healthBarContainer = document.createElement('div');
    this.healthBarContainer.style.position = 'absolute';
    this.healthBarContainer.style.width = '60px';
    this.healthBarContainer.style.height = '8px';
    this.healthBarContainer.style.backgroundColor = '#333';
    this.healthBarContainer.style.border = '1px solid #fff';
    this.healthBarContainer.style.borderRadius = '4px';
    this.healthBarContainer.style.overflow = 'hidden';
    this.healthBarContainer.style.pointerEvents = 'none';
    
    // Create health fill
    const healthFill = document.createElement('div');
    healthFill.id = `enemy-health-${this.enemyId}`;
    healthFill.style.width = '100%';
    healthFill.style.height = '100%';
    healthFill.style.backgroundColor = '#00ff00';
    healthFill.style.transition = 'width 0.2s';
    
    this.healthBarContainer.appendChild(healthFill);
    document.body.appendChild(this.healthBarContainer);
  }

  private updateHealthBar(): void {
    if (!this.healthBarContainer) return;
    
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    const healthFill = this.healthBarContainer.querySelector('div') as HTMLDivElement;
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

    // Update position based on enemy position
    const vector = new THREE.Vector3();
    this.mesh.getWorldPosition(vector);
    vector.project(this.engine.camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    this.healthBarContainer.style.left = `${x - 30}px`;
    this.healthBarContainer.style.top = `${y - 30}px`;
  }

  update(deltaTime: number, platforms: Platform[], playerPosition: THREE.Vector3): void {
    // Always update health bar, even when dead
    this.updateHealthBar();
    
    if (this.health <= 0) return;

    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Move towards player
    const direction = new THREE.Vector3();
    direction.subVectors(playerPosition, this.position);
    direction.y = 0; // Don't move vertically
    const distance = direction.length();

    if (distance > 0.1) {
      direction.normalize();
      this.position.x += direction.x * this.speed;
      this.position.z += direction.z * this.speed;
    }

    // Apply gravity
    this.velocity.y += this.gravity;
    this.position.y += this.velocity.y;

    // Check collisions with platforms
    this.checkCollisions(platforms);

    // Check attack range
    if (distance <= this.attackRange && this.attackCooldown <= 0) {
      this.attackCooldown = this.attackCooldownTime;
      // Return damage dealt (will be handled by game)
    }

    this.updateMesh();
  }

  private checkCollisions(platforms: Platform[]): void {
    this.onGround = false;

    for (const platform of platforms) {
      const bounds = platform.getBounds();
      const enemyBottom = this.position.y - 0.4;
      const enemyRadius = 0.4;

      // Check horizontal overlap
      if (
        this.position.x + enemyRadius > bounds.min.x &&
        this.position.x - enemyRadius < bounds.max.x &&
        this.position.z + enemyRadius > bounds.min.z &&
        this.position.z - enemyRadius < bounds.max.z
      ) {
        // Check vertical collision
        if (
          enemyBottom <= bounds.max.y &&
          enemyBottom >= bounds.min.y &&
          this.velocity.y <= 0
        ) {
          this.position.y = bounds.max.y + 0.4;
          this.velocity.y = 0;
          this.onGround = true;
        }
      }
    }
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    
    // Face player direction (optional, can be added)
    // const direction = new THREE.Vector3();
    // direction.subVectors(playerPosition, this.position);
    // direction.y = 0;
    // if (direction.length() > 0) {
    //   this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    // }
  }

  takeDamage(damage: number): void {
    this.health -= damage;
    if (this.health < 0) {
      this.health = 0;
    }
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

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRadius(): number {
    return 0.4;
  }

  canAttack(): boolean {
    return this.attackCooldown <= 0;
  }

  getAttackDamage(): number {
    return this.attackDamage;
  }

  getAttackRange(): number {
    return this.attackRange;
  }

  dispose(): void {
    if (this.healthBarContainer) {
      document.body.removeChild(this.healthBarContainer);
      this.healthBarContainer = null;
    }
    
    this.engine.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    
    console.log('[Enemy] Disposed');
  }
}
