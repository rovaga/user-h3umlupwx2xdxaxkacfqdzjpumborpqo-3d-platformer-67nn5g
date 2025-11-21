/**
 * AI-EDITABLE: Pikachu Boat Game
 *
 * Main game class for Pikachu exploring new lands on a boat.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';
import { Ocean } from './Ocean';
import { Boat } from './Boat';
import { Island } from './Island';

export class PikachuBoatGame implements Game {
  private engine: Engine;
  private ocean: Ocean;
  private boat: Boat;
  private islands: Island[] = [];
  private discoveredCount: number = 0;
  private skybox: THREE.Mesh | null = null;

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup lighting (sunlight)
    const { ambient, directional } = engine.createDefaultLighting();
    
    // Enhance directional light for ocean scene
    directional.position.set(20, 30, 10);
    directional.intensity = 1.2;

    // Create skybox (simple gradient sky)
    this.createSkybox();

    // Create ocean
    this.ocean = new Ocean(engine);

    // Create boat at starting position
    this.boat = new Boat(engine, this.ocean, new THREE.Vector3(0, 0, 0));

    // Create islands scattered across the ocean
    this.createIslands();

    // Setup camera to follow boat
    this.setupCamera();

    console.log('[PikachuBoatGame] Initialized - ¡El gato está listo para descubrir nuevas tierras!');
  }

  private createSkybox(): void {
    // Create a large sphere for sky
    const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87ceeb, // Sky blue
      side: THREE.BackSide,
      fog: false,
    });
    this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    this.engine.scene.add(this.skybox);

    // Add some clouds (simple white spheres)
    for (let i = 0; i < 20; i++) {
      const cloudGeometry = new THREE.SphereGeometry(15 + Math.random() * 10, 16, 16);
      const cloudMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      });
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 300,
        100 + Math.random() * 50,
        (Math.random() - 0.5) * 300
      );
      this.engine.scene.add(cloud);
    }
  }

  private createIslands(): void {
    // Create multiple islands at different positions
    const islandPositions = [
      new THREE.Vector3(30, 0, 20),
      new THREE.Vector3(-25, 0, 35),
      new THREE.Vector3(40, 0, -30),
      new THREE.Vector3(-35, 0, -25),
      new THREE.Vector3(50, 0, 15),
      new THREE.Vector3(-20, 0, -40),
      new THREE.Vector3(25, 0, -35),
      new THREE.Vector3(-45, 0, 20),
      new THREE.Vector3(35, 0, 40),
      new THREE.Vector3(-30, 0, -30),
      new THREE.Vector3(60, 0, -20),
      new THREE.Vector3(-50, 0, 10),
    ];

    for (const pos of islandPositions) {
      const size = 4 + Math.random() * 3; // Random size between 4-7
      const height = 1.5 + Math.random() * 1.5; // Random height
      const island = new Island(this.engine, pos, size, height);
      this.islands.push(island);
    }

    console.log(`[PikachuBoatGame] Created ${this.islands.length} islands to discover`);
  }

  private setupCamera(): void {
    // Camera will follow boat from behind
    const camera = this.engine.camera;
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);
  }

  update(deltaTime: number): void {
    // Update ocean waves
    this.ocean.update(deltaTime);

    // Update boat
    this.boat.update(deltaTime);

    // Update islands
    for (const island of this.islands) {
      island.update(deltaTime);

      // Check if boat discovered this island
      const boatPos = this.boat.getPosition();
      if (island.checkDiscovery(boatPos)) {
        this.discoveredCount++;
        console.log(`[PikachuBoatGame] ¡Nueva tierra descubierta! Total: ${this.discoveredCount}/${this.islands.length}`);
      }
    }

    // Update camera to follow boat
    this.updateCamera();
  }

  private updateCamera(): void {
    const boatPos = this.boat.getPosition();
    const boatRotation = this.boat.getRotation();

    // Camera follows boat from behind and slightly above
    const cameraDistance = 12;
    const cameraHeight = 8;
    const cameraAngle = boatRotation + Math.PI; // Behind boat

    const camera = this.engine.camera;
    camera.position.x = boatPos.x + Math.sin(cameraAngle) * cameraDistance;
    camera.position.y = boatPos.y + cameraHeight;
    camera.position.z = boatPos.z + Math.cos(cameraAngle) * cameraDistance;

    // Look ahead of boat
    const lookAhead = 5;
    const lookX = boatPos.x + Math.sin(boatRotation) * lookAhead;
    const lookZ = boatPos.z + Math.cos(boatRotation) * lookAhead;
    camera.lookAt(lookX, boatPos.y + 2, lookZ);
  }

  onResize(width: number, height: number): void {
    // Camera aspect ratio is handled by engine
  }

  dispose(): void {
    this.ocean.dispose();
    this.boat.dispose();
    
    for (const island of this.islands) {
      island.dispose();
    }

    if (this.skybox) {
      this.engine.scene.remove(this.skybox);
      this.skybox.geometry.dispose();
      (this.skybox.material as THREE.Material).dispose();
    }

    console.log('[PikachuBoatGame] Disposed');
  }
}
