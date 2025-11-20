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
  private score: number = 0;

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup lighting
    engine.createDefaultLighting();

    // Create ground
    this.createGround();

    // Create platforms
    this.createPlatforms();

    // Create player - start at the counter (kitchen area)
    const counterY = 1.2; // Counter top height
    const counterZ = -15; // Counter position
    const playerStartPos = new THREE.Vector3(0, counterY + 0.5, counterZ + 1); // Slightly in front of counter
    this.player = new Player(engine, playerStartPos);

    // Create ingredients
    this.createIngredients();

    // Create customers
    this.createCustomers();

    // Initialize score display
    this.updateScoreDisplay();

    console.log('[PlatformerGame] Initialized');
  }

  private createGround(): void {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    // Create restaurant floor (tile pattern)
    const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8, // Light gray tile color
      roughness: 0.6,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = !isMobile; // Disable shadow receiving on mobile
    this.engine.scene.add(ground);

    // Add ground as a platform for collision
    this.platforms.push(
      new Platform(this.engine, {
        position: new THREE.Vector3(0, -0.5, 0),
        size: new THREE.Vector3(100, 1, 100),
        color: 0xe8e8e8,
        visible: false, // Ground mesh is already added
      })
    );
  }

  private createPlatforms(): void {
    // Create Carl's Jr restaurant layout
    
    // 1. Counter (kitchen/prep area) - long counter along the back wall
    const counterLength = 30;
    const counterWidth = 2;
    const counterHeight = 1.2;
    const counterY = counterHeight / 2;
    const counterZ = -15; // Back of restaurant
    
    const counter = new Platform(this.engine, {
      position: new THREE.Vector3(0, counterY, counterZ),
      size: new THREE.Vector3(counterLength, counterHeight, counterWidth),
      color: 0x8b4513, // Brown counter top
    });
    this.platforms.push(counter);

    // 2. Tables - arranged in dining area
    // Table dimensions
    const tableSize = 2.5;
    const tableHeight = 0.8;
    const tableY = tableHeight / 2;
    
    // Table positions - arranged in rows in the dining area
    const tableConfigs = [
      // Front row (closer to entrance)
      { x: -12, z: 8 },
      { x: -6, z: 8 },
      { x: 0, z: 8 },
      { x: 6, z: 8 },
      { x: 12, z: 8 },
      
      // Middle row
      { x: -12, z: 2 },
      { x: -6, z: 2 },
      { x: 0, z: 2 },
      { x: 6, z: 2 },
      { x: 12, z: 2 },
      
      // Back row (near counter)
      { x: -12, z: -4 },
      { x: -6, z: -4 },
      { x: 0, z: -4 },
      { x: 6, z: -4 },
      { x: 12, z: -4 },
      
      // Side tables
      { x: -18, z: 5 },
      { x: 18, z: 5 },
      { x: -18, z: -1 },
      { x: 18, z: -1 },
    ];

    for (const tablePos of tableConfigs) {
      const table = new Platform(this.engine, {
        position: new THREE.Vector3(tablePos.x, tableY, tablePos.z),
        size: new THREE.Vector3(tableSize, tableHeight, tableSize),
        color: 0x654321, // Dark brown table color
      });
      this.platforms.push(table);
    }
  }

  private createIngredients(): void {
    // Ingredients spawn on the counter (kitchen/prep area)
    const counterY = 1.2; // Counter top height
    const counterZ = -15; // Counter position
    const ingredientHeight = 0.3; // Height offset for ingredients
    
    // Spread ingredients along the counter
    const ingredientSpawns = [
      { x: -12, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.LETTUCE },
      { x: -9, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.BACON },
      { x: -6, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.CHEESE },
      { x: -3, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.TOMATO },
      { x: 0, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.PICKLE },
      { x: 3, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.ONION },
      { x: 6, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.LETTUCE },
      { x: 9, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.BACON },
      { x: 12, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.CHEESE },
      // Additional ingredients for variety
      { x: -10, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.TOMATO },
      { x: -7, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.PICKLE },
      { x: -4, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.ONION },
      { x: -1, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.LETTUCE },
      { x: 2, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.BACON },
      { x: 5, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.CHEESE },
      { x: 8, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.TOMATO },
      { x: 11, y: counterY + ingredientHeight, z: counterZ, type: IngredientType.PICKLE },
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
    // Customers sit at tables in the dining area
    const tableY = 0.8; // Table top height
    const customerHeight = 1.0; // Customer standing on table
    
    // Define customer positions at tables and their orders
    const customerConfigs = [
      // Front row tables
      {
        x: -12, y: tableY + customerHeight, z: 8,
        order: [IngredientType.LETTUCE, IngredientType.TOMATO, IngredientType.CHEESE]
      },
      {
        x: -6, y: tableY + customerHeight, z: 8,
        order: [IngredientType.BACON, IngredientType.CHEESE]
      },
      {
        x: 0, y: tableY + customerHeight, z: 8,
        order: [IngredientType.PICKLE, IngredientType.ONION, IngredientType.TOMATO]
      },
      {
        x: 6, y: tableY + customerHeight, z: 8,
        order: [IngredientType.CHEESE, IngredientType.BACON, IngredientType.LETTUCE]
      },
      {
        x: 12, y: tableY + customerHeight, z: 8,
        order: [IngredientType.TOMATO, IngredientType.PICKLE]
      },
      
      // Middle row tables
      {
        x: -12, y: tableY + customerHeight, z: 2,
        order: [IngredientType.ONION, IngredientType.CHEESE, IngredientType.BACON, IngredientType.LETTUCE]
      },
      {
        x: -6, y: tableY + customerHeight, z: 2,
        order: [IngredientType.LETTUCE, IngredientType.TOMATO]
      },
      {
        x: 0, y: tableY + customerHeight, z: 2,
        order: [IngredientType.PICKLE, IngredientType.ONION]
      },
      {
        x: 6, y: tableY + customerHeight, z: 2,
        order: [IngredientType.BACON, IngredientType.CHEESE, IngredientType.TOMATO]
      },
      {
        x: 12, y: tableY + customerHeight, z: 2,
        order: [IngredientType.CHEESE, IngredientType.LETTUCE]
      },
      
      // Back row tables (near counter)
      {
        x: -12, y: tableY + customerHeight, z: -4,
        order: [IngredientType.TOMATO, IngredientType.PICKLE, IngredientType.ONION]
      },
      {
        x: -6, y: tableY + customerHeight, z: -4,
        order: [IngredientType.BACON, IngredientType.CHEESE]
      },
      {
        x: 0, y: tableY + customerHeight, z: -4,
        order: [IngredientType.LETTUCE, IngredientType.TOMATO, IngredientType.CHEESE, IngredientType.BACON]
      },
      {
        x: 6, y: tableY + customerHeight, z: -4,
        order: [IngredientType.PICKLE, IngredientType.ONION]
      },
      {
        x: 12, y: tableY + customerHeight, z: -4,
        order: [IngredientType.CHEESE, IngredientType.BACON, IngredientType.LETTUCE]
      },
      
      // Side tables
      {
        x: -18, y: tableY + customerHeight, z: 5,
        order: [IngredientType.TOMATO, IngredientType.CHEESE]
      },
      {
        x: 18, y: tableY + customerHeight, z: 5,
        order: [IngredientType.ONION, IngredientType.PICKLE, IngredientType.LETTUCE]
      },
      {
        x: -18, y: tableY + customerHeight, z: -1,
        order: [IngredientType.BACON, IngredientType.CHEESE, IngredientType.TOMATO]
      },
      {
        x: 18, y: tableY + customerHeight, z: -1,
        order: [IngredientType.LETTUCE, IngredientType.PICKLE]
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
          // Order matches! Fulfill it and award points
          nearCustomer.fulfillOrder();
          this.player.resetIngredients();
          this.hideOrderUI();
          this.currentCustomer = null;
          // Award points for correct order (base points + bonus for number of ingredients)
          const pointsEarned = 10 + (playerIngredients.length * 5);
          this.addScore(pointsEarned);
          console.log(`[PlatformerGame] Order delivered! +${pointsEarned} points. Ingredients reset.`);
        } else {
          // Wrong order - deduct points
          const pointsLost = 5;
          this.addScore(-pointsLost);
          console.log('[PlatformerGame] Order does not match. Required:', nearCustomer.getOrder().ingredients, 'Got:', playerIngredients, `-${pointsLost} points`);
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
      try {
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
        // Only add valid previews (skip null/failed ones)
        if (previewScene && previewScene.renderer && previewScene.scene) {
          this.ingredientPreviewScenes.push(previewScene);
        }
        
        // Add canvas to container
        previewContainer.appendChild(canvas);
        
        // Add text label below the preview
        const label = document.createElement('div');
        label.className = 'ingredient-label';
        label.textContent = ingredientType;
        previewContainer.appendChild(label);
        
        item.appendChild(previewContainer);
        ingredientsElement.appendChild(item);
      } catch (error) {
        console.error('[PlatformerGame] Error creating ingredient preview UI:', error);
        // Continue with other ingredients even if one fails
      }
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
    try {
      // Create a small scene for the preview
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x2a2a2a);
      
      // Camera positioned to view the ingredient
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
      camera.position.set(0.8, 0.6, 0.8);
      camera.lookAt(0, 0, 0);
      
      // Renderer for the preview canvas
      // Optimize for mobile: disable antialiasing, limit pixel ratio
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
      const renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: false, // Disable antialiasing for better performance
        alpha: true,
        preserveDrawingBuffer: false,
        powerPreference: "low-power"
      });
      renderer.setSize(80, 80);
      // Limit pixel ratio more aggressively on mobile
      renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
      
      // Lighting for the preview
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      // Create the ingredient mesh using the same config as Ingredient class
      const config = Ingredient.getIngredientConfig(ingredientType);
      if (!config) {
        throw new Error(`No config found for ingredient type: ${ingredientType}`);
      }
      const geometry = config.geometry();
      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.6,
        metalness: ingredientType === IngredientType.CHEESE ? 0.3 : 0,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      
      // Initial render - wrap in try-catch to handle context errors
      try {
        renderer.render(scene, camera);
      } catch (renderError) {
        console.warn('[PlatformerGame] Failed to render ingredient preview:', renderError);
        // Continue anyway - the animation loop will try again
      }
      
      return { scene, camera, renderer, mesh, canvas };
    } catch (error) {
      console.error('[PlatformerGame] Failed to create ingredient preview:', error);
      // Create a fallback 2D canvas instead of WebGL
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#666';
        ctx.fillRect(0, 0, 80, 80);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ingredientType.substring(0, 3).toUpperCase(), 40, 40);
      }
      
      // Return null to indicate failure - the animation loop will skip null previews
      // We'll modify the animation loop to handle this
      return null as any; // Type assertion to satisfy return type, but we'll check for null in animation
    }
  }

  private animateIngredientPreviews(): void {
    // Stop any existing animation loop
    if (this.previewAnimationId !== null) {
      cancelAnimationFrame(this.previewAnimationId);
      this.previewAnimationId = null;
    }
    
    // Throttle preview animations on mobile (render less frequently)
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    let lastPreviewTime = 0;
    const previewFrameInterval = isMobile ? 1000 / 15 : 1000 / 30; // 15 FPS on mobile, 30 FPS on desktop
    
    const animate = (time: number) => {
      if (this.ingredientPreviewScenes.length === 0) {
        this.previewAnimationId = null;
        return;
      }
      
      // Throttle rendering for better performance
      const elapsed = time - lastPreviewTime;
      if (elapsed < previewFrameInterval) {
        this.previewAnimationId = requestAnimationFrame(animate);
        return;
      }
      lastPreviewTime = time - (elapsed % previewFrameInterval);
      
      this.ingredientPreviewScenes.forEach((preview) => {
        // Skip null previews (failed to create)
        if (!preview || !preview.renderer || !preview.scene || !preview.camera) {
          return;
        }
        
        try {
          // Rotate the mesh (slower rotation on mobile)
          if (preview.mesh) {
            preview.mesh.rotation.y += isMobile ? 0.01 : 0.02;
          }
          
          // Check if renderer context is still valid
          const gl = preview.renderer.getContext();
          if (gl && !gl.isContextLost()) {
            preview.renderer.render(preview.scene, preview.camera);
          }
        } catch (error) {
          console.warn('[PlatformerGame] Error rendering ingredient preview:', error);
          // Continue with other previews
        }
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
      // Skip null/invalid previews
      if (!preview) return;
      
      try {
        // Dispose of geometries and materials
        if (preview.mesh && preview.mesh.geometry) {
          preview.mesh.geometry.dispose();
        }
        if (preview.mesh && preview.mesh.material instanceof THREE.Material) {
          preview.mesh.material.dispose();
        }
        
        // Dispose of renderer
        if (preview.renderer) {
          preview.renderer.dispose();
        }
        
        // Remove canvas from DOM if it exists
        if (preview.canvas && preview.canvas.parentNode) {
          preview.canvas.parentNode.removeChild(preview.canvas);
        }
      } catch (error) {
        console.warn('[PlatformerGame] Error disposing preview:', error);
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

  private addScore(points: number): void {
    this.score += points;
    this.updateScoreDisplay();
  }

  private updateScoreDisplay(): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `Score: ${this.score}`;
    }
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
