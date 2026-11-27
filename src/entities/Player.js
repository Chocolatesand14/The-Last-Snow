export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.speed = 120;
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

        // Normalize diagonal movement
        const length = Math.hypot(dx, dy);

        if (length > 0) {
            dx /= length;
            dy /= length;
        }

        // Update player position
        this.x += dx * this.speed * deltaTime;
        this.y += dy * this.speed * deltaTime;
    }

    draw(ctx) {
        // Draw a temporary player placeholder
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
}