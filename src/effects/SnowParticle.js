
export class SnowParticle {
    constructor(x, y, size, speed) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
    }

    update(deltaTime, wind = 0) {
        // Reject invalid or negative delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Apply horizontal wind movement
        this.x += wind * deltaTime;

        // Apply vertical falling movement
        this.y += this.speed * deltaTime;
    }

    isOutsideViewport(width, height) {
        // Check whether the particle has left the viewport
        return (
            this.y >= height ||
            this.x >= width ||
            this.x + this.size <= 0
        );
    }

    reset(x, y) {
        // Reset position while preserving particle properties
        this.x = x;
        this.y = y;
    }

    draw(ctx) {
        // Set the snow particle color
        ctx.fillStyle = "#f4f8fc";

        // Draw the particle using whole pixels
        ctx.fillRect(
            Math.round(this.x),
            Math.round(this.y),
            this.size,
            this.size
        );
    }
}
