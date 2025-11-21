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
import { Weapon, WeaponType } from './Weapon';
import { Projectile } from './Projectile';
import { Enemy } from './Enemy';
import { Boss } from './Boss';

export class PlatformerGame implements Game {
  private engine: Engine;
  private player: Player;
  private platforms: Platform[] = [];
  private ingredients: Ingredient[] = [];
  private weapons: Weapon[] = [];
  private projectiles: Projectile[] = [];
  private enemies: Enemy[] = [];
  private bosses: Boss[] = [];
  private enemySpawnTimer: number = 0;
  private enemySpawnInterval: number = 1.0; // Spawn 1 enemy per second
  private bossSpawnTimer: number = 0;
  private bossSpawnInterval: number = 30.0; // Spawn boss every 30 seconds
  private meleeAttackActive: boolean = false;
  private meleeHitEnemies: Set<Enemy | Boss> = new Set();
  private otherWeaponCooldown: number = 0;
  private otherWeaponCooldownTime: number = 1.32; // 1.32 seconds cooldown for other weapons
  private lastOtherWeaponClickState: boolean = false;

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

    // Create weapons
    this.createWeapons();

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

  private createWeapons(): void {
    // Define weapon spawn positions (on ground/platforms)
    const weaponSpawns = [
      { x: -5, y: 0.5, z: -5, type: WeaponType.SWORD },
      { x: 12, y: 0.5, z: 12, type: WeaponType.FLINTLOCK },
      { x: -15, y: 0.5, z: 15, type: WeaponType.M1_GARAND },
      { x: 20, y: 0.5, z: -10, type: WeaponType.SWORD },
      { x: -20, y: 0.5, z: -15, type: WeaponType.FLINTLOCK },
      { x: 0, y: 0.5, z: 0, type: WeaponType.M1_GARAND },
    ];

    for (const spawn of weaponSpawns) {
      const weapon = new Weapon(this.engine, {
        type: spawn.type,
        position: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
      });
      this.weapons.push(weapon);
    }
  }

  update(deltaTime: number): void {
    // Update player (handles input and movement, may create projectiles)
    this.player.update(deltaTime, this.platforms);

    // Check for shooting (after update creates projectiles)
    const projectile = this.player.getLatestProjectile();
    if (projectile) {
      this.projectiles.push(projectile);
    }

    // Check for melee attack (use Player's melee attack state)
    const currentWeapon = this.player.getCurrentWeapon();
    const wasAttacking = this.meleeAttackActive;
    this.meleeAttackActive = this.player.isMeleeAttacking();
    
    // Reset hit tracking when attack starts
    if (this.meleeAttackActive && !wasAttacking) {
      this.meleeHitEnemies.clear();
    }

    // Spawn enemies
    this.enemySpawnTimer += deltaTime;
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }

    // Spawn boss
    this.bossSpawnTimer += deltaTime;
    if (this.bossSpawnTimer >= this.bossSpawnInterval) {
      this.spawnBoss();
      this.bossSpawnTimer = 0;
    }

    // Update other weapon cooldown
    if (this.otherWeaponCooldown > 0) {
      this.otherWeaponCooldown -= deltaTime;
    }

    // Update enemies
    const playerPosition = this.player.getPosition();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (enemy.isDead()) {
        enemy.dispose();
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.update(deltaTime, this.platforms, playerPosition);

      // Check if enemy can attack player
      const distanceToPlayer = enemy.getPosition().distanceTo(playerPosition);
      if (distanceToPlayer <= enemy.getAttackRange() && enemy.canAttack()) {
        this.player.takeDamage(enemy.getAttackDamage());
      }
    }

    // Update bosses
    for (let i = this.bosses.length - 1; i >= 0; i--) {
      const boss = this.bosses[i];
      
      if (boss.isDead()) {
        boss.dispose();
        this.bosses.splice(i, 1);
        continue;
      }

      boss.update(deltaTime, this.platforms, playerPosition);

      // Check if boss can attack player
      const distanceToPlayer = boss.getPosition().distanceTo(playerPosition);
      if (distanceToPlayer <= boss.getAttackRange() && boss.canAttack()) {
        this.player.takeDamage(boss.getAttackDamage());
      }
    }

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

    // Update weapons
    for (const weapon of this.weapons) {
      if (!weapon.isCollected()) {
        weapon.update(deltaTime);

        // Check collision with player
        const playerPos = this.player.getPosition();
        const playerRadius = this.player.getRadius();
        if (weapon.checkCollision(playerPos, playerRadius)) {
          // Equip weapon
          this.player.addWeapon(weapon);
        }
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      const isActive = projectile.update(deltaTime);
      
      if (!isActive) {
        projectile.dispose();
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check projectile collision with enemies
      const projectilePos = projectile.getPosition();
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (enemy.isDead()) continue;

        const distance = projectilePos.distanceTo(enemy.getPosition());
        if (distance < enemy.getRadius() + 0.1) {
          enemy.takeDamage(projectile.getDamage());
          projectile.dispose();
          this.projectiles.splice(i, 1);
          break;
        }
      }

      // Check projectile collision with bosses
      for (let j = this.bosses.length - 1; j >= 0; j--) {
        const boss = this.bosses[j];
        if (boss.isDead()) continue;

        const distance = projectilePos.distanceTo(boss.getPosition());
        if (distance < boss.getRadius() + 0.1) {
          boss.takeDamage(projectile.getDamage());
          projectile.dispose();
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }

    // Check melee attack collision with enemies
    if (this.meleeAttackActive && currentWeapon && currentWeapon.isMelee()) {
      const playerPos = this.player.getPosition();
      const meleeRange = currentWeapon.getRange();
      
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        if (enemy.isDead() || this.meleeHitEnemies.has(enemy)) continue;

        const distance = playerPos.distanceTo(enemy.getPosition());
        if (distance <= meleeRange) {
          enemy.takeDamage(currentWeapon.getDamage());
          this.meleeHitEnemies.add(enemy);
        }
      }

      // Check melee attack collision with bosses
      for (let i = this.bosses.length - 1; i >= 0; i--) {
        const boss = this.bosses[i];
        if (boss.isDead() || this.meleeHitEnemies.has(boss)) continue;

        const distance = playerPos.distanceTo(boss.getPosition());
        if (distance <= meleeRange) {
          boss.takeDamage(currentWeapon.getDamage());
          this.meleeHitEnemies.add(boss);
        }
      }
    }

    // Handle other weapons attack (75 damage per click, 1.32s cooldown)
    this.handleOtherWeaponsAttack(playerPosition);
  }

  private handleOtherWeaponsAttack(playerPosition: THREE.Vector3): void {
    // Check if player clicked and has other weapons (not currently equipped)
    const input = this.engine.input;
    const isMobile = this.engine.mobileInput.isMobileControlsActive();
    
    if (isMobile) return; // Only handle desktop clicks for now
    
    const mouseButtonPressed = input.isKeyPressed('Mouse0');
    const currentWeapon = this.player.getCurrentWeapon();
    
    // Check if player has other collected weapons
    const otherWeapons = this.weapons.filter(w => w.isCollected() && w !== currentWeapon);
    
    // Detect click (button just pressed, not held)
    const isClick = mouseButtonPressed && !this.lastOtherWeaponClickState;
    this.lastOtherWeaponClickState = mouseButtonPressed;
    
    if (isClick && otherWeapons.length > 0 && this.otherWeaponCooldown <= 0) {
      // Deal 75 damage to all enemies and bosses in range
      const attackRange = 5.0; // Range for other weapons attack
      
      // Damage enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        if (enemy.isDead()) continue;
        
        const distance = playerPosition.distanceTo(enemy.getPosition());
        if (distance <= attackRange) {
          enemy.takeDamage(75);
        }
      }
      
      // Damage bosses
      for (let i = this.bosses.length - 1; i >= 0; i--) {
        const boss = this.bosses[i];
        if (boss.isDead()) continue;
        
        const distance = playerPosition.distanceTo(boss.getPosition());
        if (distance <= attackRange) {
          boss.takeDamage(75);
        }
      }
      
      // Set cooldown
      this.otherWeaponCooldown = this.otherWeaponCooldownTime;
      console.log('[PlatformerGame] Other weapons attack dealt 75 damage');
    }
  }

  private spawnEnemy(): void {
    // Spawn enemy at random position around the map
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 10; // Spawn 15-25 units away from center
    const spawnX = Math.cos(angle) * distance;
    const spawnZ = Math.sin(angle) * distance;
    const spawnY = 2; // Spawn above ground

    const enemy = new Enemy(this.engine, new THREE.Vector3(spawnX, spawnY, spawnZ));
    this.enemies.push(enemy);
  }

  private spawnBoss(): void {
    // Spawn boss at random position around the map
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 10; // Spawn 20-30 units away from center
    const spawnX = Math.cos(angle) * distance;
    const spawnZ = Math.sin(angle) * distance;
    const spawnY = 3; // Spawn above ground

    const boss = new Boss(this.engine, new THREE.Vector3(spawnX, spawnY, spawnZ));
    this.bosses.push(boss);
    console.log('[PlatformerGame] Boss spawned!');
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
    for (const weapon of this.weapons) {
      weapon.dispose();
    }
    for (const projectile of this.projectiles) {
      projectile.dispose();
    }
    for (const enemy of this.enemies) {
      enemy.dispose();
    }
    for (const boss of this.bosses) {
      boss.dispose();
    }
    console.log('[PlatformerGame] Disposed');
  }
}
