
export class ScreenFade {
    constructor(color = "#000000") {
        // Initialize fade appearance
        this.color = "#000000";
        this.setColor(color);

        // Initialize transition state
        this.opacity = 0;
        this.startOpacity = 0;
        this.targetOpacity = 0;

        this.duration = 0;
        this.elapsedTime = 0;
        this.isTransitioning = false;
    }

    setColor(color) {
        // Accept valid hexadecimal colors
        if (
            typeof color === "string" &&
            /^#[0-9a-fA-F]{6}$/.test(color)
        ) {
            this.color = color;
        }
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

        // Synchronize and reset transition state
        this.startOpacity = this.opacity;
        this.targetOpacity = this.opacity;

        this.duration = 0;
        this.elapsedTime = 0;
        this.isTransitioning = false;
    }

    fadeIn(duration = 2) {
        // Start with a fully covered screen
        this.setOpacity(1);

        // Reveal the game world
        this.startTransition(0, duration);
    }

    fadeOut(duration = 2) {
        // Fade from the current opacity
        this.startTransition(1, duration);
    }

    startTransition(targetOpacity, duration) {
        // Immediately complete invalid or zero-duration transitions
        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {
            this.setOpacity(targetOpacity);
            return;
        }

        // Store transition parameters
        this.startOpacity = this.opacity;
        this.targetOpacity = targetOpacity;

        this.duration = duration;
        this.elapsedTime = 0;
        this.isTransitioning = true;
    }

    update(deltaTime) {
        // Reject invalid or non-positive delta time
        if (
            !Number.isFinite(deltaTime) ||
            deltaTime <= 0
        ) {
            return;
        }

        // Skip inactive transitions
        if (!this.isTransitioning) {
            return;
        }

        // Advance transition time without exceeding duration
        this.elapsedTime = Math.min(
            this.elapsedTime + deltaTime,
            this.duration
        );

        // Calculate normalized transition progress
        const progress =
            this.elapsedTime / this.duration;

        // Interpolate between start and target opacity
        this.opacity =
            this.startOpacity +
            (this.targetOpacity - this.startOpacity) *
            progress;

        // Complete the transition at the exact target opacity
        if (this.elapsedTime >= this.duration) {
            this.opacity = this.targetOpacity;
            this.isTransitioning = false;
        }
    }

    reset() {
        // Restore a transparent screen
        this.setOpacity(0);
    }

    draw(ctx, width, height) {
        // Skip transparent overlays
        if (this.opacity <= 0) {
            return;
        }

        // Reject invalid viewport dimensions
        if (
            !Number.isFinite(width) ||
            !Number.isFinite(height) ||
            width <= 0 ||
            height <= 0
        ) {
            return;
        }

        // Preserve the canvas rendering state
        ctx.save();

        // Render independently of the world camera
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Configure the screen overlay
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;

        // Cover the entire viewport
        ctx.fillRect(0, 0, width, height);

        // Restore the previous canvas rendering state
        ctx.restore();
    }
}
