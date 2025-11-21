/**
 * AI-EDITABLE: Ocean Environment
 *
 * Creates an animated ocean/water surface for the Pikachu boat game.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class Ocean {
  private engine: Engine;
  private mesh: THREE.Mesh;
  private time: number = 0;

  constructor(engine: Engine) {
    this.engine = engine;

    // Create large ocean plane
    const oceanGeometry = new THREE.PlaneGeometry(500, 500, 50, 50);
    
    // Create water material with blue color
    const oceanMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e90ff, // Dodger blue
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9,
    });

    this.mesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
    this.mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;
    
    // Add vertex displacement for waves
    const vertices = oceanGeometry.attributes.position;
    const originalPositions = new Float32Array(vertices.array);
    
    this.engine.scene.add(this.mesh);

    // Store original positions for wave animation
    (this.mesh.userData as any).originalPositions = originalPositions;
    (this.mesh.userData as any).geometry = oceanGeometry;

    console.log('[Ocean] Created');
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    // Animate waves by displacing vertices
    const geometry = (this.mesh.userData as any).geometry;
    const originalPositions = (this.mesh.userData as any).originalPositions;
    const positions = geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = originalPositions[i];
      const z = originalPositions[i + 2];
      
      // Create wave pattern using sine waves
      const wave1 = Math.sin((x * 0.1) + (this.time * 2)) * 0.3;
      const wave2 = Math.sin((z * 0.1) + (this.time * 1.5)) * 0.2;
      const wave3 = Math.sin((x * 0.05 + z * 0.05) + (this.time * 1)) * 0.4;
      
      positions[i + 1] = originalPositions[i + 1] + wave1 + wave2 + wave3;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  getHeightAt(x: number, z: number): number {
    // Calculate approximate wave height at position
    const wave1 = Math.sin((x * 0.1) + (this.time * 2)) * 0.3;
    const wave2 = Math.sin((z * 0.1) + (this.time * 1.5)) * 0.2;
    const wave3 = Math.sin((x * 0.05 + z * 0.05) + (this.time * 1)) * 0.4;
    return wave1 + wave2 + wave3;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    console.log('[Ocean] Disposed');
  }
}
