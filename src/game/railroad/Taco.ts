/**
 * AI-EDITABLE: Taco Collectible
 *
 * This file defines collectible tacos that the player can collect on the Mexican railroad.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum TacoType {
  CARNITAS = 'carnitas',
  AL_PASTOR = 'al_pastor',
  BARBACOA = 'barbacoa',
  POLLO = 'pollo',
  CARNE_ASADA = 'carne_asada',
  VEGETARIANO = 'vegetariano',
}

interface TacoConfig {
  type: TacoType;
  position: THREE.Vector3;
}

export class Taco {
  private engine: Engine;
  private mesh: THREE.Mesh;
  private type: TacoType;
  private position: THREE.Vector3;
  private collected: boolean = false;
  private rotationSpeed: number = 0.03;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.0015;

  // Taco properties - different types of Mexican tacos
  private static readonly TACO_CONFIGS = {
    [TacoType.CARNITAS]: {
      color: 0xd2691e, // Brown/orange for carnitas
      height: 0.2,
    },
    [TacoType.AL_PASTOR]: {
      color: 0xff6347, // Reddish for al pastor
      height: 0.2,
    },
    [TacoType.BARBACOA]: {
      color: 0x8b4513, // Dark brown for barbacoa
      height: 0.2,
    },
    [TacoType.POLLO]: {
      color: 0xffd700, // Golden yellow for chicken
      height: 0.2,
    },
    [TacoType.CARNE_ASADA]: {
      color: 0xcd5c5c, // Reddish for carne asada
      height: 0.2,
    },
    [TacoType.VEGETARIANO]: {
      color: 0x32cd32, // Green for vegetarian
      height: 0.2,
    },
  };

  private tacoGroup: THREE.Group;

  constructor(engine: Engine, config: TacoConfig) {
    this.engine = engine;
    this.type = config.type;
    this.position = config.position.clone();

    const config_data = Taco.TACO_CONFIGS[config.type];
    
    // Create taco group with shell and filling
    this.tacoGroup = new THREE.Group();
    
    // Taco shell (U-shaped cylinder)
    const shellGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 8);
    const shellMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf4a460, // Tortilla color
      roughness: 0.7 
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.rotation.x = Math.PI / 2;
    shell.scale.z = 0.3; // Make it U-shaped
    this.tacoGroup.add(shell);
    
    // Filling (meat/vegetables)
    const fillingGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.3);
    const fillingMaterial = new THREE.MeshStandardMaterial({ 
      color: config_data.color,
      roughness: 0.6 
    });
    const filling = new THREE.Mesh(fillingGeometry, fillingMaterial);
    filling.position.y = 0.05;
    this.tacoGroup.add(filling);
    
    // Create collision mesh (simplified box)
    const collisionGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.3);
    const collisionMaterial = new THREE.MeshStandardMaterial({
      color: config_data.color,
      roughness: 0.6,
      transparent: true,
      opacity: 0.0, // Invisible collision mesh
    });
    this.mesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.mesh.position.copy(this.position);
    
    // Position taco group
    this.tacoGroup.position.copy(this.position);
    this.tacoGroup.castShadow = true;
    this.tacoGroup.receiveShadow = true;
    
    this.engine.scene.add(this.tacoGroup);
    this.engine.scene.add(this.mesh);

    // Random float offset for variation
    this.floatOffset = Math.random() * Math.PI * 2;

    console.log(`[Taco] Created ${config.type} at`, config.position);
  }

  update(deltaTime: number): void {
    if (this.collected) return;

    // Rotate and float animation
    this.tacoGroup.rotation.y += this.rotationSpeed;
    this.floatOffset += this.floatSpeed;
    const floatY = this.position.y + Math.sin(this.floatOffset) * 0.15;
    this.mesh.position.y = floatY;
    this.tacoGroup.position.y = floatY;
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    if (this.collected) return false;

    const distance = this.mesh.position.distanceTo(playerPosition);
    const collectDistance = playerRadius + 0.4;

    if (distance < collectDistance) {
      this.collect();
      return true;
    }

    return false;
  }

  private collect(): void {
    this.collected = true;
    this.engine.scene.remove(this.mesh);
    this.engine.scene.remove(this.tacoGroup);
    // Dispose geometries
    this.tacoGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    console.log(`[Taco] Collected ${this.type}`);
  }

  isCollected(): boolean {
    return this.collected;
  }

  getType(): TacoType {
    return this.type;
  }

  createMeshForPlayer(): THREE.Mesh {
    // Create a simplified mesh for the player's stack
    const config_data = Taco.TACO_CONFIGS[this.type];
    const geometry = new THREE.BoxGeometry(0.4, 0.2, 0.3);
    const material = new THREE.MeshStandardMaterial({
      color: config_data.color,
      roughness: 0.6,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  getHeight(): number {
    return Taco.TACO_CONFIGS[this.type].height;
  }

  dispose(): void {
    if (!this.collected) {
      if (this.mesh) {
        this.engine.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
      }
      if (this.tacoGroup) {
        this.engine.scene.remove(this.tacoGroup);
        this.tacoGroup.traverse((child) => {
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
}
