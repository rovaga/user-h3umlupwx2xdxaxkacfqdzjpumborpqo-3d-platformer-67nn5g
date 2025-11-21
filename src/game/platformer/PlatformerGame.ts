/**
 * AI-EDITABLE: Implementación del Juego de la Revolución Mexicana
 *
 * Este archivo contiene la lógica principal del juego.
 * Siéntete libre de modificar, extender o reescribir completamente este archivo.
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
  private supplies: Ingredient[] = [];

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup lighting
    engine.createDefaultLighting();

    // Crear terreno
    this.createGround();

    // Crear plataformas
    this.createPlatforms();

    // Crear jugador
    this.player = new Player(engine);

    // Crear suministros
    this.createSupplies();

    console.log('[PlatformerGame] Inicializado');
  }

  private createGround(): void {
    const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Color tierra mexicana (café rojizo)
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.engine.scene.add(ground);

    // Agregar terreno como plataforma para colisión
    this.platforms.push(
      new Platform(this.engine, {
        position: new THREE.Vector3(0, -0.5, 0),
        size: new THREE.Vector3(100, 1, 100),
        color: 0x8B4513,
        visible: false, // El mesh del terreno ya está agregado
      })
    );
  }

  private createPlatforms(): void {
    // Crear plataformas que simulan edificios y estructuras de la época revolucionaria
    const platformConfigs = [
      { x: 5, y: 1, z: 0, w: 4, h: 0.5, d: 4, color: 0x8B4513 }, // Adobe
      { x: 10, y: 2, z: 5, w: 4, h: 0.5, d: 4, color: 0xA0522D }, // Ladrillo
      { x: 0, y: 1.5, z: -8, w: 6, h: 0.5, d: 4, color: 0x8B4513 },
      { x: -8, y: 2.5, z: -5, w: 4, h: 0.5, d: 4, color: 0xA0522D },
      { x: -5, y: 1, z: 8, w: 5, h: 0.5, d: 5, color: 0x8B4513 },
      { x: 8, y: 3, z: -8, w: 4, h: 0.5, d: 4, color: 0xA0522D },
      { x: 15, y: 1.5, z: -10, w: 5, h: 0.5, d: 5, color: 0x8B4513 },
      { x: -15, y: 2, z: 10, w: 4, h: 0.5, d: 4, color: 0xA0522D },
      { x: -12, y: 3, z: -12, w: 4, h: 0.5, d: 4, color: 0x8B4513 },
      { x: 18, y: 2.5, z: 8, w: 5, h: 0.5, d: 4, color: 0xA0522D },
      { x: 20, y: 1, z: 15, w: 4, h: 0.5, d: 4, color: 0x8B4513 },
      { x: -18, y: 1.5, z: -8, w: 5, h: 0.5, d: 5, color: 0xA0522D },
      { x: 12, y: 4, z: -15, w: 4, h: 0.5, d: 4, color: 0x8B4513 },
      { x: -10, y: 1, z: 15, w: 6, h: 0.5, d: 4, color: 0xA0522D },
      { x: 25, y: 3, z: 0, w: 4, h: 0.5, d: 4, color: 0x8B4513 },
      { x: -20, y: 2.5, z: 5, w: 5, h: 0.5, d: 5, color: 0xA0522D },
      { x: 8, y: 2, z: 20, w: 4, h: 0.5, d: 4, color: 0x8B4513 },
      { x: -8, y: 3.5, z: -18, w: 4, h: 0.5, d: 4, color: 0xA0522D },
      { x: 0, y: 2, z: 22, w: 5, h: 0.5, d: 5, color: 0x8B4513 },
      { x: 15, y: 1, z: -20, w: 4, h: 0.5, d: 4, color: 0xA0522D },
      { x: -25, y: 1.5, z: -2, w: 5, h: 0.5, d: 4, color: 0x8B4513 },
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

  private createSupplies(): void {
    // Definir posiciones de aparición de suministros (sobre las plataformas)
    const supplySpawns = [
      { x: 5, y: 1.75, z: 0, type: IngredientType.BALA },
      { x: 10, y: 2.75, z: 5, type: IngredientType.MUNICION },
      { x: 0, y: 2.25, z: -8, type: IngredientType.DOCUMENTO },
      { x: -8, y: 3.25, z: -5, type: IngredientType.BANDERA },
      { x: -5, y: 1.75, z: 8, type: IngredientType.MEDALLA },
      { x: 8, y: 3.75, z: -8, type: IngredientType.CARTUCHO },
      { x: 15, y: 2.25, z: -10, type: IngredientType.BALA },
      { x: -15, y: 2.75, z: 10, type: IngredientType.MUNICION },
      { x: -12, y: 3.75, z: -12, type: IngredientType.DOCUMENTO },
      { x: 18, y: 3.25, z: 8, type: IngredientType.BANDERA },
      { x: 20, y: 1.75, z: 15, type: IngredientType.MEDALLA },
      { x: -18, y: 2.25, z: -8, type: IngredientType.CARTUCHO },
      { x: 12, y: 4.75, z: -15, type: IngredientType.BALA },
      { x: -10, y: 1.75, z: 15, type: IngredientType.MUNICION },
      { x: 25, y: 3.75, z: 0, type: IngredientType.DOCUMENTO },
      { x: -20, y: 3.25, z: 5, type: IngredientType.BANDERA },
      { x: 8, y: 2.75, z: 20, type: IngredientType.MEDALLA },
      { x: -8, y: 4.25, z: -18, type: IngredientType.CARTUCHO },
      { x: 0, y: 2.75, z: 22, type: IngredientType.BALA },
      { x: 15, y: 1.75, z: -20, type: IngredientType.MUNICION },
    ];

    for (const spawn of supplySpawns) {
      const supply = new Ingredient(this.engine, {
        type: spawn.type,
        position: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
      });
      this.supplies.push(supply);
    }
  }

  update(deltaTime: number): void {
    // Actualizar jugador (maneja entrada y movimiento)
    this.player.update(deltaTime, this.platforms);

    // Actualizar suministros
    for (const supply of this.supplies) {
      if (!supply.isCollected()) {
        supply.update(deltaTime);

        // Verificar colisión con jugador
        const playerPos = this.player.getPosition();
        const playerRadius = this.player.getRadius();
        if (supply.checkCollision(playerPos, playerRadius)) {
          // Agregar suministro a la pila del jugador
          const supplyMesh = supply.createMeshForPlayer();
          const supplyHeight = supply.getHeight();
          this.player.addSupply(supplyMesh, supplyHeight);
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
    for (const supply of this.supplies) {
      supply.dispose();
    }
    console.log('[PlatformerGame] Liberado');
  }
}
