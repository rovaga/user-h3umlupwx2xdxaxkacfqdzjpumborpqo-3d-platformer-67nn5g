/**
 * AI-EDITABLE: Controlador del Jugador
 *
 * Este archivo contiene la lógica del personaje del jugador incluyendo movimiento,
 * controles de cámara, salto y detección de colisiones.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';

export class Player {
  private engine: Engine;
  private mesh: THREE.Group; // Grupo para contener el cuerpo y tacos
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private dress: THREE.Mesh;
  private collectedTacos: (THREE.Mesh | THREE.Group)[] = [];
  private tacoStackHeight: number = 0;

  // Estado del jugador
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: number = 0;
  private onGround: boolean = false;
  private danceTime: number = 0; // Para animación de baile

  // Configuración del jugador
  private readonly speed = 0.1;
  private readonly jumpForce = 0.4;
  private readonly gravity = -0.015;

  // Configuración de cámara
  private cameraDistance = 8;
  private cameraHeight = 4;
  private cameraRotationY = 0;
  private cameraRotationX = 0.3;

  constructor(engine: Engine) {
    this.engine = engine;
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Crear grupo del jugador (mujer bailando)
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Crear cuerpo (torso)
    const bodyGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFF69B4, // Color rosa del vestido
      roughness: 0.7 
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.4;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Crear cabeza
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFDBB3, // Color piel
      roughness: 0.6 
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 0.95;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Crear pelo
    const hairGeometry = new THREE.SphereGeometry(0.28, 16, 16);
    const hairMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513, // Color café del pelo
      roughness: 0.8 
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 0.98;
    hair.position.z = -0.05;
    hair.scale.y = 1.2;
    hair.castShadow = true;
    this.mesh.add(hair);

    // Crear vestido (falda)
    const dressGeometry = new THREE.ConeGeometry(0.5, 0.6, 16);
    const dressMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFF1493, // Color rosa intenso del vestido
      roughness: 0.7 
    });
    this.dress = new THREE.Mesh(dressGeometry, dressMaterial);
    this.dress.position.y = 0.1;
    this.dress.rotation.x = Math.PI;
    this.dress.castShadow = true;
    this.mesh.add(this.dress);

    // Crear brazo izquierdo
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFDBB3, // Color piel
      roughness: 0.6 
    });
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.leftArm.position.set(-0.4, 0.5, 0);
    this.leftArm.rotation.z = 0.3;
    this.leftArm.castShadow = true;
    this.mesh.add(this.leftArm);

    // Crear brazo derecho
    this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.rightArm.position.set(0.4, 0.5, 0);
    this.rightArm.rotation.z = -0.3;
    this.rightArm.castShadow = true;
    this.mesh.add(this.rightArm);

    // Crear pierna izquierda
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFDBB3, // Color piel
      roughness: 0.6 
    });
    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.leftLeg.position.set(-0.15, -0.2, 0);
    this.leftLeg.castShadow = true;
    this.mesh.add(this.leftLeg);

    // Crear pierna derecha
    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.rightLeg.position.set(0.15, -0.2, 0);
    this.rightLeg.castShadow = true;
    this.mesh.add(this.rightLeg);

    console.log('[Player] Creada como mujer bailando');
  }

  update(deltaTime: number, platforms: Platform[]): void {
    this.handleInput();
    this.applyPhysics();
    this.checkCollisions(platforms);
    this.updateMesh();
    this.updateCamera();
    this.animateDance(deltaTime);
  }

  private handleInput(): void {
    const input = this.engine.input;
    const mobileInput = this.engine.mobileInput;
    const isMobile = mobileInput.isMobileControlsActive();

    const moveDirection = new THREE.Vector3();

    // Obtener entrada de movimiento (teclado o joystick móvil)
    if (isMobile) {
      // Entrada de joystick móvil
      const joystick = mobileInput.getJoystickVector();
      moveDirection.x = joystick.x;
      moveDirection.z = joystick.y;
    } else {
      // Entrada de teclado
      if (input.isKeyPressed('KeyW')) moveDirection.z += 1;
      if (input.isKeyPressed('KeyS')) moveDirection.z -= 1;
      if (input.isKeyPressed('KeyA')) moveDirection.x -= 1;
      if (input.isKeyPressed('KeyD')) moveDirection.x += 1;
    }

    // Aplicar movimiento
    if (moveDirection.length() > 0) {
      moveDirection.normalize();

      // Calcular movimiento relativo a la dirección de la cámara
      const angle = this.cameraRotationY;
      const forward = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
      const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));

      const worldMoveDirection = new THREE.Vector3();
      worldMoveDirection.addScaledVector(forward, moveDirection.z);
      worldMoveDirection.addScaledVector(right, moveDirection.x);
      worldMoveDirection.normalize();

      // Mover jugador
      this.position.x += worldMoveDirection.x * this.speed;
      this.position.z += worldMoveDirection.z * this.speed;

      // Rotar jugador para mirar en dirección del movimiento
      this.rotation = Math.atan2(worldMoveDirection.x, worldMoveDirection.z);
    }

    // Salto (teclado o botón móvil)
    const shouldJump = isMobile
      ? mobileInput.isJumpPressed()
      : input.isKeyPressed('Space');

    if (shouldJump && this.onGround) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }

    // Control de cámara (ratón o touch)
    if (isMobile) {
      // Cámara táctil móvil
      const touchDelta = mobileInput.getCameraDelta();
      this.cameraRotationY -= touchDelta.x * 0.005;
      this.cameraRotationX -= touchDelta.y * 0.005;
      this.cameraRotationX = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, this.cameraRotationX)
      );
    } else if (input.isPointerLocked()) {
      // Cámara con ratón
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
    // Aplicar gravedad
    this.velocity.y += this.gravity;
    this.position.y += this.velocity.y;

    // Reiniciar a spawn si cae del mundo
    if (this.position.y < -10) {
      this.position.set(0, 5, 0);
      this.velocity.set(0, 0, 0);
    }
  }

  private checkCollisions(platforms: Platform[]): void {
    this.onGround = false;

    for (const platform of platforms) {
      const bounds = platform.getBounds();
      const playerBottom = this.position.y - 0.6; // Ajustado para altura del cuerpo
      const playerRadius = 0.5;

      // Verificar superposición horizontal
      if (
        this.position.x + playerRadius > bounds.min.x &&
        this.position.x - playerRadius < bounds.max.x &&
        this.position.z + playerRadius > bounds.min.z &&
        this.position.z - playerRadius < bounds.max.z
      ) {
        // Verificar colisión vertical (aterrizar en plataforma)
        if (
          playerBottom <= bounds.max.y &&
          playerBottom >= bounds.min.y &&
          this.velocity.y <= 0
        ) {
          this.position.y = bounds.max.y + 0.6;
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

  private animateDance(deltaTime: number): void {
    // Incrementar tiempo de baile
    this.danceTime += deltaTime * 0.005;

    // Animar brazos (movimiento de baile)
    if (this.leftArm && this.rightArm) {
      this.leftArm.rotation.z = 0.3 + Math.sin(this.danceTime) * 0.5;
      this.rightArm.rotation.z = -0.3 - Math.sin(this.danceTime) * 0.5;
      this.leftArm.rotation.x = Math.sin(this.danceTime * 1.2) * 0.3;
      this.rightArm.rotation.x = -Math.sin(this.danceTime * 1.2) * 0.3;
    }

    // Animar piernas (pasos de baile)
    if (this.leftLeg && this.rightLeg) {
      this.leftLeg.rotation.x = Math.sin(this.danceTime * 1.5) * 0.2;
      this.rightLeg.rotation.x = -Math.sin(this.danceTime * 1.5) * 0.2;
    }

    // Animar vestido (movimiento de falda)
    if (this.dress) {
      this.dress.rotation.z = Math.sin(this.danceTime * 0.8) * 0.1;
      this.dress.scale.x = 1 + Math.sin(this.danceTime * 1.5) * 0.1;
      this.dress.scale.z = 1 + Math.cos(this.danceTime * 1.5) * 0.1;
    }

    // Animar cabeza (ligero movimiento)
    if (this.head) {
      this.head.rotation.y = Math.sin(this.danceTime * 0.5) * 0.1;
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

    // Prevenir que la cámara vaya por debajo del suelo
    if (camera.position.y < 0.5) {
      camera.position.y = 0.5;
    }

    camera.lookAt(this.position);
  }

  addTaco(tacoMesh: THREE.Mesh | THREE.Group, height: number): void {
    // Posicionar taco en la parte superior de la pila actual
    tacoMesh.position.y = this.tacoStackHeight + height / 2 + 1.2;
    this.mesh.add(tacoMesh);
    this.collectedTacos.push(tacoMesh);
    this.tacoStackHeight += height;
    
    console.log(`[Player] Taco agregado. Altura de pila: ${this.tacoStackHeight}`);
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
    this.leftArm.geometry.dispose();
    (this.leftArm.material as THREE.Material).dispose();
    this.rightArm.geometry.dispose();
    (this.rightArm.material as THREE.Material).dispose();
    this.leftLeg.geometry.dispose();
    (this.leftLeg.material as THREE.Material).dispose();
    this.rightLeg.geometry.dispose();
    (this.rightLeg.material as THREE.Material).dispose();
    this.dress.geometry.dispose();
    (this.dress.material as THREE.Material).dispose();
    
    // Liberar tacos recolectados
    for (const taco of this.collectedTacos) {
      if (taco instanceof THREE.Group) {
        taco.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      } else {
        taco.geometry.dispose();
        if (Array.isArray(taco.material)) {
          taco.material.forEach((mat) => mat.dispose());
        } else {
          taco.material.dispose();
        }
      }
    }
    
    console.log('[Player] Liberado');
  }
}
