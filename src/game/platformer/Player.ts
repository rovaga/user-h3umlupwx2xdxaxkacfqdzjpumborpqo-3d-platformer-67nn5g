/**
 * AI-EDITABLE: Player Controller
 *
 * This file contains the player character logic including movement,
 * camera controls, jumping, and collision detection.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';

export class Player {
  private engine: Engine;
  private mesh: THREE.Group; // Changed to Group to hold dog parts
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private snout: THREE.Mesh;
  private leftEar: THREE.Mesh;
  private rightEar: THREE.Mesh;
  private tail: THREE.Mesh;
  private frontLeftLeg: THREE.Mesh;
  private frontRightLeg: THREE.Mesh;
  private backLeftLeg: THREE.Mesh;
  private backRightLeg: THREE.Mesh;
  private indicator: THREE.Mesh;
  private collectedIngredients: THREE.Mesh[] = [];
  private ingredientStackHeight: number = 0;

  // Player state
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: number = 0;
  private onGround: boolean = false;

  // Player settings
  private readonly speed = 0.1;
  private readonly jumpForce = 0.4;
  private readonly gravity = -0.015;

  // Camera settings
  private cameraDistance = 8;
  private cameraHeight = 4;
  private cameraRotationY = 0;
  private cameraRotationX = 0.3;

  constructor(engine: Engine) {
    this.engine = engine;
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Create player group (dog)
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Dog body color (brown/tan)
    const dogColor = 0x8B4513; // Saddle brown
    const dogMaterial = new THREE.MeshStandardMaterial({ 
      color: dogColor,
      roughness: 0.8 
    });

    // Create body (ellipsoid)
    const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    bodyGeometry.scale(1, 0.7, 1.2); // Make it more dog-like
    this.body = new THREE.Mesh(bodyGeometry, dogMaterial);
    this.body.position.y = 0;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Create head (smaller sphere)
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: dogColor,
      roughness: 0.8 
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 0.3;
    this.head.position.z = 0.5;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Create snout (smaller sphere at front)
    const snoutGeometry = new THREE.SphereGeometry(0.15, 12, 12);
    snoutGeometry.scale(1, 0.8, 1.5);
    const snoutMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x654321, // Darker brown for snout
      roughness: 0.8 
    });
    this.snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    this.snout.position.y = 0.25;
    this.snout.position.z = 0.75;
    this.snout.castShadow = true;
    this.mesh.add(this.snout);

    // Create left ear (floppy ear)
    const earGeometry = new THREE.SphereGeometry(0.15, 12, 12);
    earGeometry.scale(1, 1.5, 0.3);
    const earMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x654321, // Darker brown for ears
      roughness: 0.8 
    });
    this.leftEar = new THREE.Mesh(earGeometry, earMaterial);
    this.leftEar.position.y = 0.45;
    this.leftEar.position.z = 0.4;
    this.leftEar.position.x = -0.25;
    this.leftEar.rotation.z = -0.3;
    this.leftEar.castShadow = true;
    this.mesh.add(this.leftEar);

    // Create right ear
    this.rightEar = new THREE.Mesh(earGeometry, earMaterial);
    this.rightEar.position.y = 0.45;
    this.rightEar.position.z = 0.4;
    this.rightEar.position.x = 0.25;
    this.rightEar.rotation.z = 0.3;
    this.rightEar.castShadow = true;
    this.mesh.add(this.rightEar);

    // Create tail (cone)
    const tailGeometry = new THREE.ConeGeometry(0.08, 0.4, 8);
    const tailMaterial = new THREE.MeshStandardMaterial({ 
      color: dogColor,
      roughness: 0.8 
    });
    this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
    this.tail.position.y = 0.2;
    this.tail.position.z = -0.6;
    this.tail.rotation.x = Math.PI / 6;
    this.tail.castShadow = true;
    this.mesh.add(this.tail);

    // Create legs (four small cylinders)
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x654321, // Darker brown for legs
      roughness: 0.8 
    });

    // Front left leg
    this.frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.frontLeftLeg.position.set(-0.25, -0.25, 0.3);
    this.frontLeftLeg.castShadow = true;
    this.mesh.add(this.frontLeftLeg);

    // Front right leg
    this.frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.frontRightLeg.position.set(0.25, -0.25, 0.3);
    this.frontRightLeg.castShadow = true;
    this.mesh.add(this.frontRightLeg);

    // Back left leg
    this.backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.backLeftLeg.position.set(-0.25, -0.25, -0.3);
    this.backLeftLeg.castShadow = true;
    this.mesh.add(this.backLeftLeg);

    // Back right leg
    this.backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.backRightLeg.position.set(0.25, -0.25, -0.3);
    this.backRightLeg.castShadow = true;
    this.mesh.add(this.backRightLeg);

    // Create direction indicator (yellow cone) - now on dog's back
    const indicatorGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.indicator.rotation.x = Math.PI / 2;
    this.indicator.position.z = 0.6;
    this.indicator.position.y = 0.5;
    this.mesh.add(this.indicator);

    console.log('[Player] Created as dog');
  }

  update(deltaTime: number, platforms: Platform[]): void {
    this.handleInput();
    this.applyPhysics();
    this.checkCollisions(platforms);
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
      // Mobile joystick input
      const joystick = mobileInput.getJoystickVector();
      moveDirection.x = joystick.x;
      moveDirection.z = joystick.y;
    } else {
      // Keyboard input
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
      // Mobile touch camera
      const touchDelta = mobileInput.getCameraDelta();
      this.cameraRotationY -= touchDelta.x * 0.005;
      this.cameraRotationX -= touchDelta.y * 0.005;
      this.cameraRotationX = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, this.cameraRotationX)
      );
    } else if (input.isPointerLocked()) {
      // Mouse camera
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

    // Reset to spawn if fallen off the world
    if (this.position.y < -10) {
      this.position.set(0, 5, 0);
      this.velocity.set(0, 0, 0);
    }
  }

  private checkCollisions(platforms: Platform[]): void {
    this.onGround = false;

    for (const platform of platforms) {
      const bounds = platform.getBounds();
      const playerBottom = this.position.y - 0.3; // Adjusted for dog height
      const playerRadius = 0.5;

      // Check horizontal overlap
      if (
        this.position.x + playerRadius > bounds.min.x &&
        this.position.x - playerRadius < bounds.max.x &&
        this.position.z + playerRadius > bounds.min.z &&
        this.position.z - playerRadius < bounds.max.z
      ) {
        // Check vertical collision (landing on platform)
        if (
          playerBottom <= bounds.max.y &&
          playerBottom >= bounds.min.y &&
          this.velocity.y <= 0
        ) {
          this.position.y = bounds.max.y + 0.3;
          this.velocity.y = 0;
          this.onGround = true;
        }
      }
    }
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
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

  addIngredient(ingredientMesh: THREE.Mesh, height: number): void {
    // Position ingredient on top of current stack (stack starts at top of dog's back, y=0.5)
    ingredientMesh.position.y = 0.5 + this.ingredientStackHeight + height / 2;
    this.mesh.add(ingredientMesh);
    this.collectedIngredients.push(ingredientMesh);
    this.ingredientStackHeight += height;
    
    // Move indicator higher to sit on top of ingredients
    this.indicator.position.y = 0.5 + this.ingredientStackHeight + 0.15;
    
    console.log(`[Player] Added ingredient. Stack height: ${this.ingredientStackHeight}`);
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRadius(): number {
    return 0.5;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.body.geometry.dispose();
    (this.body.material as THREE.Material).dispose();
    this.head.geometry.dispose();
    (this.head.material as THREE.Material).dispose();
    this.snout.geometry.dispose();
    (this.snout.material as THREE.Material).dispose();
    this.leftEar.geometry.dispose();
    (this.leftEar.material as THREE.Material).dispose();
    this.rightEar.geometry.dispose();
    (this.rightEar.material as THREE.Material).dispose();
    this.tail.geometry.dispose();
    (this.tail.material as THREE.Material).dispose();
    this.frontLeftLeg.geometry.dispose();
    (this.frontLeftLeg.material as THREE.Material).dispose();
    this.frontRightLeg.geometry.dispose();
    (this.frontRightLeg.material as THREE.Material).dispose();
    this.backLeftLeg.geometry.dispose();
    (this.backLeftLeg.material as THREE.Material).dispose();
    this.backRightLeg.geometry.dispose();
    (this.backRightLeg.material as THREE.Material).dispose();
    this.indicator.geometry.dispose();
    (this.indicator.material as THREE.Material).dispose();
    
    // Dispose collected ingredients
    for (const ingredient of this.collectedIngredients) {
      ingredient.geometry.dispose();
      (ingredient.material as THREE.Material).dispose();
    }
    
    console.log('[Player] Disposed');
  }
}
