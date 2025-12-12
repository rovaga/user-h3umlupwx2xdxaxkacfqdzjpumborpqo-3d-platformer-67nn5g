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
}

export class Choya {
  private engine: Engine;
  private mesh: THREE.Group | null = null;
  private position: THREE.Vector3;
  private collisionRadius: number = 1.2;
  private modelLoaded: boolean = false;

  constructor(engine: Engine, config: ChoyaConfig) {
    this.engine = engine;
    this.position = config.position.clone();

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

      // Enable shadows on all meshes in the model
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.engine.scene.add(this.mesh);
      this.modelLoaded = true;

      console.log(`[Choya] Created at`, this.position);
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

  createSpineEffect(playerPosition: THREE.Vector3): void {
    // Create visual effect of spines sticking to player
    // Spawn a few spine pieces near the player
    const spineCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < spineCount; i++) {
      const spineGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 4);
      const spineMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d5016,
        roughness: 0.8,
      });
      const spine = new THREE.Mesh(spineGeometry, spineMaterial);
      
      // Position near player with random offset
      spine.position.set(
        playerPosition.x + (Math.random() - 0.5) * 0.5,
        playerPosition.y + Math.random() * 0.5,
        playerPosition.z + (Math.random() - 0.5) * 0.5
      );
      spine.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      this.engine.scene.add(spine);
      
      // Remove after a few seconds
      setTimeout(() => {
        this.engine.scene.remove(spine);
        spine.geometry.dispose();
        (spine.material as THREE.Material).dispose();
      }, 3000);
    }
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
