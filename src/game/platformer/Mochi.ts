/**
 * AI-EDITABLE: Mochi Collectible
 *
 * This file contains the mochi collectible logic.
 * Mochis come in three types: green, blue, and rainbow.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export type MochiType = 'green' | 'blue' | 'rainbow';

export class Mochi {
  private engine: Engine;
  private mesh: THREE.Mesh;
  private type: MochiType;
  private position: THREE.Vector3;
  private collected: boolean = false;
  private rotationSpeed: number = 0.02;
  private floatSpeed: number = 0.001;
  private floatOffset: number = Math.random() * Math.PI * 2;
  private baseY: number;
  private time: number = 0;

  // Colors for each mochi type
  private static readonly COLORS = {
    green: 0x4caf50,
    blue: 0x2196f3,
    rainbow: 0xff6b6b, // Will be animated
  };

  constructor(engine: Engine, position: THREE.Vector3, type: MochiType = 'green') {
    this.engine = engine;
    this.position = position.clone();
    this.baseY = position.y;
    this.type = type;

    // Create mochi mesh (sphere with slight flattening)
    const mochiGeometry = new THREE.SphereGeometry(0.3, 16, 12);
    
    let material: THREE.MeshStandardMaterial;
    if (type === 'rainbow') {
      // Rainbow mochi uses a special material that can be animated
      material = new THREE.MeshStandardMaterial({
        color: Mochi.COLORS.rainbow,
        emissive: 0x330000,
        emissiveIntensity: 0.3,
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: Mochi.COLORS[type],
        emissive: Mochi.COLORS[type],
        emissiveIntensity: 0.2,
      });
    }

    this.mesh = new THREE.Mesh(mochiGeometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.scale.y = 0.7; // Flatten slightly to look more like a mochi
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Add a glow effect
    const glowGeometry = new THREE.SphereGeometry(0.35, 16, 12);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: Mochi.COLORS[type],
      emissive: Mochi.COLORS[type],
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.y = 0.7;
    this.mesh.add(glow);

    engine.scene.add(this.mesh);
  }

  update(deltaTime: number): void {
    if (this.collected) return;

    // Update time for animations
    this.time += deltaTime * 1000; // Convert to milliseconds

    // Rotate the mochi
    this.mesh.rotation.y += this.rotationSpeed * deltaTime * 60; // Normalize to 60fps

    // Float animation
    const floatTime = this.time * this.floatSpeed + this.floatOffset;
    this.mesh.position.y = this.baseY + Math.sin(floatTime) * 0.2;

    // Rainbow mochi color animation
    if (this.type === 'rainbow') {
      const hue = (this.time * 0.001) % 1;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      (this.mesh.material as THREE.MeshStandardMaterial).color.copy(color);
      (this.mesh.material as THREE.MeshStandardMaterial).emissive.copy(color);
    }
  }

  checkCollection(playerPosition: THREE.Vector3, playerRadius: number = 0.5): boolean {
    if (this.collected) return false;

    const distance = this.mesh.position.distanceTo(playerPosition);
    if (distance < playerRadius + 0.3) {
      this.collect();
      return true;
    }
    return false;
  }

  private collect(): void {
    this.collected = true;
    // Animate collection (scale down and fade out)
    const startScale = this.mesh.scale.x;
    const startTime = Date.now();
    const duration = 200; // milliseconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const scale = startScale * (1 - progress);
      const opacity = 1 - progress;

      this.mesh.scale.set(scale, scale, scale);
      if (this.mesh.material instanceof THREE.MeshStandardMaterial) {
        this.mesh.material.opacity = opacity;
        this.mesh.material.transparent = opacity < 1;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.dispose();
      }
    };

    animate();
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  isCollected(): boolean {
    return this.collected;
  }

  getType(): MochiType {
    return this.type;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
    // Dispose glow material if it exists
    if (this.mesh.children.length > 0) {
      const glow = this.mesh.children[0] as THREE.Mesh;
      glow.geometry.dispose();
      if (glow.material instanceof THREE.Material) {
        glow.material.dispose();
      }
    }
  }
}
