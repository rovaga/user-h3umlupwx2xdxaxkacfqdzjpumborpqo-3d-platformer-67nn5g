/**
 * AI-EDITABLE: Boat with Pikachu
 *
 * Creates a boat with Pikachu character on top that can be controlled.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Ocean } from './Ocean';

export class Boat {
  private engine: Engine;
  private ocean: Ocean;
  private group: THREE.Group;
  private boatMesh: THREE.Mesh;
  private pikachuMesh: THREE.Group;
  private position: THREE.Vector3;
  private rotation: number = 0;
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  
  // Movement settings
  private readonly speed = 8;
  private readonly rotationSpeed = 2;
  private readonly maxSpeed = 12;
  private readonly friction = 0.95;

  constructor(engine: Engine, ocean: Ocean, startPosition: THREE.Vector3) {
    this.engine = engine;
    this.ocean = ocean;
    this.position = startPosition.clone();

    // Create boat group
    this.group = new THREE.Group();
    this.engine.scene.add(this.group);

    // Create boat hull (brown wooden boat)
    const hullGeometry = new THREE.BoxGeometry(3, 0.8, 1.5);
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Saddle brown
      roughness: 0.8,
    });
    this.boatMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    this.boatMesh.position.y = 0.4;
    this.boatMesh.castShadow = true;
    this.group.add(this.boatMesh);

    // Create boat deck (lighter brown)
    const deckGeometry = new THREE.BoxGeometry(2.8, 0.1, 1.3);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d, // Sienna
      roughness: 0.7,
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0.85;
    deck.castShadow = true;
    this.group.add(deck);

    // Create mast
    const mastGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    const mastMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(0, 1.85, 0);
    mast.castShadow = true;
    this.group.add(mast);

    // Create sail (white triangle)
    const sailShape = new THREE.Shape();
    sailShape.moveTo(0, 0);
    sailShape.lineTo(1.5, 0);
    sailShape.lineTo(0, 2);
    sailShape.lineTo(0, 0);
    const sailGeometry = new THREE.ShapeGeometry(sailShape);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.rotation.y = Math.PI / 2;
    sail.position.set(0, 1.5, 0.1);
    this.group.add(sail);

    // Create Pikachu (simplified version with geometric shapes)
    this.pikachuMesh = new THREE.Group();

    // Pikachu body (yellow sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 }); // Gold/yellow
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.2;
    body.castShadow = true;
    this.pikachuMesh.add(body);

    // Pikachu head (larger yellow sphere)
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    this.pikachuMesh.add(head);

    // Pikachu ears (two red triangles)
    const earGeometry = new THREE.ConeGeometry(0.15, 0.6, 3);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    
    const ear1 = new THREE.Mesh(earGeometry, earMaterial);
    ear1.position.set(-0.3, 2.1, 0);
    ear1.rotation.z = -0.3;
    ear1.castShadow = true;
    this.pikachuMesh.add(ear1);

    const ear2 = new THREE.Mesh(earGeometry, earMaterial);
    ear2.position.set(0.3, 2.1, 0);
    ear2.rotation.z = 0.3;
    ear2.castShadow = true;
    this.pikachuMesh.add(ear2);

    // Pikachu eyes (black spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye1.position.set(-0.15, 1.85, 0.4);
    this.pikachuMesh.add(eye1);

    const eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye2.position.set(0.15, 1.85, 0.4);
    this.pikachuMesh.add(eye2);

    // Pikachu nose (small black triangle)
    const noseGeometry = new THREE.ConeGeometry(0.05, 0.1, 3);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 1.75, 0.45);
    nose.rotation.x = Math.PI;
    this.pikachuMesh.add(nose);

    // Pikachu cheeks (red circles)
    const cheekGeometry = new THREE.CircleGeometry(0.12, 8);
    const cheekMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
    
    const cheek1 = new THREE.Mesh(cheekGeometry, cheekMaterial);
    cheek1.position.set(-0.4, 1.7, 0.35);
    cheek1.rotation.y = -Math.PI / 4;
    this.pikachuMesh.add(cheek1);

    const cheek2 = new THREE.Mesh(cheekGeometry, cheekMaterial);
    cheek2.position.set(0.4, 1.7, 0.35);
    cheek2.rotation.y = Math.PI / 4;
    this.pikachuMesh.add(cheek2);

    // Position Pikachu on boat
    this.pikachuMesh.position.set(0, 0, 0);
    this.group.add(this.pikachuMesh);

    console.log('[Boat] Created with Pikachu');
  }

  update(deltaTime: number): void {
    this.handleInput();
    this.applyPhysics(deltaTime);
    this.updateMesh();
  }

  private handleInput(): void {
    const input = this.engine.input;
    const mobileInput = this.engine.mobileInput;
    const isMobile = mobileInput.isMobileControlsActive();

    let rotationDelta = 0;
    let acceleration = 0;

    // Get input (keyboard or mobile)
    if (isMobile) {
      const joystick = mobileInput.getJoystickVector();
      rotationDelta = joystick.x * this.rotationSpeed;
      acceleration = joystick.y;
    } else {
      // Keyboard controls
      if (input.isKeyPressed('KeyA') || input.isKeyPressed('ArrowLeft')) {
        rotationDelta = -this.rotationSpeed;
      }
      if (input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight')) {
        rotationDelta = this.rotationSpeed;
      }
      if (input.isKeyPressed('KeyW') || input.isKeyPressed('ArrowUp')) {
        acceleration = 1;
      }
      if (input.isKeyPressed('KeyS') || input.isKeyPressed('ArrowDown')) {
        acceleration = -0.5; // Slower reverse
      }
    }

    // Apply rotation
    this.rotation += rotationDelta * 0.02;

    // Apply acceleration
    if (acceleration !== 0) {
      const forward = new THREE.Vector3(
        Math.sin(this.rotation),
        0,
        Math.cos(this.rotation)
      );
      this.velocity.add(forward.multiplyScalar(acceleration * this.speed * 0.02));
      
      // Limit max speed
      if (this.velocity.length() > this.maxSpeed) {
        this.velocity.normalize().multiplyScalar(this.maxSpeed);
      }
    } else {
      // Apply friction
      this.velocity.multiplyScalar(this.friction);
    }
  }

  private applyPhysics(deltaTime: number): void {
    // Move boat
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Keep boat on ocean surface
    const oceanHeight = this.ocean.getHeightAt(this.position.x, this.position.z);
    this.position.y = oceanHeight + 0.8;

    // Animate Pikachu (bobbing with waves)
    const bobAmount = Math.sin(Date.now() * 0.003) * 0.1;
    this.pikachuMesh.position.y = bobAmount;

    // Rotate Pikachu slightly based on boat movement
    const tilt = this.velocity.length() * 0.05;
    this.pikachuMesh.rotation.z = Math.sin(Date.now() * 0.005) * tilt;
  }

  private updateMesh(): void {
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRotation(): number {
    return this.rotation;
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  dispose(): void {
    this.engine.scene.remove(this.group);
    
    // Dispose geometries and materials
    const disposeMesh = (mesh: THREE.Mesh) => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    };

    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        disposeMesh(child);
      }
    });

    console.log('[Boat] Disposed');
  }
}
