/**
 * AI-EDITABLE: Railroad Track Component
 *
 * This file defines railroad tracks that the train moves along.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

interface TrackConfig {
  start: THREE.Vector3;
  end: THREE.Vector3;
  width?: number;
}

interface Bounds {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export class RailroadTrack {
  private engine: Engine;
  private mesh: THREE.Group;
  private bounds: Bounds;
  private start: THREE.Vector3;
  private end: THREE.Vector3;
  private length: number;
  private direction: THREE.Vector3;

  constructor(engine: Engine, config: TrackConfig) {
    this.engine = engine;
    this.start = config.start.clone();
    this.end = config.end.clone();
    this.length = this.start.distanceTo(this.end);
    this.direction = new THREE.Vector3()
      .subVectors(this.end, this.start)
      .normalize();

    // Create track group
    this.mesh = new THREE.Group();

    // Create ties (sleepers) - wooden planks across the tracks
    const tieCount = Math.floor(this.length / 2);
    for (let i = 0; i <= tieCount; i++) {
      const t = i / tieCount;
      const tiePos = new THREE.Vector3().lerpVectors(this.start, this.end, t);
      
      const tieGeometry = new THREE.BoxGeometry(2, 0.2, 0.3);
      const tieMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown wood color
        roughness: 0.9,
      });
      const tie = new THREE.Mesh(tieGeometry, tieMaterial);
      
      // Rotate tie to be perpendicular to track direction
      const angle = Math.atan2(this.direction.x, this.direction.z);
      tie.rotation.y = angle;
      tie.position.copy(tiePos);
      tie.position.y = 0.1;
      tie.castShadow = true;
      tie.receiveShadow = true;
      this.mesh.add(tie);
    }

    // Create rails (two parallel metal rails)
    const railGeometry = new THREE.BoxGeometry(0.1, 0.15, this.length);
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x708090, // Steel gray
      roughness: 0.3,
      metalness: 0.8,
    });

    // Left rail
    const leftRail = new THREE.Mesh(railGeometry, railMaterial);
    const leftOffset = new THREE.Vector3(-this.direction.z, 0, this.direction.x).multiplyScalar(0.75);
    leftRail.position.copy(this.start).add(this.end).multiplyScalar(0.5).add(leftOffset);
    leftRail.position.y = 0.2;
    // Rotate rail to match track direction
    const angle = Math.atan2(this.direction.x, this.direction.z);
    leftRail.rotation.y = angle;
    leftRail.castShadow = true;
    leftRail.receiveShadow = true;
    this.mesh.add(leftRail);

    // Right rail
    const rightRail = new THREE.Mesh(railGeometry, railMaterial.clone());
    const rightOffset = new THREE.Vector3(this.direction.z, 0, -this.direction.x).multiplyScalar(0.75);
    rightRail.position.copy(this.start).add(this.end).multiplyScalar(0.5).add(rightOffset);
    rightRail.position.y = 0.2;
    rightRail.rotation.y = angle;
    rightRail.castShadow = true;
    rightRail.receiveShadow = true;
    this.mesh.add(rightRail);

    // Calculate bounds for collision/platform detection
    const minX = Math.min(this.start.x, this.end.x) - 1;
    const maxX = Math.max(this.start.x, this.end.x) + 1;
    const minZ = Math.min(this.start.z, this.end.z) - 1;
    const maxZ = Math.max(this.start.z, this.end.z) + 1;

    this.bounds = {
      min: new THREE.Vector3(minX, 0, minZ),
      max: new THREE.Vector3(maxX, 0.5, maxZ),
    };

    this.engine.scene.add(this.mesh);
  }

  getBounds(): Bounds {
    return this.bounds;
  }

  getStart(): THREE.Vector3 {
    return this.start.clone();
  }

  getEnd(): THREE.Vector3 {
    return this.end.clone();
  }

  getLength(): number {
    return this.length;
  }

  getDirection(): THREE.Vector3 {
    return this.direction.clone();
  }

  getPositionAt(t: number): THREE.Vector3 {
    // t is 0 to 1, returns position along track
    return new THREE.Vector3().lerpVectors(this.start, this.end, t);
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }
}
