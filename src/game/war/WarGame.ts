/**
 * AI-EDITABLE: War Game Implementation
 *
 * A war game featuring human soldiers in battle.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';
import { Soldier } from './Soldier';
import { Bullet } from './Bullet';
import { Human, Team } from './Human';

export class WarGame implements Game {
  private engine: Engine;
  private soldiers: Soldier[] = [];
  private allBullets: Bullet[] = [];
  private redTeam: Soldier[] = [];
  private blueTeam: Soldier[] = [];
  private gameTime: number = 0;

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup lighting
    engine.createDefaultLighting();

    // Create ground
    this.createGround();

    // Create cover/obstacles
    this.createCover();

    // Create soldiers
    this.createSoldiers();

    console.log('[WarGame] Initialized');
    console.log(`[WarGame] Red Team: ${this.redTeam.length} soldiers`);
    console.log(`[WarGame] Blue Team: ${this.blueTeam.length} soldiers`);
  }

  private createGround(): void {
    const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b8e23, // Olive green ground
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.engine.scene.add(ground);
  }

  private createCover(): void {
    // Create some cover objects (walls, boxes) for tactical gameplay
    const coverConfigs = [
      { x: 5, y: 0.5, z: 5, w: 2, h: 1, d: 2 },
      { x: -5, y: 0.5, z: 5, w: 2, h: 1, d: 2 },
      { x: 5, y: 0.5, z: -5, w: 2, h: 1, d: 2 },
      { x: -5, y: 0.5, z: -5, w: 2, h: 1, d: 2 },
      { x: 0, y: 0.5, z: 0, w: 3, h: 1.5, d: 3 },
      { x: 10, y: 0.5, z: 0, w: 2, h: 1, d: 4 },
      { x: -10, y: 0.5, z: 0, w: 2, h: 1, d: 4 },
      { x: 0, y: 0.5, z: 10, w: 4, h: 1, d: 2 },
      { x: 0, y: 0.5, z: -10, w: 4, h: 1, d: 2 },
    ];

    for (const config of coverConfigs) {
      const coverGeometry = new THREE.BoxGeometry(config.w, config.h, config.d);
      const coverMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b7355, // Brown/tan cover
        roughness: 0.8,
      });
      const cover = new THREE.Mesh(coverGeometry, coverMaterial);
      cover.position.set(config.x, config.y, config.z);
      cover.castShadow = true;
      cover.receiveShadow = true;
      this.engine.scene.add(cover);
    }
  }

  private createSoldiers(): void {
    // Red team spawns on one side
    const redSpawnPositions = [
      new THREE.Vector3(-20, 1, -15),
      new THREE.Vector3(-18, 1, -12),
      new THREE.Vector3(-20, 1, -9),
      new THREE.Vector3(-22, 1, -12),
      new THREE.Vector3(-18, 1, -15),
      new THREE.Vector3(-22, 1, -9),
      new THREE.Vector3(-20, 1, -18),
      new THREE.Vector3(-18, 1, -6),
    ];

    // Blue team spawns on the other side
    const blueSpawnPositions = [
      new THREE.Vector3(20, 1, 15),
      new THREE.Vector3(18, 1, 12),
      new THREE.Vector3(20, 1, 9),
      new THREE.Vector3(22, 1, 12),
      new THREE.Vector3(18, 1, 15),
      new THREE.Vector3(22, 1, 9),
      new THREE.Vector3(20, 1, 18),
      new THREE.Vector3(18, 1, 6),
    ];

    // Create red team soldiers
    for (const pos of redSpawnPositions) {
      const soldier = new Soldier(this.engine, pos, Team.RED);
      this.soldiers.push(soldier);
      this.redTeam.push(soldier);
    }

    // Create blue team soldiers
    for (const pos of blueSpawnPositions) {
      const soldier = new Soldier(this.engine, pos, Team.BLUE);
      this.soldiers.push(soldier);
      this.blueTeam.push(soldier);
    }
  }

  update(deltaTime: number): void {
    this.gameTime += deltaTime;

    // Collect all bullets from soldiers
    this.allBullets = [];
    for (const soldier of this.soldiers) {
      this.allBullets.push(...soldier.getBullets());
    }

    // Update soldiers
    for (const soldier of this.soldiers) {
      if (soldier.isAliveCheck()) {
        const enemies = this.soldiers.filter(
          (s) => s.getTeam() !== soldier.getTeam()
        );
        soldier.update(deltaTime, enemies, this.allBullets);
      } else {
        soldier.update(deltaTime);
      }
    }

    // Check bullet collisions with soldiers
    for (const bullet of this.allBullets) {
      if (!bullet.isActiveCheck()) continue;

      for (const soldier of this.soldiers) {
        if (bullet.checkCollision(soldier)) {
          soldier.takeDamage(bullet.getDamage());
          bullet.destroy();
          break;
        }
      }
    }

    // Check win condition
    this.checkWinCondition();
  }

  private checkWinCondition(): void {
    const redAlive = this.redTeam.filter((s) => s.isAliveCheck()).length;
    const blueAlive = this.blueTeam.filter((s) => s.isAliveCheck()).length;

    if (redAlive === 0 && blueAlive > 0) {
      console.log('[WarGame] Blue Team Wins!');
    } else if (blueAlive === 0 && redAlive > 0) {
      console.log('[WarGame] Red Team Wins!');
    } else if (redAlive === 0 && blueAlive === 0) {
      console.log('[WarGame] Draw - All soldiers eliminated!');
    }
  }

  onResize(width: number, height: number): void {
    // Handle resize if needed
  }

  dispose(): void {
    for (const soldier of this.soldiers) {
      soldier.dispose();
    }
    this.soldiers = [];
    this.redTeam = [];
    this.blueTeam = [];
    this.allBullets = [];
    console.log('[WarGame] Disposed');
  }
}
