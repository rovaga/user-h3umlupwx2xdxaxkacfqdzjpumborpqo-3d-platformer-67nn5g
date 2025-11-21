/**
 * AI-EDITABLE: Enemy
 *
 * Enemies that threaten Charmander in the forest.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum EnemyType {
  WILD_POKEMON = 'wild_pokemon',
  PREDATOR = 'predator',
}

export class Enemy {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private type: EnemyType;
  private health: number;
  private maxHealth: number;
  private speed: number;
  private damage: number;
  private attackCooldown: number = 0;
  private isAlive: boolean = true;
  private targetPosition: THREE.Vector3 | null = null;

  constructor(
    engine: Engine,
    position: THREE.Vector3,
    type: EnemyType = EnemyType.WILD_POKEMON
  ) {
    this.engine = engine;
    this.position = position.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.type = type;

    // Create enemy mesh based on type
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    if (type === EnemyType.WILD_POKEMON) {
      // Wild Pokemon (purple creature)
      this.health = 30;
      this.maxHealth = 30;
      this.speed = 0.03;
      this.damage = 5;

      const bodyGeometry = new THREE.SphereGeometry(0.3, 12, 12);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4c8b, // Purple
        roughness: 0.7,
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.3;
      body.castShadow = true;
      this.mesh.add(body);

      const headGeometry = new THREE.SphereGeometry(0.25, 12, 12);
      const head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.y = 0.65;
      head.castShadow = true;
      this.mesh.add(head);

      // Eyes (red)
      const eyeGeometry = new THREE.SphereGeometry(0.05, 6, 6);
      const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye1.position.set(-0.08, 0.7, 0.2);
      this.mesh.add(eye1);
      const eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye2.position.set(0.08, 0.7, 0.2);
      this.mesh.add(eye2);
    } else {
      // Predator (larger, darker)
      this.health = 50;
      this.maxHealth = 50;
      this.speed = 0.04;
      this.damage = 10;

      const bodyGeometry = new THREE.SphereGeometry(0.4, 12, 12);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d2d2d, // Dark gray
        roughness: 0.8,
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.4;
      body.castShadow = true;
      this.mesh.add(body);

      const headGeometry = new THREE.SphereGeometry(0.3, 12, 12);
      const head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.y = 0.8;
      head.castShadow = true;
      this.mesh.add(head);

      // Glowing red eyes
      const eyeGeometry = new THREE.SphereGeometry(0.06, 6, 6);
      const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5,
      });
      const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye1.position.set(-0.1, 0.85, 0.25);
      this.mesh.add(eye1);
      const eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye2.position.set(0.1, 0.85, 0.25);
      this.mesh.add(eye2);
    }

    console.log(`[Enemy] Created ${type} at ${position.x}, ${position.z}`);
  }

  update(deltaTime: number, charmanderPosition: THREE.Vector3, groundHeight: number): void {
    if (!this.isAlive) return;

    this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

    // Move towards Charmander
    const direction = new THREE.Vector3()
      .subVectors(charmanderPosition, this.position)
      .normalize();
    
    this.velocity.x = direction.x * this.speed;
    this.velocity.z = direction.z * this.speed;

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;
    this.position.y = groundHeight + 0.3;

    // Rotate to face movement direction
    if (this.velocity.length() > 0) {
      this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }

    // Update mesh position
    this.mesh.position.copy(this.position);

    // Animate (bobbing)
    const bobAmount = Math.sin(Date.now() * 0.005) * 0.05;
    this.mesh.children[0].position.y = 0.3 + bobAmount;
  }

  checkCollision(charmanderPosition: THREE.Vector3, charmanderRadius: number): boolean {
    if (!this.isAlive) return false;

    const distance = this.position.distanceTo(charmanderPosition);
    const collisionDistance = charmanderRadius + 0.3;

    if (distance < collisionDistance && this.attackCooldown <= 0) {
      this.attackCooldown = 1.0; // 1 second cooldown
      return true;
    }

    return false;
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.isAlive = false;
    // Fade out animation
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material) {
          material.transparent = true;
          material.opacity = 0.3;
        }
      }
    });
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getDamage(): number {
    return this.damage;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  isDead(): boolean {
    return !this.isAlive;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    
    const disposeMesh = (mesh: THREE.Mesh) => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    };

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        disposeMesh(child);
      }
    });

    console.log('[Enemy] Disposed');
  }
}
