/**
 * AI-EDITABLE: Stable with Horses
 *
 * Establo con caballos que se pueden montar.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import { Horse } from './Horse';

export class Stable {
  private engine: Engine;
  private building: THREE.Group;
  private horses: Horse[] = [];

  constructor(engine: Engine) {
    this.engine = engine;

    // Crear establo en posición específica
    const stablePosition = new THREE.Vector3(15, 0, -10);
    this.createBuilding(stablePosition);

    // Crear caballos dentro del establo
    this.createHorses(stablePosition);

    console.log('[Stable] Establo creado con', this.horses.length, 'caballos');
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

    // Base del establo
    const baseGeometry = new THREE.BoxGeometry(10, 0.3, 8);
    const base = new THREE.Mesh(baseGeometry, woodMaterial);
    base.position.set(position.x, position.y + 0.15, position.z);
    base.receiveShadow = true;
    this.building.add(base);

    // Paredes
    const wallHeight = 3;
    const wallThickness = 0.2;

    // Pared frontal (con entrada)
    const frontWallGeometry = new THREE.BoxGeometry(10, wallHeight, wallThickness);
    const frontWall = new THREE.Mesh(frontWallGeometry, woodMaterial);
    frontWall.position.set(position.x, position.y + wallHeight / 2, position.z - 4);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    this.building.add(frontWall);

    // Pared trasera
    const backWall = new THREE.Mesh(frontWallGeometry, woodMaterial);
    backWall.position.set(position.x, position.y + wallHeight / 2, position.z + 4);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.building.add(backWall);

    // Paredes laterales
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 8);
    
    const leftWall = new THREE.Mesh(sideWallGeometry, woodMaterial);
    leftWall.position.set(position.x - 5, position.y + wallHeight / 2, position.z);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.building.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, woodMaterial);
    rightWall.position.set(position.x + 5, position.y + wallHeight / 2, position.z);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.building.add(rightWall);

    // Techo
    const roofGeometry = new THREE.BoxGeometry(11, 0.3, 9);
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(position.x, position.y + wallHeight + 0.5, position.z);
    roof.rotation.z = Math.PI / 12; // Inclinación del techo
    roof.castShadow = true;
    this.building.add(roof);

    // Postes de soporte
    const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, wallHeight, 8);
    const postPositions = [
      [position.x - 4, position.y + wallHeight / 2, position.z - 3.5],
      [position.x + 4, position.y + wallHeight / 2, position.z - 3.5],
      [position.x - 4, position.y + wallHeight / 2, position.z + 3.5],
      [position.x + 4, position.y + wallHeight / 2, position.z + 3.5],
    ];

    for (const [x, y, z] of postPositions) {
      const post = new THREE.Mesh(postGeometry, woodMaterial);
      post.position.set(x, y, z);
      post.castShadow = true;
      this.building.add(post);
    }

    this.engine.scene.add(this.building);
  }

  private createHorses(position: THREE.Vector3): void {
    // Crear 3 caballos dentro del establo
    const numHorses = 3;
    const horsePositions = [
      new THREE.Vector3(position.x - 2.5, 1.0, position.z - 1),
      new THREE.Vector3(position.x, 1.0, position.z),
      new THREE.Vector3(position.x + 2.5, 1.0, position.z + 1),
    ];

    for (let i = 0; i < numHorses && i < horsePositions.length; i++) {
      const horse = new Horse(this.engine, horsePositions[i]);
      this.horses.push(horse);
    }
  }

  getNearestHorse(cowboyPosition: THREE.Vector3): THREE.Group | null {
    let nearestHorse: THREE.Group | null = null;
    let minDistance = Infinity;

    for (const horse of this.horses) {
      const horsePos = new THREE.Vector3();
      horse.getMesh().getWorldPosition(horsePos);
      const distance = cowboyPosition.distanceTo(horsePos);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestHorse = horse.getMesh();
      }
    }

    return nearestHorse;
  }

  getHorseByMesh(mesh: THREE.Group): Horse | null {
    for (const horse of this.horses) {
      if (horse.getMesh() === mesh) {
        return horse;
      }
    }
    return null;
  }

  update(deltaTime: number): void {
    // Actualizar todos los caballos
    for (const horse of this.horses) {
      horse.update(deltaTime);
    }
  }

  dispose(): void {
    this.engine.scene.remove(this.building);
    for (const horse of this.horses) {
      horse.dispose();
    }
    console.log('[Stable] Disposed');
  }
}
