
export class Shadow {
    constructor(
        x,
        y,
        width = 24,
        height = 10,
        opacity = 0.3
    ) {
        // Initialize world position
        this.x = x;
        this.y = y;

        // Initialize validated shadow dimensions
        this.width =
            Number.isFinite(width) && width > 0
                ? width
                : 24;

        this.height =
            Number.isFinite(height) && height > 0
                ? height
                : 10;

        // Initialize shadow opacity
        this.opacity = 0.3;
        this.setOpacity(opacity);

        // Define the soft winter shadow color
        this.color = "#344b60";

        // Initialize visibility properties
        this.visible = true;
        this.weatherVisibility = 1;
    }

    setPosition(x, y) {
        // Reject invalid world coordinates
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return;
        }

        // Update the shadow position
        this.x = x;
        this.y = y;
    }

    setSize(width, height) {
        // Reject invalid shadow dimensions
        if (
            !Number.isFinite(width) ||
            !Number.isFinite(height) ||
            width <= 0 ||
            height <= 0
        ) {
            return;
        }

        // Update the shadow dimensions
        this.width = width;
        this.height = height;
    }

    setOpacity(opacity) {
        // Reject invalid opacity values
        if (!Number.isFinite(opacity)) {
            return;
        }

        // Clamp opacity between zero and one
        this.opacity = Math.max(
            0,
            Math.min(1, opacity)
        );
    }

    setVisible(visible) {
        // Accept only boolean visibility values
        if (typeof visible !== "boolean") {
            return;
        }

        this.visible = visible;
    }

    setWeatherVisibility(visibility) {
        // Reject invalid weather visibility values
        if (!Number.isFinite(visibility)) {
            return;
        }

        // Clamp weather visibility to supported limits
        this.weatherVisibility = Math.max(
            0,
            Math.min(1, visibility)
        );
    }

    getEffectiveOpacity() {
        // Calculate weather-dependent shadow opacity
        return this.opacity * this.weatherVisibility;
    }

    draw(ctx) {
        // Skip hidden shadows
        if (!this.visible) {
            return;
        }

        // Calculate the current shadow opacity
        const effectiveOpacity = this.getEffectiveOpacity();

        // Skip fully transparent shadows
        if (effectiveOpacity <= 0) {
            return;
        }

        // Preserve the current canvas state
        ctx.save();

        // Apply weather-dependent shadow opacity
        ctx.globalAlpha = effectiveOpacity;

        // Translate to the shadow world position
        ctx.translate(
            Math.round(this.x),
            Math.round(this.y)
        );

        // Scale the circular gradient into an oval
        ctx.scale(
            this.width / 2,
            this.height / 2
        );

        // Create a soft radial shadow gradient
        const gradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, 1
        );

        // Define smooth shadow transitions
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.35, this.color);
        gradient.addColorStop(0.65, "rgba(52, 75, 96, 0.45)");
        gradient.addColorStop(1, "transparent");

        // Draw the oval shadow
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.fill();

        // Restore the original canvas state
        ctx.restore();
    }
}
