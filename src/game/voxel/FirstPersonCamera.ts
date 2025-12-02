/**
 * First-person camera controller for voxel game.
 * Handles movement (WASD + Space/Shift) and mouse look.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class FirstPersonCamera {
  private engine: Engine;
  private position: THREE.Vector3;
  private euler: THREE.Euler;
  private velocity: THREE.Vector3;
  private moveSpeed: number = 8;
  private jumpSpeed: number = 8;
  private gravity: number = -20;
  private isOnGround: boolean = false;
  private groundCheckDistance: number = 0.5;

  constructor(engine: Engine) {
    this.engine = engine;
    this.position = new THREE.Vector3(0, 10, 0);
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3(0, 0, 0);
    
    // Set initial camera rotation
    this.updateCamera();
  }

  setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
    this.updateCamera();
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  private updateCamera(): void {
    // Update camera position
    this.engine.camera.position.copy(this.position);
    
    // Update camera rotation from euler angles
    this.engine.camera.rotation.set(this.euler.x, this.euler.y, this.euler.z, 'YXZ');
  }

  update(deltaTime: number): void {
    if (!this.engine.input.isPointerLocked()) {
      return;
    }

    // Handle mouse look
    const mouseDelta = this.engine.input.getMouseDelta();
    const sensitivity = 0.002;
    
    this.euler.setFromQuaternion(this.engine.camera.quaternion);
    this.euler.y -= mouseDelta.x * sensitivity;
    this.euler.x -= mouseDelta.y * sensitivity;
    
    // Clamp vertical rotation
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

    // Handle keyboard movement
    const moveDirection = new THREE.Vector3();
    
    if (this.engine.input.isKeyPressed('KeyW')) {
      moveDirection.z -= 1;
    }
    if (this.engine.input.isKeyPressed('KeyS')) {
      moveDirection.z += 1;
    }
    if (this.engine.input.isKeyPressed('KeyA')) {
      moveDirection.x -= 1;
    }
    if (this.engine.input.isKeyPressed('KeyD')) {
      moveDirection.x += 1;
    }

    // Normalize movement direction
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      
      // Transform movement direction based on camera rotation
      const forward = new THREE.Vector3(0, 0, -1);
      const right = new THREE.Vector3(1, 0, 0);
      
      forward.applyEuler(new THREE.Euler(0, this.euler.y, 0));
      right.applyEuler(new THREE.Euler(0, this.euler.y, 0));
      
      const worldMoveDirection = new THREE.Vector3();
      worldMoveDirection.addScaledVector(forward, -moveDirection.z);
      worldMoveDirection.addScaledVector(right, moveDirection.x);
      worldMoveDirection.y = 0; // Keep movement horizontal
      worldMoveDirection.normalize();
      
      // Apply movement
      this.velocity.x = worldMoveDirection.x * this.moveSpeed;
      this.velocity.z = worldMoveDirection.z * this.moveSpeed;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // Handle jumping
    if (this.engine.input.isKeyPressed('Space') && this.isOnGround) {
      this.velocity.y = this.jumpSpeed;
      this.isOnGround = false;
    }

    // Apply gravity
    this.velocity.y += this.gravity * deltaTime;

    // Simple ground check (can be improved with proper collision)
    if (this.position.y <= 0.5) {
      this.position.y = 0.5;
      this.velocity.y = 0;
      this.isOnGround = true;
    } else {
      this.isOnGround = false;
    }

    // Update position
    this.position.addScaledVector(this.velocity, deltaTime);

    // Update camera
    this.updateCamera();
  }
}
