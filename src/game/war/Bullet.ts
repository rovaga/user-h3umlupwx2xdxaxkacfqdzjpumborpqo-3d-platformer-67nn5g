/**
 * AI-EDITABLE: Bullet
 *
 * Projectile class for shooting mechanics.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Human } from './Human';

export class Bullet {
  private engine: Engine;
  private mesh: THREE.Mesh;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private damage: number;
  private shooter: Human;
  private lifetime: number = 0;
  private maxLifetime: number = 5; // 5 seconds max lifetime
  private isActive: boolean = true;

  constructor(
    engine: Engine,
    position: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage: number,
    shooter: Human
  ) {
    this.engine = engine;
    this.position = position.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(speed);
    this.damage = damage;
    this.shooter = shooter;

    // Create bullet mesh (small sphere)
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffff00, // Yellow bullet
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.engine.scene.add(this.mesh);
  }

  update(deltaTime: number): void {
    if (!this.isActive) return;

    this.lifetime += deltaTime;
    if (this.lifetime > this.maxLifetime) {
      this.destroy();
      return;
    }

    // Move bullet
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.mesh.position.copy(this.position);

    // Check if bullet is out of bounds
    if (
      Math.abs(this.position.x) > 50 ||
      Math.abs(this.position.z) > 50 ||
      this.position.y < -5 ||
      this.position.y > 20
    ) {
      this.destroy();
    }
  }

  checkCollision(target: Human): boolean {
    if (!this.isActive || !target.isAliveCheck() || target === this.shooter) {
      return false;
    }

    const distance = this.position.distanceTo(target.getPosition());
    return distance < 0.5; // Collision radius
  }

  getDamage(): number {
    return this.damage;
  }

  getShooter(): Human {
    return this.shooter;
  }

  destroy(): void {
    this.isActive = false;
    this.engine.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }

  isActiveCheck(): boolean {
    return this.isActive;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
}
