/**
 * AI-EDITABLE: Mexican Train Component
 *
 * This file defines a train for the Mexican railroad system.
 * Inspired by the colorful trains used in Mexico.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Railway } from './Railway';

interface TrainConfig {
  railway: Railway;
  speed?: number;
  color?: number;
}

export class Train {
  private engine: Engine;
  private railway: Railway;
  private mesh: THREE.Group;
  private position: number = 0; // 0 to 1 along the railway
  private speed: number;
  private direction: number = 1; // 1 for forward, -1 for backward

  // Mexican train colors (vibrant colors typical of Mexican trains)
  private static readonly TRAIN_COLORS = [
    0xff0000, // Red
    0x00ff00, // Green
    0x0000ff, // Blue
    0xffff00, // Yellow
    0xff00ff, // Magenta
  ];

  constructor(engine: Engine, config: TrainConfig) {
    this.engine = engine;
    this.railway = config.railway;
    this.speed = config.speed ?? 0.3; // Speed along the track (0-1 per second)

    // Create train group
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Create locomotive
    this.createLocomotive(config.color);

    // Create train cars (2-3 cars)
    const numCars = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numCars; i++) {
      this.createTrainCar(i, config.color);
    }

    // Start at random position along the track
    this.position = Math.random();

    console.log('[Train] Created Mexican train on railway');
  }

  private createLocomotive(color?: number): void {
    const locoColor = color ?? Train.TRAIN_COLORS[Math.floor(Math.random() * Train.TRAIN_COLORS.length)];

    // Main locomotive body
    const bodyGeometry = new THREE.BoxGeometry(2, 1.5, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: locoColor,
      roughness: 0.6,
      metalness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);

    // Locomotive cabin
    const cabinGeometry = new THREE.BoxGeometry(1.5, 1.2, 1.5);
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: locoColor * 0.8, // Slightly darker
      roughness: 0.6,
      metalness: 0.3,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.5, -0.5);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    this.mesh.add(cabin);

    // Windows
    const windowGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb, // Sky blue for windows
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.7,
    });

    // Left window
    const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow.position.set(-0.5, 1.5, -0.75);
    this.mesh.add(leftWindow);

    // Right window
    const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightWindow.position.set(0.5, 1.5, -0.75);
    this.mesh.add(rightWindow);

    // Chimney/Stack
    const stackGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8);
    const stackMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333, // Dark gray/black
      roughness: 0.8,
      metalness: 0.2,
    });
    const stack = new THREE.Mesh(stackGeometry, stackMaterial);
    stack.position.set(0, 2.2, 0.5);
    stack.castShadow = true;
    stack.receiveShadow = true;
    this.mesh.add(stack);

    // Wheels
    this.createWheels(0, locoColor);
  }

  private createTrainCar(carIndex: number, color?: number): void {
    const carColor = color ?? Train.TRAIN_COLORS[Math.floor(Math.random() * Train.TRAIN_COLORS.length)];
    const carOffset = (carIndex + 1) * 3.5; // Space between cars

    // Car body
    const carGeometry = new THREE.BoxGeometry(1.8, 1.2, 3);
    const carMaterial = new THREE.MeshStandardMaterial({
      color: carColor,
      roughness: 0.6,
      metalness: 0.3,
    });
    const car = new THREE.Mesh(carGeometry, carMaterial);
    car.position.set(0, 0.6, -carOffset);
    car.castShadow = true;
    car.receiveShadow = true;
    this.mesh.add(car);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.8, 0.2, 3);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: carColor * 0.7,
      roughness: 0.6,
      metalness: 0.3,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 1.3, -carOffset);
    roof.castShadow = true;
    roof.receiveShadow = true;
    this.mesh.add(roof);

    // Wheels for this car
    this.createWheels(-carOffset, carColor);
  }

  private createWheels(offsetZ: number, color: number): void {
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Dark wheels
      roughness: 0.4,
      metalness: 0.8,
    });

    // Left wheels
    const leftWheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    leftWheel1.rotation.z = Math.PI / 2;
    leftWheel1.position.set(-0.8, 0.3, offsetZ - 1);
    leftWheel1.castShadow = true;
    this.mesh.add(leftWheel1);

    const leftWheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    leftWheel2.rotation.z = Math.PI / 2;
    leftWheel2.position.set(-0.8, 0.3, offsetZ + 1);
    leftWheel2.castShadow = true;
    this.mesh.add(leftWheel2);

    // Right wheels
    const rightWheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rightWheel1.rotation.z = Math.PI / 2;
    rightWheel1.position.set(0.8, 0.3, offsetZ - 1);
    rightWheel1.castShadow = true;
    this.mesh.add(rightWheel1);

    const rightWheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rightWheel2.rotation.z = Math.PI / 2;
    rightWheel2.position.set(0.8, 0.3, offsetZ + 1);
    rightWheel2.castShadow = true;
    this.mesh.add(rightWheel2);
  }

  update(deltaTime: number): void {
    // Move along the railway
    const trackSpeed = this.speed * deltaTime;
    this.position += trackSpeed * this.direction;

    // Reverse direction at ends
    if (this.position >= 1) {
      this.position = 1;
      this.direction = -1;
    } else if (this.position <= 0) {
      this.position = 0;
      this.direction = 1;
    }

    // Update position along railway
    const trackPosition = this.railway.getPositionAt(this.position);
    const trackDirection = this.railway.getDirection();
    
    // Calculate rotation to align with track
    const angle = Math.atan2(trackDirection.x, trackDirection.z);
    
    this.mesh.position.copy(trackPosition);
    this.mesh.position.y = 0.3; // Height above tracks
    this.mesh.rotation.y = angle;

    // Rotate wheels
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry) {
        // Rotate wheels based on movement
        child.rotation.x += trackSpeed * this.direction * 10;
      }
    });
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  getBounds(): { min: THREE.Vector3; max: THREE.Vector3 } {
    const box = new THREE.Box3().setFromObject(this.mesh);
    return {
      min: box.min,
      max: box.max,
    };
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    const trainPos = this.getPosition();
    const distance = trainPos.distanceTo(playerPosition);
    const collisionDistance = playerRadius + 1.5; // Train width/2 + player radius
    
    return distance < collisionDistance;
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
    
    console.log('[Train] Disposed');
  }
}
