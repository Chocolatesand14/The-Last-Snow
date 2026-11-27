
export class SnowFootprint {
    constructor(
        x,
        y,
        direction = "down",
        foot = "left",
        lifetime = 60
    ) {
        // Initialize world position
        this.x = x;
        this.y = y;

        // Initialize footprint properties
        this.direction = direction;
        this.foot = foot;

        this.lifetime =
            Number.isFinite(lifetime) && lifetime > 0
                ? lifetime
                : 60;

        // Track actual age and accumulated fading
        this.age = 0;
        this.fadeAge = 0;
        this.opacity = 1;

        // Define pixel art footprint appearance
        this.width = 4;
        this.height = 7;

        this.color = "#8ca7b9";
        this.innerColor = "#b1c6d5";
    }

    update(deltaTime, fadeMultiplier = 1) {
        // Reject invalid or negative delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Reject invalid fading multipliers
        if (
            !Number.isFinite(fadeMultiplier) ||
            fadeMultiplier < 0
        ) {
            return;
        }

        // Skip expired footprints
        if (this.isExpired()) {
            return;
        }

        // Update the actual footprint age
        this.age += deltaTime;

        // Accumulate weather-dependent fading
        this.fadeAge = Math.min(
            this.lifetime,
            this.fadeAge + deltaTime * fadeMultiplier
        );

        // Gradually reduce opacity
        this.opacity = Math.max(
            0,
            1 - this.fadeAge / this.lifetime
        );
    }

    isExpired() {
        // Check whether the footprint has completely faded
        return this.fadeAge >= this.lifetime;
    }

    getRotation() {
        // Determine rotation based on movement direction
        switch (this.direction) {
            case "up":
                return 0;

            case "right":
                return Math.PI / 2;

            case "down":
                return Math.PI;

            case "left":
                return -Math.PI / 2;

            default:
                return 0;
        }
    }

    draw(ctx) {
        // Skip rendering expired footprints
        if (this.isExpired()) {
            return;
        }

        // Preserve the current canvas state
        ctx.save();

        // Apply the current footprint opacity
        ctx.globalAlpha = this.opacity;

        // Translate to the footprint world position
        ctx.translate(
            Math.round(this.x),
            Math.round(this.y)
        );

        // Rotate according to movement direction
        ctx.rotate(this.getRotation());

        // Draw the outer footprint
        ctx.fillStyle = this.color;

        ctx.fillRect(-2, -3, 4, 5);
        ctx.fillRect(-1, 2, 2, 2);

        // Draw the inner footprint detail
        ctx.fillStyle = this.innerColor;

        ctx.fillRect(-1, -2, 2, 3);

        // Restore the original canvas state
        ctx.restore();
    }
}
