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
  private mesh: THREE.Group; // Grupo para contener el cuerpo y suministros
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private sombrero: THREE.Mesh;
  private sombreroAla: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private rifle: THREE.Mesh;
  private collectedSupplies: THREE.Mesh[] = [];
  private supplyStackHeight: number = 0;

  // Estado del jugador
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: number = 0;
  private onGround: boolean = false;

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

    // Crear grupo del jugador (persona mexicana)
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Crear piernas (pantalones)
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8);
    const pantalonMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2F4F2F, // Verde oscuro de los pantalones
      roughness: 0.8 
    });
    
    this.leftLeg = new THREE.Mesh(legGeometry, pantalonMaterial);
    this.leftLeg.position.set(-0.15, 0.4, 0);
    this.leftLeg.castShadow = true;
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeometry, pantalonMaterial);
    this.rightLeg.position.set(0.15, 0.4, 0);
    this.rightLeg.castShadow = true;
    this.mesh.add(this.rightLeg);

    // Crear cuerpo del personaje (torso con camisa)
    const bodyGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.9, 16);
    const camisaMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF, // Blanco de la camisa
      roughness: 0.7 
    });
    this.body = new THREE.Mesh(bodyGeometry, camisaMaterial);
    this.body.position.y = 0.95;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Crear cinturón
    const cinturonGeometry = new THREE.TorusGeometry(0.38, 0.05, 8, 16);
    const cinturonMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513, // Café del cinturón
      roughness: 0.6 
    });
    const cinturon = new THREE.Mesh(cinturonGeometry, cinturonMaterial);
    cinturon.rotation.x = Math.PI / 2;
    cinturon.position.y = 0.95;
    cinturon.castShadow = true;
    this.mesh.add(cinturon);

    // Crear cabeza
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const pielMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFDBB3, // Color de piel
      roughness: 0.6 
    });
    this.head = new THREE.Mesh(headGeometry, pielMaterial);
    this.head.position.y = 1.4;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Crear bigote
    const bigoteGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.05);
    const bigoteMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000000, // Negro del bigote
      roughness: 0.5 
    });
    const bigote = new THREE.Mesh(bigoteGeometry, bigoteMaterial);
    bigote.position.set(0, 1.35, 0.22);
    bigote.castShadow = true;
    this.mesh.add(bigote);

    // Crear sombrero mexicano (parte superior)
    const sombreroGeometry = new THREE.CylinderGeometry(0.5, 0.45, 0.2, 16);
    const sombreroMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B0000, // Rojo del sombrero
      roughness: 0.6 
    });
    this.sombrero = new THREE.Mesh(sombreroGeometry, sombreroMaterial);
    this.sombrero.position.y = 1.65;
    this.sombrero.castShadow = true;
    this.mesh.add(this.sombrero);

    // Crear ala del sombrero (más grande y decorativa)
    const alaGeometry = new THREE.TorusGeometry(0.6, 0.12, 8, 16);
    const alaMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B0000, // Rojo del sombrero
      roughness: 0.6 
    });
    this.sombreroAla = new THREE.Mesh(alaGeometry, alaMaterial);
    this.sombreroAla.rotation.x = Math.PI / 2;
    this.sombreroAla.position.y = 1.55;
    this.sombreroAla.castShadow = true;
    this.mesh.add(this.sombreroAla);

    // Decoración del sombrero (banda con colores de la bandera mexicana)
    const bandaGeometry = new THREE.TorusGeometry(0.52, 0.03, 8, 16);
    const bandaMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x006847, // Verde de la bandera mexicana
      roughness: 0.5 
    });
    const banda = new THREE.Mesh(bandaGeometry, bandaMaterial);
    banda.rotation.x = Math.PI / 2;
    banda.position.y = 1.6;
    this.mesh.add(banda);

    // Crear brazos
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    const brazoMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFDBB3, // Color de piel
      roughness: 0.6 
    });
    
    this.leftArm = new THREE.Mesh(armGeometry, brazoMaterial);
    this.leftArm.position.set(-0.4, 0.95, 0);
    this.leftArm.rotation.z = Math.PI / 6;
    this.leftArm.castShadow = true;
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeometry, brazoMaterial);
    this.rightArm.position.set(0.4, 0.95, 0);
    this.rightArm.rotation.z = -Math.PI / 6;
    this.rightArm.castShadow = true;
    this.mesh.add(this.rightArm);

    // Crear rifle como indicador de dirección (en la mano derecha)
    const rifleGeometry = new THREE.BoxGeometry(0.08, 0.08, 1.0);
    const rifleMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    this.rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
    this.rifle.rotation.x = Math.PI / 2;
    this.rifle.rotation.z = -Math.PI / 6;
    this.rifle.position.set(0.5, 0.95, 0.3);
    this.rifle.castShadow = true;
    this.mesh.add(this.rifle);

    console.log('[Player] Creado como persona mexicana');
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
          this.position.y = bounds.max.y + 0.8; // Ajustado para altura del personaje completo
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

    // Prevenir que la cámara vaya por debajo del suelo
    if (camera.position.y < 0.5) {
      camera.position.y = 0.5;
    }

    camera.lookAt(this.position);
  }

  addSupply(supplyMesh: THREE.Mesh, height: number): void {
    // Posicionar suministro en la parte superior de la pila actual (sobre el sombrero)
    supplyMesh.position.y = this.supplyStackHeight + height / 2 + 1.85;
    this.mesh.add(supplyMesh);
    this.collectedSupplies.push(supplyMesh);
    this.supplyStackHeight += height;
    
    console.log(`[Player] Suministro agregado. Altura de pila: ${this.supplyStackHeight}`);
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
    this.sombrero.geometry.dispose();
    (this.sombrero.material as THREE.Material).dispose();
    this.sombreroAla.geometry.dispose();
    (this.sombreroAla.material as THREE.Material).dispose();
    this.leftArm.geometry.dispose();
    (this.leftArm.material as THREE.Material).dispose();
    this.rightArm.geometry.dispose();
    (this.rightArm.material as THREE.Material).dispose();
    this.leftLeg.geometry.dispose();
    (this.leftLeg.material as THREE.Material).dispose();
    this.rightLeg.geometry.dispose();
    (this.rightLeg.material as THREE.Material).dispose();
    this.rifle.geometry.dispose();
    (this.rifle.material as THREE.Material).dispose();
    
    // Liberar suministros recolectados
    for (const supply of this.collectedSupplies) {
      supply.geometry.dispose();
      (supply.material as THREE.Material).dispose();
    }
    
    console.log('[Player] Liberado');
  }
}
