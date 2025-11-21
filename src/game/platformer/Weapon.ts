/**
 * AI-EDITABLE: Weapon Collectible
 *
 * This file defines collectible weapons that the player can collect and use.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum WeaponType {
  SWORD = 'sword',
  FLINTLOCK = 'flintlock',
  M1_GARAND = 'm1_garand',
}

interface WeaponConfig {
  type: WeaponType;
  position: THREE.Vector3;
}

export class Weapon {
  private engine: Engine;
  private mesh: THREE.Group;
  private type: WeaponType;
  private position: THREE.Vector3;
  private collected: boolean = false;
  private rotationSpeed: number = 0.02;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.001;

  // Weapon properties
  private static readonly WEAPON_CONFIGS = {
    [WeaponType.SWORD]: {
      damage: 50,
      range: 2.0,
      fireRate: 0.5, // attacks per second
      isMelee: true,
      createMesh: () => {
        const group = new THREE.Group();
        
        // Blade (long rectangular box)
        const bladeGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.05);
        const bladeMaterial = new THREE.MeshStandardMaterial({
          color: 0xc0c0c0,
          metalness: 0.9,
          roughness: 0.2,
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.6;
        group.add(blade);
        
        // Hilt (cross guard)
        const hiltGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
        const hiltMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          roughness: 0.7,
        });
        const hilt = new THREE.Mesh(hiltGeometry, hiltMaterial);
        hilt.position.y = 0.1;
        group.add(hilt);
        
        // Handle (grip)
        const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({
          color: 0x654321,
          roughness: 0.8,
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.x = Math.PI / 2;
        handle.position.y = -0.15;
        group.add(handle);
        
        return group;
      },
    },
    [WeaponType.FLINTLOCK]: {
      damage: 30,
      range: 20.0,
      fireRate: 0.8, // shots per second
      isMelee: false,
      createMesh: () => {
        const group = new THREE.Group();
        
        // Barrel (long cylinder)
        const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({
          color: 0x2c2c2c,
          metalness: 0.8,
          roughness: 0.3,
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = 0.4;
        group.add(barrel);
        
        // Stock (wooden handle)
        const stockGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.4);
        const stockMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          roughness: 0.7,
        });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.x = -0.2;
        stock.position.y = -0.1;
        group.add(stock);
        
        // Hammer (flintlock mechanism)
        const hammerGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.1);
        const hammerMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,
          metalness: 0.9,
          roughness: 0.2,
        });
        const hammer = new THREE.Mesh(hammerGeometry, hammerMaterial);
        hammer.position.x = 0.1;
        hammer.position.y = 0.1;
        hammer.rotation.z = -Math.PI / 6;
        group.add(hammer);
        
        return group;
      },
    },
    [WeaponType.M1_GARAND]: {
      damage: 60,
      range: 30.0,
      fireRate: 2.0, // shots per second
      isMelee: false,
      createMesh: () => {
        const group = new THREE.Group();
        
        // Barrel (long cylinder)
        const barrelGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,
          metalness: 0.9,
          roughness: 0.2,
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = 0.5;
        group.add(barrel);
        
        // Stock (wooden handle)
        const stockGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.5);
        const stockMaterial = new THREE.MeshStandardMaterial({
          color: 0x654321,
          roughness: 0.7,
        });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.x = -0.15;
        stock.position.y = -0.1;
        group.add(stock);
        
        // Receiver (metal body)
        const receiverGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.6);
        const receiverMaterial = new THREE.MeshStandardMaterial({
          color: 0x2c2c2c,
          metalness: 0.9,
          roughness: 0.2,
        });
        const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
        receiver.position.x = 0.2;
        group.add(receiver);
        
        // Sights
        const frontSightGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.05);
        const frontSight = new THREE.Mesh(frontSightGeometry, receiverMaterial);
        frontSight.position.x = 0.95;
        frontSight.position.y = 0.1;
        group.add(frontSight);
        
        return group;
      },
    },
  };

  constructor(engine: Engine, config: WeaponConfig) {
    this.engine = engine;
    this.type = config.type;
    this.position = config.position.clone();

    const config_data = Weapon.WEAPON_CONFIGS[config.type];
    this.mesh = config_data.createMesh();
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Random float offset for variation
    this.floatOffset = Math.random() * Math.PI * 2;

    engine.scene.add(this.mesh);
    console.log(`[Weapon] Created ${config.type} at`, config.position);
  }

  update(deltaTime: number): void {
    if (this.collected) return;

    // Rotate and float animation
    this.mesh.rotation.y += this.rotationSpeed;
    this.floatOffset += this.floatSpeed;
    this.mesh.position.y = this.position.y + Math.sin(this.floatOffset) * 0.1;
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    if (this.collected) return false;

    const distance = this.mesh.position.distanceTo(playerPosition);
    const collectDistance = playerRadius + 0.5;

    if (distance < collectDistance) {
      this.collect();
      return true;
    }

    return false;
  }

  private collect(): void {
    this.collected = true;
    this.engine.scene.remove(this.mesh);
    console.log(`[Weapon] Collected ${this.type}`);
  }

  isCollected(): boolean {
    return this.collected;
  }

  getType(): WeaponType {
    return this.type;
  }

  getDamage(): number {
    return Weapon.WEAPON_CONFIGS[this.type].damage;
  }

  getRange(): number {
    return Weapon.WEAPON_CONFIGS[this.type].range;
  }

  getFireRate(): number {
    return Weapon.WEAPON_CONFIGS[this.type].fireRate;
  }

  isMelee(): boolean {
    return Weapon.WEAPON_CONFIGS[this.type].isMelee;
  }

  createMeshForPlayer(): THREE.Group {
    // Create a new mesh for the player to hold
    const config_data = Weapon.WEAPON_CONFIGS[this.type];
    const group = config_data.createMesh();
    group.castShadow = true;
    return group;
  }

  dispose(): void {
    if (!this.collected && this.mesh) {
      this.engine.scene.remove(this.mesh);
      // Dispose all children
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }
  }
}
