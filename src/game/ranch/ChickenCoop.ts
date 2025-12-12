/**
 * AI-EDITABLE: Chicken Coop with Chickens and Chicks
 *
 * Gallinero con gallinas y pollitos.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import { Chicken } from './Chicken';
import { Chick } from './Chick';

export class ChickenCoop {
  private engine: Engine;
  private building: THREE.Group;
  private chickens: Chicken[] = [];
  private chicks: Chick[] = [];

  constructor(engine: Engine) {
    this.engine = engine;

    // Crear gallinero en posición específica
    const coopPosition = new THREE.Vector3(-10, 0, -15);
    this.createBuilding(coopPosition);

    // Crear área cercada alrededor del gallinero
    this.createFence(coopPosition);

    // Crear gallinas y pollitos
    this.createChickens(coopPosition);
    this.createChicks(coopPosition);

    console.log('[ChickenCoop] Gallinero creado con', this.chickens.length, 'gallinas y', this.chicks.length, 'pollitos');
  }

  private createBuilding(position: THREE.Vector3): void {
    this.building = new THREE.Group();

    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });

    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.7,
    });

    // Base del gallinero
    const baseGeometry = new THREE.BoxGeometry(6, 0.2, 5);
    const base = new THREE.Mesh(baseGeometry, woodMaterial);
    base.position.set(position.x, position.y + 0.1, position.z);
    base.receiveShadow = true;
    this.building.add(base);

    // Paredes más bajas (gallinero pequeño)
    const wallHeight = 2;
    const wallThickness = 0.15;

    // Pared frontal (con pequeña entrada)
    const frontWallGeometry = new THREE.BoxGeometry(6, wallHeight, wallThickness);
    const frontWall = new THREE.Mesh(frontWallGeometry, woodMaterial);
    frontWall.position.set(position.x, position.y + wallHeight / 2, position.z - 2.5);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    this.building.add(frontWall);

    // Pared trasera
    const backWall = new THREE.Mesh(frontWallGeometry, woodMaterial);
    backWall.position.set(position.x, position.y + wallHeight / 2, position.z + 2.5);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.building.add(backWall);

    // Paredes laterales
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 5);
    
    const leftWall = new THREE.Mesh(sideWallGeometry, woodMaterial);
    leftWall.position.set(position.x - 3, position.y + wallHeight / 2, position.z);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.building.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, woodMaterial);
    rightWall.position.set(position.x + 3, position.y + wallHeight / 2, position.z);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.building.add(rightWall);

    // Techo inclinado
    const roofGeometry = new THREE.BoxGeometry(6.5, 0.2, 5.5);
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(position.x, position.y + wallHeight + 0.3, position.z);
    roof.rotation.z = Math.PI / 10;
    roof.castShadow = true;
    this.building.add(roof);

    // Ventana pequeña
    const windowGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x87ceeb });
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(position.x, position.y + 1.2, position.z - 2.4);
    this.building.add(window);

    this.engine.scene.add(this.building);
  }

  private createFence(position: THREE.Vector3): void {
    const fenceGroup = new THREE.Group();
    const fenceMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });

    const fenceHeight = 0.8;
    const fenceWidth = 0.1;
    const areaSize = 10;

    // Crear cerca alrededor del área
    const numPosts = 12;
    const postGeometry = new THREE.BoxGeometry(fenceWidth, fenceHeight, fenceWidth);
    
    for (let i = 0; i < numPosts; i++) {
      const angle = (i / numPosts) * Math.PI * 2;
      const post = new THREE.Mesh(postGeometry, fenceMaterial);
      post.position.set(
        position.x + Math.cos(angle) * (areaSize / 2),
        position.y + fenceHeight / 2,
        position.z + Math.sin(angle) * (areaSize / 2)
      );
      post.castShadow = true;
      fenceGroup.add(post);
    }

    // Barras horizontales
    const railGeometry = new THREE.BoxGeometry(areaSize, 0.08, 0.08);
    const topRail = new THREE.Mesh(railGeometry, fenceMaterial);
    topRail.position.set(position.x, position.y + fenceHeight - 0.1, position.z);
    topRail.rotation.y = Math.PI / 4;
    topRail.castShadow = true;
    fenceGroup.add(topRail);

    this.engine.scene.add(fenceGroup);
  }

  private createChickens(position: THREE.Vector3): void {
    // Crear 4-5 gallinas distribuidas alrededor del gallinero
    const numChickens = 5;
    
    for (let i = 0; i < numChickens; i++) {
      const angle = (i / numChickens) * Math.PI * 2;
      const distance = 3 + Math.random() * 2;
      const chickenX = position.x + Math.cos(angle) * distance;
      const chickenZ = position.z + Math.sin(angle) * distance;
      const chickenPosition = new THREE.Vector3(chickenX, 0.5, chickenZ);
      
      const chicken = new Chicken(this.engine, chickenPosition);
      this.chickens.push(chicken);
    }
  }

  private createChicks(position: THREE.Vector3): void {
    // Crear 6-8 pollitos pequeños cerca de las gallinas
    const numChicks = 7;
    
    for (let i = 0; i < numChicks; i++) {
      const angle = (i / numChicks) * Math.PI * 2;
      const distance = 2 + Math.random() * 1.5;
      const chickX = position.x + Math.cos(angle) * distance;
      const chickZ = position.z + Math.sin(angle) * distance;
      const chickPosition = new THREE.Vector3(chickX, 0.2, chickZ);
      
      const chick = new Chick(this.engine, chickPosition);
      this.chicks.push(chick);
    }
  }

  update(deltaTime: number): void {
    // Actualizar todas las gallinas
    for (const chicken of this.chickens) {
      chicken.update(deltaTime);
    }

    // Actualizar todos los pollitos
    for (const chick of this.chicks) {
      chick.update(deltaTime);
    }
  }

  dispose(): void {
    this.engine.scene.remove(this.building);
    for (const chicken of this.chickens) {
      chicken.dispose();
    }
    for (const chick of this.chicks) {
      chick.dispose();
    }
    console.log('[ChickenCoop] Disposed');
  }
}
