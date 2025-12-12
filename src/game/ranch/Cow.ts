/**
 * AI-EDITABLE: Cow Animal
 *
 * Vaca que pasta en el corral.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class Cow {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private wanderTarget: THREE.Vector3;
  private wanderTimer: number = 0;
  private wanderInterval: number = 3 + Math.random() * 3; // 3-6 segundos

  constructor(engine: Engine, position: THREE.Vector3) {
    this.engine = engine;
    this.position = position.clone();
    this.wanderTarget = position.clone();

    // Crear grupo de la vaca
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Cuerpo de la vaca (blanco y negro)
    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0xffffff : 0x2c2c2c, // Blanco o negro
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    this.mesh.add(body);

    // Manchas si es blanca
    if (bodyMaterial.color.getHex() === 0xffffff) {
      const spotGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const spotMaterial = new THREE.MeshStandardMaterial({ color: 0x2c2c2c });
      
      for (let i = 0; i < 3; i++) {
        const spot = new THREE.Mesh(spotGeometry, spotMaterial);
        spot.position.set(
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.4 + 0.4,
          (Math.random() - 0.5) * 1.0
        );
        spot.castShadow = true;
        this.mesh.add(spot);
      }
    }

    // Cabeza
    const headGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.6);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: bodyMaterial.color.getHex() === 0xffffff ? 0x2c2c2c : 0xffffff,
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.5, 0.8);
    head.castShadow = true;
    this.mesh.add(head);

    // Orejas
    const earGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.1);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.25, 0.6, 0.75);
    leftEar.rotation.z = -0.3;
    this.mesh.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.25, 0.6, 0.75);
    rightEar.rotation.z = 0.3;
    this.mesh.add(rightEar);

    // Patas
    const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2c2c2c });
    
    const positions = [
      [-0.4, -0.3, -0.5],
      [0.4, -0.3, -0.5],
      [-0.4, -0.3, 0.5],
      [0.4, -0.3, 0.5],
    ];

    for (const [x, y, z] of positions) {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      this.mesh.add(leg);
    }

    // Cola
    const tailGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x2c2c2c });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.3, -0.7);
    tail.rotation.x = Math.PI / 4;
    tail.castShadow = true;
    this.mesh.add(tail);

    // Ubérs (si es hembra)
    const udderGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const udderMaterial = new THREE.MeshStandardMaterial({ color: 0xffd4e5 });
    const udder = new THREE.Mesh(udderGeometry, udderMaterial);
    udder.position.set(0, -0.1, -0.3);
    this.mesh.add(udder);

    this.updateMesh();
  }

  update(deltaTime: number): void {
    this.wanderTimer += deltaTime;

    // Cambiar dirección de deambulación periódicamente
    if (this.wanderTimer >= this.wanderInterval) {
      this.wanderTimer = 0;
      this.wanderInterval = 3 + Math.random() * 3;
      
      // Nuevo objetivo aleatorio dentro del área del corral
      this.wanderTarget.set(
        this.position.x + (Math.random() - 0.5) * 4,
        this.position.y,
        this.position.z + (Math.random() - 0.5) * 4
      );
    }

    // Moverse hacia el objetivo lentamente
    const direction = new THREE.Vector3()
      .subVectors(this.wanderTarget, this.position)
      .normalize();
    
    const speed = 0.3; // Movimiento lento de pastoreo
    this.position.add(direction.multiplyScalar(speed * deltaTime));

    // Mantener dentro del corral (aproximadamente)
    const corralCenter = new THREE.Vector3(-15, 0, 10);
    const distance = this.position.distanceTo(corralCenter);
    if (distance > 6) {
      const backDirection = new THREE.Vector3()
        .subVectors(corralCenter, this.position)
        .normalize();
      this.position.add(backDirection.multiplyScalar(0.5));
    }

    this.updateMesh();
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    
    // Rotar hacia la dirección de movimiento
    if (this.wanderTarget) {
      const direction = new THREE.Vector3()
        .subVectors(this.wanderTarget, this.position);
      if (direction.length() > 0.1) {
        this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
      }
    }
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
}
