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
import { Collectible, CollectibleType } from './Collectible';

export class PlatformerGame implements Game {
  private engine: Engine;
  private player: Player;
  private platforms: Platform[] = [];
  private collectibles: Collectible[] = [];
  private collectedItems: Map<CollectibleType, number> = new Map();

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

    // Initialize collected items counter
    this.collectedItems.set(CollectibleType.STRAWBERRY, 0);
    this.collectedItems.set(CollectibleType.SUGAR, 0);
    this.collectedItems.set(CollectibleType.HONEY, 0);

    // Create collectibles
    this.createCollectibles();

    // Create UI
    this.createUI();

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

  private createCollectibles(): void {
    // Place collectibles on various platforms
    const collectiblePositions = [
      // Strawberries
      { type: CollectibleType.STRAWBERRY, pos: new THREE.Vector3(5, 1.5, 0) },
      { type: CollectibleType.STRAWBERRY, pos: new THREE.Vector3(0, 2, -8) },
      { type: CollectibleType.STRAWBERRY, pos: new THREE.Vector3(-5, 1.5, 8) },
      { type: CollectibleType.STRAWBERRY, pos: new THREE.Vector3(8, 3.5, -8) },
      { type: CollectibleType.STRAWBERRY, pos: new THREE.Vector3(-15, 2.5, 10) },
      
      // Sugar
      { type: CollectibleType.SUGAR, pos: new THREE.Vector3(10, 2.5, 5) },
      { type: CollectibleType.SUGAR, pos: new THREE.Vector3(-8, 3, -5) },
      { type: CollectibleType.SUGAR, pos: new THREE.Vector3(15, 2, -10) },
      { type: CollectibleType.SUGAR, pos: new THREE.Vector3(-12, 3.5, -12) },
      { type: CollectibleType.SUGAR, pos: new THREE.Vector3(20, 1.5, 15) },
      
      // Honey
      { type: CollectibleType.HONEY, pos: new THREE.Vector3(0, 2.5, 22) },
      { type: CollectibleType.HONEY, pos: new THREE.Vector3(12, 4.5, -15) },
      { type: CollectibleType.HONEY, pos: new THREE.Vector3(-10, 1.5, 15) },
      { type: CollectibleType.HONEY, pos: new THREE.Vector3(25, 3.5, 0) },
      { type: CollectibleType.HONEY, pos: new THREE.Vector3(-25, 2, -2) },
    ];

    for (const { type, pos } of collectiblePositions) {
      const collectible = new Collectible(this.engine, type, pos);
      this.collectibles.push(collectible);
    }
  }

  private createUI(): void {
    const ui = document.createElement('div');
    ui.id = 'collectibles-ui';
    ui.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      color: white;
      background-color: rgba(0, 0, 0, 0.7);
      padding: 15px;
      border-radius: 5px;
      font-size: 16px;
      font-family: Arial, sans-serif;
      z-index: 1000;
    `;
    ui.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 10px;">🍰 Cake Ingredients</h3>
      <div id="strawberry-count">🍓 Strawberries: 0</div>
      <div id="sugar-count">🍬 Sugar: 0</div>
      <div id="honey-count">🍯 Honey: 0</div>
    `;
    document.body.appendChild(ui);
  }

  private updateUI(): void {
    const strawberryCount = this.collectedItems.get(CollectibleType.STRAWBERRY) || 0;
    const sugarCount = this.collectedItems.get(CollectibleType.SUGAR) || 0;
    const honeyCount = this.collectedItems.get(CollectibleType.HONEY) || 0;

    const strawberryEl = document.getElementById('strawberry-count');
    const sugarEl = document.getElementById('sugar-count');
    const honeyEl = document.getElementById('honey-count');

    if (strawberryEl) strawberryEl.textContent = `🍓 Strawberries: ${strawberryCount}`;
    if (sugarEl) sugarEl.textContent = `🍬 Sugar: ${sugarCount}`;
    if (honeyEl) honeyEl.textContent = `🍯 Honey: ${honeyCount}`;
  }

  update(deltaTime: number): void {
    // Update player (handles input and movement)
    this.player.update(deltaTime, this.platforms);

    // Update collectibles
    for (const collectible of this.collectibles) {
      collectible.update(deltaTime);
    }

    // Check for collection
    const playerPos = this.player.getPosition();
    const playerRadius = 0.5;

    for (const collectible of this.collectibles) {
      if (!collectible.isCollected() && collectible.checkCollision(playerPos, playerRadius)) {
        collectible.collect();
        const type = collectible.getType();
        const currentCount = this.collectedItems.get(type) || 0;
        this.collectedItems.set(type, currentCount + 1);
        this.updateUI();
        console.log(`[PlatformerGame] Collected ${type}!`);
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
    for (const collectible of this.collectibles) {
      collectible.dispose();
    }
    
    // Remove UI
    const ui = document.getElementById('collectibles-ui');
    if (ui) {
      ui.remove();
    }
    
    console.log('[PlatformerGame] Disposed');
  }
}
