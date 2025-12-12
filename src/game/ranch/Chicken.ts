/**
 * AI-EDITABLE: Chicken Component
 *
 * Chickens that roam around the desert ranch.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

interface ChickenConfig {
  position: THREE.Vector3;
}

export class Chicken {
  private engine: Engine;
  private mesh: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private beak: THREE.Mesh;
  private comb: THREE.Mesh;
  private legs: THREE.Mesh[] = [];
  private position: THREE.Vector3;
  private wanderDirection: number = 0;
  private wanderTimer: number = 0;

  constructor(engine: Engine, config: ChickenConfig) {
    this.engine = engine;
    this.position = config.position.clone();
    this.wanderDirection = Math.random() * Math.PI * 2;

    // Create chicken group
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.position.x, 0.075, this.position.z); // Position so feet touch ground
    engine.scene.add(this.mesh);

    // Create body (small, round)
    const bodyGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White chicken
      roughness: 0.8,
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.15;
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.mesh.add(this.body);

    // Create head
    const headGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700, // Golden/yellow
      roughness: 0.8,
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.set(0, 0.25, 0.12);
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Create beak
    const beakGeometry = new THREE.ConeGeometry(0.02, 0.05, 4);
    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8c00, // Orange
      roughness: 0.8,
    });
    this.beak = new THREE.Mesh(beakGeometry, beakMaterial);
    this.beak.position.set(0, 0.25, 0.18);
    this.beak.rotation.x = Math.PI / 2;
    this.beak.castShadow = true;
    this.mesh.add(this.beak);

    // Create comb (red crest on head)
    const combGeometry = new THREE.ConeGeometry(0.03, 0.08, 4);
    const combMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000, // Red
      roughness: 0.8,
    });
    this.comb = new THREE.Mesh(combGeometry, combMaterial);
    this.comb.position.set(0, 0.32, 0.1);
    this.comb.rotation.x = -Math.PI / 4;
    this.comb.castShadow = true;
    this.mesh.add(this.comb);

    // Create legs (2 legs)
    const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8c00, // Orange legs
      roughness: 0.8,
    });

    const legPositions = [
      { x: -0.05, z: 0 },
      { x: 0.05, z: 0 },
    ];

    for (const pos of legPositions) {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos.x, 0.075, pos.z);
      leg.castShadow = true;
      this.mesh.add(leg);
      this.legs.push(leg);
    }

    console.log(`[Chicken] Created at`, config.position);
  }

  update(deltaTime: number): void {
    // Wander behavior (faster, more erratic than cows)
    this.wanderTimer += deltaTime;
    
    if (this.wanderTimer > 1 + Math.random() * 2) {
      // Change direction randomly (chickens are more erratic)
      this.wanderDirection = Math.random() * Math.PI * 2;
      this.wanderTimer = 0;
    }

    // Move in wander direction
    const speed = 0.015;
    this.position.x += Math.sin(this.wanderDirection) * speed;
    this.position.z += Math.cos(this.wanderDirection) * speed;

    // Keep within bounds
    const maxDistance = 80;
    const distanceFromOrigin = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
    if (distanceFromOrigin > maxDistance) {
      // Turn back towards center
      this.wanderDirection = Math.atan2(-this.position.x, -this.position.z);
    }

    // Update mesh position (keep y at 0.075 so feet touch ground)
    this.mesh.position.set(this.position.x, 0.075, this.position.z);
    this.mesh.rotation.y = this.wanderDirection;

    // Animate legs (pecking/walking motion)
    const walkSpeed = 0.2;
    for (let i = 0; i < this.legs.length; i++) {
      const legOffset = Math.sin(Date.now() * walkSpeed + i * Math.PI) * 0.1;
      this.legs[i].rotation.x = legOffset;
    }

    // Bobbing motion (chickens bob as they walk)
    this.body.position.y = 0.15 + Math.sin(Date.now() * 0.005) * 0.02;
    this.head.position.y = 0.25 + Math.sin(Date.now() * 0.005) * 0.02;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.body.geometry.dispose();
    (this.body.material as THREE.Material).dispose();
    this.head.geometry.dispose();
    (this.head.material as THREE.Material).dispose();
    this.beak.geometry.dispose();
    (this.beak.material as THREE.Material).dispose();
    this.comb.geometry.dispose();
    (this.comb.material as THREE.Material).dispose();
    
    for (const leg of this.legs) {
      leg.geometry.dispose();
      (leg.material as THREE.Material).dispose();
    }
    
    console.log('[Chicken] Disposed');
  }
}
