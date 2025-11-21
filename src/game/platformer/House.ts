/**
 * AI-EDITABLE: House Component
 *
 * This file defines houses/buildings that can be placed in the game world.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

interface HouseConfig {
  position: THREE.Vector3;
  size?: THREE.Vector3;
  color?: number;
  roofColor?: number;
}

export class House {
  private engine: Engine;
  private group: THREE.Group;
  private bounds: { min: THREE.Vector3; max: THREE.Vector3 };

  constructor(engine: Engine, config: HouseConfig) {
    this.engine = engine;
    this.group = new THREE.Group();

    const size = config.size || new THREE.Vector3(3, 3, 3);
    const color = config.color ?? 0xd4a574; // Beige/tan color
    const roofColor = config.roofColor ?? 0x8b4513; // Brown roof

    // Create house base (walls)
    const wallGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
    });
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = size.y / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    this.group.add(walls);

    // Create roof (triangular prism)
    const roofHeight = size.y * 0.5;
    const roofGeometry = new THREE.ConeGeometry(
      size.x * 0.9,
      roofHeight,
      4
    );
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: roofColor,
      roughness: 0.7,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = size.y + roofHeight / 2;
    roof.rotation.y = Math.PI / 4; // Rotate 45 degrees for diamond shape
    roof.castShadow = true;
    roof.receiveShadow = true;
    this.group.add(roof);

    // Create door
    const doorGeometry = new THREE.BoxGeometry(size.x * 0.3, size.y * 0.5, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321, // Dark brown door
      roughness: 0.6,
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, size.y * 0.25, size.z / 2 + 0.05);
    door.castShadow = true;
    this.group.add(door);

    // Position the entire house group
    this.group.position.copy(config.position);

    // Calculate bounds for collision (optional, can be used for gameplay)
    this.bounds = {
      min: new THREE.Vector3(
        config.position.x - size.x / 2,
        config.position.y,
        config.position.z - size.z / 2
      ),
      max: new THREE.Vector3(
        config.position.x + size.x / 2,
        config.position.y + size.y + roofHeight,
        config.position.z + size.z / 2
      ),
    };

    // Add house to scene
    engine.scene.add(this.group);
  }

  getBounds(): { min: THREE.Vector3; max: THREE.Vector3 } {
    return this.bounds;
  }

  dispose(): void {
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    this.engine.scene.remove(this.group);
  }
}
