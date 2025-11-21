/**
 * AI-EDITABLE: Railway Component
 *
 * This file defines railway tracks and a moving train.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class Railway {
  private engine: Engine;
  private tracks: THREE.Group;
  private train: THREE.Group | null = null;
  private trainWheels: THREE.Mesh[] = [];
  private trainSpeed: number = 0.05;
  private trainPosition: number = 0;
  private trackLength: number = 100;
  private trackStart: THREE.Vector3;
  private trackEnd: THREE.Vector3;
  private trackDirection: THREE.Vector3;

  constructor(
    engine: Engine,
    start: THREE.Vector3,
    end: THREE.Vector3
  ) {
    this.engine = engine;
    this.trackStart = start;
    this.trackEnd = end;
    this.trackDirection = new THREE.Vector3().subVectors(end, start).normalize();
    this.trackLength = start.distanceTo(end);

    // Create tracks group
    this.tracks = new THREE.Group();
    this.createTracks();
    this.createTrain();
    engine.scene.add(this.tracks);
  }

  private createTracks(): void {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    
    // Create railway ties (sleepers) along the track
    const tieSpacing = 2;
    const numTies = Math.floor(this.trackLength / tieSpacing);
    
    for (let i = 0; i <= numTies; i++) {
      const t = i / numTies;
      const tiePosition = new THREE.Vector3().lerpVectors(this.trackStart, this.trackEnd, t);
      
      // Create wooden tie
      const tieGeometry = new THREE.BoxGeometry(2, 0.2, 0.3);
      const tieMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown wood
        roughness: 0.8,
      });
      const tie = new THREE.Mesh(tieGeometry, tieMaterial);
      tie.position.copy(tiePosition);
      tie.position.y = 0.1;
      tie.rotation.y = Math.atan2(this.trackDirection.x, this.trackDirection.z);
      tie.castShadow = !isMobile;
      tie.receiveShadow = !isMobile;
      this.tracks.add(tie);
    }

    // Create two parallel rails
    const railGeometry = new THREE.BoxGeometry(0.1, 0.1, this.trackLength);
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080, // Gray metal
      metalness: 0.8,
      roughness: 0.2,
    });

    // Left rail
    const leftRail = new THREE.Mesh(railGeometry, railMaterial);
    leftRail.position.copy(this.trackStart).lerp(this.trackEnd, 0.5);
    leftRail.position.y = 0.25;
    leftRail.position.x -= 0.5 * Math.cos(Math.atan2(this.trackDirection.x, this.trackDirection.z));
    leftRail.position.z -= 0.5 * Math.sin(Math.atan2(this.trackDirection.x, this.trackDirection.z));
    leftRail.rotation.y = Math.atan2(this.trackDirection.x, this.trackDirection.z);
    leftRail.castShadow = !isMobile;
    this.tracks.add(leftRail);

    // Right rail
    const rightRail = new THREE.Mesh(railGeometry, railMaterial);
    rightRail.position.copy(this.trackStart).lerp(this.trackEnd, 0.5);
    rightRail.position.y = 0.25;
    rightRail.position.x += 0.5 * Math.cos(Math.atan2(this.trackDirection.x, this.trackDirection.z));
    rightRail.position.z += 0.5 * Math.sin(Math.atan2(this.trackDirection.x, this.trackDirection.z));
    rightRail.rotation.y = Math.atan2(this.trackDirection.x, this.trackDirection.z);
    rightRail.castShadow = !isMobile;
    this.tracks.add(rightRail);
  }

  private createTrain(): void {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    this.train = new THREE.Group();

    // Train body (main locomotive)
    const bodyGeometry = new THREE.BoxGeometry(3, 2, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000, // Red train
      roughness: 0.6,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = !isMobile;
    this.train.add(body);

    // Train cabin (smaller box on top)
    const cabinGeometry = new THREE.BoxGeometry(2, 1.5, 2);
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc0000,
      roughness: 0.6,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 2.75, -0.5);
    cabin.castShadow = !isMobile;
    this.train.add(cabin);

    // Windows
    const windowGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb, // Sky blue
      roughness: 0.1,
      metalness: 0.3,
    });
    
    const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow.position.set(-0.6, 2.75, -1.4);
    this.train.add(leftWindow);
    
    const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightWindow.position.set(0.6, 2.75, -1.4);
    this.train.add(rightWindow);

    // Chimney
    const chimneyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    const chimneyMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333, // Dark gray
      roughness: 0.7,
    });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(0, 3.5, 0.5);
    chimney.castShadow = !isMobile;
    this.train.add(chimney);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000, // Black
      roughness: 0.5,
      metalness: 0.5,
    });

    const wheelPositions = [
      { x: -0.6, z: -1.2 },
      { x: 0.6, z: -1.2 },
      { x: -0.6, z: 0 },
      { x: 0.6, z: 0 },
      { x: -0.6, z: 1.2 },
      { x: 0.6, z: 1.2 },
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.4, pos.z);
      wheel.castShadow = !isMobile;
      this.train.add(wheel);
      this.trainWheels.push(wheel);
    });

    // Initial position
    this.train.position.copy(this.trackStart);
    this.train.rotation.y = Math.atan2(this.trackDirection.x, this.trackDirection.z);
    this.tracks.add(this.train);
  }

  update(deltaTime: number): void {
    if (!this.train) return;

    // Move train along the track
    this.trainPosition += this.trainSpeed * deltaTime * 60; // Normalize for 60fps

    // Loop the train back to start when it reaches the end
    if (this.trainPosition >= this.trackLength) {
      this.trainPosition = 0;
    }

    // Calculate position along track
    const t = this.trainPosition / this.trackLength;
    const trainWorldPos = new THREE.Vector3().lerpVectors(this.trackStart, this.trackEnd, t);
    
    // Update train position
    this.train.position.copy(trainWorldPos);
    
    // Rotate wheels
    this.trainWheels.forEach((wheel) => {
      wheel.rotation.x += this.trainSpeed * deltaTime * 60 * 2;
    });
  }

  dispose(): void {
    if (this.train) {
      this.tracks.remove(this.train);
      this.train.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      this.train = null;
    }

    this.tracks.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });

    this.engine.scene.remove(this.tracks);
  }
}
