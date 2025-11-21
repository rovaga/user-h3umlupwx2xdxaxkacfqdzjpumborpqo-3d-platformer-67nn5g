/**
 * AI-EDITABLE: Railroad Player Controller
 *
 * This file contains the player character logic for moving on the train
 * and collecting tacos.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { TrainCar } from './TrainCar';

export class RailroadPlayer {
  private engine: Engine;
  private mesh: THREE.Group;
  private trainCar: TrainCar;
  private localPosition: THREE.Vector3; // Position relative to train car
  private collectedTacos: THREE.Mesh[] = [];
  private tacoStackHeight: number = 0;

  // Player settings
  private readonly speed = 0.15;
  private readonly jumpForce = 0.4;
  private readonly gravity = -0.015;
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private onGround: boolean = true;

  // Camera settings
  private cameraDistance = 10;
  private cameraHeight = 5;
  private cameraRotationY = 0;
  private cameraRotationX = 0.4;

  constructor(engine: Engine, trainCar: TrainCar) {
    this.engine = engine;
    this.trainCar = trainCar;
    this.localPosition = new THREE.Vector3(0, 2.5, 0); // Start on top of train car

    // Create player group (Mexican character - sombrero and poncho)
    this.mesh = new THREE.Group();

    // Body (poncho)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6347, // Red poncho
      roughness: 0.8 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    this.mesh.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffdbac, // Skin tone
      roughness: 0.8 
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.9;
    head.castShadow = true;
    this.mesh.add(head);

    // Sombrero
    const sombreroBrimGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 16);
    const sombreroBrimMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513, // Brown
      roughness: 0.8 
    });
    const sombreroBrim = new THREE.Mesh(sombreroBrimGeometry, sombreroBrimMaterial);
    sombreroBrim.position.y = 1.0;
    sombreroBrim.castShadow = true;
    this.mesh.add(sombreroBrim);

    const sombreroTopGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.3, 8);
    const sombreroTop = new THREE.Mesh(sombreroTopGeometry, sombreroBrimMaterial);
    sombreroTop.position.y = 1.2;
    sombreroTop.castShadow = true;
    this.mesh.add(sombreroTop);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 0.95, 0.2);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
    rightEye.position.set(0.08, 0.95, 0.2);
    this.mesh.add(rightEye);

    // Mustache
    const mustacheGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
    const mustacheMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const mustache = new THREE.Mesh(mustacheGeometry, mustacheMaterial);
    mustache.position.set(0, 0.85, 0.22);
    this.mesh.add(mustache);

    // Direction indicator
    const indicatorGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.rotation.x = Math.PI / 2;
    indicator.position.z = -0.4;
    indicator.position.y = 0.5;
    indicator.userData.isIndicator = true;
    this.mesh.add(indicator);

    this.updateMeshPosition();
    engine.scene.add(this.mesh);

    console.log('[RailroadPlayer] Created');
  }

  update(deltaTime: number): void {
    this.handleInput();
    this.applyPhysics();
    this.checkGroundCollision();
    this.updateMeshPosition();
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

    // Apply movement relative to train car
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

      // Move player locally on train car
      this.localPosition.x += worldMoveDirection.x * this.speed;
      this.localPosition.z += worldMoveDirection.z * this.speed;

      // Keep player roughly on train car (simple bounds)
      const trainBounds = 1.5; // Half width of train car
      this.localPosition.x = Math.max(-trainBounds, Math.min(trainBounds, this.localPosition.x));
      this.localPosition.z = Math.max(-trainBounds, Math.min(trainBounds, this.localPosition.z));
    }

    // Jump
    const shouldJump = isMobile
      ? mobileInput.isJumpPressed()
      : input.isKeyPressed('Space');

    if (shouldJump && this.onGround) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }

    // Camera control
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
    this.localPosition.y += this.velocity.y;

    // Reset if fallen too far
    if (this.localPosition.y < -5) {
      this.localPosition.set(0, 2.5, 0);
      this.velocity.set(0, 0, 0);
    }
  }

  private checkGroundCollision(): void {
    // Simple ground check - train car top is at y = 2.0 (0.4 base + 2 height)
    const trainTop = 2.0;
    if (this.localPosition.y - 0.5 <= trainTop && this.velocity.y <= 0) {
      this.localPosition.y = trainTop + 0.5;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }

  private updateMeshPosition(): void {
    // Get train car's world position and rotation
    const trainPos = this.trainCar.getPosition();
    const trainBounds = this.trainCar.getBounds();
    
    // Calculate world position relative to train car
    const worldPos = new THREE.Vector3(
      trainPos.x + this.localPosition.x,
      trainBounds.max.y + this.localPosition.y - 0.5,
      trainPos.z + this.localPosition.z
    );

    this.mesh.position.copy(worldPos);
  }

  private updateCamera(): void {
    const camera = this.engine.camera;
    const playerWorldPos = this.getPosition();
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

    camera.position.copy(playerWorldPos).add(cameraOffset);
    camera.lookAt(playerWorldPos);
  }

  addTaco(tacoMesh: THREE.Mesh, height: number): void {
    // Position taco on top of current stack (stack starts at top of head, y=1.25)
    tacoMesh.position.y = this.tacoStackHeight + height / 2 + 1.25;
    this.mesh.add(tacoMesh);
    this.collectedTacos.push(tacoMesh);
    this.tacoStackHeight += height;
    
    // Move indicator higher
    const indicator = this.mesh.children.find(child => child.userData.isIndicator);
    if (indicator) {
      indicator.position.y = this.tacoStackHeight + 1.25 + 0.15;
    }
    
    console.log(`[RailroadPlayer] Added taco. Stack height: ${this.tacoStackHeight}`);
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  getRadius(): number {
    return 0.4;
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
    
    // Dispose collected tacos
    for (const taco of this.collectedTacos) {
      taco.geometry.dispose();
      (taco.material as THREE.Material).dispose();
    }
    
    console.log('[RailroadPlayer] Disposed');
  }
}
