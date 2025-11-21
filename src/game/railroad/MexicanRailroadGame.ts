/**
 * AI-EDITABLE: Mexican Railroad Game Implementation
 *
 * This file contains the main Mexican railroad game logic with tacos.
 * Feel free to modify, extend, or completely rewrite this file.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';
import { RailroadTrack } from './RailroadTrack';
import { TrainCar } from './TrainCar';
import { Taco, TacoType } from './Taco';
import { RailroadPlayer } from './RailroadPlayer';

export class MexicanRailroadGame implements Game {
  private engine: Engine;
  private player: RailroadPlayer;
  private tracks: RailroadTrack[] = [];
  private trainCar: TrainCar;
  private tacos: Taco[] = [];

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup lighting with warm Mexican sunset colors
    engine.createDefaultLighting();
    
    // Add ambient light with warm tone
    const ambientLight = new THREE.AmbientLight(0xffd700, 0.4); // Golden warm light
    engine.scene.add(ambientLight);

    // Create desert ground
    this.createGround();

    // Create railroad tracks in a loop
    this.createTracks();

    // Create train car (pass all tracks for continuous loop)
    this.trainCar = new TrainCar(this.engine, this.tracks, 0);

    // Create player on the train
    this.player = new RailroadPlayer(this.engine, this.trainCar);

    // Create tacos along the tracks
    this.createTacos();

    console.log('[MexicanRailroadGame] Initialized');
  }

  private createGround(): void {
    // Desert ground with Mexican colors
    const groundGeometry = new THREE.BoxGeometry(200, 1, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2b48c, // Tan/desert color
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.engine.scene.add(ground);

    // Add some cacti for Mexican desert atmosphere
    for (let i = 0; i < 20; i++) {
      const cactusX = (Math.random() - 0.5) * 180;
      const cactusZ = (Math.random() - 0.5) * 180;
      const cactusHeight = 1 + Math.random() * 2;
      
      // Main cactus body
      const cactusGeometry = new THREE.CylinderGeometry(0.3, 0.4, cactusHeight, 8);
      const cactusMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
      const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
      cactus.position.set(cactusX, cactusHeight / 2, cactusZ);
      cactus.castShadow = true;
      this.engine.scene.add(cactus);

      // Add some arms to the cactus
      if (Math.random() > 0.5) {
        const armGeometry = new THREE.CylinderGeometry(0.2, 0.25, cactusHeight * 0.6, 8);
        const arm = new THREE.Mesh(armGeometry, cactusMaterial);
        arm.position.set(cactusX + 0.5, cactusHeight * 0.7, cactusZ);
        arm.rotation.z = Math.PI / 4;
        arm.castShadow = true;
        this.engine.scene.add(arm);
      }
    }
  }

  private createTracks(): void {
    // Create a large loop of tracks
    const trackPoints = [
      new THREE.Vector3(-50, 0, 0),
      new THREE.Vector3(0, 0, -50),
      new THREE.Vector3(50, 0, 0),
      new THREE.Vector3(0, 0, 50),
      new THREE.Vector3(-50, 0, 0), // Close the loop
    ];

    for (let i = 0; i < trackPoints.length - 1; i++) {
      const track = new RailroadTrack(this.engine, {
        start: trackPoints[i],
        end: trackPoints[i + 1],
      });
      this.tracks.push(track);
    }
  }

  private createTacos(): void {
    // Place tacos along the tracks at various positions
    const tacoSpawns = [
      { x: -40, y: 1.5, z: -10, type: TacoType.CARNITAS },
      { x: -30, y: 1.5, z: -20, type: TacoType.AL_PASTOR },
      { x: -20, y: 1.5, z: -30, type: TacoType.BARBACOA },
      { x: -10, y: 1.5, z: -40, type: TacoType.POLLO },
      { x: 0, y: 1.5, z: -45, type: TacoType.CARNE_ASADA },
      { x: 10, y: 1.5, z: -40, type: TacoType.VEGETARIANO },
      { x: 20, y: 1.5, z: -30, type: TacoType.CARNITAS },
      { x: 30, y: 1.5, z: -20, type: TacoType.AL_PASTOR },
      { x: 40, y: 1.5, z: -10, type: TacoType.BARBACOA },
      { x: 45, y: 1.5, z: 0, type: TacoType.POLLO },
      { x: 40, y: 1.5, z: 10, type: TacoType.CARNE_ASADA },
      { x: 30, y: 1.5, z: 20, type: TacoType.VEGETARIANO },
      { x: 20, y: 1.5, z: 30, type: TacoType.CARNITAS },
      { x: 10, y: 1.5, z: 40, type: TacoType.AL_PASTOR },
      { x: 0, y: 1.5, z: 45, type: TacoType.BARBACOA },
      { x: -10, y: 1.5, z: 40, type: TacoType.POLLO },
      { x: -20, y: 1.5, z: 30, type: TacoType.CARNE_ASADA },
      { x: -30, y: 1.5, z: 20, type: TacoType.VEGETARIANO },
      { x: -40, y: 1.5, z: 10, type: TacoType.CARNITAS },
      { x: -45, y: 1.5, z: 0, type: TacoType.AL_PASTOR },
    ];

    for (const spawn of tacoSpawns) {
      const taco = new Taco(this.engine, {
        type: spawn.type,
        position: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
      });
      this.tacos.push(taco);
    }
  }

  update(deltaTime: number): void {
    // Update train car
    this.trainCar.update(deltaTime);

    // Update player (handles input and movement on train)
    this.player.update(deltaTime);

    // Update tacos
    for (const taco of this.tacos) {
      if (!taco.isCollected()) {
        taco.update(deltaTime);

        // Check collision with player
        const playerPos = this.player.getPosition();
        const playerRadius = this.player.getRadius();
        if (taco.checkCollision(playerPos, playerRadius)) {
          // Add taco to player's stack
          const tacoMesh = taco.createMeshForPlayer();
          const tacoHeight = taco.getHeight();
          this.player.addTaco(tacoMesh, tacoHeight);
        }
      }
    }
  }

  onResize(width: number, height: number): void {
    // Handle resize if needed
  }

  dispose(): void {
    this.player.dispose();
    this.trainCar.dispose();
    for (const track of this.tracks) {
      track.dispose();
    }
    for (const taco of this.tacos) {
      taco.dispose();
    }
    console.log('[MexicanRailroadGame] Disposed');
  }
}
