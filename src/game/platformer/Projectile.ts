/**
 * AI-EDITABLE: Projectile
 *
 * This file defines projectiles (bullets) that can be shot from weapons.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class Projectile {
  private engine: Engine;
  private mesh: THREE.Mesh;
  private velocity: THREE.Vector3;
  private position: THREE.Vector3;
  private damage: number;
  private range: number;
  private distanceTraveled: number = 0;
  private active: boolean = true;

  constructor(
    engine: Engine,
    startPosition: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    range: number,
    speed: number = 1.0
  ) {
    this.engine = engine;
    this.damage = damage;
    this.range = range;
    this.position = startPosition.clone();
    
    // Normalize direction and scale by speed
    this.velocity = direction.clone().normalize().multiplyScalar(speed);

    // Create bullet mesh (small sphere)
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700, // Gold color for bullets
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;

    engine.scene.add(this.mesh);
  }

  update(deltaTime: number): boolean {
    if (!this.active) return false;

    // Move projectile
    const moveDistance = this.velocity.length() * deltaTime;
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.distanceTraveled += moveDistance;
    this.mesh.position.copy(this.position);

    // Check if projectile has traveled beyond its range
    if (this.distanceTraveled >= this.range) {
      this.destroy();
      return false;
    }

    // Check if projectile is below ground (hit ground)
    if (this.position.y < -1) {
      this.destroy();
      return false;
    }

    return true;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getDamage(): number {
    return this.damage;
  }

  isActive(): boolean {
    return this.active;
  }

  destroy(): void {
    if (!this.active) return;
    this.active = false;
    this.engine.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }

  dispose(): void {
    this.destroy();
  }
}
