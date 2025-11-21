/**
 * AI-EDITABLE: Charmander Character
 *
 * Charmander character controller for forest survival game.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class Charmander {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: number = 0;
  private onGround: boolean = false;
  
  // Survival stats
  private health: number = 100;
  private maxHealth: number = 100;
  private hunger: number = 100;
  private maxHunger: number = 100;
  private firePower: number = 50;
  private maxFirePower: number = 100;
  
  // Movement settings
  private readonly speed = 0.08;
  private readonly jumpForce = 0.35;
  private readonly gravity = -0.018;
  
  // Camera settings
  private cameraDistance = 6;
  private cameraHeight = 3;
  private cameraRotationY = 0;
  private cameraRotationX = 0.4;
  
  // Fire effect
  private tailFlame: THREE.Mesh | null = null;
  private fireParticles: THREE.Mesh[] = [];

  constructor(engine: Engine, startPosition: THREE.Vector3) {
    this.engine = engine;
    this.position = startPosition.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Create Charmander group
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Charmander body (orange sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6b35, // Orange
      roughness: 0.6 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.35;
    body.castShadow = true;
    this.mesh.add(body);

    // Charmander head (larger orange sphere)
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6b35,
      roughness: 0.6 
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.85;
    head.castShadow = true;
    this.mesh.add(head);

    // Charmander snout (smaller sphere)
    const snoutGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const snoutMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff8c5a, // Lighter orange
      roughness: 0.5 
    });
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.position.set(0, 0.9, 0.35);
    this.mesh.add(snout);

    // Eyes (black spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye1.position.set(-0.12, 0.95, 0.25);
    this.mesh.add(eye1);

    const eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye2.position.set(0.12, 0.95, 0.25);
    this.mesh.add(eye2);

    // Arms (smaller spheres)
    const armGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6b35,
      roughness: 0.6 
    });
    
    const arm1 = new THREE.Mesh(armGeometry, armMaterial);
    arm1.position.set(-0.3, 0.5, 0.2);
    arm1.castShadow = true;
    this.mesh.add(arm1);

    const arm2 = new THREE.Mesh(armGeometry, armMaterial);
    arm2.position.set(0.3, 0.5, 0.2);
    arm2.castShadow = true;
    this.mesh.add(arm2);

    // Legs (smaller spheres)
    const legGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6b35,
      roughness: 0.6 
    });
    
    const leg1 = new THREE.Mesh(legGeometry, legMaterial);
    leg1.position.set(-0.15, 0.1, 0.15);
    leg1.castShadow = true;
    this.mesh.add(leg1);

    const leg2 = new THREE.Mesh(legGeometry, legMaterial);
    leg2.position.set(0.15, 0.1, 0.15);
    leg2.castShadow = true;
    this.mesh.add(leg2);

    // Tail (orange cone)
    const tailGeometry = new THREE.ConeGeometry(0.1, 0.6, 8);
    const tailMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6b35,
      roughness: 0.6 
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.3, -0.4);
    tail.rotation.x = Math.PI / 6;
    tail.castShadow = true;
    this.mesh.add(tail);

    // Tail flame (fire effect)
    const flameGeometry = new THREE.ConeGeometry(0.12, 0.4, 6);
    const flameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff4500, // Orange-red
      emissive: 0xff4500,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });
    this.tailFlame = new THREE.Mesh(flameGeometry, flameMaterial);
    this.tailFlame.position.set(0, 0.15, -0.55);
    this.tailFlame.rotation.x = Math.PI;
    this.mesh.add(this.tailFlame);

    // Create fire particles
    for (let i = 0; i < 5; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.03, 6, 6);
      const particleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff6600,
        emissive: 0xff6600,
        emissiveIntensity: 1.0
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      this.fireParticles.push(particle);
      this.mesh.add(particle);
    }

    console.log('[Charmander] Created');
  }

  update(deltaTime: number, groundHeight: number): void {
    this.handleInput();
    this.applyPhysics(groundHeight);
    this.updateMesh();
    this.updateCamera();
    this.updateFireEffect();
    this.updateSurvivalStats(deltaTime);
  }

  private handleInput(): void {
    const input = this.engine.input;
    const mobileInput = this.engine.mobileInput;
    const isMobile = mobileInput.isMobileControlsActive();

    const moveDirection = new THREE.Vector3();

    // Get movement input
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

      const angle = this.cameraRotationY;
      const forward = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
      const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));

      const worldMoveDirection = new THREE.Vector3();
      worldMoveDirection.addScaledVector(forward, moveDirection.z);
      worldMoveDirection.addScaledVector(right, moveDirection.x);
      worldMoveDirection.normalize();

      this.position.x += worldMoveDirection.x * this.speed;
      this.position.z += worldMoveDirection.z * this.speed;

      this.rotation = Math.atan2(worldMoveDirection.x, worldMoveDirection.z);
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

  private applyPhysics(groundHeight: number): void {
    this.velocity.y += this.gravity;
    this.position.y += this.velocity.y;

    // Ground collision
    if (this.position.y <= groundHeight + 0.35) {
      this.position.y = groundHeight + 0.35;
      this.velocity.y = 0;
      this.onGround = true;
    }

    // Reset if fallen too far
    if (this.position.y < -10) {
      this.position.set(0, 5, 0);
      this.velocity.set(0, 0, 0);
      this.takeDamage(10);
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
    camera.lookAt(this.position);
  }

  private updateFireEffect(): void {
    if (!this.tailFlame) return;

    const time = Date.now() * 0.005;
    const flameIntensity = 0.8 + Math.sin(time * 2) * 0.2;
    
    // Animate flame
    this.tailFlame.scale.y = flameIntensity;
    this.tailFlame.rotation.z = Math.sin(time) * 0.1;

    // Animate fire particles
    for (let i = 0; i < this.fireParticles.length; i++) {
      const particle = this.fireParticles[i];
      const offset = (i / this.fireParticles.length) * Math.PI * 2;
      particle.position.set(
        Math.sin(time * 2 + offset) * 0.15,
        0.1 + Math.sin(time * 3 + offset) * 0.1,
        -0.5 + Math.cos(time * 2 + offset) * 0.1
      );
      particle.scale.setScalar(0.5 + Math.sin(time * 3 + offset) * 0.3);
    }
  }

  private updateSurvivalStats(deltaTime: number): void {
    // Hunger decreases over time
    this.hunger = Math.max(0, this.hunger - deltaTime * 2);
    
    // Health decreases if hunger is too low
    if (this.hunger <= 0) {
      this.health = Math.max(0, this.health - deltaTime * 5);
    }

    // Fire power regenerates slowly
    this.firePower = Math.min(this.maxFirePower, this.firePower + deltaTime * 10);
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  eat(foodValue: number): void {
    this.hunger = Math.min(this.maxHunger, this.hunger + foodValue);
    this.heal(foodValue * 0.5); // Eating also heals a bit
  }

  useFireAttack(): boolean {
    if (this.firePower >= 20) {
      this.firePower -= 20;
      return true;
    }
    return false;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRadius(): number {
    return 0.4;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getHunger(): number {
    return this.hunger;
  }

  getMaxHunger(): number {
    return this.maxHunger;
  }

  getFirePower(): number {
    return this.firePower;
  }

  getMaxFirePower(): number {
    return this.maxFirePower;
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    
    const disposeMesh = (mesh: THREE.Mesh) => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    };

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        disposeMesh(child);
      }
    });

    console.log('[Charmander] Disposed');
  }
}
