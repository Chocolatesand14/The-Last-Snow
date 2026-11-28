
const EmotionSymbols = Object.freeze({
    none: "",
    sleeping: "Zzz",
    surprised: "!",
    confused: "?"
});

export class EmotionIndicator {
    constructor() {
        // Initialize emotion state
        this.emotion = "none";
        this.isVisible = false;
        this.target = null;

        // Initialize animation timing
        this.elapsedTime = 0;
        this.duration = null;

        // Configure symbol appearance
        this.font = '10px "Press Start 2P", monospace';
        this.offsetY = 12;

        this.textColor = "#f2f7fc";
        this.outlineColor = "#18232f";
        this.surprisedColor = "#ffda87";
    }

    show(emotion, duration = null) {
        // Reject unsupported emotion states
        if (
            typeof emotion !== "string" ||
            !Object.hasOwn(EmotionSymbols, emotion)
        ) {
            return;
        }

        // Hide the indicator when no emotion is requested
        if (emotion === "none") {
            this.hide();
            return;
        }

        // Activate the requested emotion
        this.emotion = emotion;
        this.isVisible = true;
        this.elapsedTime = 0;

        // Use unlimited duration when no valid limit is provided
        this.duration =
            Number.isFinite(duration) && duration > 0
                ? duration
                : null;
    }

    hide() {
        // Clear the active emotion
        this.emotion = "none";
        this.isVisible = false;
        this.elapsedTime = 0;
        this.duration = null;
    }

    getSymbol() {
        // Return the symbol associated with the current emotion
        return EmotionSymbols[this.emotion] ?? "";
    }

    setTarget(target) {
        // Validate character position and dimensions
        if (
            !target ||
            !Number.isFinite(target.x) ||
            !Number.isFinite(target.y) ||
            !Number.isFinite(target.width) ||
            !Number.isFinite(target.height) ||
            target.width <= 0 ||
            target.height <= 0
        ) {
            this.target = null;
            return;
        }

        this.target = target;
    }

    getPosition(camera = null) {
        // Skip positioning without an attached character
        if (!this.target) {
            return null;
        }

        // Center the indicator above the character
        const worldX =
            this.target.x + this.target.width / 2;

        const worldY =
            this.target.y - this.offsetY;

        // Return world coordinates without a camera
        if (!camera) {
            return {
                x: worldX,
                y: worldY
            };
        }

        // Convert world coordinates to screen coordinates
        return {
            x: worldX - Math.round(camera.x),
            y: worldY - Math.round(camera.y)
        };
    }

    getAnimationOffset() {
        // Return the offset for the active emotion
        switch (this.emotion) {
            case "sleeping":
                return this.getSleepingOffset();

            case "surprised":
                return this.getSurprisedOffset();

            case "confused":
                return this.getConfusedOffset();

            default:
                return {
                    x: 0,
                    y: 0
                };
        }
    }

    getSleepingOffset() {
        // Repeat the floating animation every two seconds
        const cycle = this.elapsedTime % 2;
        const progress = cycle / 2;

        return {
            x: Math.sin(progress * Math.PI * 2) * 2,
            y: -progress * 12
        };
    }

    getSurprisedOffset() {
        // Complete the bounce after half a second
        const progress = Math.min(
            this.elapsedTime / 0.5,
            1
        );

        return {
            x: 0,
            y: -Math.sin(progress * Math.PI) * 8
        };
    }

    getConfusedOffset() {
        // Create a gentle side-to-side movement
        return {
            x: Math.sin(
                this.elapsedTime * Math.PI * 2
            ) * 3,

            y: Math.sin(
                this.elapsedTime * Math.PI
            ) * -2
        };
    }

    update(deltaTime) {
        // Reject invalid or non-positive delta time
        if (
            !Number.isFinite(deltaTime) ||
            deltaTime <= 0
        ) {
            return;
        }

        // Skip inactive indicators
        if (!this.isVisible) {
            return;
        }

        // Advance animation time
        this.elapsedTime += deltaTime;

        // Hide timed emotions when their duration expires
        if (
            this.duration !== null &&
            this.elapsedTime >= this.duration
        ) {
            this.hide();
        }
    }

    reset() {
        // Reset emotion state while preserving the target
        this.hide();
    }

    draw(ctx, camera = null) {
        // Skip hidden indicators
        if (!this.isVisible) {
            return;
        }

        const position = this.getPosition(camera);

        // Skip rendering without an attached character
        if (!position) {
            return;
        }

        const symbol = this.getSymbol();
        const offset = this.getAnimationOffset();

        // Apply animation offsets to screen coordinates
        const x = Math.round(
            position.x + offset.x
        );

        const y = Math.round(
            position.y + offset.y
        );

        // Preserve the canvas rendering state
        ctx.save();

        // Render independently of the world camera
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Configure pixel-style symbol rendering
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";

        ctx.font = this.font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Draw a dark outline for readability
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;

        ctx.strokeText(symbol, x, y);

        // Highlight the surprised emotion
        ctx.fillStyle =
            this.emotion === "surprised"
                ? this.surprisedColor
                : this.textColor;

        // Render the active emotion symbol
        ctx.fillText(symbol, x, y);

        // Restore the previous canvas rendering state
        ctx.restore();
    }
}
