/**
 * AI-EDITABLE: Train Component
 *
 * This file defines a train that moves along railroad tracks.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Railroad } from './Railroad';

interface TrainConfig {
  railroad: Railroad;
  speed?: number;
  startPosition?: number; // Normalized position along track (0-1)
}

export class Train {
  private engine: Engine;
  private railroad: Railroad;
  private group: THREE.Group;
  private speed: number;
  private position: number; // Normalized position along track (0-1)
  private direction: number = 1; // 1 for forward, -1 for backward

  // Train parts
  private locomotive: THREE.Group;
  private cars: THREE.Group[] = [];

  constructor(engine: Engine, config: TrainConfig) {
    this.engine = engine;
    this.railroad = config.railroad;
    this.speed = config.speed ?? 0.3; // Speed in normalized units per second
    this.position = config.startPosition ?? 0;

    // Create train group
    this.group = new THREE.Group();
    engine.scene.add(this.group);

    // Create locomotive
    this.locomotive = this.createLocomotive();
    this.group.add(this.locomotive);

    // Create a few train cars
    for (let i = 0; i < 2; i++) {
      const car = this.createTrainCar();
      this.cars.push(car);
      this.group.add(car);
    }

    // Update initial position
    this.updatePosition();

    console.log('[Train] Created train on railroad');
  }

  private createLocomotive(): THREE.Group {
    const group = new THREE.Group();

    // Main body (rectangular)
    const bodyGeometry = new THREE.BoxGeometry(2, 1.5, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000, // Red locomotive
      roughness: 0.5,
      metalness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabin (smaller box on top)
    const cabinGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333, // Dark gray cabin
      roughness: 0.6,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.75, -0.5);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Chimney (cylinder)
    const chimneyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    const chimneyMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.7,
    });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(0, 2.4, 0.5);
    chimney.castShadow = true;
    group.add(chimney);

    // Wheels (4 wheels)
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.9,
    });

    const wheelPositions = [
      { x: -0.7, z: -0.8 },
      { x: 0.7, z: -0.8 },
      { x: -0.7, z: 0.8 },
      { x: 0.7, z: 0.8 },
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.4, pos.z);
      wheel.castShadow = true;
      group.add(wheel);
    });

    return group;
  }

  private createTrainCar(): THREE.Group {
    const group = new THREE.Group();

    // Car body (rectangular box)
    const bodyGeometry = new THREE.BoxGeometry(1.8, 1.2, 2.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4169e1, // Royal blue
      roughness: 0.5,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Wheels (4 wheels)
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.9,
    });

    const wheelPositions = [
      { x: -0.6, z: -0.7 },
      { x: 0.6, z: -0.7 },
      { x: -0.6, z: 0.7 },
      { x: 0.6, z: 0.7 },
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.35, pos.z);
      wheel.castShadow = true;
      group.add(wheel);
    });

    return group;
  }

  update(deltaTime: number): void {
    // Move train along track
    this.position += this.speed * this.direction * deltaTime;

    // Reverse direction at ends
    if (this.position >= 1) {
      this.position = 1;
      this.direction = -1;
    } else if (this.position <= 0) {
      this.position = 0;
      this.direction = 1;
    }

    this.updatePosition();
  }

  private updatePosition(): void {
    // Get position along track
    const trackPosition = this.railroad.getPositionAt(this.position);
    const trackDirection = this.railroad.getDirection();

    // Set train position
    this.group.position.copy(trackPosition);
    this.group.position.y += 0.5; // Height above tracks

    // Rotate train to face track direction
    this.group.rotation.y = Math.atan2(trackDirection.x, trackDirection.z);

    // Position cars behind locomotive
    const carSpacing = 3.5;
    const carOffset = new THREE.Vector3(0, 0, -carSpacing);
    carOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y);

    this.cars.forEach((car, index) => {
      const offset = carOffset.clone().multiplyScalar(index + 1);
      car.position.copy(offset);
    });
  }

  /**
   * Get the train's current world position
   */
  getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }

  /**
   * Get the train's bounding box for collision detection
   */
  getBounds(): { min: THREE.Vector3; max: THREE.Vector3 } {
    const box = new THREE.Box3().setFromObject(this.group);
    return {
      min: box.min.clone(),
      max: box.max.clone(),
    };
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
    
    console.log('[Train] Disposed');
  }
}
