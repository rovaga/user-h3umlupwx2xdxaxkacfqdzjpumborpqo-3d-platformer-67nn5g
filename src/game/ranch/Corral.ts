/**
 * AI-EDITABLE: Corral with Cows
 *
 * Corral con vacas pastando.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import { Cow } from './Cow';

export class Corral {
  private engine: Engine;
  private fence: THREE.Group;
  private cows: Cow[] = [];

  constructor(engine: Engine) {
    this.engine = engine;

    // Crear corral en posición específica
    const corralPosition = new THREE.Vector3(-15, 0, 10);
    this.createFence(corralPosition, 12, 10);

    // Crear vacas dentro del corral
    this.createCows(corralPosition, 12, 10);

    console.log('[Corral] Corral creado con', this.cows.length, 'vacas');
  }

  private createFence(position: THREE.Vector3, width: number, depth: number): void {
    this.fence = new THREE.Group();

    const fenceMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Marrón para la cerca de madera
      roughness: 0.8,
    });

    const postHeight = 1.5;
    const postWidth = 0.2;
    const railHeight = 0.1;
    const railWidth = 0.15;

    // Postes de las esquinas y lados
    const postGeometry = new THREE.BoxGeometry(postWidth, postHeight, postWidth);
    
    // Postes del perímetro
    const numPostsX = Math.floor(width / 2) + 1;
    const numPostsZ = Math.floor(depth / 2) + 1;

    // Postes del lado frontal (z negativo)
    for (let i = 0; i < numPostsX; i++) {
      const post = new THREE.Mesh(postGeometry, fenceMaterial);
      post.position.set(
        position.x - width / 2 + (i * width / (numPostsX - 1)),
        position.y + postHeight / 2,
        position.z - depth / 2
      );
      post.castShadow = true;
      this.fence.add(post);
    }

    // Postes del lado trasero (z positivo)
    for (let i = 0; i < numPostsX; i++) {
      const post = new THREE.Mesh(postGeometry, fenceMaterial);
      post.position.set(
        position.x - width / 2 + (i * width / (numPostsX - 1)),
        position.y + postHeight / 2,
        position.z + depth / 2
      );
      post.castShadow = true;
      this.fence.add(post);
    }

    // Postes del lado izquierdo (x negativo)
    for (let i = 1; i < numPostsZ - 1; i++) {
      const post = new THREE.Mesh(postGeometry, fenceMaterial);
      post.position.set(
        position.x - width / 2,
        position.y + postHeight / 2,
        position.z - depth / 2 + (i * depth / (numPostsZ - 1))
      );
      post.castShadow = true;
      this.fence.add(post);
    }

    // Postes del lado derecho (x positivo)
    for (let i = 1; i < numPostsZ - 1; i++) {
      const post = new THREE.Mesh(postGeometry, fenceMaterial);
      post.position.set(
        position.x + width / 2,
        position.y + postHeight / 2,
        position.z - depth / 2 + (i * depth / (numPostsZ - 1))
      );
      post.castShadow = true;
      this.fence.add(post);
    }

    // Barras horizontales (rieles)
    const railGeometry = new THREE.BoxGeometry(width, railHeight, railWidth);
    
    // Riel superior frontal
    const topRailFront = new THREE.Mesh(railGeometry, fenceMaterial);
    topRailFront.position.set(position.x, position.y + postHeight - 0.2, position.z - depth / 2);
    topRailFront.castShadow = true;
    this.fence.add(topRailFront);

    // Riel superior trasero
    const topRailBack = new THREE.Mesh(railGeometry, fenceMaterial);
    topRailBack.position.set(position.x, position.y + postHeight - 0.2, position.z + depth / 2);
    topRailBack.castShadow = true;
    this.fence.add(topRailBack);

    // Rieles laterales
    const sideRailGeometry = new THREE.BoxGeometry(railWidth, railHeight, depth);
    
    const leftRail = new THREE.Mesh(sideRailGeometry, fenceMaterial);
    leftRail.position.set(position.x - width / 2, position.y + postHeight - 0.2, position.z);
    leftRail.castShadow = true;
    this.fence.add(leftRail);

    const rightRail = new THREE.Mesh(sideRailGeometry, fenceMaterial);
    rightRail.position.set(position.x + width / 2, position.y + postHeight - 0.2, position.z);
    rightRail.castShadow = true;
    this.fence.add(rightRail);

    this.engine.scene.add(this.fence);
  }

  private createCows(position: THREE.Vector3, width: number, depth: number): void {
    // Crear 4-5 vacas distribuidas dentro del corral
    const numCows = 5;
    
    for (let i = 0; i < numCows; i++) {
      const cowX = position.x + (Math.random() - 0.5) * (width - 2);
      const cowZ = position.z + (Math.random() - 0.5) * (depth - 2);
      const cowPosition = new THREE.Vector3(cowX, 1.0, cowZ);
      
      const cow = new Cow(this.engine, cowPosition);
      this.cows.push(cow);
    }
  }

  update(deltaTime: number): void {
    // Actualizar todas las vacas
    for (const cow of this.cows) {
      cow.update(deltaTime);
    }
  }

  dispose(): void {
    this.engine.scene.remove(this.fence);
    for (const cow of this.cows) {
      cow.dispose();
    }
    console.log('[Corral] Disposed');
  }
}
