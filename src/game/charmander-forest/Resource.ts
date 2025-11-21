/**
 * AI-EDITABLE: Resource
 *
 * Resources that Charmander can collect in the forest (food, wood, etc.).
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum ResourceType {
  BERRY = 'berry',
  WOOD = 'wood',
  MEAT = 'meat',
}

export class Resource {
  private engine: Engine;
  private mesh: THREE.Mesh;
  private position: THREE.Vector3;
  private type: ResourceType;
  private value: number;
  private collected: boolean = false;
  private rotationSpeed: number = 0.5;
  private bobAmount: number = 0;
  private bobSpeed: number = 2;

  constructor(
    engine: Engine,
    position: THREE.Vector3,
    type: ResourceType = ResourceType.BERRY
  ) {
    this.engine = engine;
    this.position = position.clone();
    this.type = type;

    // Create resource mesh based on type
    if (type === ResourceType.BERRY) {
      this.value = 20; // Hunger value
      const geometry = new THREE.SphereGeometry(0.15, 8, 8);
      const material = new THREE.MeshStandardMaterial({
        color: 0xff1493, // Deep pink/red berry
        roughness: 0.3,
        emissive: 0xff1493,
        emissiveIntensity: 0.3,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.castShadow = true;
    } else if (type === ResourceType.WOOD) {
      this.value = 15; // Fire power value
      const geometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown wood
        roughness: 0.8,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.castShadow = true;
    } else {
      // MEAT
      this.value = 30; // High hunger value
      const geometry = new THREE.BoxGeometry(0.2, 0.15, 0.2);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8b0000, // Dark red meat
        roughness: 0.5,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.castShadow = true;
    }

    this.mesh.position.copy(this.position);
    this.engine.scene.add(this.mesh);

    // Random bob offset
    this.bobAmount = Math.random() * Math.PI * 2;
  }

  update(deltaTime: number, groundHeight: number): void {
    if (this.collected) return;

    // Rotate
    this.mesh.rotation.y += this.rotationSpeed * deltaTime;

    // Bob up and down
    this.bobAmount += this.bobSpeed * deltaTime;
    const bobOffset = Math.sin(this.bobAmount) * 0.1;
    this.mesh.position.y = groundHeight + 0.2 + bobOffset;
  }

  checkCollision(charmanderPosition: THREE.Vector3, charmanderRadius: number): boolean {
    if (this.collected) return false;

    const distance = this.position.distanceTo(charmanderPosition);
    return distance < charmanderRadius + 0.2;
  }

  collect(): number {
    if (this.collected) return 0;
    
    this.collected = true;
    this.engine.scene.remove(this.mesh);
    return this.value;
  }

  getType(): ResourceType {
    return this.type;
  }

  getValue(): number {
    return this.value;
  }

  isCollected(): boolean {
    return this.collected;
  }

  dispose(): void {
    if (!this.collected) {
      this.engine.scene.remove(this.mesh);
    }
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    console.log('[Resource] Disposed');
  }
}
