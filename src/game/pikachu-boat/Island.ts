/**
 * AI-EDITABLE: Island
 *
 * Creates discoverable islands scattered across the ocean.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class Island {
  private engine: Engine;
  private group: THREE.Group;
  private position: THREE.Vector3;
  private discovered: boolean = false;
  private discoveryParticles: THREE.Points | null = null;
  private discoveryTime: number = 0;

  constructor(
    engine: Engine,
    position: THREE.Vector3,
    size: number = 5,
    height: number = 2
  ) {
    this.engine = engine;
    this.position = position.clone();

    this.group = new THREE.Group();
    this.engine.scene.add(this.group);

    // Create island base (brown/green terrain)
    const islandGeometry = new THREE.CylinderGeometry(
      size * 0.8,
      size,
      height,
      16
    );
    const islandMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355, // Brown earth
      roughness: 0.9,
    });
    const islandBase = new THREE.Mesh(islandGeometry, islandMaterial);
    islandBase.position.y = height / 2;
    islandBase.castShadow = true;
    islandBase.receiveShadow = true;
    this.group.add(islandBase);

    // Create island top (grass green)
    const topGeometry = new THREE.CylinderGeometry(size * 0.7, size * 0.8, 0.3, 16);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c59, // Green grass
      roughness: 0.8,
    });
    const islandTop = new THREE.Mesh(topGeometry, topMaterial);
    islandTop.position.y = height + 0.15;
    islandTop.castShadow = true;
    islandTop.receiveShadow = true;
    this.group.add(islandTop);

    // Add some palm trees
    const treeCount = Math.floor(Math.random() * 3) + 2; // 2-4 trees
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      const radius = size * 0.4 + Math.random() * size * 0.2;
      const treeX = Math.cos(angle) * radius;
      const treeZ = Math.sin(angle) * radius;

      // Tree trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(treeX, height + 1, treeZ);
      trunk.castShadow = true;
      this.group.add(trunk);

      // Tree leaves (green spheres)
      const leavesGeometry = new THREE.ConeGeometry(0.8, 1.5, 8);
      const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.set(treeX, height + 2.2, treeZ);
      leaves.castShadow = true;
      this.group.add(leaves);
    }

    // Add a flag or marker
    const flagPoleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
    const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole.position.set(0, height + 0.75, 0);
    flagPole.castShadow = true;
    this.group.add(flagPole);

    // Flag (red)
    const flagGeometry = new THREE.PlaneGeometry(0.6, 0.4);
    const flagMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(0.3, height + 1.5, 0);
    flag.rotation.y = -Math.PI / 4;
    this.group.add(flag);

    // Position island
    this.group.position.copy(this.position);

    console.log(`[Island] Created at (${position.x}, ${position.z})`);
  }

  checkDiscovery(boatPosition: THREE.Vector3, discoveryRadius: number = 8): boolean {
    if (this.discovered) return false;

    const distance = this.position.distanceTo(boatPosition);
    if (distance < discoveryRadius) {
      this.discovered = true;
      this.discoveryTime = Date.now();
      this.createDiscoveryEffect();
      console.log(`[Island] Discovered at (${this.position.x}, ${this.position.z})!`);
      return true;
    }
    return false;
  }

  private createDiscoveryEffect(): void {
    // Create particle effect for discovery
    const particleCount = 50;
    const particles = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Random positions around island
      particles[i3] = (Math.random() - 0.5) * 10;
      particles[i3 + 1] = Math.random() * 5 + 2;
      particles[i3 + 2] = (Math.random() - 0.5) * 10;

      // Gold/yellow colors
      colors[i3] = 1.0; // R
      colors[i3 + 1] = 0.84; // G
      colors[i3 + 2] = 0.0; // B
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 1,
    });

    this.discoveryParticles = new THREE.Points(geometry, material);
    this.discoveryParticles.position.copy(this.position);
    this.discoveryParticles.position.y += 2;
    this.engine.scene.add(this.discoveryParticles);
  }

  update(deltaTime: number): void {
    // Animate discovery particles
    if (this.discoveryParticles) {
      const elapsed = (Date.now() - this.discoveryTime) / 1000;
      
      if (elapsed < 3) {
        // Fade out particles
        const opacity = 1 - elapsed / 3;
        (this.discoveryParticles.material as THREE.PointsMaterial).opacity = opacity;

        // Move particles upward
        const positions = this.discoveryParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += deltaTime * 2; // Move up
        }
        this.discoveryParticles.geometry.attributes.position.needsUpdate = true;
      } else {
        // Remove particles after animation
        this.engine.scene.remove(this.discoveryParticles);
        this.discoveryParticles.geometry.dispose();
        (this.discoveryParticles.material as THREE.Material).dispose();
        this.discoveryParticles = null;
      }
    }

    // Rotate flag
    const flag = this.group.children.find(child => 
      child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial &&
      (child.material as THREE.MeshStandardMaterial).color.getHex() === 0xff0000
    );
    if (flag) {
      flag.rotation.y += deltaTime * 0.5;
    }
  }

  isDiscovered(): boolean {
    return this.discovered;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getBounds(): { min: THREE.Vector3; max: THREE.Vector3; radius: number } {
    // Approximate island bounds (assuming size ~5)
    const radius = 5;
    return {
      min: new THREE.Vector3(
        this.position.x - radius,
        this.position.y,
        this.position.z - radius
      ),
      max: new THREE.Vector3(
        this.position.x + radius,
        this.position.y + 4,
        this.position.z + radius
      ),
      radius: radius,
    };
  }

  dispose(): void {
    if (this.discoveryParticles) {
      this.engine.scene.remove(this.discoveryParticles);
      this.discoveryParticles.geometry.dispose();
      (this.discoveryParticles.material as THREE.Material).dispose();
    }

    this.engine.scene.remove(this.group);
    
    const disposeMesh = (mesh: THREE.Mesh) => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    };

    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        disposeMesh(child);
      }
    });

    console.log('[Island] Disposed');
  }
}
