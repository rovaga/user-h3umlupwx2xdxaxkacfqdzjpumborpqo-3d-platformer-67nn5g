/**
 * AI-EDITABLE: Boss Enemy
 *
 * This file defines boss enemy entities that spawn periodically and are stronger than regular enemies.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';

export class Boss {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private health: number = 300;
  private maxHealth: number = 300;
  private onGround: boolean = false;
  private attackCooldown: number = 0;
  private attackRange: number = 2.0;
  private attackDamage: number = 99;
  private attackCooldownTime: number = 1.5; // 1.5 seconds between attacks
  private speed: number = 0.06; // Slightly faster than regular enemies
  private gravity: number = -0.015;
  private healthBarContainer: HTMLDivElement | null = null;
  private static bossCounter: number = 0;
  private bossId: number;

  constructor(engine: Engine, spawnPosition: THREE.Vector3) {
    this.engine = engine;
    this.position = spawnPosition.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.bossId = Boss.bossCounter++;

    // Create boss mesh (larger, purple/darker red)
    this.mesh = new THREE.Group();
    
    // Main body (larger purple sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b008b, // Purple color for boss
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    this.mesh.add(body);

    // Crown/spikes on top (to make boss look different)
    const spikeGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
    const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 }); // Gold spikes
    
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(
        Math.cos(angle) * 0.5,
        0.5,
        Math.sin(angle) * 0.5
      );
      spike.rotation.z = Math.PI / 6;
      this.mesh.add(spike);
    }

    // Eyes (glowing red)
    const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.25, 0.15, 0.55);
    this.mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.25, 0.15, 0.55);
    this.mesh.add(rightEye);

    this.mesh.position.copy(this.position);
    engine.scene.add(this.mesh);

    // Create health bar (larger for boss)
    this.createHealthBar();

    console.log('[Boss] Created at', spawnPosition);
  }

  private createHealthBar(): void {
    // Create health bar container (larger for boss)
    this.healthBarContainer = document.createElement('div');
    this.healthBarContainer.style.position = 'absolute';
    this.healthBarContainer.style.width = '120px';
    this.healthBarContainer.style.height = '12px';
    this.healthBarContainer.style.backgroundColor = '#333';
    this.healthBarContainer.style.border = '2px solid #8b008b';
    this.healthBarContainer.style.borderRadius = '6px';
    this.healthBarContainer.style.overflow = 'hidden';
    this.healthBarContainer.style.pointerEvents = 'none';
    
    // Create health fill
    const healthFill = document.createElement('div');
    healthFill.id = `boss-health-${this.bossId}`;
    healthFill.style.width = '100%';
    healthFill.style.height = '100%';
    healthFill.style.backgroundColor = '#8b008b';
    healthFill.style.transition = 'width 0.2s';
    
    // Create health text
    const healthText = document.createElement('div');
    healthText.id = `boss-health-text-${this.bossId}`;
    healthText.style.position = 'absolute';
    healthText.style.top = '50%';
    healthText.style.left = '50%';
    healthText.style.transform = 'translate(-50%, -50%)';
    healthText.style.color = '#fff';
    healthText.style.fontSize = '10px';
    healthText.style.fontWeight = 'bold';
    healthText.style.textShadow = '1px 1px 2px #000';
    healthText.textContent = 'BOSS';
    
    this.healthBarContainer.appendChild(healthFill);
    this.healthBarContainer.appendChild(healthText);
    document.body.appendChild(this.healthBarContainer);
  }

  private updateHealthBar(): void {
    if (!this.healthBarContainer) return;
    
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    const healthFill = this.healthBarContainer.querySelector(`#boss-health-${this.bossId}`) as HTMLDivElement;
    const healthText = this.healthBarContainer.querySelector(`#boss-health-text-${this.bossId}`) as HTMLDivElement;
    
    if (healthFill) {
      healthFill.style.width = `${healthPercent * 100}%`;
      // Change color based on health
      if (healthPercent > 0.6) {
        healthFill.style.backgroundColor = '#8b008b';
      } else if (healthPercent > 0.3) {
        healthFill.style.backgroundColor = '#ff00ff';
      } else {
        healthFill.style.backgroundColor = '#ff0000';
      }
    }
    
    if (healthText) {
      healthText.textContent = `BOSS ${Math.ceil(this.health)}/${this.maxHealth}`;
    }

    // Update position based on boss position
    const vector = new THREE.Vector3();
    this.mesh.getWorldPosition(vector);
    vector.project(this.engine.camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    this.healthBarContainer.style.left = `${x - 60}px`;
    this.healthBarContainer.style.top = `${y - 40}px`;
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
      const bossBottom = this.position.y - 0.7;
      const bossRadius = 0.7;

      // Check horizontal overlap
      if (
        this.position.x + bossRadius > bounds.min.x &&
        this.position.x - bossRadius < bounds.max.x &&
        this.position.z + bossRadius > bounds.min.z &&
        this.position.z - bossRadius < bounds.max.z
      ) {
        // Check vertical collision
        if (
          bossBottom <= bounds.max.y &&
          bossBottom >= bounds.min.y &&
          this.velocity.y <= 0
        ) {
          this.position.y = bounds.max.y + 0.7;
          this.velocity.y = 0;
          this.onGround = true;
        }
      }
    }
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    
    // Rotate boss slowly for visual effect
    this.mesh.rotation.y += 0.01;
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
    return 0.7;
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
    
    console.log('[Boss] Disposed');
  }
}
