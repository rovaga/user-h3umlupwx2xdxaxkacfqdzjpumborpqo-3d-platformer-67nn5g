/**
 * AI-EDITABLE: Choya (Cactus) Component
 *
 * Choyas are dangerous cacti with many arms and long spines.
 * When collided with, they cause damage and create spine effects.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

interface ChoyaConfig {
  position: THREE.Vector3;
}

export class Choya {
  private engine: Engine;
  private mesh: THREE.Group;
  private mainBody: THREE.Mesh;
  private arms: THREE.Mesh[] = [];
  private spines: THREE.Mesh[] = [];
  private position: THREE.Vector3;
  private collisionRadius: number = 1.2;

  constructor(engine: Engine, config: ChoyaConfig) {
    this.engine = engine;
    this.position = config.position.clone();

    // Create choya group
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.position.x, 0, this.position.z); // Position at ground level
    engine.scene.add(this.mesh);

    // Create main body (central trunk)
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c3d, // Green cactus color
      roughness: 0.9,
    });
    this.mainBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mainBody.position.y = 0.6;
    this.mainBody.castShadow = true;
    this.mainBody.receiveShadow = true;
    this.mesh.add(this.mainBody);

    // Create multiple arms (branches)
    const armCount = 4 + Math.floor(Math.random() * 4); // 4-7 arms
    for (let i = 0; i < armCount; i++) {
      const angle = (i / armCount) * Math.PI * 2;
      const armLength = 0.6 + Math.random() * 0.4;
      const armHeight = 0.5 + Math.random() * 0.5;
      
      const armGeometry = new THREE.CylinderGeometry(
        0.15,
        0.2,
        armLength,
        6
      );
      const armMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a7c3d,
        roughness: 0.9,
      });
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      
      // Position arm extending from body
      arm.position.set(
        Math.cos(angle) * 0.3,
        armHeight,
        Math.sin(angle) * 0.3
      );
      arm.rotation.z = Math.cos(angle) * 0.3;
      arm.rotation.x = Math.sin(angle) * 0.3;
      arm.castShadow = true;
      arm.receiveShadow = true;
      this.mesh.add(arm);
      this.arms.push(arm);

      // Add spines to each arm
      const spineCount = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < spineCount; j++) {
        const spineLength = 0.15 + Math.random() * 0.1;
        const spineGeometry = new THREE.CylinderGeometry(0.02, 0.02, spineLength, 4);
        const spineMaterial = new THREE.MeshStandardMaterial({
          color: 0x2d5016, // Darker green for spines
          roughness: 0.8,
        });
        const spine = new THREE.Mesh(spineGeometry, spineMaterial);
        
        // Position spine along the arm
        const spinePos = (j / spineCount) * armLength - armLength / 2;
        const spineAngle = angle + (Math.random() - 0.5) * 0.5;
        spine.position.set(
          Math.cos(spineAngle) * 0.2 + Math.cos(angle) * 0.3,
          armHeight + spinePos * Math.sin(arm.rotation.x),
          Math.sin(spineAngle) * 0.2 + Math.sin(angle) * 0.3
        );
        spine.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        spine.castShadow = true;
        this.mesh.add(spine);
        this.spines.push(spine);
      }
    }

    console.log(`[Choya] Created at`, config.position);
  }

  update(deltaTime: number): void {
    // Slight swaying animation in desert wind
    const windOffset = Math.sin(Date.now() * 0.001) * 0.02;
    this.mesh.rotation.z = windOffset;
    
    // Arms sway slightly
    for (let i = 0; i < this.arms.length; i++) {
      const armWind = Math.sin(Date.now() * 0.001 + i) * 0.05;
      this.arms[i].rotation.z += armWind * deltaTime;
    }
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    const choyaWorldPos = new THREE.Vector3(
      this.mesh.position.x,
      this.mesh.position.y + 0.6, // Center of choya body
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
    this.engine.scene.remove(this.mesh);
    this.mainBody.geometry.dispose();
    (this.mainBody.material as THREE.Material).dispose();
    
    for (const arm of this.arms) {
      arm.geometry.dispose();
      (arm.material as THREE.Material).dispose();
    }
    
    for (const spine of this.spines) {
      spine.geometry.dispose();
      (spine.material as THREE.Material).dispose();
    }
    
    console.log('[Choya] Disposed');
  }
}
