/**
 * AI-EDITABLE: Objetos Recolectables - Tacos
 *
 * Este archivo define objetos recolectables que la mujer bailando puede recoger.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum IngredientType {
  TACO = 'taco',
}

interface IngredientConfig {
  type: IngredientType;
  position: THREE.Vector3;
}

export class Ingredient {
  private engine: Engine;
  private mesh: THREE.Mesh | THREE.Group;
  private type: IngredientType;
  private position: THREE.Vector3;
  private collected: boolean = false;
  private rotationSpeed: number = 0.02;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.001;

  // Propiedades de los tacos
  private static readonly INGREDIENT_CONFIGS = {
    [IngredientType.TACO]: {
      color: 0xFFD700, // Color dorado de la tortilla
      height: 0.2,
      geometry: () => {
        // Crear forma de taco (tortilla doblada en forma de U)
        const group = new THREE.Group();
        
        // Tortilla (forma de U usando un cilindro parcialmente cortado)
        // Usar un torus cortado para simular la forma de taco
        const tortillaGeometry = new THREE.TorusGeometry(0.15, 0.05, 8, 16, Math.PI);
        const tortillaMaterial = new THREE.MeshStandardMaterial({
          color: 0xFFD700, // Dorado de la tortilla
          roughness: 0.7,
        });
        const tortilla = new THREE.Mesh(tortillaGeometry, tortillaMaterial);
        tortilla.rotation.z = Math.PI / 2;
        tortilla.rotation.x = Math.PI / 2;
        group.add(tortilla);
        
        // Relleno (carne/vegetales) - forma simple
        const fillingGeometry = new THREE.BoxGeometry(0.25, 0.12, 0.1);
        const fillingMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B4513, // Color café de la carne
          roughness: 0.8,
        });
        const filling = new THREE.Mesh(fillingGeometry, fillingMaterial);
        filling.position.y = 0.05;
        group.add(filling);
        
        return group;
      },
    },
  };

  constructor(engine: Engine, config: IngredientConfig) {
    this.engine = engine;
    this.type = config.type;
    this.position = config.position.clone();

    const config_data = Ingredient.INGREDIENT_CONFIGS[config.type];
    const geometryResult = config_data.geometry();
    
    // Si es un grupo (como el taco), usar el grupo directamente
    if (geometryResult instanceof THREE.Group) {
      this.mesh = geometryResult as any; // El grupo se comporta como mesh para posicionamiento
      this.mesh.position.copy(this.position);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      
      // Aplicar sombras a todos los hijos
      geometryResult.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } else {
      const material = new THREE.MeshStandardMaterial({
        color: config_data.color,
        roughness: 0.6,
        metalness: 0,
      });
      this.mesh = new THREE.Mesh(geometryResult as THREE.BufferGeometry, material);
      this.mesh.position.copy(this.position);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
    }

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

  createMeshForPlayer(): THREE.Mesh | THREE.Group {
    // Crear un nuevo mesh para la pila del jugador (ya que removimos el original)
    const config_data = Ingredient.INGREDIENT_CONFIGS[this.type];
    const geometryResult = config_data.geometry();
    
    // Si es un grupo (como el taco), clonarlo
    if (geometryResult instanceof THREE.Group) {
      const clonedGroup = geometryResult.clone() as any;
      clonedGroup.castShadow = true;
      clonedGroup.receiveShadow = true;
      
      // Aplicar sombras a todos los hijos
      clonedGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      return clonedGroup;
    } else {
      const material = new THREE.MeshStandardMaterial({
        color: config_data.color,
        roughness: 0.6,
        metalness: 0,
      });
      const mesh = new THREE.Mesh(geometryResult as THREE.BufferGeometry, material);
      mesh.castShadow = true;
      return mesh;
    }
  }

  getHeight(): number {
    return Ingredient.INGREDIENT_CONFIGS[this.type].height;
  }

  dispose(): void {
    if (!this.collected && this.mesh) {
      this.engine.scene.remove(this.mesh);
      
      // Si es un grupo, liberar todos los hijos
      if (this.mesh instanceof THREE.Group) {
        this.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      } else {
        // Si es un mesh simple
        this.mesh.geometry.dispose();
        if (Array.isArray(this.mesh.material)) {
          this.mesh.material.forEach((mat) => mat.dispose());
        } else {
          this.mesh.material.dispose();
        }
      }
    }
  }
}
