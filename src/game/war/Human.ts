/**
 * AI-EDITABLE: Human Character
 *
 * Base class for human characters in the war game.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum Team {
  RED = 'red',
  BLUE = 'blue',
}

export class Human {
  protected engine: Engine;
  protected mesh: THREE.Group;
  protected position: THREE.Vector3;
  protected velocity: THREE.Vector3;
  protected health: number;
  protected maxHealth: number;
  protected team: Team;
  protected isAlive: boolean = true;

  constructor(engine: Engine, position: THREE.Vector3, team: Team) {
    this.engine = engine;
    this.position = position.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.team = team;
    this.maxHealth = 100;
    this.health = this.maxHealth;

    // Create human mesh (simple capsule shape)
    this.mesh = new THREE.Group();
    
    // Body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: team === Team.RED ? 0xff4444 : 0x4444ff,
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    this.mesh.add(body);

    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbac, // Skin color
      roughness: 0.6,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    this.mesh.add(head);

    // Legs (two cylinders)
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
    });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, 0.4, 0);
    leftLeg.castShadow = true;
    this.mesh.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, 0.4, 0);
    rightLeg.castShadow = true;
    this.mesh.add(rightLeg);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 6);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: team === Team.RED ? 0xff4444 : 0x4444ff,
      roughness: 0.7,
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.8, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    this.mesh.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.8, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    this.mesh.add(rightArm);

    // Health bar background
    const healthBarBgGeometry = new THREE.PlaneGeometry(0.8, 0.1);
    const healthBarBgMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    const healthBarBg = new THREE.Mesh(healthBarBgGeometry, healthBarBgMaterial);
    healthBarBg.position.y = 2;
    this.mesh.add(healthBarBg);

    // Health bar
    const healthBarGeometry = new THREE.PlaneGeometry(0.8, 0.1);
    const healthBarMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });
    const healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
    healthBar.position.y = 2;
    healthBar.position.x = -0.4;
    healthBar.name = 'healthBar';
    this.mesh.add(healthBar);

    this.mesh.position.copy(this.position);
    this.engine.scene.add(this.mesh);
  }

  update(deltaTime: number): void {
    if (!this.isAlive) return;

    // Apply velocity
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Apply friction
    this.velocity.multiplyScalar(0.9);

    // Update mesh position
    this.mesh.position.copy(this.position);

    // Update health bar
    const healthBar = this.mesh.getObjectByName('healthBar') as THREE.Mesh;
    if (healthBar) {
      const healthPercent = this.health / this.maxHealth;
      healthBar.scale.x = healthPercent;
      healthBar.position.x = -0.4 + (healthPercent * 0.4);
      
      // Change color based on health
      const material = healthBar.material as THREE.MeshBasicMaterial;
      if (healthPercent > 0.6) {
        material.color.setHex(0x00ff00); // Green
      } else if (healthPercent > 0.3) {
        material.color.setHex(0xffff00); // Yellow
      } else {
        material.color.setHex(0xff0000); // Red
      }
    }
  }

  takeDamage(amount: number): void {
    if (!this.isAlive) return;
    
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die(): void {
    this.isAlive = false;
    // Rotate to lying position
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.y = 0.1;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getTeam(): Team {
    return this.team;
  }

  isAliveCheck(): boolean {
    return this.isAlive;
  }

  getHealth(): number {
    return this.health;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
}
