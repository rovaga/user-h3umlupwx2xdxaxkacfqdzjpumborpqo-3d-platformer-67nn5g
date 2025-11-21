/**
 * AI-EDITABLE: Railway Tracks Component
 *
 * This file defines railway tracks for the Mexican railroad system.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

interface RailwayConfig {
  start: THREE.Vector3;
  end: THREE.Vector3;
  width?: number;
}

export class Railway {
  private engine: Engine;
  private mesh: THREE.Group;
  private start: THREE.Vector3;
  private end: THREE.Vector3;
  private direction: THREE.Vector3;
  private length: number;
  private width: number;

  constructor(engine: Engine, config: RailwayConfig) {
    this.engine = engine;
    this.start = config.start.clone();
    this.end = config.end.clone();
    this.width = config.width ?? 2;
    
    this.direction = new THREE.Vector3().subVectors(this.end, this.start);
    this.length = this.direction.length();
    this.direction.normalize();

    // Create railway group
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Create tracks
    this.createTracks();

    console.log('[Railway] Created railway from', this.start, 'to', this.end);
  }

  private createTracks(): void {
    const trackSpacing = 1.435; // Standard gauge in meters (scaled down)
    const tieSpacing = 0.5;
    const numTies = Math.floor(this.length / tieSpacing) + 1;

    // Create wooden ties
    for (let i = 0; i < numTies; i++) {
      const t = i / (numTies - 1);
      const tiePosition = new THREE.Vector3().lerpVectors(this.start, this.end, t);
      
      // Rotate tie to be perpendicular to track direction
      const tieGeometry = new THREE.BoxGeometry(this.width, 0.1, 0.2);
      const tieMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown wood color
        roughness: 0.8,
      });
      const tie = new THREE.Mesh(tieGeometry, tieMaterial);
      
      // Calculate rotation to align with track direction
      const angle = Math.atan2(this.direction.x, this.direction.z);
      tie.rotation.y = angle + Math.PI / 2;
      tie.position.copy(tiePosition);
      tie.position.y = -0.45; // Slightly below ground level
      tie.castShadow = true;
      tie.receiveShadow = true;
      
      this.mesh.add(tie);
    }

    // Create left rail
    const leftRailGeometry = new THREE.BoxGeometry(0.1, 0.15, this.length);
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x708090, // Steel gray
      roughness: 0.3,
      metalness: 0.8,
    });
    
    const leftRail = new THREE.Mesh(leftRailGeometry, railMaterial);
    const leftOffset = new THREE.Vector3(-this.direction.z, 0, this.direction.x).multiplyScalar(trackSpacing / 2);
    leftRail.position.copy(new THREE.Vector3().addVectors(this.start, this.end).multiplyScalar(0.5));
    leftRail.position.add(leftOffset);
    leftRail.position.y = -0.35;
    
    // Rotate rail to align with track direction
    const angle = Math.atan2(this.direction.x, this.direction.z);
    leftRail.rotation.y = angle;
    leftRail.castShadow = true;
    leftRail.receiveShadow = true;
    
    this.mesh.add(leftRail);

    // Create right rail
    const rightRail = new THREE.Mesh(leftRailGeometry.clone(), railMaterial.clone());
    const rightOffset = new THREE.Vector3(this.direction.z, 0, -this.direction.x).multiplyScalar(trackSpacing / 2);
    rightRail.position.copy(new THREE.Vector3().addVectors(this.start, this.end).multiplyScalar(0.5));
    rightRail.position.add(rightOffset);
    rightRail.position.y = -0.35;
    rightRail.rotation.y = angle;
    rightRail.castShadow = true;
    rightRail.receiveShadow = true;
    
    this.mesh.add(rightRail);
  }

  getStart(): THREE.Vector3 {
    return this.start.clone();
  }

  getEnd(): THREE.Vector3 {
    return this.end.clone();
  }

  getDirection(): THREE.Vector3 {
    return this.direction.clone();
  }

  getLength(): number {
    return this.length;
  }

  getPositionAt(t: number): THREE.Vector3 {
    // t is 0 to 1 along the track
    const position = new THREE.Vector3().lerpVectors(this.start, this.end, t);
    return position;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    
    // Dispose all children
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    
    console.log('[Railway] Disposed');
  }
}
