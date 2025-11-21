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
import { Ingredient, IngredientType } from './Ingredient';

export class PlatformerGame implements Game {
  private engine: Engine;
  private player: Player;
  private platforms: Platform[] = [];
  private ingredients: Ingredient[] = [];

  constructor(engine: Engine) {
    this.engine = engine;

    // Set sky background to match Mexican flag theme (light blue sky)
    engine.scene.background = new THREE.Color(0x87ceeb);

    // Setup lighting
    engine.createDefaultLighting();

    // Create ground
    this.createGround();

    // Create platforms
    this.createPlatforms();

    // Create player
    this.player = new Player(engine);

    // Create ingredients
    this.createIngredients();

    console.log('[PlatformerGame] Initialized');
  }

  /**
   * Creates a Mexican flag texture (green, white, red vertical stripes)
   */
  private createMexicanFlagTexture(width: number = 512, height: number = 512): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Mexican flag colors
    const green = '#006847';
    const white = '#FFFFFF';
    const red = '#CE1126';

    // Draw three vertical stripes
    const stripeWidth = width / 3;
    
    // Green stripe (left)
    ctx.fillStyle = green;
    ctx.fillRect(0, 0, stripeWidth, height);
    
    // White stripe (middle)
    ctx.fillStyle = white;
    ctx.fillRect(stripeWidth, 0, stripeWidth, height);
    
    // Red stripe (right)
    ctx.fillStyle = red;
    ctx.fillRect(stripeWidth * 2, 0, stripeWidth, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10); // Repeat the pattern
    return texture;
  }

  private createGround(): void {
    const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    const mexicanFlagTexture = this.createMexicanFlagTexture();
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: mexicanFlagTexture,
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
    const mexicanFlagTexture = this.createMexicanFlagTexture();
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
      // Create a new texture instance for each platform with appropriate repeat
      const platformTexture = this.createMexicanFlagTexture();
      platformTexture.repeat.set(2, 2); // Smaller repeat for platforms
      const platform = new Platform(this.engine, {
        position: new THREE.Vector3(config.x, config.y, config.z),
        size: new THREE.Vector3(config.w, config.h, config.d),
        texture: platformTexture,
      });
      this.platforms.push(platform);
    }
  }

  private createIngredients(): void {
    // Define ingredient spawn positions (on top of platforms)
    const ingredientSpawns = [
      { x: 5, y: 1.75, z: 0, type: IngredientType.LETTUCE },
      { x: 10, y: 2.75, z: 5, type: IngredientType.BACON },
      { x: 0, y: 2.25, z: -8, type: IngredientType.CHEESE },
      { x: -8, y: 3.25, z: -5, type: IngredientType.TOMATO },
      { x: -5, y: 1.75, z: 8, type: IngredientType.PICKLE },
      { x: 8, y: 3.75, z: -8, type: IngredientType.ONION },
      { x: 15, y: 2.25, z: -10, type: IngredientType.LETTUCE },
      { x: -15, y: 2.75, z: 10, type: IngredientType.BACON },
      { x: -12, y: 3.75, z: -12, type: IngredientType.CHEESE },
      { x: 18, y: 3.25, z: 8, type: IngredientType.TOMATO },
      { x: 20, y: 1.75, z: 15, type: IngredientType.PICKLE },
      { x: -18, y: 2.25, z: -8, type: IngredientType.ONION },
      { x: 12, y: 4.75, z: -15, type: IngredientType.LETTUCE },
      { x: -10, y: 1.75, z: 15, type: IngredientType.BACON },
      { x: 25, y: 3.75, z: 0, type: IngredientType.CHEESE },
      { x: -20, y: 3.25, z: 5, type: IngredientType.TOMATO },
      { x: 8, y: 2.75, z: 20, type: IngredientType.PICKLE },
      { x: -8, y: 4.25, z: -18, type: IngredientType.ONION },
      { x: 0, y: 2.75, z: 22, type: IngredientType.LETTUCE },
      { x: 15, y: 1.75, z: -20, type: IngredientType.BACON },
    ];

    for (const spawn of ingredientSpawns) {
      const ingredient = new Ingredient(this.engine, {
        type: spawn.type,
        position: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
      });
      this.ingredients.push(ingredient);
    }
  }

  update(deltaTime: number): void {
    // Update player (handles input and movement)
    this.player.update(deltaTime, this.platforms);

    // Update ingredients
    for (const ingredient of this.ingredients) {
      if (!ingredient.isCollected()) {
        ingredient.update(deltaTime);

        // Check collision with player
        const playerPos = this.player.getPosition();
        const playerRadius = this.player.getRadius();
        if (ingredient.checkCollision(playerPos, playerRadius)) {
          // Add ingredient to player's stack
          const ingredientMesh = ingredient.createMeshForPlayer();
          const ingredientHeight = ingredient.getHeight();
          this.player.addIngredient(ingredientMesh, ingredientHeight);
        }
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
    for (const ingredient of this.ingredients) {
      ingredient.dispose();
    }
    console.log('[PlatformerGame] Disposed');
  }
}
