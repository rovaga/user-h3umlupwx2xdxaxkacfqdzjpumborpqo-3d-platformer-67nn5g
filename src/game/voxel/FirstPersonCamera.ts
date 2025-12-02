/**
 * First-person camera controller for voxel game.
 * Handles movement (WASD + Space/Shift) and mouse look.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { VoxelWorld } from './VoxelWorld';

export class FirstPersonCamera {
  private engine: Engine;
  private voxelWorld: VoxelWorld | null = null;
  private position: THREE.Vector3;
  private euler: THREE.Euler;
  private velocity: THREE.Vector3;
  private moveSpeed: number = 8;
  private jumpSpeed: number = 8;
  private gravity: number = -20;
  private isOnGround: boolean = false;
  private groundCheckDistance: number = 0.5;
  
  // Player collision box dimensions
  private playerWidth: number = 0.6;  // Half-width (radius)
  private playerHeight: number = 1.8;  // Full height
  private playerEyeHeight: number = 1.6; // Eye level from feet

  constructor(engine: Engine) {
    this.engine = engine;
    this.position = new THREE.Vector3(0, 10, 0);
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3(0, 0, 0);
    
    // Set initial camera rotation
    this.updateCamera();
  }

  setVoxelWorld(voxelWorld: VoxelWorld): void {
    this.voxelWorld = voxelWorld;
  }

  setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
    this.updateCamera();
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  private updateCamera(): void {
    // Update camera position (eye level)
    const eyePosition = this.position.clone();
    eyePosition.y += this.playerEyeHeight;
    this.engine.camera.position.copy(eyePosition);
    
    // Update camera rotation from euler angles
    this.engine.camera.rotation.set(this.euler.x, this.euler.y, this.euler.z, 'YXZ');
  }

  /**
   * Check if a block exists at the given world coordinates
   */
  private hasBlock(x: number, y: number, z: number): boolean {
    if (!this.voxelWorld) {
      return false;
    }
    return this.voxelWorld.getBlock(x, y, z) !== undefined;
  }

  /**
   * Check if the player's bounding box intersects with any blocks at the given position
   */
  private checkCollision(pos: THREE.Vector3): boolean {
    if (!this.voxelWorld) {
      return false;
    }

    // Calculate the bounding box corners
    const minX = Math.floor(pos.x - this.playerWidth);
    const maxX = Math.floor(pos.x + this.playerWidth);
    const minY = Math.floor(pos.y);
    const maxY = Math.floor(pos.y + this.playerHeight);
    const minZ = Math.floor(pos.z - this.playerWidth);
    const maxZ = Math.floor(pos.z + this.playerWidth);

    // Check all blocks that could intersect with the player's bounding box
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.hasBlock(x, y, z)) {
            // Check if this block actually intersects with the player's bounding box
            const blockMinX = x;
            const blockMaxX = x + 1;
            const blockMinY = y;
            const blockMaxY = y + 1;
            const blockMinZ = z;
            const blockMaxZ = z + 1;

            const playerMinX = pos.x - this.playerWidth;
            const playerMaxX = pos.x + this.playerWidth;
            const playerMinY = pos.y;
            const playerMaxY = pos.y + this.playerHeight;
            const playerMinZ = pos.z - this.playerWidth;
            const playerMaxZ = pos.z + this.playerWidth;

            // AABB collision detection
            if (playerMinX < blockMaxX && playerMaxX > blockMinX &&
                playerMinY < blockMaxY && playerMaxY > blockMinY &&
                playerMinZ < blockMaxZ && playerMaxZ > blockMinZ) {
              return true; // Collision detected
            }
          }
        }
      }
    }

    return false; // No collision
  }

  /**
   * Find the closest non-colliding position along an axis using binary search
   */
  private resolveAxisCollision(
    startPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    axis: 'x' | 'y' | 'z'
  ): number {
    // Binary search for the closest valid position
    let min = startPos[axis];
    let max = targetPos[axis];
    let best = min;
    const testPos = startPos.clone();

    // If start position already collides, don't move
    if (this.checkCollision(startPos)) {
      return startPos[axis];
    }

    // Binary search with small epsilon
    const epsilon = 0.01;
    while (Math.abs(max - min) > epsilon) {
      const mid = (min + max) / 2;
      testPos[axis] = mid;

      if (!this.checkCollision(testPos)) {
        best = mid;
        min = mid;
      } else {
        max = mid;
      }
    }

    return best;
  }

  /**
   * Move position with collision detection
   * Returns the actual position after collision resolution
   */
  private moveWithCollision(newPos: THREE.Vector3): THREE.Vector3 {
    const result = this.position.clone();
    const originalPos = this.position.clone();

    // Separate movement into X, Y, Z components for proper collision handling
    // This prevents getting stuck in corners
    
    // First try X movement
    const testX = originalPos.clone();
    testX.x = newPos.x;
    if (!this.checkCollision(testX)) {
      result.x = newPos.x;
    } else {
      // Resolve X collision by finding the closest valid position
      result.x = this.resolveAxisCollision(originalPos, newPos, 'x');
      this.velocity.x = 0; // Stop horizontal velocity when hitting a wall
    }

    // Then try Y movement (vertical)
    const testY = result.clone();
    testY.y = newPos.y;
    if (!this.checkCollision(testY)) {
      result.y = newPos.y;
    } else {
      // Resolve Y collision
      const resolvedY = this.resolveAxisCollision(
        new THREE.Vector3(result.x, originalPos.y, result.z),
        new THREE.Vector3(result.x, newPos.y, result.z),
        'y'
      );
      result.y = resolvedY;
      
      if (newPos.y > originalPos.y) {
        // Hitting ceiling
        this.velocity.y = 0;
      } else {
        // Hitting floor
        this.velocity.y = 0;
        this.isOnGround = true;
      }
    }

    // Finally try Z movement
    const testZ = result.clone();
    testZ.z = newPos.z;
    if (!this.checkCollision(testZ)) {
      result.z = newPos.z;
    } else {
      // Resolve Z collision
      result.z = this.resolveAxisCollision(
        new THREE.Vector3(result.x, result.y, originalPos.z),
        new THREE.Vector3(result.x, result.y, newPos.z),
        'z'
      );
      this.velocity.z = 0; // Stop horizontal velocity when hitting a wall
    }

    return result;
  }

  update(deltaTime: number): void {
    const isMobile = this.engine.mobileInput.isMobileControlsActive();
    const isPointerLocked = this.engine.input.isPointerLocked();
    
    // Allow updates if pointer is locked OR mobile controls are active
    if (!isPointerLocked && !isMobile) {
      return;
    }

    // Handle mouse look (desktop) or touch camera (mobile)
    if (isPointerLocked) {
      const mouseDelta = this.engine.input.getMouseDelta();
      const sensitivity = 0.002;
      
      this.euler.setFromQuaternion(this.engine.camera.quaternion);
      this.euler.y -= mouseDelta.x * sensitivity;
      this.euler.x -= mouseDelta.y * sensitivity;
      
      // Clamp vertical rotation
      this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
    } else if (isMobile) {
      // Handle touch camera rotation
      const touchDelta = this.engine.mobileInput.getCameraDelta();
      const sensitivity = 0.002;
      
      this.euler.setFromQuaternion(this.engine.camera.quaternion);
      this.euler.y -= touchDelta.x * sensitivity;
      this.euler.x -= touchDelta.y * sensitivity;
      
      // Clamp vertical rotation
      this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
    }

    // Handle keyboard movement (desktop) or joystick (mobile)
    const moveDirection = new THREE.Vector3();
    
    if (isMobile) {
      // Use joystick input
      const joystick = this.engine.mobileInput.getJoystickVector();
      moveDirection.x = joystick.x;
      moveDirection.z = joystick.y;
    } else {
      // Use keyboard input
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

    // Handle jumping (keyboard or mobile button)
    const jumpPressed = isMobile 
      ? this.engine.mobileInput.consumeJump()
      : this.engine.input.isKeyPressed('Space');
      
    if (jumpPressed && this.isOnGround) {
      this.velocity.y = this.jumpSpeed;
      this.isOnGround = false;
    }

    // Apply gravity
    this.velocity.y += this.gravity * deltaTime;

    // Calculate new position
    const newPosition = this.position.clone();
    newPosition.addScaledVector(this.velocity, deltaTime);

    // Apply collision detection and update position
    if (this.voxelWorld) {
      this.position = this.moveWithCollision(newPosition);
      
      // Check if on ground (standing on a block directly below feet)
      const groundCheckPos = this.position.clone();
      groundCheckPos.y -= 0.05; // Check slightly below feet
      const wasOnGround = this.isOnGround;
      this.isOnGround = this.checkCollision(groundCheckPos);
      
      // If we're falling and not on ground, make sure isOnGround is false
      if (this.velocity.y < -0.1 && !this.checkCollision(groundCheckPos)) {
        this.isOnGround = false;
      }
    } else {
      // Fallback: simple ground check if no voxel world
      if (this.position.y <= 0.5) {
        this.position.y = 0.5;
        this.velocity.y = 0;
        this.isOnGround = true;
      } else {
        this.isOnGround = false;
      }
    }

    // Update camera
    this.updateCamera();
  }
}
