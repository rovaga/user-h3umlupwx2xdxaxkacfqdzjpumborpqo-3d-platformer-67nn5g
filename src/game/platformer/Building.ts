/**
 * AI-EDITABLE: Building Component
 *
 * This file defines buildings for the town scene.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';

export enum BuildingType {
  HOUSE = 'house',
  SHOP = 'shop',
  TOWN_HALL = 'town_hall',
  STATION = 'station',
}

interface BuildingConfig {
  position: THREE.Vector3;
  type: BuildingType;
  width?: number;
  height?: number;
  depth?: number;
  color?: number;
}

export class Building {
  private engine: Engine;
  private mesh: THREE.Group;
  private platform: Platform;
  private config: BuildingConfig;
  private bounds: { min: THREE.Vector3; max: THREE.Vector3 };

  constructor(engine: Engine, config: BuildingConfig) {
    this.engine = engine;
    this.config = config;

    // Default dimensions based on building type
    const dimensions = this.getDimensions();
    
    this.mesh = new THREE.Group();
    this.createBuilding(dimensions);
    engine.scene.add(this.mesh);

    // Create platform for collision
    this.platform = new Platform(engine, {
      position: new THREE.Vector3(
        config.position.x,
        config.position.y + dimensions.height / 2,
        config.position.z
      ),
      size: new THREE.Vector3(dimensions.width, dimensions.height, dimensions.depth),
      visible: false,
    });

    // Calculate bounds
    this.bounds = {
      min: new THREE.Vector3(
        config.position.x - dimensions.width / 2,
        config.position.y,
        config.position.z - dimensions.depth / 2
      ),
      max: new THREE.Vector3(
        config.position.x + dimensions.width / 2,
        config.position.y + dimensions.height,
        config.position.z + dimensions.depth / 2
      ),
    };
  }

  private getDimensions(): { width: number; height: number; depth: number } {
    const defaults = {
      [BuildingType.HOUSE]: { width: 4, height: 3, depth: 4 },
      [BuildingType.SHOP]: { width: 5, height: 4, depth: 5 },
      [BuildingType.TOWN_HALL]: { width: 8, height: 6, depth: 8 },
      [BuildingType.STATION]: { width: 10, height: 5, depth: 6 },
    };

    const defaultDim = defaults[this.config.type];
    return {
      width: this.config.width ?? defaultDim.width,
      height: this.config.height ?? defaultDim.height,
      depth: this.config.depth ?? defaultDim.depth,
    };
  }

  private createBuilding(dimensions: { width: number; height: number; depth: number }): void {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    const color = this.config.color ?? this.getDefaultColor();

    // Main building body
    const bodyGeometry = new THREE.BoxGeometry(dimensions.width, dimensions.height, dimensions.depth);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, dimensions.height / 2, 0);
    body.castShadow = !isMobile;
    body.receiveShadow = !isMobile;
    this.mesh.add(body);

    // Roof
    this.createRoof(dimensions, isMobile);

    // Windows and doors based on building type
    this.createDetails(dimensions, isMobile);

    // Position the building
    this.mesh.position.copy(this.config.position);
  }

  private createRoof(
    dimensions: { width: number; height: number; depth: number },
    isMobile: boolean
  ): void {
    const roofHeight = dimensions.height * 0.3;
    const roofGeometry = new THREE.ConeGeometry(
      Math.max(dimensions.width, dimensions.depth) * 0.8,
      roofHeight,
      4
    );
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown roof
      roughness: 0.8,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = dimensions.height + roofHeight / 2;
    roof.castShadow = !isMobile;
    this.mesh.add(roof);
  }

  private createDetails(
    dimensions: { width: number; height: number; depth: number },
    isMobile: boolean
  ): void {
    // Windows
    const windowGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb, // Sky blue
      roughness: 0.1,
      metalness: 0.3,
    });

    // Create windows on front and sides
    const windowPositions = [
      // Front face
      { x: -dimensions.width * 0.3, y: dimensions.height * 0.4, z: dimensions.depth / 2 + 0.05 },
      { x: dimensions.width * 0.3, y: dimensions.height * 0.4, z: dimensions.depth / 2 + 0.05 },
      { x: -dimensions.width * 0.3, y: dimensions.height * 0.7, z: dimensions.depth / 2 + 0.05 },
      { x: dimensions.width * 0.3, y: dimensions.height * 0.7, z: dimensions.depth / 2 + 0.05 },
      // Left side
      { x: -dimensions.width / 2 - 0.05, y: dimensions.height * 0.4, z: -dimensions.depth * 0.3 },
      { x: -dimensions.width / 2 - 0.05, y: dimensions.height * 0.7, z: -dimensions.depth * 0.3 },
      // Right side
      { x: dimensions.width / 2 + 0.05, y: dimensions.height * 0.4, z: -dimensions.depth * 0.3 },
      { x: dimensions.width / 2 + 0.05, y: dimensions.height * 0.7, z: -dimensions.depth * 0.3 },
    ];

    windowPositions.forEach((pos) => {
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(pos.x, pos.y, pos.z);
      this.mesh.add(window);
    });

    // Door
    const doorGeometry = new THREE.BoxGeometry(1, 2, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321, // Brown door
      roughness: 0.8,
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1, dimensions.depth / 2 + 0.05);
    this.mesh.add(door);
  }

  private getDefaultColor(): number {
    const colors = {
      [BuildingType.HOUSE]: 0xf5deb3, // Wheat
      [BuildingType.SHOP]: 0xffd700, // Gold
      [BuildingType.TOWN_HALL]: 0xffffff, // White
      [BuildingType.STATION]: 0xd3d3d3, // Light gray
    };
    return colors[this.config.type] ?? 0xf5deb3;
  }

  getBounds(): { min: THREE.Vector3; max: THREE.Vector3 } {
    return this.bounds;
  }

  getPlatform(): Platform {
    return this.platform;
  }

  dispose(): void {
    this.platform.dispose();
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    this.engine.scene.remove(this.mesh);
  }
}
