/**
 * AI-EDITABLE: Charmander Forest Survival Game
 *
 * Main game class for Charmander surviving in a forest.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';
import { Charmander } from './Charmander';
import { Forest } from './Forest';
import { Enemy, EnemyType } from './Enemy';
import { Resource, ResourceType } from './Resource';

export class CharmanderForestGame implements Game {
  private engine: Engine;
  private charmander: Charmander;
  private forest: Forest;
  private enemies: Enemy[] = [];
  private resources: Resource[] = [];
  private fireAttacks: Array<{ mesh: THREE.Mesh; direction: THREE.Vector3 }> = [];
  
  // Game state
  private gameTime: number = 0;
  private enemySpawnTimer: number = 0;
  private resourceSpawnTimer: number = 0;
  private gameOver: boolean = false;

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup lighting (forest atmosphere)
    const { ambient, directional } = engine.createDefaultLighting();
    ambient.intensity = 0.5; // Darker ambient for forest
    directional.intensity = 0.7;
    directional.position.set(10, 15, 5);
    directional.color.setHex(0xfff5e6); // Warm sunlight

    // Create forest environment
    this.forest = new Forest(engine);

    // Create Charmander at starting position
    const startPosition = new THREE.Vector3(0, 0, 0);
    this.charmander = new Charmander(engine, startPosition);

    // Setup camera
    this.setupCamera();

    // Create initial enemies
    this.spawnEnemies(3);

    // Create initial resources
    this.spawnResources(10);

    console.log('[CharmanderForestGame] Initialized - ¡Charmander está sobreviviendo en el bosque!');
  }

  private setupCamera(): void {
    const camera = this.engine.camera;
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);
  }

  private spawnEnemies(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 20;
      const position = new THREE.Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );

      const type = Math.random() > 0.7 ? EnemyType.PREDATOR : EnemyType.WILD_POKEMON;
      const enemy = new Enemy(this.engine, position, type);
      this.enemies.push(enemy);
    }
  }

  private spawnResources(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 5 + Math.random() * 30;
      const position = new THREE.Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );

      // Random resource type
      const rand = Math.random();
      let type: ResourceType;
      if (rand < 0.6) {
        type = ResourceType.BERRY;
      } else if (rand < 0.9) {
        type = ResourceType.WOOD;
      } else {
        type = ResourceType.MEAT;
      }

      const resource = new Resource(this.engine, position, type);
      this.resources.push(resource);
    }
  }

  update(deltaTime: number): void {
    if (this.gameOver) return;

    this.gameTime += deltaTime;

    // Update forest
    this.forest.update(deltaTime);

    // Update Charmander
    const groundHeight = this.forest.getGroundHeight(
      this.charmander.getPosition().x,
      this.charmander.getPosition().z
    );
    this.charmander.update(deltaTime, groundHeight);

    // Check game over
    if (!this.charmander.isAlive()) {
      this.gameOver = true;
      console.log('[CharmanderForestGame] Game Over - Charmander no pudo sobrevivir');
      return;
    }

    // Update enemies
    const charmanderPos = this.charmander.getPosition();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (enemy.isDead()) {
        enemy.dispose();
        this.enemies.splice(i, 1);
        continue;
      }

      const enemyGroundHeight = this.forest.getGroundHeight(
        enemy.getPosition().x,
        enemy.getPosition().z
      );
      enemy.update(deltaTime, charmanderPos, enemyGroundHeight);

      // Check collision with Charmander
      if (enemy.checkCollision(charmanderPos, this.charmander.getRadius())) {
        this.charmander.takeDamage(enemy.getDamage());
        console.log(`[CharmanderForestGame] Charmander recibió ${enemy.getDamage()} de daño!`);
      }
    }

    // Update resources
    for (let i = this.resources.length - 1; i >= 0; i--) {
      const resource = this.resources[i];
      
      if (resource.isCollected()) {
        resource.dispose();
        this.resources.splice(i, 1);
        continue;
      }

      const resourceGroundHeight = this.forest.getGroundHeight(
        resource.getPosition().x,
        resource.getPosition().z
      );
      resource.update(deltaTime, resourceGroundHeight);

      // Check collision with Charmander
      if (resource.checkCollision(charmanderPos, this.charmander.getRadius())) {
        const value = resource.collect();
        const resourceType = resource.getType();
        
        if (resourceType === ResourceType.BERRY || resourceType === ResourceType.MEAT) {
          this.charmander.eat(value);
          console.log(`[CharmanderForestGame] Charmander comió! +${value} hambre`);
        } else if (resourceType === ResourceType.WOOD) {
          // Wood could be used for fire power or crafting
          this.charmander.eat(value * 0.5); // Small hunger boost
          console.log(`[CharmanderForestGame] Charmander recogió leña!`);
        }
      }
    }

    // Handle fire attacks
    this.updateFireAttacks(deltaTime);

    // Spawn new enemies periodically
    this.enemySpawnTimer += deltaTime;
    if (this.enemySpawnTimer >= 10) { // Every 10 seconds
      this.spawnEnemies(1);
      this.enemySpawnTimer = 0;
    }

    // Spawn new resources periodically
    this.resourceSpawnTimer += deltaTime;
    if (this.resourceSpawnTimer >= 5) { // Every 5 seconds
      this.spawnResources(2);
      this.resourceSpawnTimer = 0;
    }
  }

  private updateFireAttacks(deltaTime: number): void {
    const input = this.engine.input;
    const mobileInput = this.engine.mobileInput;
    const isMobile = mobileInput.isMobileControlsActive();

    // Check for fire attack input (F or E key, or mobile jump button double-tap)
    const firePressed = isMobile
      ? false // Mobile fire attack can be added later
      : input.isKeyPressed('KeyF') || input.isKeyPressed('KeyE');

    if (firePressed && this.charmander.useFireAttack()) {
      this.createFireAttack();
    }

    // Update existing fire attacks
    for (let i = this.fireAttacks.length - 1; i >= 0; i--) {
      const fireAttack = this.fireAttacks[i];
      
      // Move fire attack forward in stored direction
      fireAttack.mesh.position.add(
        fireAttack.direction.clone().multiplyScalar(deltaTime * 8)
      );

      // Check collision with enemies
      for (const enemy of this.enemies) {
        if (!enemy.isDead()) {
          const distance = fireAttack.mesh.position.distanceTo(enemy.getPosition());
          if (distance < 0.5) {
            enemy.takeDamage(15);
            this.engine.scene.remove(fireAttack.mesh);
            fireAttack.mesh.geometry.dispose();
            (fireAttack.mesh.material as THREE.Material).dispose();
            this.fireAttacks.splice(i, 1);
            console.log('[CharmanderForestGame] ¡Ataque de fuego golpeó al enemigo!');
            break;
          }
        }
      }

      // Remove if too far
      if (fireAttack.mesh.position.distanceTo(this.charmander.getPosition()) > 20) {
        this.engine.scene.remove(fireAttack.mesh);
        fireAttack.mesh.geometry.dispose();
        (fireAttack.mesh.material as THREE.Material).dispose();
        this.fireAttacks.splice(i, 1);
      }
    }
  }

  private createFireAttack(): void {
    const charmanderPos = this.charmander.getPosition();
    const fireGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff4500,
      emissiveIntensity: 1.0,
    });
    const fireMesh = new THREE.Mesh(fireGeometry, fireMaterial);
    
    fireMesh.position.copy(charmanderPos);
    fireMesh.position.y += 0.5;
    
    // Calculate direction based on camera forward direction (where player is looking)
    const camera = this.engine.camera;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; // Keep it horizontal
    direction.normalize();
    
    // If direction is zero (shouldn't happen), use a default forward
    if (direction.length() < 0.1) {
      direction.set(0, 0, -1);
    }
    
    this.engine.scene.add(fireMesh);
    this.fireAttacks.push({
      mesh: fireMesh,
      direction: direction,
    });
  }

  onResize(width: number, height: number): void {
    // Camera aspect ratio is handled by engine
  }

  dispose(): void {
    this.charmander.dispose();
    this.forest.dispose();
    
    for (const enemy of this.enemies) {
      enemy.dispose();
    }
    
    for (const resource of this.resources) {
      resource.dispose();
    }

    for (const fireAttack of this.fireAttacks) {
      this.engine.scene.remove(fireAttack.mesh);
      fireAttack.mesh.geometry.dispose();
      (fireAttack.mesh.material as THREE.Material).dispose();
    }

    console.log('[CharmanderForestGame] Disposed');
  }
}
