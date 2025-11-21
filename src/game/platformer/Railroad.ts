/**
 * AI-EDITABLE: Railroad Component
 *
 * This file defines railroad tracks that can be placed in the game world.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

interface RailroadConfig {
  start: THREE.Vector3;
  end: THREE.Vector3;
  height?: number;
}

export class Railroad {
  private engine: Engine;
  private group: THREE.Group;
  private start: THREE.Vector3;
  private end: THREE.Vector3;
  private direction: THREE.Vector3;
  private length: number;

  constructor(engine: Engine, config: RailroadConfig) {
    this.engine = engine;
    this.start = config.start.clone();
    this.end = config.end.clone();
    this.direction = new THREE.Vector3()
      .subVectors(this.end, this.start)
      .normalize();
    this.length = this.start.distanceTo(this.end);
    const height = config.height ?? 0.5;

    // Create railroad group
    this.group = new THREE.Group();
    engine.scene.add(this.group);

    // Create ties (sleepers) along the track
    const tieCount = Math.floor(this.length * 2);
    for (let i = 0; i <= tieCount; i++) {
      const t = i / tieCount;
      const tiePosition = new THREE.Vector3().lerpVectors(this.start, this.end, t);
      tiePosition.y = height;

      const tieGeometry = new THREE.BoxGeometry(2, 0.2, 0.3);
      const tieMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321, // Brown wood color
        roughness: 0.8,
      });
      const tie = new THREE.Mesh(tieGeometry, tieMaterial);
      tie.position.copy(tiePosition);
      
      // Rotate tie to align with track direction
      tie.rotation.y = Math.atan2(this.direction.x, this.direction.z);
      tie.castShadow = true;
      tie.receiveShadow = true;
      this.group.add(tie);
    }

    // Create rails (two parallel rails)
    const railGeometry = new THREE.BoxGeometry(0.1, 0.15, this.length);
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080, // Gray metal color
      roughness: 0.3,
      metalness: 0.8,
    });

    // Calculate track center and perpendicular direction for rail offset
    const trackCenter = new THREE.Vector3().lerpVectors(this.start, this.end, 0.5);
    const trackAngle = Math.atan2(this.direction.x, this.direction.z);
    const perpAngle = trackAngle + Math.PI / 2;
    const perpDirection = new THREE.Vector3(Math.sin(perpAngle), 0, Math.cos(perpAngle));

    // Left rail
    const leftRail = new THREE.Mesh(railGeometry, railMaterial);
    const leftOffset = perpDirection.clone().multiplyScalar(-0.75);
    leftOffset.y = height + 0.075;
    leftRail.position.copy(trackCenter).add(leftOffset);
    leftRail.rotation.y = trackAngle;
    leftRail.castShadow = true;
    leftRail.receiveShadow = true;
    this.group.add(leftRail);

    // Right rail
    const rightRail = new THREE.Mesh(railGeometry, railMaterial);
    const rightOffset = perpDirection.clone().multiplyScalar(0.75);
    rightOffset.y = height + 0.075;
    rightRail.position.copy(trackCenter).add(rightOffset);
    rightRail.rotation.y = trackAngle;
    rightRail.castShadow = true;
    rightRail.receiveShadow = true;
    this.group.add(rightRail);

    console.log(`[Railroad] Created track from (${this.start.x}, ${this.start.z}) to (${this.end.x}, ${this.end.z})`);
  }

  /**
   * Get the position along the track at a given normalized distance (0-1)
   */
  getPositionAt(t: number): THREE.Vector3 {
    return new THREE.Vector3().lerpVectors(this.start, this.end, t);
  }

  /**
   * Get the direction vector of the track
   */
  getDirection(): THREE.Vector3 {
    return this.direction.clone();
  }

  /**
   * Get the length of the track
   */
  getLength(): number {
    return this.length;
  }

  /**
   * Get the start position
   */
  getStart(): THREE.Vector3 {
    return this.start.clone();
  }

  /**
   * Get the end position
   */
  getEnd(): THREE.Vector3 {
    return this.end.clone();
  }

  dispose(): void {
    this.engine.scene.remove(this.group);
    
    // Dispose all meshes in the group
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    
    console.log('[Railroad] Disposed');
  }
}
