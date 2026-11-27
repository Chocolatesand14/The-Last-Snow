
export class WeatherOverlay {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // Initialize visibility properties
        this.visibility = 1;
        this.opacity = 0;

        // Define a cold blue-gray weather overlay color
        this.color = "#dce8f2";
    }

    setVisibility(visibility) {
        // Reject invalid visibility values
        if (!Number.isFinite(visibility)) {
            return;
        }

        // Clamp visibility between zero and one
        this.visibility = Math.max(
            0,
            Math.min(1, visibility)
        );

        // Convert visibility into overlay opacity
        this.opacity = 1 - this.visibility;
    }

    draw(ctx) {
        // Skip rendering when visibility is unaffected
        if (this.opacity <= 0) {
            return;
        }

        // Preserve the current canvas state
        ctx.save();

        // Apply weather overlay opacity and color
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;

        // Render the overlay across the entire viewport
        ctx.fillRect(
            0,
            0,
            this.width,
            this.height
        );

        // Restore the original canvas state
        ctx.restore();
    }
}
