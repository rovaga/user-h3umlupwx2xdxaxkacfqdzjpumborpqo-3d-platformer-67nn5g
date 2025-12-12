/**
 * AI-EDITABLE: Choya (Cactus) Component
 *
 * Choyas are dangerous cacti with many arms and long spines.
 * When collided with, they cause damage and create spine effects.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Engine } from '../../engine/Engine';

interface ChoyaConfig {
  position: THREE.Vector3;
  size?: number; // Size multiplier (1-3 cowboys tall, with base scale factor applied)
}

export class Choya {
  private engine: Engine;
  private mesh: THREE.Group | null = null;
  private position: THREE.Vector3;
  private size: number;
  private collisionRadius: number = 1.2;
  private modelLoaded: boolean = false;

  constructor(engine: Engine, config: ChoyaConfig) {
    this.engine = engine;
    this.position = config.position.clone();
    // Random size between 1 and 3 cowboys tall (cowboy is ~1.15 units tall)
    // Apply a base scale factor to make saguaros smaller - the model base is scaled down
    const baseScale = 0.35 / 3; // Base scale factor to make saguaros smaller (3x smaller than current)
    const minCowboys = 1;
    const maxCowboys = 3;
    // Size multiplier: baseScale * (1 to 3 cowboys)
    this.size = config.size ?? (baseScale * (minCowboys + Math.random() * (maxCowboys - minCowboys))); // 0.117 to 0.35 scale

    // Load the cactus GLB model
    this.loadModel();
  }

  private async loadModel(): Promise<void> {
    try {
      const cactusUrl = this.engine.assetLoader.getUrl('models/Cactus-1765500322237.glb');
      if (!cactusUrl) {
        console.error('[Choya] Cactus model not found');
        return;
      }

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(cactusUrl);

      // Clone the model for this instance
      this.mesh = gltf.scene.clone();
      this.mesh.position.set(this.position.x, 0, this.position.z);
      
      // Scale the cactus based on size (1-3 cowboys tall)
      this.mesh.scale.set(this.size, this.size, this.size);
      
      // Adjust collision radius based on size
      this.collisionRadius = 1.2 * this.size;

      // Enable shadows on all meshes in the model
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.engine.scene.add(this.mesh);
      this.modelLoaded = true;

      console.log(`[Choya] Created at`, this.position, `size: ${this.size.toFixed(2)}`);
    } catch (error) {
      console.error('[Choya] Failed to load cactus model:', error);
    }
  }

  update(deltaTime: number): void {
    if (!this.mesh || !this.modelLoaded) {
      return;
    }

    // Slight swaying animation in desert wind
    const windOffset = Math.sin(Date.now() * 0.001) * 0.02;
    this.mesh.rotation.z = windOffset;
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    if (!this.mesh || !this.modelLoaded) {
      return false;
    }

    const choyaWorldPos = new THREE.Vector3(
      this.mesh.position.x,
      this.mesh.position.y + 0.6, // Center of cactus body
      this.mesh.position.z
    );
    const distance = choyaWorldPos.distanceTo(playerPosition);
    const collisionDistance = this.collisionRadius + playerRadius;
    
    return distance < collisionDistance;
  }

  createSpineEffect(playerPosition: THREE.Vector3, playerMesh: THREE.Group): THREE.Mesh[] {
    // Create visual effect of spines sticking to player
    // Spawn a few spine pieces that stick to the player
    const spineCount = 3 + Math.floor(Math.random() * 3);
    const spines: THREE.Mesh[] = [];
    
    for (let i = 0; i < spineCount; i++) {
      const spineGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 4); // Double size
      const spineMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d5016,
        roughness: 0.8,
        transparent: true,
        opacity: 1.0,
      });
      const spine = new THREE.Mesh(spineGeometry, spineMaterial);
      
      // Position relative to player with random offset (in local space)
      spine.position.set(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      spine.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Add spine as child of player mesh so it follows the player
      playerMesh.add(spine);
      spines.push(spine);
    }
    
    return spines;
  }

  dispose(): void {
    if (this.mesh) {
      this.engine.scene.remove(this.mesh);
      
      // Dispose of all geometries and materials in the model
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    console.log('[Choya] Disposed');
  }
}
