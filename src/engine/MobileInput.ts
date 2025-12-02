/**
 * IMPORTANT FOR AI:
 * - This file handles mobile touch input (joystick, buttons, touch camera).
 * - DO NOT modify this file.
 * - Games should use the MobileInput instance provided by the Engine.
 */

import * as THREE from 'three';

interface TouchPosition {
  x: number;
  y: number;
}

/**
 * Mobile input handler for touch-based controls.
 * Provides virtual joystick, jump button, and touch-based camera rotation.
 */
export class MobileInput {
  private joystickActive = false;
  private joystickCenter: TouchPosition = { x: 0, y: 0 };
  private joystickCurrent: TouchPosition = { x: 0, y: 0 };
  private joystickTouchId: number | null = null;

  private cameraTouchId: number | null = null;
  private lastCameraTouch: TouchPosition = { x: 0, y: 0 };
  private cameraDelta: TouchPosition = { x: 0, y: 0 };

  private jumpPressed = false;
  private createMode = true; // true = create, false = destroy
  private mapTapPressed = false; // Track map taps for create/destroy
  private mapTapPosition: TouchPosition | null = null; // Store tap position for raycasting

  private joystickElement: HTMLElement | null = null;
  private joystickKnobElement: HTMLElement | null = null;
  private jumpButtonElement: HTMLElement | null = null;
  private toggleButtonElement: HTMLElement | null = null;
  private mapTapTouchId: number | null = null;

  constructor() {
    this.setupMobileControls();
    this.setupEventListeners();
  }

  private setupMobileControls(): void {
    // Check if controls already exist
    if (document.getElementById('mobile-controls')) return;

    const controlsHTML = `
      <div id="mobile-controls" style="display: none;">
        <!-- Virtual Joystick -->
        <div id="joystick" style="
          position: fixed;
          bottom: 80px;
          left: 60px;
          width: 120px;
          height: 120px;
          background: rgba(255, 255, 255, 0.2);
          border: 3px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          touch-action: none;
        ">
          <div id="joystick-knob" style="
            position: absolute;
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
          "></div>
        </div>

        <!-- Toggle Button (Create/Destroy) -->
        <button id="toggle-button" style="
          position: fixed;
          bottom: 220px;
          right: 60px;
          width: 80px;
          height: 80px;
          background: rgba(100, 255, 100, 0.3);
          border: 3px solid rgba(100, 255, 100, 0.6);
          border-radius: 50%;
          color: white;
          font-size: 12px;
          font-weight: bold;
          touch-action: none;
          user-select: none;
        ">CREATE</button>

        <!-- Jump Button -->
        <button id="jump-button" style="
          position: fixed;
          bottom: 120px;
          right: 60px;
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 100, 0.3);
          border: 3px solid rgba(255, 255, 100, 0.6);
          border-radius: 50%;
          color: white;
          font-size: 16px;
          font-weight: bold;
          touch-action: none;
          user-select: none;
        ">JUMP</button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', controlsHTML);

    this.joystickElement = document.getElementById('joystick');
    this.joystickKnobElement = document.getElementById('joystick-knob');
    this.jumpButtonElement = document.getElementById('jump-button');
    this.toggleButtonElement = document.getElementById('toggle-button');

    // Initialize toggle button state
    this.updateToggleButton();

    // Show/hide based on device type
    this.updateControlsVisibility();
    
    // Also check after a short delay to ensure proper detection
    setTimeout(() => {
      this.updateControlsVisibility();
    }, 100);
  }

  private setupEventListeners(): void {
    // Joystick events
    if (this.joystickElement) {
      this.joystickElement.addEventListener('touchstart', this.handleJoystickStart.bind(this));
      this.joystickElement.addEventListener('touchmove', this.handleJoystickMove.bind(this));
      this.joystickElement.addEventListener('touchend', this.handleJoystickEnd.bind(this));
      this.joystickElement.addEventListener('touchcancel', this.handleJoystickEnd.bind(this));
    }

    // Jump button events
    if (this.jumpButtonElement) {
      this.jumpButtonElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.jumpPressed = true;
      });
      this.jumpButtonElement.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.jumpPressed = false;
      });
    }

    // Toggle button events (Create/Destroy)
    if (this.toggleButtonElement) {
      this.toggleButtonElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.createMode = !this.createMode;
        this.updateToggleButton();
      });
    }

    // Camera touch (anywhere on screen except controls)
    document.addEventListener('touchstart', this.handleCameraTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleCameraTouchMove.bind(this));
    document.addEventListener('touchend', this.handleCameraTouchEnd.bind(this));
    document.addEventListener('touchcancel', this.handleCameraTouchEnd.bind(this));

    // Orientation change
    window.addEventListener('resize', this.updateControlsVisibility.bind(this));
    window.addEventListener('orientationchange', this.updateControlsVisibility.bind(this));
  }

  private handleJoystickStart(e: TouchEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (this.joystickTouchId !== null) return;

    const touch = e.changedTouches[0];
    this.joystickTouchId = touch.identifier;

    const rect = this.joystickElement!.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    this.joystickActive = true;
    this.updateJoystickPosition(touch.clientX, touch.clientY);
  }

  private handleJoystickMove(e: TouchEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this.joystickActive) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.updateJoystickPosition(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  private handleJoystickEnd(e: TouchEvent): void {
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.joystickCurrent = { x: 0, y: 0 };
        this.resetJoystickKnob();
        break;
      }
    }
  }

  private updateJoystickPosition(touchX: number, touchY: number): void {
    const dx = touchX - this.joystickCenter.x;
    const dy = touchY - this.joystickCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 35; // Half of joystick radius

    let finalX = dx;
    let finalY = dy;

    if (distance > maxDistance) {
      finalX = (dx / distance) * maxDistance;
      finalY = (dy / distance) * maxDistance;
    }

    // Normalize to -1 to 1
    this.joystickCurrent = {
      x: finalX / maxDistance,
      y: finalY / maxDistance,
    };

    // Update visual position
    if (this.joystickKnobElement) {
      this.joystickKnobElement.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px))`;
    }
  }

  private resetJoystickKnob(): void {
    if (this.joystickKnobElement) {
      this.joystickKnobElement.style.transform = 'translate(-50%, -50%)';
    }
  }

  private handleCameraTouchStart(e: TouchEvent): void {
    // Ignore touches on controls
    const target = e.target as HTMLElement;
    if (target.closest('#mobile-controls')) return;

    // Start tracking potential tap/drag
    // We'll determine if it's a tap or drag based on movement
    // Only start if we don't already have a map/camera touch active
    if (this.mapTapTouchId === null && this.cameraTouchId === null) {
      // Find the first touch that's not the joystick touch
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        // Skip if this is the joystick touch
        if (touch.identifier === this.joystickTouchId) {
          continue;
        }
        // Use this touch for map/camera control
        this.mapTapTouchId = touch.identifier;
        this.lastCameraTouch = {
          x: touch.clientX,
          y: touch.clientY,
        };
        break;
      }
    }
  }

  private handleCameraTouchMove(e: TouchEvent): void {
    // Check if map tap moved (if moved significantly, it's a drag, not a tap)
    if (this.mapTapTouchId !== null) {
      // Check if the touch still exists
      let touchFound = false;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === this.mapTapTouchId) {
          touchFound = true;
          const dx = touch.clientX - this.lastCameraTouch.x;
          const dy = touch.clientY - this.lastCameraTouch.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If moved more than 10px, treat as drag (camera rotation)
          if (distance > 10) {
            // Switch to camera control
            this.cameraTouchId = this.mapTapTouchId;
            this.mapTapTouchId = null;
            // Update last touch position for camera delta calculation
            this.lastCameraTouch = {
              x: touch.clientX,
              y: touch.clientY,
            };
          }
          break;
        }
      }
      // If touch was lost (e.g., ended unexpectedly), clear it
      if (!touchFound) {
        this.mapTapTouchId = null;
      }
    }

    // Handle camera rotation
    if (this.cameraTouchId !== null) {
      // Check if the touch still exists
      let touchFound = false;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === this.cameraTouchId) {
          touchFound = true;
          this.cameraDelta = {
            x: touch.clientX - this.lastCameraTouch.x,
            y: touch.clientY - this.lastCameraTouch.y,
          };
          this.lastCameraTouch = {
            x: touch.clientX,
            y: touch.clientY,
          };
          break;
        }
      }
      // If touch was lost (e.g., ended unexpectedly), clear it
      if (!touchFound) {
        this.cameraTouchId = null;
        this.cameraDelta = { x: 0, y: 0 };
      }
    }
  }

  private handleCameraTouchEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      
      // Skip joystick touches - they're handled separately
      if (touch.identifier === this.joystickTouchId) {
        continue;
      }
      
      // Handle map tap end
      if (touch.identifier === this.mapTapTouchId) {
        // This was a tap (not a drag), trigger map interaction
        this.mapTapPressed = true;
        // Store tap position for raycasting
        this.mapTapPosition = {
          x: touch.clientX,
          y: touch.clientY,
        };
        this.mapTapTouchId = null;
      }
      
      // Handle camera touch end
      if (touch.identifier === this.cameraTouchId) {
        this.cameraTouchId = null;
        this.cameraDelta = { x: 0, y: 0 };
      }
    }
    
    // Also check if any tracked touches are no longer in the touches list
    // This handles cases where touches might be lost unexpectedly
    if (this.mapTapTouchId !== null) {
      let touchExists = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.mapTapTouchId) {
          touchExists = true;
          break;
        }
      }
      if (!touchExists) {
        this.mapTapTouchId = null;
      }
    }
    
    if (this.cameraTouchId !== null) {
      let touchExists = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.cameraTouchId) {
          touchExists = true;
          break;
        }
      }
      if (!touchExists) {
        this.cameraTouchId = null;
        this.cameraDelta = { x: 0, y: 0 };
      }
    }
  }

  private updateToggleButton(): void {
    if (!this.toggleButtonElement) return;
    
    if (this.createMode) {
      this.toggleButtonElement.textContent = 'CREATE';
      this.toggleButtonElement.style.background = 'rgba(100, 255, 100, 0.3)';
      this.toggleButtonElement.style.borderColor = 'rgba(100, 255, 100, 0.6)';
    } else {
      this.toggleButtonElement.textContent = 'DESTROY';
      this.toggleButtonElement.style.background = 'rgba(255, 100, 100, 0.3)';
      this.toggleButtonElement.style.borderColor = 'rgba(255, 100, 100, 0.6)';
    }
  }

  private updateControlsVisibility(): void {
    const controls = document.getElementById('mobile-controls');
    if (!controls) return;

    // Show on mobile devices (touch devices)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || ('ontouchstart' in window) 
      || (navigator.maxTouchPoints > 0);

    controls.style.display = isMobile ? 'block' : 'none';
  }

  /**
   * Check if mobile controls are currently active/visible.
   */
  isMobileControlsActive(): boolean {
    const controls = document.getElementById('mobile-controls');
    return controls?.style.display === 'block';
  }

  /**
   * Get joystick movement vector (normalized -1 to 1).
   */
  getJoystickVector(): THREE.Vector2 {
    return new THREE.Vector2(this.joystickCurrent.x, this.joystickCurrent.y);
  }

  /**
   * Check if jump button is pressed.
   */
  isJumpPressed(): boolean {
    return this.jumpPressed;
  }

  /**
   * Consume jump press (resets to false after reading once).
   */
  consumeJump(): boolean {
    const pressed = this.jumpPressed;
    this.jumpPressed = false;
    return pressed;
  }

  /**
   * Get current mode (true = create, false = destroy).
   */
  isCreateMode(): boolean {
    return this.createMode;
  }

  /**
   * Check if map tap occurred (for create/destroy).
   */
  isMapTapPressed(): boolean {
    return this.mapTapPressed;
  }

  /**
   * Consume map tap (resets to false after reading once).
   * Returns the tap position in screen coordinates (clientX, clientY).
   */
  consumeMapTap(): { pressed: boolean; position: { x: number; y: number } | null } {
    const pressed = this.mapTapPressed;
    const position = this.mapTapPosition;
    this.mapTapPressed = false;
    this.mapTapPosition = null;
    return { pressed, position };
  }

  /**
   * Get camera touch delta and reset.
   */
  getCameraDelta(): { x: number; y: number } {
    const delta = { ...this.cameraDelta };
    this.cameraDelta = { x: 0, y: 0 };
    return delta;
  }

  /**
   * Clean up event listeners.
   */
  dispose(): void {
    const controls = document.getElementById('mobile-controls');
    if (controls) {
      controls.remove();
    }
  }
}
