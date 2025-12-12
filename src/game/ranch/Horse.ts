/**
 * AI-EDITABLE: Horse Animal
 *
 * Caballo que puede ser montado por el vaquero.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class Horse {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private isMounted: boolean = false;
  private wanderTarget: THREE.Vector3;
  private wanderTimer: number = 0;
  private wanderInterval: number = 4 + Math.random() * 4; // 4-8 segundos

  constructor(engine: Engine, position: THREE.Vector3) {
    this.engine = engine;
    this.position = position.clone();
    this.wanderTarget = position.clone();

    // Crear grupo del caballo
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Cuerpo del caballo
    const bodyGeometry = new THREE.BoxGeometry(1.5, 0.9, 2.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Marrón para el cuerpo
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.45;
    body.castShadow = true;
    this.mesh.add(body);

    // Cabeza
    const headGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.9);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321, // Marrón más oscuro para la cabeza
      roughness: 0.7,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.6, 1.2);
    head.castShadow = true;
    this.mesh.add(head);

    // Orejas
    const earGeometry = new THREE.ConeGeometry(0.1, 0.25, 6);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.2, 0.95, 1.1);
    leftEar.rotation.z = -0.3;
    this.mesh.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.2, 0.95, 1.1);
    rightEar.rotation.z = 0.3;
    this.mesh.add(rightEar);

    // Crin (melena)
    const maneGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.6);
    const maneMaterial = new THREE.MeshStandardMaterial({ color: 0x2c1810 });
    const mane = new THREE.Mesh(maneGeometry, maneMaterial);
    mane.position.set(0, 0.85, 0.5);
    mane.castShadow = true;
    this.mesh.add(mane);

    // Patas
    const legGeometry = new THREE.BoxGeometry(0.25, 0.9, 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    
    const legPositions = [
      [-0.5, -0.45, -0.7],
      [0.5, -0.45, -0.7],
      [-0.5, -0.45, 0.7],
      [0.5, -0.45, 0.7],
    ];

    for (const [x, y, z] of legPositions) {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      this.mesh.add(leg);
    }

    // Cola
    const tailGeometry = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 8);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x2c1810 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.3, -1.0);
    tail.rotation.x = Math.PI / 6;
    tail.castShadow = true;
    this.mesh.add(tail);

    // Silla de montar (opcional, para indicar que es montable)
    const saddleGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.6);
    const saddleMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
    const saddle = new THREE.Mesh(saddleGeometry, saddleMaterial);
    saddle.position.set(0, 0.9, 0);
    this.mesh.add(saddle);

    this.updateMesh();
  }

  update(deltaTime: number): void {
    if (!this.isMounted) {
      this.wanderTimer += deltaTime;

      // Cambiar dirección de deambulación periódicamente
      if (this.wanderTimer >= this.wanderInterval) {
        this.wanderTimer = 0;
        this.wanderInterval = 4 + Math.random() * 4;
        
        // Nuevo objetivo aleatorio cerca del establo
        const stableCenter = new THREE.Vector3(15, 0, -10);
        this.wanderTarget.set(
          stableCenter.x + (Math.random() - 0.5) * 6,
          this.position.y,
          stableCenter.z + (Math.random() - 0.5) * 6
        );
      }

      // Moverse hacia el objetivo lentamente
      const direction = new THREE.Vector3()
        .subVectors(this.wanderTarget, this.position)
        .normalize();
      
      const speed = 0.5; // Movimiento lento
      this.position.add(direction.multiplyScalar(speed * deltaTime));

      // Mantener cerca del establo
      const stableCenter = new THREE.Vector3(15, 0, -10);
      const distance = this.position.distanceTo(stableCenter);
      if (distance > 8) {
        const backDirection = new THREE.Vector3()
          .subVectors(stableCenter, this.position)
          .normalize();
        this.position.add(backDirection.multiplyScalar(0.5));
      }
    }

    this.updateMesh();
  }

  setMounted(mounted: boolean): void {
    this.isMounted = mounted;
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    
    // Rotar hacia la dirección de movimiento
    if (this.wanderTarget && !this.isMounted) {
      const direction = new THREE.Vector3()
        .subVectors(this.wanderTarget, this.position);
      if (direction.length() > 0.1) {
        this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
      }
    }
  }

  getMesh(): THREE.Group {
    return this.mesh;
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
