/**
 * AI-EDITABLE: Collectible Items
 *
 * This file defines collectible items (strawberries, sugar, honey)
 * that the cat can collect to make cakes.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum CollectibleType {
  STRAWBERRY = 'strawberry',
  SUGAR = 'sugar',
  HONEY = 'honey',
}

interface Bounds {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export class Collectible {
  private engine: Engine;
  private mesh: THREE.Object3D;
  private type: CollectibleType;
  private position: THREE.Vector3;
  private rotation: number = 0;
  private collected: boolean = false;
  private bounds: Bounds;

  constructor(engine: Engine, type: CollectibleType, position: THREE.Vector3) {
    this.engine = engine;
    this.type = type;
    this.position = position.clone();

    // Create mesh based on type
    let geometry: THREE.BufferGeometry;
    let material: THREE.MeshStandardMaterial;

    switch (type) {
      case CollectibleType.STRAWBERRY:
        // Strawberry shape (cone with sphere on top)
        const strawberryGroup = new THREE.Group();
        
        // Main body (red sphere)
        const berryBody = new THREE.SphereGeometry(0.2, 12, 12);
        const berryMaterial = new THREE.MeshStandardMaterial({ color: 0xff1744 });
        const body = new THREE.Mesh(berryBody, berryMaterial);
        body.position.y = 0.1;
        strawberryGroup.add(body);

        // Top leaves (green cone)
        const leaves = new THREE.ConeGeometry(0.15, 0.2, 6);
        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
        const leavesMesh = new THREE.Mesh(leaves, leavesMaterial);
        leavesMesh.position.y = 0.3;
        strawberryGroup.add(leavesMesh);

        geometry = berryBody; // Use body for bounds
        material = berryMaterial;
        this.mesh = strawberryGroup;
        break;

      case CollectibleType.SUGAR:
        // Sugar cube (white cube)
        geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        this.mesh = new THREE.Mesh(geometry, material);
        break;

      case CollectibleType.HONEY:
        // Honey jar (cylinder with golden liquid)
        const jarGroup = new THREE.Group();
        
        // Jar body (transparent cylinder)
        const jarGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
        const jarMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          transparent: true, 
          opacity: 0.3 
        });
        const jar = new THREE.Mesh(jarGeometry, jarMaterial);
        jarGroup.add(jar);

        // Honey liquid (golden sphere)
        const honeyGeometry = new THREE.SphereGeometry(0.12, 12, 12);
        const honeyMaterial = new THREE.MeshStandardMaterial({ color: 0xffb300 });
        const honey = new THREE.Mesh(honeyGeometry, honeyMaterial);
        honey.position.y = -0.05;
        jarGroup.add(honey);

        geometry = jarGeometry;
        material = jarMaterial;
        this.mesh = jarGroup;
        break;
    }

    this.mesh.position.copy(position);
    
    // Set shadow properties for meshes in groups
    if (this.mesh instanceof THREE.Mesh) {
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
    } else if (this.mesh instanceof THREE.Group) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
    
    engine.scene.add(this.mesh);

    // Calculate bounds for collision detection
    const radius = 0.25;
    this.bounds = {
      min: new THREE.Vector3(
        position.x - radius,
        position.y - radius,
        position.z - radius
      ),
      max: new THREE.Vector3(
        position.x + radius,
        position.y + radius,
        position.z + radius
      ),
    };
  }

  update(deltaTime: number): void {
    if (this.collected) return;

    // Rotate and bob up and down
    this.rotation += deltaTime * 0.001;
    this.mesh.rotation.y = this.rotation;
    this.mesh.position.y = this.position.y + Math.sin(this.rotation * 2) * 0.1;
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    if (this.collected) return false;

    const distance = playerPosition.distanceTo(this.position);
    return distance < playerRadius + 0.25;
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;
    this.engine.scene.remove(this.mesh);
    
    // Dispose of geometry and materials
    if (this.mesh instanceof THREE.Mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    } else if (this.mesh instanceof THREE.Group) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
  }

  isCollected(): boolean {
    return this.collected;
  }

  getType(): CollectibleType {
    return this.type;
  }

  getBounds(): Bounds {
    return this.bounds;
  }

  dispose(): void {
    if (!this.collected) {
      this.collect();
    }
  }
}
