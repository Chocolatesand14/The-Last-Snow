
export class SnowParticle {
    constructor(
        x,
        y,
        size,
        speed,
        swayAmplitude = 0,
        swayFrequency = 0.5,
        phase = 0
    ) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;

        // Initialize individual sway properties
        this.swayAmplitude = swayAmplitude;
        this.swayFrequency = swayFrequency;
        this.phase = phase;

        this.elapsedTime = 0;
    }

    update(deltaTime, wind = 0) {
        // Reject invalid or negative delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Calculate the previous sway offset
        const previousSway = this.calculateSway(
            this.elapsedTime
        );

        // Update elapsed simulation time
        this.elapsedTime += deltaTime;

        // Calculate the current sway offset
        const currentSway = this.calculateSway(
            this.elapsedTime
        );

        // Apply wind and individual sway movement
        this.x += wind * deltaTime;
        this.x += currentSway - previousSway;

        // Apply vertical falling movement
        this.y += this.speed * deltaTime;
    }

    calculateSway(time) {
        // Calculate the current sinusoidal offset
        return this.swayAmplitude * Math.sin(
            time *
            this.swayFrequency *
            Math.PI * 2 +
            this.phase
        );
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

        // Reset the individual movement timer
        this.elapsedTime = 0;
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
