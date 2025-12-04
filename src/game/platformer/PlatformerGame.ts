/**
 * AI-EDITABLE: Platformer Game Implementation
 *
 * This file contains the main platformer game logic.
 * Feel free to modify, extend, or completely rewrite this file.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';
import { Player } from './Player';
import { Platform } from './Platform';
import { Ball } from './Ball';

export class PlatformerGame implements Game {
  private engine: Engine;
  private player: Player;
  private platforms: Platform[] = [];
  private balls: Ball[] = [];
  private ballSpawnTimer: number = 0;
  private ballSpawnInterval: number = 2.0; // Spawn a ball every 2 seconds
  private gameOver: boolean = false;

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup bright, cheerful lighting for playground
    const lighting = engine.createDefaultLighting();
    
    // Make lighting brighter and more cheerful
    lighting.ambient.intensity = 0.8; // Brighter ambient
    lighting.directional.intensity = 1.2; // Brighter directional
    
    // Add a second directional light from opposite side for softer shadows
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-10, 10, -10);
    engine.scene.add(fillLight);
    
    // Change sky color to bright blue (sunny day)
    engine.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    if (engine.scene.fog) {
      engine.scene.fog.color = new THREE.Color(0x87ceeb);
    }

    // Create ground
    this.createGround();

    // Create platforms
    this.createPlatforms();

    // Create player
    this.player = new Player(engine);

    console.log('[PlatformerGame] Initialized - Playground theme');
  }

  private createGround(): void {
    const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x7cb342, // Bright green grass color
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.engine.scene.add(ground);

    // Add ground as a platform for collision
    this.platforms.push(
      new Platform(this.engine, {
        position: new THREE.Vector3(0, -0.5, 0),
        size: new THREE.Vector3(100, 1, 100),
        color: 0x7cb342,
        visible: false, // Ground mesh is already added
      })
    );
  }

  private createPlatforms(): void {
    // Create playground equipment - colorful platforms
    const platformConfigs = [
      // Playground structures with bright, cheerful colors
      { x: 5, y: 1, z: 0, w: 4, h: 0.5, d: 4, color: 0xff6b6b }, // Red
      { x: 10, y: 2, z: 5, w: 4, h: 0.5, d: 4, color: 0x4ecdc4 }, // Teal
      { x: 0, y: 1.5, z: -8, w: 6, h: 0.5, d: 4, color: 0xffe66d }, // Yellow
      { x: -8, y: 2.5, z: -5, w: 4, h: 0.5, d: 4, color: 0x95e1d3 }, // Light blue
      { x: -5, y: 1, z: 8, w: 5, h: 0.5, d: 5, color: 0xff6b9d }, // Pink
      { x: 8, y: 3, z: -8, w: 4, h: 0.5, d: 4, color: 0xa8e6cf }, // Mint
      { x: 15, y: 1.5, z: -10, w: 5, h: 0.5, d: 5, color: 0xffd93d }, // Bright yellow
      { x: -15, y: 2, z: 10, w: 4, h: 0.5, d: 4, color: 0x6c5ce7 }, // Purple
      { x: -12, y: 3, z: -12, w: 4, h: 0.5, d: 4, color: 0xfd79a8 }, // Hot pink
      { x: 18, y: 2.5, z: 8, w: 5, h: 0.5, d: 4, color: 0x00b894 }, // Green
      { x: 20, y: 1, z: 15, w: 4, h: 0.5, d: 4, color: 0xff7675 }, // Coral
      { x: -18, y: 1.5, z: -8, w: 5, h: 0.5, d: 5, color: 0x74b9ff }, // Sky blue
      { x: 12, y: 4, z: -15, w: 4, h: 0.5, d: 4, color: 0xfdcb6e }, // Orange
      { x: -10, y: 1, z: 15, w: 6, h: 0.5, d: 4, color: 0xa29bfe }, // Lavender
      { x: 25, y: 3, z: 0, w: 4, h: 0.5, d: 4, color: 0x55efc4 }, // Turquoise
      { x: -20, y: 2.5, z: 5, w: 5, h: 0.5, d: 5, color: 0xff9ff3 }, // Magenta
      { x: 8, y: 2, z: 20, w: 4, h: 0.5, d: 4, color: 0x54a0ff }, // Blue
      { x: -8, y: 3.5, z: -18, w: 4, h: 0.5, d: 4, color: 0x5f27cd }, // Deep purple
      { x: 0, y: 2, z: 22, w: 5, h: 0.5, d: 5, color: 0x00d2d3 }, // Cyan
      { x: 15, y: 1, z: -20, w: 4, h: 0.5, d: 4, color: 0xff6348 }, // Red-orange
      { x: -25, y: 1.5, z: -2, w: 5, h: 0.5, d: 4, color: 0xff9ff3 }, // Pink
    ];

    for (const config of platformConfigs) {
      const platform = new Platform(this.engine, {
        position: new THREE.Vector3(config.x, config.y, config.z),
        size: new THREE.Vector3(config.w, config.h, config.d),
        color: config.color,
      });
      this.platforms.push(platform);
    }
  }

  private spawnBall(): void {
    // Spawn balls from random positions around the playground
    // Balls are "thrown" by children playing, so they come from various directions
    
    const playerPos = this.player.getPosition();
    
    // Random spawn position around the edges of the playground
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 10; // 15-25 units away
    const spawnX = Math.cos(angle) * distance;
    const spawnZ = Math.sin(angle) * distance;
    const spawnY = 1.5 + Math.random() * 2; // Throw from 1.5-3.5 height
    
    const spawnPosition = new THREE.Vector3(spawnX, spawnY, spawnZ);
    
    // Calculate direction towards player (with some randomness)
    const directionToPlayer = new THREE.Vector3()
      .subVectors(playerPos, spawnPosition)
      .normalize();
    
    // Add some randomness to make it less predictable
    directionToPlayer.x += (Math.random() - 0.5) * 0.3;
    directionToPlayer.y += Math.random() * 0.2; // Slight upward arc
    directionToPlayer.z += (Math.random() - 0.5) * 0.3;
    directionToPlayer.normalize();
    
    // Random speed variation
    const speed = 0.12 + Math.random() * 0.08; // 0.12-0.20
    
    const ball = new Ball(this.engine, {
      position: spawnPosition,
      direction: directionToPlayer,
      speed: speed,
    });
    
    this.balls.push(ball);
  }

  update(deltaTime: number): void {
    if (this.gameOver) {
      // Game over state - could show message or reset
      return;
    }

    // Update player (handles input and movement)
    this.player.update(deltaTime, this.platforms);

    // Spawn new balls periodically
    this.ballSpawnTimer += deltaTime;
    if (this.ballSpawnTimer >= this.ballSpawnInterval) {
      this.spawnBall();
      this.ballSpawnTimer = 0;
      // Gradually decrease spawn interval to increase difficulty
      this.ballSpawnInterval = Math.max(0.8, this.ballSpawnInterval - 0.05);
    }

    // Update balls
    const playerPos = this.player.getPosition();
    const playerRadius = this.player.getRadius();
    
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      
      if (!ball.isActive()) {
        this.balls.splice(i, 1);
        continue;
      }
      
      ball.update(deltaTime);
      
      // Check collision with player
      if (ball.checkCollision(playerPos, playerRadius)) {
        // Game over - ball hit the girl!
        this.gameOver = true;
        console.log('[PlatformerGame] Game Over - Ball hit the girl!');
        alert('¡Oh no! Te golpeó una pelota. ¡Intenta de nuevo!');
        // Could reset game here or show game over screen
        break;
      }
    }
  }

  onResize(width: number, height: number): void {
    // Handle resize if needed
  }

  dispose(): void {
    this.player.dispose();
    for (const platform of this.platforms) {
      platform.dispose();
    }
    for (const ball of this.balls) {
      ball.dispose();
    }
    console.log('[PlatformerGame] Disposed');
  }
}
