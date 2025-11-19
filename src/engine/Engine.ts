/**
 * IMPORTANT FOR AI:
 * - This is the stable engine layer that provides core functionality.
 * - DO NOT modify this file unless absolutely necessary.
 * - Games interact with the engine through the public API defined here.
 */

import * as THREE from 'three';
import type { Game, EngineConfig } from './Types';
import { Input } from './Input';
import { MobileInput } from './MobileInput';
import { AssetLoader } from './AssetLoader';

/**
 * Core game engine that manages the render loop, scene, camera, and renderer.
 * Provides a stable interface for games to build upon.
 */
export class Engine {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly input: Input;
  public readonly mobileInput: MobileInput;
  public readonly assetLoader: AssetLoader;

  private game: Game | null = null;
  private lastTime: number = 0;
  private animationId: number | null = null;

  constructor(config: EngineConfig) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: config.canvas,
      antialias: config.antialias ?? true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    if (config.enableShadows ?? true) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Input setup
    this.input = new Input(config.canvas);
    this.mobileInput = new MobileInput();

    // Asset loader setup
    this.assetLoader = new AssetLoader();

    // Window resize handling
    window.addEventListener('resize', this.handleResize.bind(this));

    console.log('[Engine] Initialized');
  }

  /**
   * Handle window resize events.
   */
  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.game?.onResize) {
      this.game.onResize(width, height);
    }
  }

  /**
   * Main render loop.
   */
  private animate = (time: number): void => {
    this.animationId = requestAnimationFrame(this.animate);

    // Calculate delta time in seconds
    const deltaTime = this.lastTime ? (time - this.lastTime) / 1000 : 0;
    this.lastTime = time;

    // Update game
    if (this.game) {
      this.game.update(deltaTime);
    }

    // Reset mouse delta after game update
    this.input.resetMouseDelta();

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Start running a game.
   * @param game - The game instance to run
   */
  run(game: Game): void {
    if (this.game) {
      console.warn('[Engine] Stopping previous game');
      this.stop();
    }

    this.game = game;
    this.lastTime = 0;
    console.log('[Engine] Starting game');
    this.animate(0);
  }

  /**
   * Stop the current game.
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.game) {
      this.game.dispose();
      this.game = null;
    }

    console.log('[Engine] Stopped');
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.stop();
    this.input.dispose();
    this.mobileInput.dispose();
    this.renderer.dispose();
    console.log('[Engine] Disposed');
  }

  /**
   * Helper: Create a basic directional light setup.
   * Common pattern that games can use.
   */
  createDefaultLighting(): {
    ambient: THREE.AmbientLight;
    directional: THREE.DirectionalLight;
  } {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    directional.shadow.camera.left = -60;
    directional.shadow.camera.right = 60;
    directional.shadow.camera.top = 60;
    directional.shadow.camera.bottom = -60;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    this.scene.add(directional);

    return { ambient, directional };
  }
}
