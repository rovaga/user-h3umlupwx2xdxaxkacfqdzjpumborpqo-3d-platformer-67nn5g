/**
 * Voxel world manager.
 * Handles block storage, rendering, and placement/destruction.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export interface BlockType {
  id: number;
  name: string;
  color: number;
}

export const BLOCK_TYPES: Record<number, BlockType> = {
  1: { id: 1, name: 'Stone', color: 0x808080 },
  2: { id: 2, name: 'Grass', color: 0x7cb342 },
  3: { id: 3, name: 'Dirt', color: 0x8d6e63 },
  4: { id: 4, name: 'Wood', color: 0x8d6e63 },
  5: { id: 5, name: 'Leaves', color: 0x4caf50 },
  6: { id: 6, name: 'Sand', color: 0xfdd835 },
  7: { id: 7, name: 'Water', color: 0x2196f3 },
  8: { id: 8, name: 'Glass', color: 0xe3f2fd },
  9: { id: 9, name: 'Brick', color: 0xd32f2f },
};

export class VoxelWorld {
  private engine: Engine;
  private blocks: Map<string, number> = new Map();
  private blockMeshes: THREE.Mesh[] = [];
  private blockGroup: THREE.Group;
  private blockGeometry: THREE.BoxGeometry;
  private blockMaterials: Map<number, THREE.MeshStandardMaterial> = new Map();

  constructor(engine: Engine) {
    this.engine = engine;
    this.blockGroup = new THREE.Group();
    this.engine.scene.add(this.blockGroup);

    // Create shared geometry for all blocks
    this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);

    // Create materials for each block type
    for (const [id, blockType] of Object.entries(BLOCK_TYPES)) {
      const material = new THREE.MeshStandardMaterial({
        color: blockType.color,
        roughness: 0.7,
        metalness: 0.1,
      });
      this.blockMaterials.set(parseInt(id), material);
    }

    console.log('[VoxelWorld] Initialized');
  }

  private getBlockKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  getBlock(x: number, y: number, z: number): number | undefined {
    return this.blocks.get(this.getBlockKey(x, y, z));
  }

  setBlock(x: number, y: number, z: number, blockType: number): void {
    const key = this.getBlockKey(x, y, z);
    
    // Remove existing block if any
    if (this.blocks.has(key)) {
      this.removeBlock(x, y, z);
    }

    // Add block to map
    this.blocks.set(key, blockType);

    // Create mesh for the block
    const material = this.blockMaterials.get(blockType);
    if (!material) {
      console.warn(`[VoxelWorld] Unknown block type: ${blockType}`);
      return;
    }

    const mesh = new THREE.Mesh(this.blockGeometry, material);
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.blockPosition = { x, y, z };
    
    this.blockGroup.add(mesh);
    this.blockMeshes.push(mesh);
  }

  removeBlock(x: number, y: number, z: number): void {
    const key = this.getBlockKey(x, y, z);
    
    if (!this.blocks.has(key)) {
      return;
    }

    // Remove from map
    this.blocks.delete(key);

    // Find and remove mesh
    const meshIndex = this.blockMeshes.findIndex((mesh) => {
      const pos = mesh.userData.blockPosition;
      return pos && pos.x === x && pos.y === y && pos.z === z;
    });

    if (meshIndex !== -1) {
      const mesh = this.blockMeshes[meshIndex];
      this.blockGroup.remove(mesh);
      mesh.geometry.dispose();
      this.blockMeshes.splice(meshIndex, 1);
    }
  }

  getBlockMeshes(): THREE.Mesh[] {
    return this.blockMeshes;
  }

  dispose(): void {
    // Dispose all meshes
    for (const mesh of this.blockMeshes) {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    }

    // Dispose shared geometry
    this.blockGeometry.dispose();

    // Dispose materials
    for (const material of this.blockMaterials.values()) {
      material.dispose();
    }

    // Remove group from scene
    this.engine.scene.remove(this.blockGroup);

    console.log('[VoxelWorld] Disposed');
  }
}
