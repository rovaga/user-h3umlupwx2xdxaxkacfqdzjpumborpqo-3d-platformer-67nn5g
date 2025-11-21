/**
 * AI-EDITABLE: Microphone Collectible
 *
 * This file defines collectible microphones that the girl player can collect.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum IngredientType {
  MICROPHONE = 'microphone',
}

interface IngredientConfig {
  type: IngredientType;
  position: THREE.Vector3;
}

export class Ingredient {
  private engine: Engine;
  private mesh: THREE.Group | THREE.Mesh;
  private type: IngredientType;
  private position: THREE.Vector3;
  private collected: boolean = false;
  private rotationSpeed: number = 0.02;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.001;

  // Microphone properties
  private static readonly INGREDIENT_CONFIGS = {
    [IngredientType.MICROPHONE]: {
      color: 0x333333, // Dark gray/black for microphone
      height: 0.4,
      geometry: () => {
        // Create microphone shape: handle (cylinder) + head (sphere)
        const group = new THREE.Group();
        
        // Microphone handle (vertical cylinder)
        const handleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x333333,
          roughness: 0.3,
          metalness: 0.7
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.125;
        group.add(handle);
        
        // Microphone head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.12, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x1a1a1a,
          roughness: 0.2,
          metalness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.05;
        group.add(head);
        
        // Microphone grill (small cylinder on top)
        const grillGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8);
        const grillMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x000000,
          roughness: 0.1,
          metalness: 0.9
        });
        const grill = new THREE.Mesh(grillGeometry, grillMaterial);
        grill.position.y = 0.15;
        group.add(grill);
        
        return group;
      },
    },
  };

  constructor(engine: Engine, config: IngredientConfig) {
    this.engine = engine;
    this.type = config.type;
    this.position = config.position.clone();

    const config_data = Ingredient.INGREDIENT_CONFIGS[config.type];
    const geometry = config_data.geometry();
    
    // Geometry is already a Group for microphone, so use it directly
    if (geometry instanceof THREE.Group) {
      this.mesh = geometry;
      this.mesh.position.copy(this.position);
      // Enable shadows for all children
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } else {
      // Fallback for other types (shouldn't happen with microphone)
      const material = new THREE.MeshStandardMaterial({
        color: config_data.color,
        roughness: 0.6,
        metalness: 0.7,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.copy(this.position);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
    }

    // Random float offset for variation
    this.floatOffset = Math.random() * Math.PI * 2;

    engine.scene.add(this.mesh);
    console.log(`[Ingredient] Created ${config.type} at`, config.position);
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
    const collectDistance = playerRadius + 0.3;

    if (distance < collectDistance) {
      this.collect();
      return true;
    }

    return false;
  }

  private collect(): void {
    this.collected = true;
    this.engine.scene.remove(this.mesh);
    console.log(`[Ingredient] Collected ${this.type}`);
  }

  isCollected(): boolean {
    return this.collected;
  }

  getType(): IngredientType {
    return this.type;
  }

  createMeshForPlayer(): THREE.Group {
    // Create a new microphone group for the player's stack
    const handleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.7
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.castShadow = true;
    
    const headGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      roughness: 0.2,
      metalness: 0.8
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.05;
    head.castShadow = true;
    
    // Microphone grill
    const grillGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8);
    const grillMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.9
    });
    const grill = new THREE.Mesh(grillGeometry, grillMaterial);
    grill.position.y = 0.15;
    grill.castShadow = true;
    
    // Create a group and add all parts
    const group = new THREE.Group();
    group.add(handle);
    group.add(head);
    group.add(grill);
    
    return group;
  }

  getHeight(): number {
    return Ingredient.INGREDIENT_CONFIGS[this.type].height;
  }

  dispose(): void {
    if (!this.collected && this.mesh) {
      this.engine.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
  }
}
