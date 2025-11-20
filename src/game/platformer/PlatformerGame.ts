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

    // Create player
    this.player = new Player(engine);

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
    const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.8,
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

    // Update ingredients (optimize: cache player position)
    const playerPos = this.player.getPosition();
    const playerRadius = this.player.getRadius();
    
    for (const ingredient of this.ingredients) {
      if (!ingredient.isCollected()) {
        ingredient.update(deltaTime);

        // Check collision with player (optimized distance check)
        if (ingredient.checkCollision(playerPos, playerRadius)) {
          // Add ingredient to player's stack
          const ingredientMesh = ingredient.createMeshForPlayer();
          const ingredientHeight = ingredient.getHeight();
          const ingredientType = ingredient.getType();
          this.player.addIngredient(ingredientMesh, ingredientHeight, ingredientType);
        }
      }
    }

    // Check customer interactions (reuse cached playerPos)
    let nearCustomer: Customer | null = null;
    
    for (const customer of this.customers) {
      if (!customer.isOrderFulfilled() && customer.checkInteraction(playerPos)) {
        nearCustomer = customer;
        break; // Found one, no need to check others
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

    // Update customers (throttle on mobile for better performance)
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    if (!isMobile || (Math.floor(performance.now() / 33) % 2 === 0)) {
      // Update every frame on desktop, every 2nd frame on mobile (33ms = ~30fps)
      for (const customer of this.customers) {
        customer.update(deltaTime);
      }
    }
  }

  onResize(width: number, height: number): void {
    // Handle resize if needed
  }

  private ingredientPreviewCanvases: Array<{
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    color: number;
    type: IngredientType;
  }> = [];

  private updateOrderUI(customer: Customer): void {
    const orderElement = document.getElementById('customer-order');
    const ingredientsElement = document.getElementById('order-ingredients');
    
    if (!orderElement || !ingredientsElement) return;

    // Clean up previous preview canvases
    this.cleanupIngredientPreviews();

    const order = customer.getOrder();
    ingredientsElement.innerHTML = '';

    order.ingredients.forEach((ingredientType) => {
      try {
        const item = document.createElement('div');
        item.className = 'ingredient-item';
        
        // Create container for preview and text
        const previewContainer = document.createElement('div');
        previewContainer.className = 'ingredient-preview-container';
        
        // Create canvas for 2D preview (much lighter than WebGL)
        const canvas = document.createElement('canvas');
        canvas.className = 'ingredient-preview-canvas';
        canvas.width = 80;
        canvas.height = 80;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Get ingredient config for color
          const config = Ingredient.getIngredientConfig(ingredientType);
          const color = config ? config.color : 0xffffff;
          
          // Draw 2D preview
          this.drawIngredientPreview(ctx, ingredientType, color);
          
          // Store canvas reference for cleanup
          this.ingredientPreviewCanvases.push({ canvas, ctx, color, type: ingredientType });
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
  }

  /**
   * Draw a simple 2D preview of an ingredient on a canvas context.
   * This is much more performant than creating separate WebGL contexts.
   */
  private drawIngredientPreview(ctx: CanvasRenderingContext2D, ingredientType: IngredientType, color: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear canvas with dark background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, width, height);
    
    // Convert hex color to RGB
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const colorStr = `rgb(${r}, ${g}, ${b})`;
    
    // Draw ingredient shape based on type
    ctx.fillStyle = colorStr;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    
    switch (ingredientType) {
      case IngredientType.LETTUCE:
        // Draw wavy lettuce shape
        ctx.beginPath();
        ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Add some texture lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, 15 + i * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
        
      case IngredientType.BACON:
        // Draw rectangular bacon strip
        ctx.fillRect(centerX - 20, centerY - 8, 40, 16);
        ctx.strokeRect(centerX - 20, centerY - 8, 40, 16);
        // Add wavy lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX - 20, centerY - 8 + i * 5);
          ctx.quadraticCurveTo(centerX, centerY - 8 + i * 5 + 2, centerX + 20, centerY - 8 + i * 5);
          ctx.stroke();
        }
        break;
        
      case IngredientType.CHEESE:
        // Draw square cheese slice
        ctx.fillRect(centerX - 20, centerY - 20, 40, 40);
        ctx.strokeRect(centerX - 20, centerY - 20, 40, 40);
        // Add holes
        ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX - 10, centerY - 10, 3, 0, Math.PI * 2);
        ctx.arc(centerX + 10, centerY + 10, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case IngredientType.TOMATO:
        // Draw circular tomato
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX - 8, centerY - 8, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case IngredientType.PICKLE:
        // Draw elongated pickle
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 12, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Add texture lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX + i * 5, centerY - 15);
          ctx.lineTo(centerX + i * 5, centerY + 15);
          ctx.stroke();
        }
        break;
        
      case IngredientType.ONION:
        // Draw circular onion
        ctx.beginPath();
        ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Add concentric circles
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, 6 * i, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
        
      default:
        // Fallback: simple circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
  }

  private cleanupIngredientPreviews(): void {
    // Clean up canvas references (2D canvases don't need special disposal)
    this.ingredientPreviewCanvases = [];
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
