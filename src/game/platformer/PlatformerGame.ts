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
import { Railroad } from './Railroad';
import { Train } from './Train';

export class PlatformerGame implements Game {
  private engine: Engine;
  private player: Player;
  private platforms: Platform[] = [];
  private ingredients: Ingredient[] = [];
  private railroads: Railroad[] = [];
  private trains: Train[] = [];

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

    // Create ingredients
    this.createIngredients();

    // Create railroads and trains
    this.createRailroads();

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

  private createRailroads(): void {
    // Create railroad tracks across the game world
    const railroadConfigs = [
      {
        start: new THREE.Vector3(-30, 0.5, 0),
        end: new THREE.Vector3(30, 0.5, 0),
        height: 0.5,
      },
      {
        start: new THREE.Vector3(0, 0.5, -30),
        end: new THREE.Vector3(0, 0.5, 30),
        height: 0.5,
      },
      {
        start: new THREE.Vector3(-20, 0.5, -20),
        end: new THREE.Vector3(20, 0.5, 20),
        height: 0.5,
      },
    ];

    for (const config of railroadConfigs) {
      const railroad = new Railroad(this.engine, config);
      this.railroads.push(railroad);

      // Create a train on each railroad
      const train = new Train(this.engine, {
        railroad: railroad,
        speed: 0.2 + Math.random() * 0.2, // Random speed between 0.2 and 0.4
        startPosition: Math.random(), // Random starting position
      });
      this.trains.push(train);
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

    // Update trains
    for (const train of this.trains) {
      train.update(deltaTime);
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
    for (const railroad of this.railroads) {
      railroad.dispose();
    }
    for (const train of this.trains) {
      train.dispose();
    }
    console.log('[PlatformerGame] Disposed');
  }
}
