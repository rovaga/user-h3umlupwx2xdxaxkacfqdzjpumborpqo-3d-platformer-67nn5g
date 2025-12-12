/**
 * AI-EDITABLE: Chick Animal
 *
 * Pollito pequeño que sigue a las gallinas.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class Chick {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private wanderTarget: THREE.Vector3;
  private wanderTimer: number = 0;
  private wanderInterval: number = 1 + Math.random() * 1.5; // 1-2.5 segundos

  constructor(engine: Engine, position: THREE.Vector3) {
    this.engine = engine;
    this.position = position.clone();
    this.wanderTarget = position.clone();

    // Crear grupo del pollito
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Cuerpo del pollito (más pequeño y amarillo)
    const bodyGeometry = new THREE.SphereGeometry(0.15, 12, 12);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff700, // Amarillo para pollitos
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.15;
    body.castShadow = true;
    this.mesh.add(body);

    // Cabeza
    const headGeometry = new THREE.SphereGeometry(0.12, 12, 12);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff700,
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.2, 0.1);
    head.castShadow = true;
    this.mesh.add(head);

    // Ojos pequeños
    const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.05, 0.22, 0.15);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.05, 0.22, 0.15);
    this.mesh.add(rightEye);

    // Pico pequeño
    const beakGeometry = new THREE.ConeGeometry(0.03, 0.06, 6);
    const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 0.2, 0.2);
    beak.rotation.x = Math.PI / 2;
    this.mesh.add(beak);

    // Patas pequeñas
    const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.05, 0.05, 0);
    leftLeg.castShadow = true;
    this.mesh.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.05, 0.05, 0);
    rightLeg.castShadow = true;
    this.mesh.add(rightLeg);

    // Pequeñas alas
    const wingGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.15);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.12, 0.15, 0);
    leftWing.rotation.z = -0.3;
    this.mesh.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.12, 0.15, 0);
    rightWing.rotation.z = 0.3;
    this.mesh.add(rightWing);

    this.updateMesh();
  }

  update(deltaTime: number): void {
    this.wanderTimer += deltaTime;

    // Cambiar dirección más frecuentemente (pollitos más inquietos)
    if (this.wanderTimer >= this.wanderInterval) {
      this.wanderTimer = 0;
      this.wanderInterval = 1 + Math.random() * 1.5;
      
      // Nuevo objetivo aleatorio cerca del gallinero
      const coopCenter = new THREE.Vector3(-10, 0, -15);
      const angle = Math.random() * Math.PI * 2;
      const distance = 1.5 + Math.random() * 2;
      this.wanderTarget.set(
        coopCenter.x + Math.cos(angle) * distance,
        this.position.y,
        coopCenter.z + Math.sin(angle) * distance
      );
    }

    // Moverse hacia el objetivo (más rápido y errático)
    const direction = new THREE.Vector3()
      .subVectors(this.wanderTarget, this.position)
      .normalize();
    
    const speed = 0.6; // Movimiento más rápido de pollito
    this.position.add(direction.multiplyScalar(speed * deltaTime));

    // Mantener cerca del gallinero
    const coopCenter = new THREE.Vector3(-10, 0, -15);
    const distance = this.position.distanceTo(coopCenter);
    if (distance > 5) {
      const backDirection = new THREE.Vector3()
        .subVectors(coopCenter, this.position)
        .normalize();
      this.position.add(backDirection.multiplyScalar(0.4));
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
