
import { Sprite } from "../core/Sprite.js";
import { Animation } from "../core/Animation.js";

export class Player {
    constructor(x, y, { useBaseAppearance = false } = {}) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.speed = 120;

        this.direction = "down";
        this.isMoving = false;
        this.currentState = "idle";

        this.useBaseAppearance = useBaseAppearance;

        // Load the original equipped player sprites
        this.sprites = {
            idle: new Sprite("assets/sprites/player/idle/idle.png"),
            down: new Sprite("assets/sprites/player/walk/walk-down.png"),
            up: new Sprite("assets/sprites/player/walk/walk-up.png"),
            left: new Sprite("assets/sprites/player/walk/walk-left.png"),
            right: new Sprite("assets/sprites/player/walk/walk-right.png")
        };

        // Load the unequipped player appearance
        this.baseSprite = useBaseAppearance
            ? new Sprite("assets/sprites/player/awakening/awakening.png")
            : null;

        // Load unequipped directional sprites
        this.baseSprites = useBaseAppearance
            ? {
                idle: this.baseSprite,
                down: new Sprite("assets/sprites/player/base/walk-down.png"),
                up: new Sprite("assets/sprites/player/base/walk-up.png"),
                left: new Sprite("assets/sprites/player/base/walk-left.png"),
                right: new Sprite("assets/sprites/player/base/walk-right.png")
            }
            : null;

        // Initialize player animations
        this.animations = {
            idle: new Animation(4, 0.30),
            down: new Animation(4, 0.15),
            up: new Animation(4, 0.15),
            left: new Animation(4, 0.15),
            right: new Animation(4, 0.15)
        };
    }

    updateAwakening(deltaTime) {
        // Keep the player stationary during the awakening
        this.isMoving = false;

        // Use the idle animation without processing input
        if (this.currentState !== "idle") {
            this.currentState = "idle";
            this.animations.idle.reset();
        }

        // Advance the animation using valid frame time
        if (Number.isFinite(deltaTime) && deltaTime > 0) {
            this.animations.idle.update(deltaTime);
        }
    }

    update(input, deltaTime) {
        let dx = 0;
        let dy = 0;

        // Handle movement input
        if (input.isPressed("w") || input.isPressed("ArrowUp")) {
            dy -= 1;
        }

        if (input.isPressed("s") || input.isPressed("ArrowDown")) {
            dy += 1;
        }

        if (input.isPressed("a") || input.isPressed("ArrowLeft")) {
            dx -= 1;
        }

        if (input.isPressed("d") || input.isPressed("ArrowRight")) {
            dx += 1;
        }

        // Determine whether the player is moving
        this.isMoving = dx !== 0 || dy !== 0;

        // Determine movement direction
        if (this.isMoving) {
            if (dx < 0) {
                this.direction = "left";
            } else if (dx > 0) {
                this.direction = "right";
            } else if (dy < 0) {
                this.direction = "up";
            } else {
                this.direction = "down";
            }
        }

        // Normalize diagonal movement
        const length = Math.hypot(dx, dy);

        if (length > 0) {
            dx /= length;
            dy /= length;
        }

        // Update player position
        this.x += dx * this.speed * deltaTime;
        this.y += dy * this.speed * deltaTime;

        // Select the appropriate animation
        const nextState = this.isMoving
            ? this.direction
            : "idle";

        // Reset animation when changing state
        if (this.currentState !== nextState) {
            this.currentState = nextState;
            this.animations[this.currentState].reset();
        }

        // Update the active animation
        this.animations[this.currentState].update(deltaTime);
    }

    getCurrentSprite() {
        // Preserve the original equipped appearance
        if (!this.baseSprites) {
            return this.sprites[this.currentState];
        }

        // Select the directional walking sprite
        if (this.isMoving) {
            return this.baseSprites[this.direction];
        }

        // Use the front-facing idle sprite
        if (this.direction === "down") {
            return this.baseSprites.idle;
        }

        // Preserve the facing direction while stationary
        return this.baseSprites[this.direction];
    }

    getCurrentFrame() {
        // Use a stationary directional frame when not moving
        if (
            this.baseSprites &&
            !this.isMoving &&
            this.direction !== "down"
        ) {
            return 0;
        }

        // Return the active animation frame
        return this.animations[this.currentState].getFrame();
    }

    draw(ctx) {
        // Select the current appearance and animation frame
        const sprite = this.getCurrentSprite();
        const frame = this.getCurrentFrame();

        // Preserve sharp pixel art when scaling
        ctx.imageSmoothingEnabled = false;

        // Render the current animation frame
        sprite.draw(
            ctx,
            frame,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
}
