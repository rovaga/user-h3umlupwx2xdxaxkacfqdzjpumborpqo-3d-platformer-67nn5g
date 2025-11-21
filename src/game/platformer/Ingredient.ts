/**
 * AI-EDITABLE: Objetos Recolectables de la Revolución
 *
 * Este archivo define objetos recolectables que el revolucionario puede recoger.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum IngredientType {
  BALA = 'bala',
  MUNICION = 'municion',
  DOCUMENTO = 'documento',
  BANDERA = 'bandera',
  MEDALLA = 'medalla',
  CARTUCHO = 'cartucho',
}

interface IngredientConfig {
  type: IngredientType;
  position: THREE.Vector3;
}

export class Ingredient {
  private engine: Engine;
  private mesh: THREE.Mesh;
  private type: IngredientType;
  private position: THREE.Vector3;
  private collected: boolean = false;
  private rotationSpeed: number = 0.02;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.001;

  // Propiedades de los objetos de la revolución
  private static readonly INGREDIENT_CONFIGS = {
    [IngredientType.BALA]: {
      color: 0x8B7355, // Color dorado/cobre de las balas
      height: 0.15,
      geometry: () => new THREE.CylinderGeometry(0.1, 0.1, 0.15, 8),
    },
    [IngredientType.MUNICION]: {
      color: 0x2F4F4F, // Color gris oscuro de la munición
      height: 0.2,
      geometry: () => new THREE.BoxGeometry(0.3, 0.2, 0.2),
    },
    [IngredientType.DOCUMENTO]: {
      color: 0xFFF8DC, // Color beige del papel
      height: 0.05,
      geometry: () => new THREE.BoxGeometry(0.4, 0.05, 0.3),
    },
    [IngredientType.BANDERA]: {
      color: 0x006847, // Color verde de la bandera mexicana
      height: 0.3,
      geometry: () => new THREE.BoxGeometry(0.1, 0.3, 0.4),
    },
    [IngredientType.MEDALLA]: {
      color: 0xFFD700, // Color dorado de las medallas
      height: 0.1,
      geometry: () => new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16),
    },
    [IngredientType.CARTUCHO]: {
      color: 0x654321, // Color café de los cartuchos
      height: 0.25,
      geometry: () => new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8),
    },
  };

  constructor(engine: Engine, config: IngredientConfig) {
    this.engine = engine;
    this.type = config.type;
    this.position = config.position.clone();

    const config_data = Ingredient.INGREDIENT_CONFIGS[config.type];
    const geometry = config_data.geometry();
    const material = new THREE.MeshStandardMaterial({
      color: config_data.color,
      roughness: 0.6,
      metalness: config.type === IngredientType.CHEESE ? 0.3 : 0,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Offset aleatorio de flotación para variación
    this.floatOffset = Math.random() * Math.PI * 2;

    engine.scene.add(this.mesh);
    console.log(`[Ingredient] Creado ${config.type} en`, config.position);
  }

  update(deltaTime: number): void {
    if (this.collected) return;

    // Animación de rotación y flotación
    this.mesh.rotation.y += this.rotationSpeed;
    this.floatOffset += this.floatSpeed;
    this.mesh.position.y = this.position.y + Math.sin(this.floatOffset) * 0.1;
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    if (this.collected) return false;

    const distance = this.mesh.position.distanceTo(playerPosition);
    const collectDistance = playerRadius + 0.3;

    if (distance < collectDistance) {
      this.collect();
      return true;
    }

    return false;
  }

  private collect(): void {
    this.collected = true;
    this.engine.scene.remove(this.mesh);
    console.log(`[Ingredient] Recolectado ${this.type}`);
  }

  isCollected(): boolean {
    return this.collected;
  }

  getType(): IngredientType {
    return this.type;
  }

  createMeshForPlayer(): THREE.Mesh {
    // Crear un nuevo mesh para la pila del jugador (ya que removimos el original)
    const config_data = Ingredient.INGREDIENT_CONFIGS[this.type];
    const geometry = config_data.geometry();
    const material = new THREE.MeshStandardMaterial({
      color: config_data.color,
      roughness: 0.6,
      metalness: this.type === IngredientType.MEDALLA ? 0.5 : 0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  getHeight(): number {
    return Ingredient.INGREDIENT_CONFIGS[this.type].height;
  }

  dispose(): void {
    if (!this.collected && this.mesh) {
      this.engine.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
  }
}
