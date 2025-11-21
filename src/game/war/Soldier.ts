/**
 * AI-EDITABLE: Soldier
 *
 * Combat-ready human with shooting capabilities.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import { Human } from './Human';
import { Team } from './Human';
import { Bullet } from './Bullet';

export class Soldier extends Human {
  private lastShotTime: number = 0;
  private shootCooldown: number = 0.5; // 0.5 seconds between shots
  private target: Human | null = null;
  private detectionRange: number = 15;
  private shootRange: number = 12;
  private bullets: Bullet[] = [];
  private weaponMesh: THREE.Mesh | null = null;

  constructor(engine: Engine, position: THREE.Vector3, team: Team) {
    super(engine, position, team);
    
    // Create weapon (rifle)
    const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    const weaponMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
    });
    this.weaponMesh = new THREE.Mesh(weaponGeometry, weaponMaterial);
    this.weaponMesh.position.set(0.4, 0.9, 0.3);
    this.weaponMesh.rotation.z = -Math.PI / 6;
    this.mesh.add(this.weaponMesh);
  }

  update(deltaTime: number, enemies: Human[], allBullets: Bullet[]): void {
    if (!this.isAliveCheck()) {
      super.update(deltaTime);
      return;
    }

    // Find nearest enemy
    this.findTarget(enemies);

    // Shoot at target if in range
    if (this.target && this.canShoot()) {
      this.shoot();
    }

    // Simple AI movement - move towards nearest enemy or patrol
    if (this.target) {
      const direction = new THREE.Vector3()
        .subVectors(this.target.getPosition(), this.position)
        .normalize();
      
      // Move towards enemy but keep distance
      const distance = this.position.distanceTo(this.target.getPosition());
      if (distance > this.shootRange) {
        this.velocity.x = direction.x * 2;
        this.velocity.z = direction.z * 2;
      } else {
        // Strafe around enemy
        const strafeDirection = new THREE.Vector3(-direction.z, 0, direction.x);
        this.velocity.x = strafeDirection.x * 1.5;
        this.velocity.z = strafeDirection.z * 1.5;
      }
    } else {
      // Patrol behavior - simple random movement
      if (Math.random() < 0.01) {
        const angle = Math.random() * Math.PI * 2;
        this.velocity.x = Math.cos(angle) * 1;
        this.velocity.z = Math.sin(angle) * 1;
      }
    }

    // Rotate to face movement direction or target
    if (this.target) {
      const direction = new THREE.Vector3()
        .subVectors(this.target.getPosition(), this.position)
        .normalize();
      this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    } else if (this.velocity.length() > 0.1) {
      this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
    }

    super.update(deltaTime);

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (!bullet.isActiveCheck()) {
        this.bullets.splice(i, 1);
        continue;
      }
      bullet.update(deltaTime);
    }
  }

  private findTarget(enemies: Human[]): void {
    let nearestEnemy: Human | null = null;
    let nearestDistance = Infinity;

    for (const enemy of enemies) {
      if (!enemy.isAliveCheck() || enemy.getTeam() === this.team) {
        continue;
      }

      const distance = this.position.distanceTo(enemy.getPosition());
      if (distance < this.detectionRange && distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }

    this.target = nearestEnemy;
  }

  private canShoot(): boolean {
    const currentTime = Date.now() / 1000;
    return currentTime - this.lastShotTime >= this.shootCooldown;
  }

  private shoot(): void {
    if (!this.target || !this.isAliveCheck()) return;

    const currentTime = Date.now() / 1000;
    if (currentTime - this.lastShotTime < this.shootCooldown) return;

    const direction = new THREE.Vector3()
      .subVectors(this.target.getPosition(), this.position)
      .normalize();

    // Add slight randomness to shots
    direction.x += (Math.random() - 0.5) * 0.1;
    direction.y += (Math.random() - 0.5) * 0.05;
    direction.z += (Math.random() - 0.5) * 0.1;
    direction.normalize();

    // Shoot from weapon position
    const shootPosition = this.position.clone();
    shootPosition.y += 1.2; // Head/weapon height
    shootPosition.add(direction.clone().multiplyScalar(0.5));

    const bullet = new Bullet(
      this.engine,
      shootPosition,
      direction,
      30, // Speed
      25, // Damage
      this
    );

    this.bullets.push(bullet);
    this.lastShotTime = currentTime;
  }

  getBullets(): Bullet[] {
    return this.bullets;
  }

  dispose(): void {
    // Dispose bullets
    for (const bullet of this.bullets) {
      bullet.destroy();
    }
    this.bullets = [];
    
    super.dispose();
  }
}
