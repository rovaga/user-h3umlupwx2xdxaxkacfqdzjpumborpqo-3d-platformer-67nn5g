/**
 * AI-EDITABLE: Ranch Game Implementation
 *
 * Un rancho en el desierto de Sonora con vaquero, vacas, caballos y gallinas.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';
import { Cowboy } from './Cowboy';
import { Corral } from './Corral';
import { Stable } from './Stable';
import { ChickenCoop } from './ChickenCoop';

export class RanchGame implements Game {
  private engine: Engine;
  private cowboy: Cowboy;
  private corral: Corral;
  private stable: Stable;
  private chickenCoop: ChickenCoop;

  constructor(engine: Engine) {
    this.engine = engine;

    // Configurar iluminación del desierto (luz solar intensa)
    this.setupDesertLighting();

    // Crear terreno del desierto
    this.createDesertTerrain();

    // Crear estructuras del rancho
    this.corral = new Corral(engine);
    this.stable = new Stable(engine);
    this.chickenCoop = new ChickenCoop(engine);

    // Crear vaquero
    this.cowboy = new Cowboy(engine, this.stable);

    console.log('[RanchGame] Rancho inicializado en el desierto de Sonora');
  }

  private setupDesertLighting(): void {
    // Luz ambiental cálida del desierto
    const ambient = new THREE.AmbientLight(0xffd4a3, 0.7);
    this.engine.scene.add(ambient);

    // Luz direccional del sol (más intensa y amarillenta)
    const sun = new THREE.DirectionalLight(0xfff5e1, 1.2);
    sun.position.set(15, 25, 10);
    sun.castShadow = true;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    this.engine.scene.add(sun);

    // Cambiar color del cielo a desierto
    this.engine.scene.background = new THREE.Color(0xf4e4bc);
    this.engine.scene.fog = new THREE.Fog(0xf4e4bc, 30, 100);
  }

  private createDesertTerrain(): void {
    // Suelo del desierto (arena)
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    
    // Crear variación de altura para hacer el terreno más interesante
    const vertices = groundGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      // Crear pequeñas ondulaciones en el terreno
      vertices[i + 1] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
    }
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a574, // Color arena del desierto
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.engine.scene.add(ground);

    // Agregar algunas rocas del desierto
    for (let i = 0; i < 15; i++) {
      const rockSize = Math.random() * 0.5 + 0.3;
      const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 1.0,
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 150,
        rockSize,
        (Math.random() - 0.5) * 150
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.engine.scene.add(rock);
    }

    // Agregar algunos cactus pequeños
    for (let i = 0; i < 10; i++) {
      const cactusGroup = new THREE.Group();
      
      // Cuerpo principal del cactus
      const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
      const cactusMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a7c3d,
        roughness: 0.8,
      });
      const body = new THREE.Mesh(bodyGeometry, cactusMaterial);
      body.castShadow = true;
      cactusGroup.add(body);

      // Brazos del cactus
      for (let j = 0; j < 2; j++) {
        const armGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1, 8);
        const arm = new THREE.Mesh(armGeometry, cactusMaterial);
        arm.position.set(
          (Math.random() - 0.5) * 0.8,
          Math.random() * 0.5 + 0.5,
          (Math.random() - 0.5) * 0.8
        );
        arm.rotation.z = (Math.random() - 0.5) * 0.5;
        arm.castShadow = true;
        cactusGroup.add(arm);
      }

      cactusGroup.position.set(
        (Math.random() - 0.5) * 120,
        1,
        (Math.random() - 0.5) * 120
      );
      cactusGroup.rotation.y = Math.random() * Math.PI * 2;
      this.engine.scene.add(cactusGroup);
    }
  }

  update(deltaTime: number): void {
    // Actualizar vaquero
    this.cowboy.update(deltaTime);

    // Actualizar estructuras y animales
    this.corral.update(deltaTime);
    this.stable.update(deltaTime);
    this.chickenCoop.update(deltaTime);
  }

  onResize(width: number, height: number): void {
    // Manejar redimensionamiento si es necesario
  }

  dispose(): void {
    this.cowboy.dispose();
    this.corral.dispose();
    this.stable.dispose();
    this.chickenCoop.dispose();
    console.log('[RanchGame] Disposed');
  }
}
