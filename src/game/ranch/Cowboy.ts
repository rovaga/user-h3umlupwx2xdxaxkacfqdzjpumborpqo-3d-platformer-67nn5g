/**
 * AI-EDITABLE: Cowboy Character
 *
 * Vaquero con sombrero y botas que puede montar caballos.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Stable } from './Stable';

export class Cowboy {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: number = 0;
  private onGround: boolean = false;
  private isRiding: boolean = false;
  private mountedHorse: THREE.Group | null = null;
  private stable: Stable;

  // Configuraciรณn del vaquero
  private readonly speed = 0.08;
  private readonly jumpForce = 0.35;
  private readonly gravity = -0.015;

  // Configuraciรณn de cรกmara
  private cameraDistance = 6;
  private cameraHeight = 3;
  private cameraRotationY = 0;
  private cameraRotationX = 0.4;

  constructor(engine: Engine, stable: Stable) {
    this.engine = engine;
    this.stable = stable;
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Crear grupo del vaquero
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Cuerpo (torso)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Marrรณn para el chaleco
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    this.mesh.add(body);

    // Piernas
    const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c1810, // Marrรณn oscuro para los pantalones
      roughness: 0.7,
    });

    // Pierna izquierda
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.2, 0);
    leftLeg.castShadow = true;
    this.mesh.add(leftLeg);

    // Pierna derecha
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.2, 0);
    rightLeg.castShadow = true;
    this.mesh.add(rightLeg);

    // Botas (mรกs grandes y oscuras)
    const bootGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.4);
    const bootMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Negro para las botas
      roughness: 0.5,
    });

    // Bota izquierda
    const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial);
    leftBoot.position.set(-0.15, -0.65, 0.05);
    leftBoot.castShadow = true;
    this.mesh.add(leftBoot);

    // Bota derecha
    const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial);
    rightBoot.position.set(0.15, -0.65, 0.05);
    rightBoot.castShadow = true;
    this.mesh.add(rightBoot);

    // Cabeza
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbac, // Color piel
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    head.castShadow = true;
    this.mesh.add(head);

    // Sombrero de vaquero
    const hatBrimGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16);
    const hatMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817, // Marrรณn oscuro para el sombrero
      roughness: 0.6,
    });
    const hatBrim = new THREE.Mesh(hatBrimGeometry, hatMaterial);
    hatBrim.position.y = 1.7;
    hatBrim.rotation.x = Math.PI / 2;
    hatBrim.castShadow = true;
    this.mesh.add(hatBrim);

    // Corona del sombrero
    const hatCrownGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.3, 16);
    const hatCrown = new THREE.Mesh(hatCrownGeometry, hatMaterial);
    hatCrown.position.y = 1.85;
    hatCrown.castShadow = true;
    this.mesh.add(hatCrown);

    // Brazos
    const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7,
    });

    // Brazo izquierdo
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 0.7, 0);
    leftArm.castShadow = true;
    this.mesh.add(leftArm);

    // Brazo derecho
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 0.7, 0);
    rightArm.castShadow = true;
    this.mesh.add(rightArm);

    console.log('[Cowboy] Vaquero creado');
  }

  update(deltaTime: number): void {
    this.handleInput();
    this.applyPhysics();
    this.checkGroundCollision();
    this.updateMesh();
    this.updateCamera();
    this.checkHorseInteraction();
  }

  private handleInput(): void {
    const input = this.engine.input;
    const mobileInput = this.engine.mobileInput;
    const isMobile = mobileInput.isMobileControlsActive();

    const moveDirection = new THREE.Vector3();

    // Obtener input de movimiento
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

    // Aplicar movimiento
    if (moveDirection.length() > 0) {
      moveDirection.normalize();

      const angle = this.cameraRotationY;
      const forward = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
      const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));

      const worldMoveDirection = new THREE.Vector3();
      worldMoveDirection.addScaledVector(forward, moveDirection.z);
      worldMoveDirection.addScaledVector(right, moveDirection.x);
      worldMoveDirection.normalize();

      if (this.isRiding && this.mountedHorse) {
        // Si estรก montado, mover el caballo
        const horseSpeed = this.speed * 2.5;
        const horsePos = new THREE.Vector3();
        this.mountedHorse.getWorldPosition(horsePos);
        horsePos.add(worldMoveDirection.multiplyScalar(horseSpeed));
        horsePos.y = 1.0;
        this.mountedHorse.position.copy(horsePos);
        this.mountedHorse.rotation.y = Math.atan2(worldMoveDirection.x, worldMoveDirection.z);
        this.rotation = this.mountedHorse.rotation.y;
      } else if (!this.isRiding) {
        // Movimiento normal del vaquero
        this.position.x += worldMoveDirection.x * this.speed;
        this.position.z += worldMoveDirection.z * this.speed;
        this.rotation = Math.atan2(worldMoveDirection.x, worldMoveDirection.z);
      }
    }

    // Saltar
    const shouldJump = isMobile
      ? mobileInput.isJumpPressed()
      : input.isKeyPressed('Space');

    if (shouldJump && this.onGround && !this.isRiding) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }

    // Desmontar del caballo (tecla E)
    if (input.isKeyPressed('KeyE') && this.isRiding) {
      this.dismountHorse();
    }

    // Control de cรกmara
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
    if (!this.isRiding) {
      this.velocity.y += this.gravity;
      this.position.y += this.velocity.y;
    }

    if (this.position.y < -10) {
      this.position.set(0, 5, 0);
      this.velocity.set(0, 0, 0);
    }
  }

  private checkGroundCollision(): void {
    if (this.position.y <= 1.0) {
      this.position.y = 1.0;
      this.velocity.y = 0;
      this.onGround = true;
    }
  }

  private checkHorseInteraction(): void {
    if (this.isRiding) {
      // Si está montado, seguir al caballo
      if (this.mountedHorse) {
        const horsePosition = new THREE.Vector3();
        this.mountedHorse.getWorldPosition(horsePosition);
        this.position.copy(horsePosition);
        this.position.y += 1.2; // Altura sobre el caballo
        
        // Notificar al caballo que está montado
        const horse = this.stable.getHorseByMesh(this.mountedHorse);
        if (horse) {
          horse.setMounted(true);
        }
      }
    } else {
      // Verificar si está cerca de un caballo para montarlo
      const horse = this.stable.getNearestHorse(this.position);
      if (horse) {
        const horsePos = new THREE.Vector3();
        horse.getWorldPosition(horsePos);
        const distance = this.position.distanceTo(horsePos);
        
        if (distance < 2.5) {
          // Presionar E para montar
          if (this.engine.input.isKeyPressed('KeyE')) {
            this.mountHorse(horse);
          }
        }
      }
    }
  }

  private mountHorse(horse: THREE.Group): void {
    this.isRiding = true;
    this.mountedHorse = horse;
    this.onGround = true;
    
    // Notificar al caballo que está montado
    const horseObj = this.stable.getHorseByMesh(horse);
    if (horseObj) {
      horseObj.setMounted(true);
    }
    
    console.log('[Cowboy] Montado en caballo');
  }

  private dismountHorse(): void {
    if (this.mountedHorse) {
      this.isRiding = false;
      // Notificar al caballo que ya no está montado
      const horse = this.stable.getHorseByMesh(this.mountedHorse);
      if (horse) {
        horse.setMounted(false);
      }
      // Colocar al vaquero al lado del caballo
      const horsePos = new THREE.Vector3();
      this.mountedHorse.getWorldPosition(horsePos);
      this.position.copy(horsePos);
      this.position.x += 1.5;
      this.position.y = 1.0;
      this.mountedHorse = null;
      console.log('[Cowboy] Desmontado del caballo');
    }
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
    
    // Si estรก montado, rotar con el caballo
    if (this.isRiding && this.mountedHorse) {
      this.mesh.rotation.y = this.mountedHorse.rotation.y;
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

    if (camera.position.y < 0.5) {
      camera.position.y = 0.5;
    }

    camera.lookAt(this.position);
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    // Limpiar geometrรญas y materiales
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    console.log('[Cowboy] Disposed');
  }
}
