/**
 * AI-EDITABLE: Implementación del Juego - Mujer Bailando Recolectando Tacos
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
  private tacos: Ingredient[] = [];

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

    // Crear tacos
    this.createTacos();

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

  private createTacos(): void {
    // Definir posiciones de aparición de tacos (sobre las plataformas)
    const tacoSpawns = [
      { x: 5, y: 1.75, z: 0 },
      { x: 10, y: 2.75, z: 5 },
      { x: 0, y: 2.25, z: -8 },
      { x: -8, y: 3.25, z: -5 },
      { x: -5, y: 1.75, z: 8 },
      { x: 8, y: 3.75, z: -8 },
      { x: 15, y: 2.25, z: -10 },
      { x: -15, y: 2.75, z: 10 },
      { x: -12, y: 3.75, z: -12 },
      { x: 18, y: 3.25, z: 8 },
      { x: 20, y: 1.75, z: 15 },
      { x: -18, y: 2.25, z: -8 },
      { x: 12, y: 4.75, z: -15 },
      { x: -10, y: 1.75, z: 15 },
      { x: 25, y: 3.75, z: 0 },
      { x: -20, y: 3.25, z: 5 },
      { x: 8, y: 2.75, z: 20 },
      { x: -8, y: 4.25, z: -18 },
      { x: 0, y: 2.75, z: 22 },
      { x: 15, y: 1.75, z: -20 },
    ];

    for (const spawn of tacoSpawns) {
      const taco = new Ingredient(this.engine, {
        type: IngredientType.TACO,
        position: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
      });
      this.tacos.push(taco);
    }
  }

  update(deltaTime: number): void {
    // Actualizar jugador (maneja entrada y movimiento)
    this.player.update(deltaTime, this.platforms);

    // Actualizar tacos
    for (const taco of this.tacos) {
      if (!taco.isCollected()) {
        taco.update(deltaTime);

        // Verificar colisión con jugador
        const playerPos = this.player.getPosition();
        const playerRadius = this.player.getRadius();
        if (taco.checkCollision(playerPos, playerRadius)) {
          // Agregar taco a la pila del jugador
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
    for (const platform of this.platforms) {
      platform.dispose();
    }
    for (const taco of this.tacos) {
      taco.dispose();
    }
    console.log('[PlatformerGame] Liberado');
  }
}
