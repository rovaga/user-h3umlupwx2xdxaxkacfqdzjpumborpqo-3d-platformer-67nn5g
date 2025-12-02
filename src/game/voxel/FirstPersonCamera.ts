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
  private playerWidth: number = 0.6;  // Half-width
  private playerHeight: number = 1.6; // Height from feet to head
  private playerEyeHeight: number = 1.5; // Eye height from feet

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
    // Update camera position (offset by eye height)
    const eyePosition = this.position.clone();
    eyePosition.y += this.playerEyeHeight;
    this.engine.camera.position.copy(eyePosition);
    
    // Update camera rotation from euler angles
    this.engine.camera.rotation.set(this.euler.x, this.euler.y, this.euler.z, 'YXZ');
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
    const newPosition = this.position.clone().addScaledVector(this.velocity, deltaTime);

    // Apply collision detection if voxel world is available
    if (this.voxelWorld) {
      // Check collisions separately for each axis to allow sliding along walls
      // Process X first
      const testX = new THREE.Vector3(newPosition.x, this.position.y, this.position.z);
      if (!this.checkCollision(testX)) {
        this.position.x = newPosition.x;
      } else {
        this.velocity.x = 0;
      }

      // Process Y (using updated X position)
      const testY = new THREE.Vector3(this.position.x, newPosition.y, this.position.z);
      if (!this.checkCollision(testY)) {
        this.position.y = newPosition.y;
        this.isOnGround = false;
      } else {
        // Hit ceiling or ground - resolve collision
        if (this.velocity.y < 0) {
          // Hit ground - position player on top of the block
          const blockY = Math.floor(this.position.y);
          this.position.y = blockY + 1; // Position feet on top of block
          this.isOnGround = true;
        } else {
          // Hit ceiling - position player below the block
          const blockY = Math.floor(this.position.y + this.playerHeight);
          this.position.y = blockY - this.playerHeight; // Position so head is below block
        }
        this.velocity.y = 0;
      }

      // Process Z (using updated X and Y positions)
      const testZ = new THREE.Vector3(this.position.x, this.position.y, newPosition.z);
      if (!this.checkCollision(testZ)) {
        this.position.z = newPosition.z;
      } else {
        this.velocity.z = 0;
      }
    } else {
      // Fallback to simple ground check if no voxel world
      if (this.position.y <= 0.5) {
        this.position.y = 0.5;
        this.velocity.y = 0;
        this.isOnGround = true;
      } else {
        this.isOnGround = false;
      }

      // Update position
      this.position.addScaledVector(this.velocity, deltaTime);
    }

    // Update camera
    this.updateCamera();
  }

  /**
   * Check if the player's collision box at the given position intersects with any blocks.
   * Returns true if there's a collision.
   * Position represents the player's feet position (bottom of collision box).
   */
  private checkCollision(position: THREE.Vector3): boolean {
    if (!this.voxelWorld) {
      return false;
    }

    // Calculate player's AABB bounds
    // Position represents feet, so collision box goes from position.y to position.y + playerHeight
    // Add a small epsilon to ensure we detect blocks we're standing on or colliding with
    const epsilon = 0.01;
    const minX = position.x - this.playerWidth;
    const maxX = position.x + this.playerWidth;
    const minY = position.y - epsilon; // Extend slightly downward to detect ground blocks
    const maxY = position.y + this.playerHeight;
    const minZ = position.z - this.playerWidth;
    const maxZ = position.z + this.playerWidth;

    // Check all blocks that could intersect with the player's AABB
    // Use Math.floor for min and Math.floor for max to ensure we check all potentially intersecting blocks
    const blockMinX = Math.floor(minX);
    const blockMaxX = Math.floor(maxX);
    const blockMinY = Math.floor(minY);
    const blockMaxY = Math.floor(maxY);
    const blockMinZ = Math.floor(minZ);
    const blockMaxZ = Math.floor(maxZ);

    for (let bx = blockMinX; bx <= blockMaxX; bx++) {
      for (let by = blockMinY; by <= blockMaxY; by++) {
        for (let bz = blockMinZ; bz <= blockMaxZ; bz++) {
          // Check if block exists
          if (this.voxelWorld.getBlock(bx, by, bz)) {
            // Block exists, check AABB intersection
            // Block occupies space from (bx, by, bz) to (bx+1, by+1, bz+1)
            const blockMin = new THREE.Vector3(bx, by, bz);
            const blockMax = new THREE.Vector3(bx + 1, by + 1, bz + 1);

            // AABB intersection test: two AABBs intersect if they overlap on all axes
            if (minX < blockMax.x && maxX > blockMin.x &&
                minY < blockMax.y && maxY > blockMin.y &&
                minZ < blockMax.z && maxZ > blockMin.z) {
              return true; // Collision detected
            }
          }
        }
      }
    }

    return false; // No collision
  }
}
