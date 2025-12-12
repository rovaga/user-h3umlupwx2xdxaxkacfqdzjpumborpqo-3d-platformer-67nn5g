/**
 * AI-EDITABLE: Chicken Animal
 *
 * Gallina que camina alrededor del gallinero.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class Chicken {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private wanderTarget: THREE.Vector3;
  private wanderTimer: number = 0;
  private wanderInterval: number = 2 + Math.random() * 2; // 2-4 segundos

  constructor(engine: Engine, position: THREE.Vector3) {
    this.engine = engine;
    this.position = position.clone();
    this.wanderTarget = position.clone();

    // Crear grupo de la gallina
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Cuerpo de la gallina
    const bodyGeometry = new THREE.SphereGeometry(0.3, 12, 12);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0xffffff : 0xf5deb3, // Blanco o beige
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.3;
    body.castShadow = true;
    this.mesh.add(body);

    // Cabeza
    const headGeometry = new THREE.SphereGeometry(0.2, 12, 12);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b6b, // Rojo para la cresta y cabeza
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.4, 0.25);
    head.castShadow = true;
    this.mesh.add(head);

    // Cresta
    const combGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.05);
    const combMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const comb = new THREE.Mesh(combGeometry, combMaterial);
    comb.position.set(0, 0.55, 0.2);
    comb.rotation.z = -0.2;
    this.mesh.add(comb);

    // Pico
    const beakGeometry = new THREE.ConeGeometry(0.05, 0.1, 6);
    const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 0.4, 0.35);
    beak.rotation.x = Math.PI / 2;
    this.mesh.add(beak);

    // Patas
    const legGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.1, 0.1, 0);
    leftLeg.castShadow = true;
    this.mesh.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.1, 0.1, 0);
    rightLeg.castShadow = true;
    this.mesh.add(rightLeg);

    // Cola (pequeñas plumas)
    const tailGeometry = new THREE.ConeGeometry(0.15, 0.2, 6);
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: bodyMaterial.color.getHex() === 0xffffff ? 0xf5deb3 : 0xffffff,
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.3, -0.25);
    tail.rotation.x = Math.PI / 3;
    tail.castShadow = true;
    this.mesh.add(tail);

    this.updateMesh();
  }

  update(deltaTime: number): void {
    this.wanderTimer += deltaTime;

    // Cambiar dirección de deambulación periódicamente
    if (this.wanderTimer >= this.wanderInterval) {
      this.wanderTimer = 0;
      this.wanderInterval = 2 + Math.random() * 2;
      
      // Nuevo objetivo aleatorio cerca del gallinero
      const coopCenter = new THREE.Vector3(-10, 0, -15);
      const angle = Math.random() * Math.PI * 2;
      const distance = 2 + Math.random() * 3;
      this.wanderTarget.set(
        coopCenter.x + Math.cos(angle) * distance,
        this.position.y,
        coopCenter.z + Math.sin(angle) * distance
      );
    }

    // Moverse hacia el objetivo
    const direction = new THREE.Vector3()
      .subVectors(this.wanderTarget, this.position)
      .normalize();
    
    const speed = 0.4; // Movimiento de gallina
    this.position.add(direction.multiplyScalar(speed * deltaTime));

    // Mantener cerca del gallinero
    const coopCenter = new THREE.Vector3(-10, 0, -15);
    const distance = this.position.distanceTo(coopCenter);
    if (distance > 6) {
      const backDirection = new THREE.Vector3()
        .subVectors(coopCenter, this.position)
        .normalize();
      this.position.add(backDirection.multiplyScalar(0.3));
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
