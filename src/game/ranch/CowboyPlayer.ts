/**
 * AI-EDITABLE: Cowboy Player Controller
 *
 * This file contains the cowboy character logic including movement,
 * camera controls, jumping, and lives system.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class CowboyPlayer {
  private engine: Engine;
  private mesh: THREE.Group;
  private body: THREE.Mesh;
  private hat: THREE.Mesh;
  private legs: THREE.Mesh[];
  private boots: THREE.Mesh[];
  private arms: THREE.Mesh[];

  // Player state
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: number = 0;
  private onGround: boolean = false;
  private lives: number = 3;

  // Player settings
  private readonly speed = 0.12;
  private readonly jumpForce = 0.4;
  private readonly gravity = -0.015;
  private readonly groundY = 0.3; // Player height when on ground (feet at y=0)

  // Camera settings
  private cameraDistance = 8;
  private cameraHeight = 4;
  private cameraRotationY = 0;
  private cameraRotationX = 0.3;

  // Damage cooldown to prevent multiple hits in quick succession
  private damageCooldown: number = 0;
  private readonly damageCooldownTime = 1.0; // 1 second cooldown

  constructor(engine: Engine) {
    this.engine = engine;
    this.position = new THREE.Vector3(0, this.groundY, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Create player group
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Create body (torso)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown shirt
      roughness: 0.8,
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.4;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Create hat (cowboy hat)
    const hatBrimGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16);
    const hatBrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c1810, // Dark brown/black
      roughness: 0.7,
    });
    const hatBrim = new THREE.Mesh(hatBrimGeometry, hatBrimMaterial);
    hatBrim.position.y = 1.0;
    hatBrim.castShadow = true;
    this.mesh.add(hatBrim);

    const hatTopGeometry = new THREE.CylinderGeometry(0.25, 0.35, 0.3, 8);
    const hatTopMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c1810,
      roughness: 0.7,
    });
    this.hat = new THREE.Mesh(hatTopGeometry, hatTopMaterial);
    this.hat.position.y = 1.15;
    this.hat.castShadow = true;
    this.mesh.add(this.hat);

    // Create legs
    this.legs = [];
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321, // Darker brown for pants
      roughness: 0.8,
    });

    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.1, 0);
    leftLeg.castShadow = true;
    this.mesh.add(leftLeg);
    this.legs.push(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.1, 0);
    rightLeg.castShadow = true;
    this.mesh.add(rightLeg);
    this.legs.push(rightLeg);

    // Create boots
    this.boots = [];
    const bootGeometry = new THREE.CylinderGeometry(0.14, 0.12, 0.15, 8);
    const bootMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Black boots
      roughness: 0.7,
    });

    // Left boot
    const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial);
    leftBoot.position.set(-0.15, -0.375, 0);
    leftBoot.castShadow = true;
    this.mesh.add(leftBoot);
    this.boots.push(leftBoot);

    // Right boot
    const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial);
    rightBoot.position.set(0.15, -0.375, 0);
    rightBoot.castShadow = true;
    this.mesh.add(rightBoot);
    this.boots.push(rightBoot);

    // Create arms
    this.arms = [];
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });

    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 0.3, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    this.mesh.add(leftArm);
    this.arms.push(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 0.3, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    this.mesh.add(rightArm);
    this.arms.push(rightArm);

    console.log('[CowboyPlayer] Created');
  }

  update(deltaTime: number): void {
    // Update damage cooldown
    if (this.damageCooldown > 0) {
      this.damageCooldown -= deltaTime;
    }

    this.handleInput();
    this.applyPhysics();
    this.checkGroundCollision();
    this.updateMesh();
    this.updateCamera();
  }

  private handleInput(): void {
    const input = this.engine.input;
    const mobileInput = this.engine.mobileInput;
    const isMobile = mobileInput.isMobileControlsActive();

    const moveDirection = new THREE.Vector3();

    // Get movement input (keyboard or mobile joystick)
    if (isMobile) {
      const joystick = mobileInput.getJoystickVector();
      moveDirection.x = joystick.x;
      moveDirection.z = joystick.y;
    } else {
      if (input.isKeyPressed('KeyW')) moveDirection.z += 1;
      if (input.isKeyPressed('KeyS')) moveDirection.z -= 1;
      if (input.isKeyPressed('KeyA')) moveDirection.x -= 1;
      if (input.isKeyPressed('KeyD')) moveDirection.x += 1;
    }

    // Apply movement
    if (moveDirection.length() > 0) {
      moveDirection.normalize();

      // Calculate movement relative to camera direction
      const angle = this.cameraRotationY;
      const forward = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
      const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));

      const worldMoveDirection = new THREE.Vector3();
      worldMoveDirection.addScaledVector(forward, moveDirection.z);
      worldMoveDirection.addScaledVector(right, moveDirection.x);
      worldMoveDirection.normalize();

      // Move player
      this.position.x += worldMoveDirection.x * this.speed;
      this.position.z += worldMoveDirection.z * this.speed;

      // Rotate player to face movement direction
      this.rotation = Math.atan2(worldMoveDirection.x, worldMoveDirection.z);
    }

    // Jump (keyboard or mobile button)
    const shouldJump = isMobile
      ? mobileInput.isJumpPressed()
      : input.isKeyPressed('Space');

    if (shouldJump && this.onGround) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }

    // Camera control (mouse or touch)
    if (isMobile) {
      const touchDelta = mobileInput.getCameraDelta();
      this.cameraRotationY -= touchDelta.x * 0.005;
      this.cameraRotationX -= touchDelta.y * 0.005;
      this.cameraRotationX = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, this.cameraRotationX)
      );
    } else if (input.isPointerLocked()) {
      const mouseDelta = input.getMouseDelta();
      this.cameraRotationY -= mouseDelta.x * 0.002;
      this.cameraRotationX -= mouseDelta.y * 0.002;
      this.cameraRotationX = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, this.cameraRotationX)
      );
    }
  }

  private applyPhysics(): void {
    // Apply gravity
    this.velocity.y += this.gravity;
    this.position.y += this.velocity.y;
  }

  private checkGroundCollision(): void {
    if (this.position.y <= this.groundY) {
      this.position.y = this.groundY;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;

    // Animate legs when moving
    if (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01) {
      const walkSpeed = 0.1;
      const legOffset = Math.sin(Date.now() * walkSpeed) * 0.2;
      this.legs[0].rotation.x = legOffset;
      this.legs[1].rotation.x = -legOffset;
    } else {
      this.legs[0].rotation.x = 0;
      this.legs[1].rotation.x = 0;
    }
  }

  private updateCamera(): void {
    const camera = this.engine.camera;
    const cameraOffset = new THREE.Vector3();

    cameraOffset.x =
      Math.sin(this.cameraRotationY) *
      Math.cos(this.cameraRotationX) *
      this.cameraDistance;
    cameraOffset.y =
      Math.sin(this.cameraRotationX) * this.cameraDistance + this.cameraHeight;
    cameraOffset.z =
      Math.cos(this.cameraRotationY) *
      Math.cos(this.cameraRotationX) *
      this.cameraDistance;

    camera.position.copy(this.position).add(cameraOffset);

    // Prevent camera from going below ground
    if (camera.position.y < 0.5) {
      camera.position.y = 0.5;
    }

    camera.lookAt(this.position);
  }

  takeDamage(): void {
    if (this.damageCooldown <= 0 && this.lives > 0) {
      this.lives--;
      this.damageCooldown = this.damageCooldownTime;
      
      // Visual feedback: flash red
      const originalColor = (this.body.material as THREE.MeshStandardMaterial).color.clone();
      (this.body.material as THREE.MeshStandardMaterial).color.setHex(0xff0000);
      
      setTimeout(() => {
        (this.body.material as THREE.MeshStandardMaterial).color.copy(originalColor);
      }, 200);

      console.log(`[CowboyPlayer] Took damage! Lives remaining: ${this.lives}`);
    }
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRadius(): number {
    return 0.4;
  }

  getLives(): number {
    return this.lives;
  }

  getMesh(): THREE.Group {
    return this.mesh;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.body.geometry.dispose();
    (this.body.material as THREE.Material).dispose();
    this.hat.geometry.dispose();
    (this.hat.material as THREE.Material).dispose();
    
    for (const leg of this.legs) {
      leg.geometry.dispose();
      (leg.material as THREE.Material).dispose();
    }
    
    for (const boot of this.boots) {
      boot.geometry.dispose();
      (boot.material as THREE.Material).dispose();
    }
    
    for (const arm of this.arms) {
      arm.geometry.dispose();
      (arm.material as THREE.Material).dispose();
    }
    
    console.log('[CowboyPlayer] Disposed');
  }
}
