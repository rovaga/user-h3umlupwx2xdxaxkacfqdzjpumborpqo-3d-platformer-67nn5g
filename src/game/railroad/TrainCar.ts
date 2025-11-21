/**
 * AI-EDITABLE: Train Car Component
 *
 * This file defines a train car that moves along railroad tracks.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { RailroadTrack } from './RailroadTrack';

export class TrainCar {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private tracks: RailroadTrack[];
  private currentTrackIndex: number = 0;
  private trackProgress: number = 0; // 0 to 1 along the current track
  private speed: number = 0.01;

  constructor(engine: Engine, tracks: RailroadTrack | RailroadTrack[], startProgress: number = 0) {
    this.engine = engine;
    this.tracks = Array.isArray(tracks) ? tracks : [tracks];
    this.currentTrackIndex = 0;
    this.trackProgress = startProgress;
    this.position = this.tracks[0].getPositionAt(startProgress);

    // Create train car group
    this.mesh = new THREE.Group();

    // Main car body (colorful Mexican-style train car)
    const bodyGeometry = new THREE.BoxGeometry(3, 2, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6347, // Tomato red - Mexican colors
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);

    // Decorative stripes (green and white - Mexican flag colors)
    const stripeGeometry = new THREE.BoxGeometry(3.1, 0.3, 4.1);
    const greenStripe = new THREE.Mesh(
      stripeGeometry,
      new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.7 })
    );
    greenStripe.position.set(0, 2.2, 0);
    this.mesh.add(greenStripe);

    const whiteStripe = new THREE.Mesh(
      stripeGeometry,
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
    );
    whiteStripe.position.set(0, 1.5, 0);
    this.mesh.add(whiteStripe);

    const redStripe = new THREE.Mesh(
      stripeGeometry,
      new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.7 })
    );
    redStripe.position.set(0, 0.8, 0);
    this.mesh.add(redStripe);

    // Windows
    const windowGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb, // Sky blue
      roughness: 0.2,
      metalness: 0.3,
    });

    // Left side windows
    const leftWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow1.position.set(-1.2, 1.8, 2.05);
    this.mesh.add(leftWindow1);

    const leftWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow2.position.set(1.2, 1.8, 2.05);
    this.mesh.add(leftWindow2);

    // Right side windows
    const rightWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
    rightWindow1.position.set(-1.2, 1.8, -2.05);
    this.mesh.add(rightWindow1);

    const rightWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
    rightWindow2.position.set(1.2, 1.8, -2.05);
    this.mesh.add(rightWindow2);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f2f2f, // Dark gray/black
      roughness: 0.5,
      metalness: 0.7,
    });

    // Front wheels
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.rotation.z = Math.PI / 2;
    frontLeftWheel.position.set(-1.2, 0.4, 1.5);
    this.mesh.add(frontLeftWheel);

    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.rotation.z = Math.PI / 2;
    frontRightWheel.position.set(1.2, 0.4, 1.5);
    this.mesh.add(frontRightWheel);

    // Back wheels
    const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backLeftWheel.rotation.z = Math.PI / 2;
    backLeftWheel.position.set(-1.2, 0.4, -1.5);
    this.mesh.add(backLeftWheel);

    const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backRightWheel.rotation.z = Math.PI / 2;
    backRightWheel.position.set(1.2, 0.4, -1.5);
    this.mesh.add(backRightWheel);

    // Position the train car
    this.updatePosition();

    this.engine.scene.add(this.mesh);
    console.log('[TrainCar] Created');
  }

  update(deltaTime: number): void {
    // Move along track
    this.trackProgress += this.speed;
    
    // Switch to next track if we reach the end
    while (this.trackProgress >= 1.0 && this.tracks.length > 1) {
      this.trackProgress -= 1.0;
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    }
    
    // Loop around if single track
    if (this.trackProgress >= 1.0) {
      this.trackProgress = 0;
    }

    this.updatePosition();
  }

  private updatePosition(): void {
    const currentTrack = this.tracks[this.currentTrackIndex];
    
    // Get position along track
    this.position = currentTrack.getPositionAt(this.trackProgress);
    
    // Get direction and rotate train car to face track direction
    const direction = currentTrack.getDirection();
    const angle = Math.atan2(direction.x, direction.z);
    
    // Update mesh position and rotation
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 0.4; // Slightly above tracks
    this.mesh.rotation.y = angle;
  }

  getCurrentTrack(): RailroadTrack {
    return this.tracks[this.currentTrackIndex];
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getBounds(): { min: THREE.Vector3; max: THREE.Vector3 } {
    const size = new THREE.Vector3(3, 2, 4);
    return {
      min: new THREE.Vector3(
        this.position.x - size.x / 2,
        this.position.y,
        this.position.z - size.z / 2
      ),
      max: new THREE.Vector3(
        this.position.x + size.x / 2,
        this.position.y + size.y,
        this.position.z + size.z / 2
      ),
    };
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
