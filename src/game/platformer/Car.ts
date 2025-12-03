/**
 * AI-EDITABLE: Car Controller
 *
 * This file contains the car logic including movement,
 * rotation, and physics.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';

export class Car {
  private engine: Engine;
  private mesh: THREE.Group;
  
  // Car state
  private position: THREE.Vector3;
  private rotation: number = 0;
  private speed: number = 0;
  private maxSpeed: number = 0.3;
  private acceleration: number = 0.01;
  private deceleration: number = 0.02;
  private turnSpeed: number = 0.03;
  private onGround: boolean = false;

  constructor(engine: Engine, position: THREE.Vector3 = new THREE.Vector3(0, 1, 0)) {
    this.engine = engine;
    this.position = position.clone();

    // Create car group
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Car body (main chassis)
    const bodyGeometry = new THREE.BoxGeometry(2, 0.6, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000, // Red car
      roughness: 0.3,
      metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.3;
    body.castShadow = true;
    this.mesh.add(body);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.6, 0.5, 1.5);
    const roofMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcc0000,
      roughness: 0.3,
      metalness: 0.7
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 0.85;
    roof.position.z = -0.3;
    roof.castShadow = true;
    this.mesh.add(roof);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      roughness: 0.8
    });

    // Front left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.rotation.z = Math.PI / 2;
    wheelFL.position.set(-1.1, 0.2, 1.3);
    wheelFL.castShadow = true;
    this.mesh.add(wheelFL);

    // Front right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.rotation.z = Math.PI / 2;
    wheelFR.position.set(1.1, 0.2, 1.3);
    wheelFR.castShadow = true;
    this.mesh.add(wheelFR);

    // Rear left wheel
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRL.rotation.z = Math.PI / 2;
    wheelRL.position.set(-1.1, 0.2, -1.3);
    wheelRL.castShadow = true;
    this.mesh.add(wheelRL);

    // Rear right wheel
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRR.rotation.z = Math.PI / 2;
    wheelRR.position.set(1.1, 0.2, -1.3);
    wheelRR.castShadow = true;
    this.mesh.add(wheelRR);

    // Windshield
    const windshieldGeometry = new THREE.BoxGeometry(1.5, 0.4, 0.1);
    const windshieldMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x88ccff,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.set(0, 0.75, 0.2);
    this.mesh.add(windshield);

    console.log('[Car] Created');
  }

  update(deltaTime: number, platforms: Platform[]): void {
    this.handleInput();
    this.applyPhysics();
    this.checkCollisions(platforms);
    this.updateMesh();
  }

  private handleInput(): void {
    const input = this.engine.input;
    const mobileInput = this.engine.mobileInput;
    const isMobile = mobileInput.isMobileControlsActive();

    let forward = false;
    let backward = false;
    let turnLeft = false;
    let turnRight = false;

    // Get input (keyboard or mobile)
    if (isMobile) {
      const joystick = mobileInput.getJoystickVector();
      forward = joystick.y < -0.3;
      backward = joystick.y > 0.3;
      turnLeft = joystick.x < -0.3;
      turnRight = joystick.x > 0.3;
    } else {
      // Keyboard input - use arrow keys for car (WASD is for player)
      forward = input.isKeyPressed('ArrowUp');
      backward = input.isKeyPressed('ArrowDown');
      turnLeft = input.isKeyPressed('ArrowLeft');
      turnRight = input.isKeyPressed('ArrowRight');
    }

    // Accelerate/Decelerate
    if (forward) {
      this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
    } else if (backward) {
      this.speed = Math.max(this.speed - this.acceleration, -this.maxSpeed * 0.7);
    } else {
      // Decelerate when no input
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.deceleration);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.deceleration);
      }
    }

    // Turn (only when moving)
    if (Math.abs(this.speed) > 0.01) {
      if (turnLeft) {
        this.rotation -= this.turnSpeed * Math.abs(this.speed) / this.maxSpeed;
      }
      if (turnRight) {
        this.rotation += this.turnSpeed * Math.abs(this.speed) / this.maxSpeed;
      }
    }
  }

  private applyPhysics(): void {
    // Move car forward/backward based on rotation
    if (Math.abs(this.speed) > 0.01) {
      this.position.x += Math.sin(this.rotation) * this.speed;
      this.position.z += Math.cos(this.rotation) * this.speed;
    }

    // Keep car on ground level
    this.position.y = 1.0;

    // Reset if fallen off the world
    if (this.position.y < -10) {
      this.position.set(0, 1, 0);
      this.speed = 0;
    }
  }

  private checkCollisions(platforms: Platform[]): void {
    this.onGround = false;
    const carRadius = 2; // Approximate collision radius

    for (const platform of platforms) {
      const bounds = platform.getBounds();
      const carBottom = this.position.y - 0.5;

      // Check horizontal overlap
      if (
        this.position.x + carRadius > bounds.min.x &&
        this.position.x - carRadius < bounds.max.x &&
        this.position.z + carRadius > bounds.min.z &&
        this.position.z - carRadius < bounds.max.z
      ) {
        // Check if car is on platform
        if (
          carBottom <= bounds.max.y + 0.5 &&
          carBottom >= bounds.min.y - 0.5
        ) {
          this.position.y = bounds.max.y + 1.0;
          this.onGround = true;
        }
      }
    }

    // If not on any platform, keep on ground level
    if (!this.onGround) {
      this.position.y = 1.0;
    }
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRotation(): number {
    return this.rotation;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    
    // Dispose all meshes in the group
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    console.log('[Car] Disposed');
  }
}
