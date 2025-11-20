/**
 * AI-EDITABLE: Platformer Game Implementation
 *
 * This file contains the main platformer game logic.
 * Feel free to modify, extend, or completely rewrite this file.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';
import { Player } from './Player';
import { Platform } from './Platform';
import { Ingredient, IngredientType } from './Ingredient';
import { Customer } from './Customer';

export class PlatformerGame implements Game {
  private engine: Engine;
  private player: Player;
  private platforms: Platform[] = [];
  private ingredients: Ingredient[] = [];
  private customers: Customer[] = [];
  private currentCustomer: Customer | null = null;

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup lighting
    engine.createDefaultLighting();

    // Create ground
    this.createGround();

    // Create platforms
    this.createPlatforms();

    // Create player
    this.player = new Player(engine);

    // Create ingredients
    this.createIngredients();

    // Create customers
    this.createCustomers();

    console.log('[PlatformerGame] Initialized');
  }

  private createGround(): void {
    const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.engine.scene.add(ground);

    // Add ground as a platform for collision
    this.platforms.push(
      new Platform(this.engine, {
        position: new THREE.Vector3(0, -0.5, 0),
        size: new THREE.Vector3(100, 1, 100),
        color: 0x4a7c59,
        visible: false, // Ground mesh is already added
      })
    );
  }

  private createPlatforms(): void {
    const platformConfigs = [
      { x: 5, y: 1, z: 0, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: 10, y: 2, z: 5, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: 0, y: 1.5, z: -8, w: 6, h: 0.5, d: 4, color: 0x8b4513 },
      { x: -8, y: 2.5, z: -5, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: -5, y: 1, z: 8, w: 5, h: 0.5, d: 5, color: 0x8b4513 },
      { x: 8, y: 3, z: -8, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: 15, y: 1.5, z: -10, w: 5, h: 0.5, d: 5, color: 0x8b4513 },
      { x: -15, y: 2, z: 10, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: -12, y: 3, z: -12, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: 18, y: 2.5, z: 8, w: 5, h: 0.5, d: 4, color: 0xa0522d },
      { x: 20, y: 1, z: 15, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: -18, y: 1.5, z: -8, w: 5, h: 0.5, d: 5, color: 0xa0522d },
      { x: 12, y: 4, z: -15, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: -10, y: 1, z: 15, w: 6, h: 0.5, d: 4, color: 0xa0522d },
      { x: 25, y: 3, z: 0, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: -20, y: 2.5, z: 5, w: 5, h: 0.5, d: 5, color: 0xa0522d },
      { x: 8, y: 2, z: 20, w: 4, h: 0.5, d: 4, color: 0x8b4513 },
      { x: -8, y: 3.5, z: -18, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: 0, y: 2, z: 22, w: 5, h: 0.5, d: 5, color: 0x8b4513 },
      { x: 15, y: 1, z: -20, w: 4, h: 0.5, d: 4, color: 0xa0522d },
      { x: -25, y: 1.5, z: -2, w: 5, h: 0.5, d: 4, color: 0x8b4513 },
    ];

    for (const config of platformConfigs) {
      const platform = new Platform(this.engine, {
        position: new THREE.Vector3(config.x, config.y, config.z),
        size: new THREE.Vector3(config.w, config.h, config.d),
        color: config.color,
      });
      this.platforms.push(platform);
    }
  }

  private createIngredients(): void {
    // Define ingredient spawn positions (on top of platforms)
    const ingredientSpawns = [
      { x: 5, y: 1.75, z: 0, type: IngredientType.LETTUCE },
      { x: 10, y: 2.75, z: 5, type: IngredientType.BACON },
      { x: 0, y: 2.25, z: -8, type: IngredientType.CHEESE },
      { x: -8, y: 3.25, z: -5, type: IngredientType.TOMATO },
      { x: -5, y: 1.75, z: 8, type: IngredientType.PICKLE },
      { x: 8, y: 3.75, z: -8, type: IngredientType.ONION },
      { x: 15, y: 2.25, z: -10, type: IngredientType.LETTUCE },
      { x: -15, y: 2.75, z: 10, type: IngredientType.BACON },
      { x: -12, y: 3.75, z: -12, type: IngredientType.CHEESE },
      { x: 18, y: 3.25, z: 8, type: IngredientType.TOMATO },
      { x: 20, y: 1.75, z: 15, type: IngredientType.PICKLE },
      { x: -18, y: 2.25, z: -8, type: IngredientType.ONION },
      { x: 12, y: 4.75, z: -15, type: IngredientType.LETTUCE },
      { x: -10, y: 1.75, z: 15, type: IngredientType.BACON },
      { x: 25, y: 3.75, z: 0, type: IngredientType.CHEESE },
      { x: -20, y: 3.25, z: 5, type: IngredientType.TOMATO },
      { x: 8, y: 2.75, z: 20, type: IngredientType.PICKLE },
      { x: -8, y: 4.25, z: -18, type: IngredientType.ONION },
      { x: 0, y: 2.75, z: 22, type: IngredientType.LETTUCE },
      { x: 15, y: 1.75, z: -20, type: IngredientType.BACON },
    ];

    for (const spawn of ingredientSpawns) {
      const ingredient = new Ingredient(this.engine, {
        type: spawn.type,
        position: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
      });
      this.ingredients.push(ingredient);
    }
  }

  private createCustomers(): void {
    // Define customer positions and their orders
    const customerConfigs = [
      {
        x: 5, y: 1.75, z: 0,
        order: [IngredientType.LETTUCE, IngredientType.TOMATO, IngredientType.CHEESE]
      },
      {
        x: -8, y: 3.25, z: -5,
        order: [IngredientType.BACON, IngredientType.CHEESE]
      },
      {
        x: 15, y: 2.25, z: -10,
        order: [IngredientType.PICKLE, IngredientType.ONION, IngredientType.TOMATO]
      },
      {
        x: -15, y: 2.75, z: 10,
        order: [IngredientType.CHEESE, IngredientType.BACON, IngredientType.LETTUCE]
      },
      {
        x: 25, y: 3.75, z: 0,
        order: [IngredientType.TOMATO, IngredientType.PICKLE]
      },
      {
        x: -20, y: 3.25, z: 5,
        order: [IngredientType.ONION, IngredientType.CHEESE, IngredientType.BACON, IngredientType.LETTUCE]
      },
      {
        x: 0, y: 2.75, z: 22,
        order: [IngredientType.LETTUCE, IngredientType.TOMATO]
      },
      {
        x: -25, y: 1.5, z: -2,
        order: [IngredientType.PICKLE, IngredientType.ONION]
      },
    ];

    for (const config of customerConfigs) {
      const customer = new Customer(this.engine, new THREE.Vector3(config.x, config.y, config.z), {
        ingredients: config.order
      });
      this.customers.push(customer);
    }
  }

  update(deltaTime: number): void {
    // Update player (handles input and movement)
    this.player.update(deltaTime, this.platforms);

    // Update ingredients
    for (const ingredient of this.ingredients) {
      if (!ingredient.isCollected()) {
        ingredient.update(deltaTime);

        // Check collision with player
        const playerPos = this.player.getPosition();
        const playerRadius = this.player.getRadius();
        if (ingredient.checkCollision(playerPos, playerRadius)) {
          // Add ingredient to player's stack
          const ingredientMesh = ingredient.createMeshForPlayer();
          const ingredientHeight = ingredient.getHeight();
          const ingredientType = ingredient.getType();
          this.player.addIngredient(ingredientMesh, ingredientHeight, ingredientType);
        }
      }
    }

    // Check customer interactions
    const playerPos = this.player.getPosition();
    let nearCustomer: Customer | null = null;
    
    for (const customer of this.customers) {
      if (!customer.isOrderFulfilled() && customer.checkInteraction(playerPos)) {
        nearCustomer = customer;
        break;
      }
    }

    // Handle customer interaction
    if (nearCustomer) {
      if (this.currentCustomer !== nearCustomer) {
        this.currentCustomer = nearCustomer;
        this.updateOrderUI(nearCustomer);
        console.log('[PlatformerGame] Near customer with order:', nearCustomer.getOrder().ingredients);
      }

      // Check if player wants to deliver (press E key)
      const input = this.engine.input;
      const shouldInteract = input.isKeyPressed('KeyE');

      if (shouldInteract) {
        const playerIngredients = this.player.getIngredientList();
        if (nearCustomer.validateOrder(playerIngredients)) {
          // Order matches! Fulfill it
          nearCustomer.fulfillOrder();
          this.player.resetIngredients();
          this.hideOrderUI();
          this.currentCustomer = null;
          console.log('[PlatformerGame] Order delivered! Ingredients reset.');
        } else {
          console.log('[PlatformerGame] Order does not match. Required:', nearCustomer.getOrder().ingredients, 'Got:', playerIngredients);
        }
      }
    } else {
      if (this.currentCustomer) {
        this.hideOrderUI();
        this.currentCustomer = null;
      }
    }

    // Update customers
    for (const customer of this.customers) {
      customer.update(deltaTime);
    }
  }

  onResize(width: number, height: number): void {
    // Handle resize if needed
  }

  private ingredientPreviewScenes: Array<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mesh: THREE.Mesh;
    canvas: HTMLCanvasElement;
  }> = [];
  private previewAnimationId: number | null = null;

  private updateOrderUI(customer: Customer): void {
    const orderElement = document.getElementById('customer-order');
    const ingredientsElement = document.getElementById('order-ingredients');
    
    if (!orderElement || !ingredientsElement) return;

    // Clean up previous preview scenes
    this.cleanupIngredientPreviews();

    const order = customer.getOrder();
    ingredientsElement.innerHTML = '';

    order.ingredients.forEach((ingredientType) => {
      const item = document.createElement('div');
      item.className = 'ingredient-item';
      
      // Create container for 3D preview and text
      const previewContainer = document.createElement('div');
      previewContainer.className = 'ingredient-preview-container';
      
      // Create canvas for 3D preview
      const canvas = document.createElement('canvas');
      canvas.className = 'ingredient-preview-canvas';
      canvas.width = 80;
      canvas.height = 80;
      
      // Create 3D preview scene
      const previewScene = this.createIngredientPreview(ingredientType, canvas);
      this.ingredientPreviewScenes.push(previewScene);
      
      // Add canvas to container
      previewContainer.appendChild(canvas);
      
      // Add text label below the preview
      const label = document.createElement('div');
      label.className = 'ingredient-label';
      label.textContent = ingredientType;
      previewContainer.appendChild(label);
      
      item.appendChild(previewContainer);
      ingredientsElement.appendChild(item);
    });

    orderElement.classList.add('show');
    
    // Start animation loop for previews
    this.animateIngredientPreviews();
  }

  private createIngredientPreview(ingredientType: IngredientType, canvas: HTMLCanvasElement): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mesh: THREE.Mesh;
    canvas: HTMLCanvasElement;
  } {
    // Create a small scene for the preview
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);
    
    // Camera positioned to view the ingredient
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
    camera.position.set(0.8, 0.6, 0.8);
    camera.lookAt(0, 0, 0);
    
    // Renderer for the preview canvas
    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(80, 80);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Lighting for the preview
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create the ingredient mesh using the same config as Ingredient class
    const config = Ingredient.getIngredientConfig(ingredientType);
    const geometry = config.geometry();
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.6,
      metalness: ingredientType === IngredientType.CHEESE ? 0.3 : 0,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // Initial render
    renderer.render(scene, camera);
    
    return { scene, camera, renderer, mesh, canvas };
  }

  private animateIngredientPreviews(): void {
    // Stop any existing animation loop
    if (this.previewAnimationId !== null) {
      cancelAnimationFrame(this.previewAnimationId);
      this.previewAnimationId = null;
    }
    
    const animate = () => {
      if (this.ingredientPreviewScenes.length === 0) {
        this.previewAnimationId = null;
        return;
      }
      
      this.ingredientPreviewScenes.forEach((preview) => {
        // Rotate the mesh
        preview.mesh.rotation.y += 0.02;
        preview.renderer.render(preview.scene, preview.camera);
      });
      
      this.previewAnimationId = requestAnimationFrame(animate);
    };
    
    this.previewAnimationId = requestAnimationFrame(animate);
  }

  private cleanupIngredientPreviews(): void {
    // Stop animation loop
    if (this.previewAnimationId !== null) {
      cancelAnimationFrame(this.previewAnimationId);
      this.previewAnimationId = null;
    }
    
    this.ingredientPreviewScenes.forEach((preview) => {
      // Dispose of geometries and materials
      preview.mesh.geometry.dispose();
      if (preview.mesh.material instanceof THREE.Material) {
        preview.mesh.material.dispose();
      }
      
      // Dispose of renderer
      preview.renderer.dispose();
      
      // Remove canvas from DOM if it exists
      if (preview.canvas.parentNode) {
        preview.canvas.parentNode.removeChild(preview.canvas);
      }
    });
    
    this.ingredientPreviewScenes = [];
  }

  private hideOrderUI(): void {
    const orderElement = document.getElementById('customer-order');
    if (orderElement) {
      orderElement.classList.remove('show');
    }
    // Clean up preview scenes when hiding UI
    this.cleanupIngredientPreviews();
  }

  dispose(): void {
    this.hideOrderUI();
    this.cleanupIngredientPreviews();
    this.player.dispose();
    for (const platform of this.platforms) {
      platform.dispose();
    }
    for (const ingredient of this.ingredients) {
      ingredient.dispose();
    }
    for (const customer of this.customers) {
      customer.dispose();
    }
    console.log('[PlatformerGame] Disposed');
  }
}
