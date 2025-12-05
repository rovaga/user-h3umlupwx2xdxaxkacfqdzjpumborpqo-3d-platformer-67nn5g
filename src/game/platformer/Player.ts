/**
 * AI-EDITABLE: Player Controller
 *
 * This file contains the player character logic including movement,
 * camera controls, jumping, and collision detection.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';

export class Player {
  private engine: Engine;
  private mesh: THREE.Group;
  private model: THREE.Group | null = null;
  private animationMixer: THREE.AnimationMixer | null = null;
  private idleAction: THREE.AnimationAction | null = null;
  private walkAction: THREE.AnimationAction | null = null;
  private isMoving: boolean = false;
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

    // Create player group
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Load pikachu model
    this.loadPikachuModel();

    console.log('[Player] Created, loading pikachu model...');
  }

  private async loadPikachuModel(): Promise<void> {
    const pikachuUrl = this.engine.assetLoader.getUrl('models/pikachu-1764892395768.glb');
    if (!pikachuUrl) {
      console.warn('[Player] Pikachu model not found');
      return;
    }

    const loader = new GLTFLoader();
    
    try {
      const gltf = await loader.loadAsync(pikachuUrl);
      this.model = gltf.scene;

      // Enable shadows for the pikachu model
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Scale the model appropriately
      this.model.scale.set(1, 1, 1);

      // Set up animation mixer
      if (gltf.animations && gltf.animations.length > 0) {
        this.animationMixer = new THREE.AnimationMixer(this.model);
        
        // Find idle and walk animations
        const animations = gltf.animations;
        const idleAnim = animations.find(anim => 
          anim.name.toLowerCase().includes('idle')
        ) || animations.find(anim => 
          anim.name.toLowerCase().includes('stand')
        ) || animations[0];
        
        const walkAnim = animations.find(anim => 
          anim.name.toLowerCase().includes('walk')
        ) || animations.find(anim => 
          anim.name.toLowerCase().includes('run')
        ) || (animations.length > 1 ? animations[1] : animations[0]);

        // Create animation actions
        if (idleAnim) {
          this.idleAction = this.animationMixer.clipAction(idleAnim);
          this.idleAction.setLoop(THREE.LoopRepeat);
          this.idleAction.play();
          console.log(`[Player] Loaded idle animation: ${idleAnim.name}`);
        }

        if (walkAnim && walkAnim !== idleAnim) {
          this.walkAction = this.animationMixer.clipAction(walkAnim);
          this.walkAction.setLoop(THREE.LoopRepeat);
          console.log(`[Player] Loaded walk animation: ${walkAnim.name}`);
        } else if (walkAnim === idleAnim) {
          // If walk animation is the same as idle, use it for both
          this.walkAction = this.idleAction;
        }
      } else {
        console.warn('[Player] No animations found in pikachu model');
      }

      this.mesh.add(this.model);
      console.log('[Player] Pikachu model loaded successfully');
    } catch (error) {
      console.error('[Player] Failed to load pikachu model:', error);
    }
  }

  update(deltaTime: number, platforms: Platform[]): void {
    this.handleInput();
    this.applyPhysics();
    this.checkCollisions(platforms);
    this.updateAnimations(deltaTime);
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

    // Track movement state
    this.isMoving = moveDirection.length() > 0;

    // Apply movement
    if (this.isMoving) {
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

  private updateAnimations(deltaTime: number): void {
    // Update animation mixer
    if (this.animationMixer) {
      this.animationMixer.update(deltaTime);
    }

    // Switch between idle and walk animations based on movement
    if (this.idleAction && this.walkAction && this.idleAction !== this.walkAction) {
      if (this.isMoving) {
        // Fade to walk animation
        if (this.idleAction.isRunning() && this.idleAction.getEffectiveWeight() > 0) {
          this.idleAction.fadeOut(0.2);
        }
        if (!this.walkAction.isRunning() || this.walkAction.getEffectiveWeight() === 0) {
          this.walkAction.reset().fadeIn(0.2).play();
        }
      } else {
        // Fade to idle animation
        if (this.walkAction.isRunning() && this.walkAction.getEffectiveWeight() > 0) {
          this.walkAction.fadeOut(0.2);
        }
        if (!this.idleAction.isRunning() || this.idleAction.getEffectiveWeight() === 0) {
          this.idleAction.reset().fadeIn(0.2).play();
        }
      }
    }
  }

  private checkCollisions(platforms: Platform[]): void {
    this.onGround = false;

    for (const platform of platforms) {
      const bounds = platform.getBounds();
      const playerBottom = this.position.y - 0.5; // Adjusted for pikachu height
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
          this.position.y = bounds.max.y + 0.5;
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
    // Position ingredient on top of pikachu
    ingredientMesh.position.y = this.ingredientStackHeight + height / 2 + 1;
    this.mesh.add(ingredientMesh);
    this.collectedIngredients.push(ingredientMesh);
    this.ingredientStackHeight += height;
    
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
    
    // Dispose pikachu model
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    // Dispose collected ingredients
    for (const ingredient of this.collectedIngredients) {
      ingredient.geometry.dispose();
      (ingredient.material as THREE.Material).dispose();
    }
    
    // Clean up animation mixer
    if (this.animationMixer) {
      this.animationMixer = null;
    }
    
    console.log('[Player] Disposed');
  }
}
