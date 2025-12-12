/**
 * AI-EDITABLE: Desert Ranch Game Implementation
 *
 * This file contains the main desert ranch game logic.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';
import { CowboyPlayer } from './CowboyPlayer';
import { Choya } from './Choya';
import { BarrelCactus } from './BarrelCactus';
import { Horse } from './Horse';
import { Cow } from './Cow';
import { Chicken } from './Chicken';

interface SpineData {
  mesh: THREE.Mesh;
  startTime: number;
  fadeDuration: number;
}

export class RanchGame implements Game {
  private engine: Engine;
  private player: CowboyPlayer;
  private choyas: Choya[] = [];
  private barrelCacti: BarrelCactus[] = [];
  private horses: Horse[] = [];
  private cows: Cow[] = [];
  private chickens: Chicken[] = [];
  private livesUI: HTMLElement | null = null;
  private activeSpines: SpineData[] = [];

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup desert lighting (bright, warm sun)
    this.setupDesertLighting();

    // Create desert ground
    this.createDesertGround();

    // Position camera initially
    this.engine.camera.position.set(0, 5, 10);
    this.engine.camera.lookAt(0, 0, 0);

    // Create player (cowboy)
    this.player = new CowboyPlayer(engine);

    // Create choyas (dangerous cacti)
    this.createChoyas();

    // Create barrel cacti (smaller cacti)
    this.createBarrelCacti();

    // Create animals
    this.createAnimals();

    // Setup UI for lives
    this.setupLivesUI();

    console.log('[RanchGame] Initialized');
  }

  private setupDesertLighting(): void {
    // Warm desert ambient light
    const ambient = new THREE.AmbientLight(0xfff5e1, 0.7);
    this.engine.scene.add(ambient);

    // Bright desert sun
    const directional = new THREE.DirectionalLight(0xfff5e1, 1.2);
    directional.position.set(15, 25, 10);
    directional.castShadow = true;
    directional.shadow.camera.left = -60;
    directional.shadow.camera.right = 60;
    directional.shadow.camera.top = 60;
    directional.shadow.camera.bottom = -60;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    this.engine.scene.add(directional);

    // Desert sky color
    this.engine.scene.background = new THREE.Color(0xe0f2ff);
    this.engine.scene.fog = new THREE.Fog(0xe0f2ff, 30, 100);
  }

  private createDesertGround(): void {
    // Large desert ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2b48c, // Tan desert color
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.engine.scene.add(ground);

    // Add some desert rocks/debris for atmosphere
    for (let i = 0; i < 30; i++) {
      const rockSize = Math.random() * 0.5 + 0.2;
      const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.9,
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 180,
        rockSize,
        (Math.random() - 0.5) * 180
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.engine.scene.add(rock);
    }
  }

  private createChoyas(): void {
    // Create choyas scattered around the desert
    const choyaPositions = [
      { x: 10, z: 5 },
      { x: -8, z: 12 },
      { x: 15, z: -10 },
      { x: -12, z: -8 },
      { x: 20, z: 15 },
      { x: -15, z: 20 },
      { x: 8, z: -15 },
      { x: -20, z: -12 },
      { x: 25, z: 8 },
      { x: -25, z: 5 },
      { x: 12, z: 25 },
      { x: -8, z: -25 },
      { x: 18, z: -20 },
      { x: -18, z: 18 },
      { x: 30, z: -15 },
    ];

    for (const pos of choyaPositions) {
      const choya = new Choya(this.engine, {
        position: new THREE.Vector3(pos.x, 0, pos.z),
      });
      this.choyas.push(choya);
    }
  }

  private createBarrelCacti(): void {
    // Create barrel cacti scattered around the desert (more numerous, smaller)
    const barrelCactusPositions = [
      { x: 5, z: 3 },
      { x: -5, z: 7 },
      { x: 7, z: -5 },
      { x: -7, z: -6 },
      { x: 12, z: 8 },
      { x: -12, z: 10 },
      { x: 9, z: -12 },
      { x: -9, z: -14 },
      { x: 16, z: 4 },
      { x: -16, z: 6 },
      { x: 11, z: 18 },
      { x: -11, z: -18 },
      { x: 22, z: -8 },
      { x: -22, z: 12 },
      { x: 14, z: 22 },
      { x: -14, z: -22 },
      { x: 28, z: 10 },
      { x: -28, z: -10 },
      { x: 6, z: 14 },
      { x: -6, z: -16 },
    ];

    for (const pos of barrelCactusPositions) {
      const barrelCactus = new BarrelCactus(this.engine, {
        position: new THREE.Vector3(pos.x, 0, pos.z),
      });
      this.barrelCacti.push(barrelCactus);
    }
  }

  private createAnimals(): void {
    // Create horses
    const horsePositions = [
      { x: 5, z: 8 },
      { x: -5, z: 10 },
      { x: 12, z: -5 },
    ];

    for (const pos of horsePositions) {
      const horse = new Horse(this.engine, {
        position: new THREE.Vector3(pos.x, 0, pos.z),
      });
      this.horses.push(horse);
    }

    // Create cows
    const cowPositions = [
      { x: -10, z: 5 },
      { x: 8, z: -8 },
      { x: -15, z: -10 },
      { x: 15, z: 12 },
    ];

    for (const pos of cowPositions) {
      const cow = new Cow(this.engine, {
        position: new THREE.Vector3(pos.x, 0, pos.z),
      });
      this.cows.push(cow);
    }

    // Create chickens
    const chickenPositions = [
      { x: 3, z: 3 },
      { x: -3, z: 4 },
      { x: 6, z: -3 },
      { x: -6, z: -4 },
      { x: 10, z: 2 },
      { x: -10, z: -2 },
    ];

    for (const pos of chickenPositions) {
      const chicken = new Chicken(this.engine, {
        position: new THREE.Vector3(pos.x, 0, pos.z),
      });
      this.chickens.push(chicken);
    }
  }

  private setupLivesUI(): void {
    // Create lives display
    this.livesUI = document.createElement('div');
    this.livesUI.id = 'lives-ui';
    this.livesUI.style.position = 'fixed';
    this.livesUI.style.top = '20px';
    this.livesUI.style.left = '20px';
    this.livesUI.style.color = '#fff';
    this.livesUI.style.fontSize = '24px';
    this.livesUI.style.fontWeight = 'bold';
    this.livesUI.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    this.livesUI.style.zIndex = '1000';
    document.body.appendChild(this.livesUI);
    this.updateLivesUI();
  }

  private updateLivesUI(): void {
    if (this.livesUI) {
      const lives = this.player.getLives();
      this.livesUI.textContent = `❤️ Vidas: ${lives}`;
      
      if (lives <= 0) {
        this.livesUI.textContent = '💀 ¡Game Over!';
        this.livesUI.style.color = '#ff0000';
      }
    }
  }

  update(deltaTime: number): void {
    // Update player
    this.player.update(deltaTime);

    // Update choyas
    for (const choya of this.choyas) {
      choya.update(deltaTime);

      // Check collision with player
      const playerPos = this.player.getPosition();
      const playerRadius = this.player.getRadius();
      if (choya.checkCollision(playerPos, playerRadius)) {
        // Player takes damage
        this.player.takeDamage();
        this.updateLivesUI();
        
        // Create visual effect (spines sticking to player)
        const playerMesh = this.player.getMesh();
        const spines = choya.createSpineEffect(playerPos, playerMesh);
        const now = Date.now();
        for (const spine of spines) {
          this.activeSpines.push({
            mesh: spine,
            startTime: now,
            fadeDuration: 3000, // 3 seconds
          });
        }
      }
    }

    // Update barrel cacti
    for (const barrelCactus of this.barrelCacti) {
      barrelCactus.update(deltaTime);

      // Check collision with player
      const playerPos = this.player.getPosition();
      const playerRadius = this.player.getRadius();
      if (barrelCactus.checkCollision(playerPos, playerRadius)) {
        // Player takes damage
        this.player.takeDamage();
        this.updateLivesUI();
        
        // Create visual effect (spines sticking to player)
        const playerMesh = this.player.getMesh();
        const spines = barrelCactus.createSpineEffect(playerPos, playerMesh);
        const now = Date.now();
        for (const spine of spines) {
          this.activeSpines.push({
            mesh: spine,
            startTime: now,
            fadeDuration: 3000, // 3 seconds
          });
        }
      }
    }

    // Update active spines (fade out over time)
    const now = Date.now();
    const playerMesh = this.player.getMesh();
    for (let i = this.activeSpines.length - 1; i >= 0; i--) {
      const spineData = this.activeSpines[i];
      const elapsed = now - spineData.startTime;
      
      if (elapsed >= spineData.fadeDuration) {
        // Remove spine
        playerMesh.remove(spineData.mesh);
        spineData.mesh.geometry.dispose();
        (spineData.mesh.material as THREE.Material).dispose();
        this.activeSpines.splice(i, 1);
      } else {
        // Fade out opacity
        const opacity = 1.0 - (elapsed / spineData.fadeDuration);
        (spineData.mesh.material as THREE.MeshStandardMaterial).opacity = opacity;
      }
    }

    // Update animals
    for (const horse of this.horses) {
      horse.update(deltaTime);
    }

    for (const cow of this.cows) {
      cow.update(deltaTime);
    }

    for (const chicken of this.chickens) {
      chicken.update(deltaTime);
    }
  }

  onResize(width: number, height: number): void {
    // Handle resize if needed
  }

  dispose(): void {
    // Clean up active spines
    const playerMesh = this.player.getMesh();
    for (const spineData of this.activeSpines) {
      playerMesh.remove(spineData.mesh);
      spineData.mesh.geometry.dispose();
      (spineData.mesh.material as THREE.Material).dispose();
    }
    this.activeSpines = [];
    
    this.player.dispose();
    
    for (const choya of this.choyas) {
      choya.dispose();
    }
    
    for (const barrelCactus of this.barrelCacti) {
      barrelCactus.dispose();
    }
    
    for (const horse of this.horses) {
      horse.dispose();
    }
    
    for (const cow of this.cows) {
      cow.dispose();
    }
    
    for (const chicken of this.chickens) {
      chicken.dispose();
    }

    if (this.livesUI) {
      document.body.removeChild(this.livesUI);
    }

    console.log('[RanchGame] Disposed');
  }
}
