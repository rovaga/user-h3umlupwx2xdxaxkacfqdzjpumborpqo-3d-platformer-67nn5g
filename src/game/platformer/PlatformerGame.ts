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
import { Mochi, type MochiType } from './Mochi';

export class PlatformerGame implements Game {
  private engine: Engine;
  private player: Player;
  private platforms: Platform[] = [];
  private mochis: Mochi[] = [];
  private score: { green: number; blue: number; rainbow: number } = {
    green: 0,
    blue: 0,
    rainbow: 0,
  };

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup lighting
    engine.createDefaultLighting();

    // Create ground
    this.createGround();

    // Create platforms
    this.createPlatforms();

    // Create player
    this.player = new Player(engine);

    // Create mochis
    this.createMochis();

    // Display initial score
    this.updateScoreDisplay();

    console.log('[PlatformerGame] Initialized');
  }

  private createGround(): void {
    const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.8,
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
        color: 0x4a7c59,
        visible: false, // Ground mesh is already added
      })
    );
  }

  private createPlatforms(): void {
    const platformConfigs = [
      { x: 5, y: 1, z: 0, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: 10, y: 2, z: 5, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: 0, y: 1.5, z: -8, w: 6, h: 0.5, d: 4, color: 0x8b4513 },
      { x: -8, y: 2.5, z: -5, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: -5, y: 1, z: 8, w: 5, h: 0.5, d: 5, color: 0x8b4513 },
      { x: 8, y: 3, z: -8, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: 15, y: 1.5, z: -10, w: 5, h: 0.5, d: 5, color: 0x8b4513 },
      { x: -15, y: 2, z: 10, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: -12, y: 3, z: -12, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: 18, y: 2.5, z: 8, w: 5, h: 0.5, d: 4, color: 0xa0522d },
      { x: 20, y: 1, z: 15, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: -18, y: 1.5, z: -8, w: 5, h: 0.5, d: 5, color: 0xa0522d },
      { x: 12, y: 4, z: -15, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: -10, y: 1, z: 15, w: 6, h: 0.5, d: 4, color: 0xa0522d },
      { x: 25, y: 3, z: 0, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: -20, y: 2.5, z: 5, w: 5, h: 0.5, d: 5, color: 0xa0522d },
      { x: 8, y: 2, z: 20, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: -8, y: 3.5, z: -18, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: 0, y: 2, z: 22, w: 5, h: 0.5, d: 5, color: 0x8b4513 },
      { x: 15, y: 1, z: -20, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: -25, y: 1.5, z: -2, w: 5, h: 0.5, d: 4, color: 0x8b4513 },
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

  update(deltaTime: number): void {
    // Update player (handles input and movement)
    this.player.update(deltaTime, this.platforms);

    // Update mochis
    const playerPosition = this.player.getPosition();
    for (let i = this.mochis.length - 1; i >= 0; i--) {
      const mochi = this.mochis[i];
      mochi.update(deltaTime);

      // Check for collection
      if (mochi.checkCollection(playerPosition)) {
        const type = mochi.getType();
        this.score[type]++;
        this.updateScoreDisplay();
        this.mochis.splice(i, 1);
      } else if (mochi.isCollected()) {
        this.mochis.splice(i, 1);
      }
    }
  }

  onResize(width: number, height: number): void {
    // Handle resize if needed
  }

  private createMochis(): void {
    // Mochi positions on various platforms
    const mochiConfigs: Array<{ position: THREE.Vector3; type: MochiType }> = [
      // Green mochis
      { position: new THREE.Vector3(5, 2, 0), type: 'green' },
      { position: new THREE.Vector3(0, 2.5, -8), type: 'green' },
      { position: new THREE.Vector3(-5, 2, 8), type: 'green' },
      { position: new THREE.Vector3(8, 4, -8), type: 'green' },
      { position: new THREE.Vector3(-15, 3, 10), type: 'green' },
      { position: new THREE.Vector3(20, 2, 15), type: 'green' },
      { position: new THREE.Vector3(-10, 2, 15), type: 'green' },
      { position: new THREE.Vector3(0, 3, 22), type: 'green' },
      
      // Blue mochis
      { position: new THREE.Vector3(10, 3, 5), type: 'blue' },
      { position: new THREE.Vector3(-8, 3.5, -5), type: 'blue' },
      { position: new THREE.Vector3(15, 2.5, -10), type: 'blue' },
      { position: new THREE.Vector3(-12, 4, -12), type: 'blue' },
      { position: new THREE.Vector3(18, 3.5, 8), type: 'blue' },
      { position: new THREE.Vector3(-18, 2.5, -8), type: 'blue' },
      { position: new THREE.Vector3(12, 5, -15), type: 'blue' },
      { position: new THREE.Vector3(-8, 4.5, -18), type: 'blue' },
      
      // Rainbow mochis (rare, fewer of them)
      { position: new THREE.Vector3(25, 4, 0), type: 'rainbow' },
      { position: new THREE.Vector3(-20, 3.5, 5), type: 'rainbow' },
      { position: new THREE.Vector3(15, 2, -20), type: 'rainbow' },
      { position: new THREE.Vector3(-25, 2.5, -2), type: 'rainbow' },
    ];

    for (const config of mochiConfigs) {
      const mochi = new Mochi(this.engine, config.position, config.type);
      this.mochis.push(mochi);
    }
  }

  private updateScoreDisplay(): void {
    // Create or update score display
    let scoreElement = document.getElementById('mochi-score');
    if (!scoreElement) {
      scoreElement = document.createElement('div');
      scoreElement.id = 'mochi-score';
      scoreElement.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        font-size: 18px;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      `;
      document.body.appendChild(scoreElement);
    }

    const total = this.score.green + this.score.blue + this.score.rainbow;
    scoreElement.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; font-size: 20px;">🐉 Mochi Collection</div>
      <div style="color: #4caf50;">🟢 Green: ${this.score.green}</div>
      <div style="color: #2196f3;">🔵 Blue: ${this.score.blue}</div>
      <div style="background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">🌈 Rainbow: ${this.score.rainbow}</div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-weight: bold;">Total: ${total}</div>
    `;
  }

  dispose(): void {
    this.player.dispose();
    for (const platform of this.platforms) {
      platform.dispose();
    }
    for (const mochi of this.mochis) {
      mochi.dispose();
    }
    const scoreElement = document.getElementById('mochi-score');
    if (scoreElement) {
      scoreElement.remove();
    }
    console.log('[PlatformerGame] Disposed');
  }
}
