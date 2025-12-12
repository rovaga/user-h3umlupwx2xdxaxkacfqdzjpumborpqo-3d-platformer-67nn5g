/**
 * AI-EDITABLE: Horse Component
 *
 * Horses that roam around the desert ranch.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

interface HorseConfig {
  position: THREE.Vector3;
}

export class Horse {
  private engine: Engine;
  private mesh: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private legs: THREE.Mesh[] = [];
  private tail: THREE.Mesh;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private wanderDirection: number = 0;
  private wanderTimer: number = 0;

  constructor(engine: Engine, config: HorseConfig) {
    this.engine = engine;
    this.position = config.position.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.wanderDirection = Math.random() * Math.PI * 2;

    // Create horse group
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.position.x, 0.3, this.position.z); // Position so feet touch ground
    engine.scene.add(this.mesh);

    // Create body (using ellipsoid made from sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown horse
      roughness: 0.8,
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.6;
    this.body.scale.set(1, 1.5, 1.2);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.mesh.add(this.body);

    // Create head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321, // Darker brown
      roughness: 0.8,
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.set(0, 0.7, 0.5);
    this.head.scale.set(1, 1.2, 1.3);
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Create legs (4 legs)
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });

    const legPositions = [
      { x: -0.25, z: 0.2 },
      { x: 0.25, z: 0.2 },
      { x: -0.25, z: -0.2 },
      { x: 0.25, z: -0.2 },
    ];

    for (const pos of legPositions) {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos.x, 0.3, pos.z);
      leg.castShadow = true;
      this.mesh.add(leg);
      this.legs.push(leg);
    }

    // Create tail
    const tailGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.4, 6);
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
    this.tail.position.set(0, 0.5, -0.4);
    this.tail.rotation.x = Math.PI / 4;
    this.tail.castShadow = true;
    this.mesh.add(this.tail);

    console.log(`[Horse] Created at`, config.position);
  }

  update(deltaTime: number): void {
    // Wander behavior
    this.wanderTimer += deltaTime;
    
    if (this.wanderTimer > 3 + Math.random() * 4) {
      // Change direction randomly
      this.wanderDirection = Math.random() * Math.PI * 2;
      this.wanderTimer = 0;
    }

    // Move in wander direction
    const speed = 0.02;
    this.position.x += Math.sin(this.wanderDirection) * speed;
    this.position.z += Math.cos(this.wanderDirection) * speed;

    // Keep within bounds
    const maxDistance = 80;
    const distanceFromOrigin = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
    if (distanceFromOrigin > maxDistance) {
      // Turn back towards center
      this.wanderDirection = Math.atan2(-this.position.x, -this.position.z);
    }

    // Update mesh position (keep y at 0.3 so feet touch ground)
    this.mesh.position.set(this.position.x, 0.3, this.position.z);
    this.mesh.rotation.y = this.wanderDirection;

    // Animate legs (walking)
    const walkSpeed = 0.15;
    for (let i = 0; i < this.legs.length; i++) {
      const legOffset = Math.sin(Date.now() * walkSpeed + i * Math.PI / 2) * 0.2;
      this.legs[i].rotation.x = legOffset;
    }

    // Animate tail
    this.tail.rotation.x = Math.PI / 4 + Math.sin(Date.now() * 0.002) * 0.1;
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
    
    console.log('[Horse] Disposed');
  }
}
