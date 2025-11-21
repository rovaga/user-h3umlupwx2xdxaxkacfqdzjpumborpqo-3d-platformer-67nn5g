/**
 * AI-EDITABLE: Forest Environment
 *
 * Creates a forest environment with trees, ground, and atmosphere.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class Forest {
  private engine: Engine;
  private ground: THREE.Mesh;
  private trees: THREE.Group[] = [];
  private groundHeight: number = 0;

  constructor(engine: Engine) {
    this.engine = engine;

    // Create forest ground (brown/dark green)
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    
    // Add some height variation to ground
    const vertices = groundGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      const z = vertices.getY(i);
      const height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
      vertices.setZ(i, height);
    }
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d5a2f, // Dark forest green
      roughness: 0.9,
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = this.groundHeight;
    this.ground.receiveShadow = true;
    this.engine.scene.add(this.ground);

    // Create trees scattered across the forest
    this.createTrees();

    // Add fog for atmosphere
    this.engine.scene.fog = new THREE.Fog(0x87a96b, 15, 60);

    console.log(`[Forest] Created with ${this.trees.length} trees`);
  }

  private createTrees(): void {
    const treeCount = 80;
    
    for (let i = 0; i < treeCount; i++) {
      const tree = this.createTree();
      
      // Random position in forest
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 50;
      tree.position.x = Math.cos(angle) * distance;
      tree.position.z = Math.sin(angle) * distance;
      
      // Get ground height at this position
      const groundY = this.getGroundHeight(tree.position.x, tree.position.z);
      tree.position.y = groundY;
      
      this.trees.push(tree);
      this.engine.scene.add(tree);
    }
  }

  private createTree(): THREE.Group {
    const treeGroup = new THREE.Group();

    // Tree trunk (brown cylinder)
    const trunkHeight = 2 + Math.random() * 2;
    const trunkRadius = 0.2 + Math.random() * 0.1;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321, // Brown
      roughness: 0.8,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Tree foliage (green cone/sphere combination)
    const foliageSize = 1.5 + Math.random() * 1;
    const foliageGeometry = new THREE.ConeGeometry(foliageSize, foliageSize * 1.5, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x228b22, // Forest green
      roughness: 0.7,
    });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = trunkHeight + foliageSize * 0.5;
    foliage.castShadow = true;
    treeGroup.add(foliage);

    // Add some smaller foliage spheres for variety
    for (let i = 0; i < 2; i++) {
      const smallFoliageGeometry = new THREE.SphereGeometry(foliageSize * 0.6, 8, 8);
      const smallFoliage = new THREE.Mesh(smallFoliageGeometry, foliageMaterial);
      smallFoliage.position.set(
        (Math.random() - 0.5) * foliageSize,
        trunkHeight + foliageSize * 0.8 + Math.random() * foliageSize * 0.5,
        (Math.random() - 0.5) * foliageSize
      );
      smallFoliage.castShadow = true;
      treeGroup.add(smallFoliage);
    }
    
    return treeGroup;
  }

  getGroundHeight(x: number, z: number): number {
    // Simple height function based on position
    return this.groundHeight + Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
  }

  getTrees(): THREE.Group[] {
    return this.trees;
  }

  update(deltaTime: number): void {
    // Trees sway slightly in the wind
    const time = Date.now() * 0.001;
    for (let i = 0; i < this.trees.length; i++) {
      const tree = this.trees[i];
      const swayAmount = Math.sin(time + i) * 0.02;
      tree.rotation.z = swayAmount;
    }
  }

  dispose(): void {
    this.engine.scene.remove(this.ground);
    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();

    for (const tree of this.trees) {
      this.engine.scene.remove(tree);
      tree.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    console.log('[Forest] Disposed');
  }
}
