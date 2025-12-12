/**
 * AI-EDITABLE: Cow Component
 *
 * Cows that roam around the desert ranch.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

interface CowConfig {
  position: THREE.Vector3;
}

export class Cow {
  private engine: Engine;
  private mesh: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private legs: THREE.Mesh[] = [];
  private tail: THREE.Mesh;
  private position: THREE.Vector3;
  private wanderDirection: number = 0;
  private wanderTimer: number = 0;

  constructor(engine: Engine, config: CowConfig) {
    this.engine = engine;
    this.position = config.position.clone();
    this.wanderDirection = Math.random() * Math.PI * 2;

    // Create cow group
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.position.x, 0.35, this.position.z); // Position so feet touch ground
    engine.scene.add(this.mesh);

    // Create body (larger, more rounded)
    const bodyGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White cow
      roughness: 0.8,
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.7;
    this.body.scale.set(1, 1.3, 1.4);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.mesh.add(this.body);

    // Add black spots
    const spotGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const spotMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.8,
    });
    
    // Add a few random spots
    for (let i = 0; i < 5; i++) {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      spot.position.set(
        (Math.random() - 0.5) * 0.6,
        0.7 + (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.8
      );
      spot.scale.set(1, Math.random() * 0.5 + 0.5, 1);
      this.mesh.add(spot);
    }

    // Create head
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.set(0, 0.8, 0.6);
    this.head.scale.set(1, 1.2, 1.4);
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Create legs (4 legs)
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
    });

    const legPositions = [
      { x: -0.3, z: 0.25 },
      { x: 0.3, z: 0.25 },
      { x: -0.3, z: -0.25 },
      { x: 0.3, z: -0.25 },
    ];

    for (const pos of legPositions) {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos.x, 0.35, pos.z);
      leg.castShadow = true;
      this.mesh.add(leg);
      this.legs.push(leg);
    }

    // Create tail
    const tailGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.5, 6);
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.8,
    });
    this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
    this.tail.position.set(0, 0.6, -0.5);
    this.tail.rotation.x = Math.PI / 3;
    this.tail.castShadow = true;
    this.mesh.add(this.tail);

    console.log(`[Cow] Created at`, config.position);
  }

  update(deltaTime: number): void {
    // Wander behavior (slower than horses)
    this.wanderTimer += deltaTime;
    
    if (this.wanderTimer > 4 + Math.random() * 5) {
      // Change direction randomly
      this.wanderDirection = Math.random() * Math.PI * 2;
      this.wanderTimer = 0;
    }

    // Move in wander direction (slower than horses)
    const speed = 0.01;
    this.position.x += Math.sin(this.wanderDirection) * speed;
    this.position.z += Math.cos(this.wanderDirection) * speed;

    // Keep within bounds
    const maxDistance = 80;
    const distanceFromOrigin = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
    if (distanceFromOrigin > maxDistance) {
      // Turn back towards center
      this.wanderDirection = Math.atan2(-this.position.x, -this.position.z);
    }

    // Update mesh position (keep y at 0.35 so feet touch ground)
    this.mesh.position.set(this.position.x, 0.35, this.position.z);
    this.mesh.rotation.y = this.wanderDirection;

    // Animate legs (walking, slower)
    const walkSpeed = 0.1;
    for (let i = 0; i < this.legs.length; i++) {
      const legOffset = Math.sin(Date.now() * walkSpeed + i * Math.PI / 2) * 0.15;
      this.legs[i].rotation.x = legOffset;
    }

    // Animate tail (swishing)
    this.tail.rotation.x = Math.PI / 3 + Math.sin(Date.now() * 0.003) * 0.2;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.body.geometry.dispose();
    (this.body.material as THREE.Material).dispose();
    this.head.geometry.dispose();
    (this.head.material as THREE.Material).dispose();
    
    for (const leg of this.legs) {
      leg.geometry.dispose();
      (leg.material as THREE.Material).dispose();
    }
    
    this.tail.geometry.dispose();
    (this.tail.material as THREE.Material).dispose();
    
    console.log('[Cow] Disposed');
  }
}
