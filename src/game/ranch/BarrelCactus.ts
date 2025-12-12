/**
 * AI-EDITABLE: Barrel Cactus Component
 *
 * Barrel cacti are smaller, round cacti that are less dangerous than choyas.
 * Maximum height is 1/2 cowboy.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Engine } from '../../engine/Engine';

interface BarrelCactusConfig {
  position: THREE.Vector3;
  size?: number; // Size multiplier (max 0.5 cowboys tall)
}

export class BarrelCactus {
  private engine: Engine;
  private mesh: THREE.Group | null = null;
  private position: THREE.Vector3;
  private size: number;
  private collisionRadius: number = 0.6;
  private modelLoaded: boolean = false;

  constructor(engine: Engine, config: BarrelCactusConfig) {
    this.engine = engine;
    this.position = config.position.clone();
    // Random size up to 0.5 cowboys tall (cowboy is ~1.0 units tall)
    // Minimum 0.2 to ensure visibility, maximum 0.5 as specified
    // Reduced to 1/9 of original size (3x smaller than current)
    this.size = config.size ?? ((0.2 + Math.random() * 0.3) / 9); // 0.022 to 0.056 (1/9 of original)

    // Load the barrel cactus GLB model
    this.loadModel();
  }

  private async loadModel(): Promise<void> {
    try {
      const cactusUrl = this.engine.assetLoader.getUrl('models/Barrel_cactus-1765500635663.glb');
      if (!cactusUrl) {
        console.error('[BarrelCactus] Barrel cactus model not found');
        return;
      }

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(cactusUrl);

      // Clone the model for this instance
      this.mesh = gltf.scene.clone();
      this.mesh.position.set(this.position.x, 0, this.position.z);
      
      // Scale the cactus based on size (max 0.5 cowboys tall)
      this.mesh.scale.set(this.size, this.size, this.size);
      
      // Adjust collision radius based on size
      this.collisionRadius = 0.6 * this.size;

      // Enable shadows on all meshes in the model
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.engine.scene.add(this.mesh);
      this.modelLoaded = true;

      console.log(`[BarrelCactus] Created at`, this.position, `size: ${this.size.toFixed(2)}`);
    } catch (error) {
      console.error('[BarrelCactus] Failed to load barrel cactus model:', error);
    }
  }

  update(deltaTime: number): void {
    if (!this.mesh || !this.modelLoaded) {
      return;
    }

    // Slight swaying animation in desert wind (less than choyas)
    const windOffset = Math.sin(Date.now() * 0.001) * 0.01;
    this.mesh.rotation.z = windOffset;
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    if (!this.mesh || !this.modelLoaded) {
      return false;
    }

    const cactusWorldPos = new THREE.Vector3(
      this.mesh.position.x,
      this.mesh.position.y + 0.3 * this.size, // Center of barrel cactus body
      this.mesh.position.z
    );
    const distance = cactusWorldPos.distanceTo(playerPosition);
    const collisionDistance = this.collisionRadius + playerRadius;
    
    return distance < collisionDistance;
  }

  createSpineEffect(playerPosition: THREE.Vector3, playerMesh: THREE.Group): THREE.Mesh[] {
    // Create visual effect of spines sticking to player
    // Spawn fewer spines than choyas (barrel cacti are less dangerous)
    const spineCount = 1 + Math.floor(Math.random() * 2);
    const spines: THREE.Mesh[] = [];
    
    for (let i = 0; i < spineCount; i++) {
      const spineGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 4); // Double size
      const spineMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d5016,
        roughness: 0.8,
        transparent: true,
        opacity: 1.0,
      });
      const spine = new THREE.Mesh(spineGeometry, spineMaterial);
      
      // Position relative to player with random offset (in local space)
      spine.position.set(
        (Math.random() - 0.5) * 0.4,
        Math.random() * 0.4,
        (Math.random() - 0.5) * 0.4
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
    
    console.log('[BarrelCactus] Disposed');
  }
}
