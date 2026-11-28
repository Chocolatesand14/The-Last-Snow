
import { Sprite } from "../core/Sprite.js";
import { Animation } from "../core/Animation.js";

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.speed = 120;

        this.direction = "down";
        this.isMoving = false;
        this.currentState = "idle";

        // Load player sprite sheets
        this.sprites = {
            idle: new Sprite("assets/sprites/player/idle/idle.png"),
            down: new Sprite("assets/sprites/player/walk/walk-down.png"),
            up: new Sprite("assets/sprites/player/walk/walk-up.png"),
            left: new Sprite("assets/sprites/player/walk/walk-left.png"),
            right: new Sprite("assets/sprites/player/walk/walk-right.png")
        };

        // Initialize player animations
        this.animations = {
            idle: new Animation(4, 0.30),
            down: new Animation(4, 0.15),
            up: new Animation(4, 0.15),
            left: new Animation(4, 0.15),
            right: new Animation(4, 0.15)
        };
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

    draw(ctx) {
        const sprite = this.sprites[this.currentState];
        const animation = this.animations[this.currentState];

        // Preserve sharp pixel art when scaling
        ctx.imageSmoothingEnabled = false;

        // Render the current animation frame
        sprite.draw(
            ctx,
            animation.getFrame(),
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
}
