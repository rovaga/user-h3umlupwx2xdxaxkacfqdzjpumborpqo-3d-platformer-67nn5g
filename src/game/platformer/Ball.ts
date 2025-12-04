/**
 * AI-EDITABLE: Ball Obstacle
 *
 * This file defines balls that are thrown by children playing in the playground.
 * The player (girl) must dodge these balls.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

interface BallConfig {
  position: THREE.Vector3;
  direction: THREE.Vector3; // Direction the ball is moving
  speed?: number;
}

export class Ball {
  private engine: Engine;
  private mesh: THREE.Mesh;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private radius: number = 0.2;
  private active: boolean = true;
  private color: number;

  // Ball colors (different colored balls)
  private static readonly BALL_COLORS = [
    0xff0000, // Red
    0x0000ff, // Blue
    0x00ff00, // Green
    0xffff00, // Yellow
    0xff00ff, // Magenta
    0x00ffff, // Cyan
  ];

  constructor(engine: Engine, config: BallConfig) {
    this.engine = engine;
    this.position = config.position.clone();
    
    // Random color for variety
    this.color = Ball.BALL_COLORS[
      Math.floor(Math.random() * Ball.BALL_COLORS.length)
    ];

    // Create ball mesh (sphere)
    const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.3,
      metalness: 0.1,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Set velocity based on direction and speed
    const speed = config.speed ?? 0.15;
    this.velocity = config.direction.clone().normalize().multiplyScalar(speed);

    engine.scene.add(this.mesh);
    console.log('[Ball] Created at', config.position, 'moving', config.direction);
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    // Move ball
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));

    // Apply gravity
    this.velocity.y -= 0.02 * deltaTime * 60;

    // Bounce on ground
    if (this.position.y < this.radius) {
      this.position.y = this.radius;
      this.velocity.y = Math.abs(this.velocity.y) * 0.6; // Bounce with energy loss
    }

    // Rotate ball for visual effect
    this.mesh.rotation.x += 0.05;
    this.mesh.rotation.z += 0.03;

    // Update mesh position
    this.mesh.position.copy(this.position);

    // Remove ball if it goes too far or too low
    const distance = this.position.length();
    if (distance > 50 || this.position.y < -5) {
      this.deactivate();
    }
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    if (!this.active) return false;

    const distance = this.position.distanceTo(playerPosition);
    const collisionDistance = playerRadius + this.radius;

    return distance < collisionDistance;
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    this.engine.scene.remove(this.mesh);
    console.log('[Ball] Deactivated');
  }

  isActive(): boolean {
    return this.active;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRadius(): number {
    return this.radius;
  }

  dispose(): void {
    if (this.active && this.mesh) {
      this.engine.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
  }
}
