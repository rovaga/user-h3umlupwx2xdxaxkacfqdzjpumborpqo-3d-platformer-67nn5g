/**
 * AI-EDITABLE: Voxel Game Implementation
 *
 * Minecraft-like voxel game with block creation and destruction.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';
import { VoxelWorld } from './VoxelWorld';
import { FirstPersonCamera } from './FirstPersonCamera';

export class VoxelGame implements Game {
  private engine: Engine;
  private voxelWorld: VoxelWorld;
  private cameraController: FirstPersonCamera;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedBlockType: number = 1; // Default block type
  private destroyPointerMesh: THREE.LineSegments | null = null; // Visual pointer for block destruction (red)
  private placePointerMesh: THREE.LineSegments | null = null; // Visual pointer for block placement (green)

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup lighting
    engine.createDefaultLighting();

    // Initialize raycaster for block selection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Create voxel world
    this.voxelWorld = new VoxelWorld(engine);

    // Create first-person camera controller
    this.cameraController = new FirstPersonCamera(engine);
    this.cameraController.setVoxelWorld(this.voxelWorld);
    this.cameraController.setPosition(new THREE.Vector3(0, 10, 0));

    // Generate initial terrain
    this.generateTerrain();

    // Setup mouse click handlers for block placement/destruction
    this.setupInputHandlers();

    // Create visual pointer for block placement/destruction
    this.createPointer();

    console.log('[VoxelGame] Initialized');
  }

  private generateTerrain(): void {
    // Generate a simple flat terrain with some variation
    const size = 20;
    for (let x = -size; x <= size; x++) {
      for (let z = -size; z <= size; z++) {
        // Create ground layer
        this.voxelWorld.setBlock(x, 0, z, 2); // Grass block
        
        // Add some dirt layers below
        for (let y = -1; y >= -3; y--) {
          this.voxelWorld.setBlock(x, y, z, 3); // Dirt block
        }

        // Add some random blocks for variety
        if (Math.random() > 0.95) {
          const height = Math.floor(Math.random() * 3) + 1;
          for (let y = 1; y <= height; y++) {
            this.voxelWorld.setBlock(x, y, z, 1); // Stone block
          }
        }
      }
    }
  }

  private setupInputHandlers(): void {
    // Handle mouse clicks for block placement/destruction
    window.addEventListener('mousedown', (e) => {
      if (!this.engine.input.isPointerLocked()) {
        return;
      }

      if (e.button === 0) {
        // Left click - destroy block
        this.destroyBlock();
      } else if (e.button === 2) {
        // Right click - place block
        this.placeBlock();
      }
    });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Handle number keys for block type selection
    window.addEventListener('keydown', (e) => {
      const key = e.code;
      if (key >= 'Digit1' && key <= 'Digit9') {
        const blockType = parseInt(key.replace('Digit', ''));
        this.selectedBlockType = blockType;
        console.log(`[VoxelGame] Selected block type: ${blockType}`);
      }
    });
  }

  private getBlockRaycast(): { 
    hit: boolean; 
    position?: THREE.Vector3; 
    normal?: THREE.Vector3;
    blockPosition?: { x: number; y: number; z: number };
  } {
    // Cast ray from camera forward
    const direction = new THREE.Vector3();
    this.engine.camera.getWorldDirection(direction);
    
    this.raycaster.set(this.engine.camera.position, direction);
    
    // Get all block meshes from the world
    const blockMeshes = this.voxelWorld.getBlockMeshes();
    
    const intersects = this.raycaster.intersectObjects(blockMeshes, false);
    
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const position = intersect.point.clone();
      const normal = intersect.face?.normal.clone();
      
      if (normal) {
        // Convert normal from local to world space
        if (intersect.object instanceof THREE.Mesh) {
          normal.transformDirection(intersect.object.matrixWorld);
        }
      }
      
      // Get the block position from the intersected mesh
      const mesh = intersect.object as THREE.Mesh;
      const blockPos = mesh.userData.blockPosition;
      
      return { hit: true, position, normal, blockPosition: blockPos };
    }
    
    return { hit: false };
  }

  private destroyBlock(): void {
    const raycast = this.getBlockRaycast();
    
    if (raycast.hit && raycast.blockPosition) {
      this.voxelWorld.removeBlock(
        raycast.blockPosition.x, 
        raycast.blockPosition.y, 
        raycast.blockPosition.z
      );
    }
  }

  private placeBlock(): void {
    const raycast = this.getBlockRaycast();
    
    if (raycast.hit && raycast.position && raycast.normal) {
      // Calculate where to place the block (adjacent to the hit face)
      // Move slightly away from the hit point along the normal
      const blockPos = raycast.position.clone().add(raycast.normal.multiplyScalar(0.5));
      
      // Round to nearest block position
      const x = Math.round(blockPos.x - 0.5);
      const y = Math.round(blockPos.y - 0.5);
      const z = Math.round(blockPos.z - 0.5);
      
      // Check if block already exists
      if (this.voxelWorld.getBlock(x, y, z)) {
        return;
      }
      
      // Check if player is not inside this block
      const playerPos = this.cameraController.getPosition();
      const playerBlockX = Math.floor(playerPos.x);
      const playerBlockY = Math.floor(playerPos.y);
      const playerBlockZ = Math.floor(playerPos.z);
      
      if (x === playerBlockX && y === playerBlockY && z === playerBlockZ) {
        return; // Don't place block where player is
      }
      
      // Also check adjacent blocks to player
      if (Math.abs(x - playerPos.x) < 0.6 && Math.abs(y - playerPos.y) < 1.6 && Math.abs(z - playerPos.z) < 0.6) {
        return; // Don't place block too close to player
      }
      
      // Place the block
      this.voxelWorld.setBlock(x, y, z, this.selectedBlockType);
    }
  }

  private createPointer(): void {
    // Create wireframe box outlines to show where blocks will be placed/destroyed
    const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01); // Slightly larger than block to be visible
    const edges = new THREE.EdgesGeometry(geometry);
    
    // Red pointer for block destruction
    const destroyMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff0000,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    this.destroyPointerMesh = new THREE.LineSegments(edges.clone(), destroyMaterial);
    this.destroyPointerMesh.visible = false;
    this.engine.scene.add(this.destroyPointerMesh);
    
    // Green pointer for block placement
    const placeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff00,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    this.placePointerMesh = new THREE.LineSegments(edges.clone(), placeMaterial);
    this.placePointerMesh.visible = false;
    this.engine.scene.add(this.placePointerMesh);
  }

  private updatePointer(): void {
    if (!this.destroyPointerMesh || !this.placePointerMesh) return;

    const raycast = this.getBlockRaycast();
    const isPointerLocked = this.engine.input.isPointerLocked();
    const isMobile = this.engine.mobileInput.isMobileControlsActive();

    // Only show pointers when pointer is locked or mobile controls are active
    if (!raycast.hit || (!isPointerLocked && !isMobile)) {
      this.destroyPointerMesh.visible = false;
      this.placePointerMesh.visible = false;
      return;
    }

    // Show red pointer on the block that will be destroyed
    if (raycast.blockPosition) {
      const blockPos = raycast.blockPosition;
      this.destroyPointerMesh.position.set(blockPos.x + 0.5, blockPos.y + 0.5, blockPos.z + 0.5);
      this.destroyPointerMesh.visible = true;
    } else {
      this.destroyPointerMesh.visible = false;
    }

    // Show green pointer where block will be placed
    if (raycast.position && raycast.normal) {
      const blockPos = raycast.position.clone().add(raycast.normal.multiplyScalar(0.5));
      const x = Math.round(blockPos.x - 0.5);
      const y = Math.round(blockPos.y - 0.5);
      const z = Math.round(blockPos.z - 0.5);
      
      // Check if placement is valid (not inside player, not already occupied)
      const playerPos = this.cameraController.getPosition();
      const playerBlockX = Math.floor(playerPos.x);
      const playerBlockY = Math.floor(playerPos.y);
      const playerBlockZ = Math.floor(playerPos.z);
      
      const isValidPlacement = 
        !this.voxelWorld.getBlock(x, y, z) &&
        !(x === playerBlockX && y === playerBlockY && z === playerBlockZ) &&
        !(Math.abs(x - playerPos.x) < 0.6 && Math.abs(y - playerPos.y) < 1.6 && Math.abs(z - playerPos.z) < 0.6);
      
      if (isValidPlacement) {
        this.placePointerMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        this.placePointerMesh.visible = true;
      } else {
        this.placePointerMesh.visible = false;
      }
    } else {
      this.placePointerMesh.visible = false;
    }
  }

  update(deltaTime: number): void {
    // Update camera controller (handles movement and rotation)
    this.cameraController.update(deltaTime);

    // Update pointer position
    this.updatePointer();

    // Handle mobile create/destroy button presses
    if (this.engine.mobileInput.isMobileControlsActive()) {
      if (this.engine.mobileInput.consumeCreate()) {
        this.placeBlock();
      }
      if (this.engine.mobileInput.consumeDestroy()) {
        this.destroyBlock();
      }
    }
  }

  onResize(width: number, height: number): void {
    // Camera aspect ratio is handled by engine
  }

  dispose(): void {
    // Clean up pointers
    if (this.destroyPointerMesh) {
      this.engine.scene.remove(this.destroyPointerMesh);
      this.destroyPointerMesh.geometry.dispose();
      (this.destroyPointerMesh.material as THREE.Material).dispose();
      this.destroyPointerMesh = null;
    }
    
    if (this.placePointerMesh) {
      this.engine.scene.remove(this.placePointerMesh);
      this.placePointerMesh.geometry.dispose();
      (this.placePointerMesh.material as THREE.Material).dispose();
      this.placePointerMesh = null;
    }
    
    this.voxelWorld.dispose();
    console.log('[VoxelGame] Disposed');
  }
}
