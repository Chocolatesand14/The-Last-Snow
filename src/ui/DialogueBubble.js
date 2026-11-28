
export class DialogueBubble {
    constructor() {
        // Initialize dialogue state
        this.text = "";
        this.isVisible = false;
        this.isTyping = false;
        this.visibleCharacters = 0;

        // Configure dialogue timing
        this.typingSpeed = 20;
        this.holdDuration = 2;
        this.typingProgress = 0;
        this.holdElapsed = 0;

        // Store the attached character
        this.target = null;

        // Configure dialogue appearance
        this.backgroundColor = "#243345";
        this.textColor = "#f2f7fc";
        this.borderColor = "#d7e5ef";

        this.font = '8px "Press Start 2P", monospace';
        this.fontSize = 8;
        this.padding = 8;
        this.offsetY = 12;
        this.pointerWidth = 10;
        this.pointerHeight = 6;
    }

    show(text) {
        // Reject invalid or empty dialogue text
        if (
            typeof text !== "string" ||
            text.trim().length === 0
        ) {
            return;
        }

        // Initialize the new dialogue
        this.text = text;
        this.isVisible = true;
        this.isTyping = true;

        // Reset animation progress
        this.visibleCharacters = 0;
        this.typingProgress = 0;
        this.holdElapsed = 0;
    }

    hide() {
        // Hide the dialogue and stop typing
        this.isVisible = false;
        this.isTyping = false;
    }

    setTarget(target) {
        // Validate the character position and dimensions
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

    setTypingSpeed(speed) {
        // Accept positive and finite typing speeds
        if (Number.isFinite(speed) && speed > 0) {
            this.typingSpeed = speed;
        }
    }

    setHoldDuration(duration) {
        // Accept non-negative and finite hold durations
        if (
            Number.isFinite(duration) &&
            duration >= 0
        ) {
            this.holdDuration = duration;
        }
    }

    getVisibleText() {
        // Return only the currently revealed characters
        return this.text.slice(
            0,
            this.visibleCharacters
        );
    }

    getPosition(camera = null) {
        // Skip positioning without an attached character
        if (!this.target) {
            return null;
        }

        // Center the dialogue above the character
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

    skipTyping() {
        // Ignore typing skips while hidden
        if (!this.isVisible || !this.isTyping) {
            return;
        }

        // Immediately reveal the complete dialogue
        this.visibleCharacters = this.text.length;
        this.typingProgress = this.text.length;
        this.isTyping = false;

        // Begin the hold duration
        this.holdElapsed = 0;
    }

    update(deltaTime) {
        // Reject invalid or non-positive delta time
        if (
            !Number.isFinite(deltaTime) ||
            deltaTime <= 0
        ) {
            return;
        }

        // Skip hidden dialogue
        if (!this.isVisible) {
            return;
        }

        let remainingTime = deltaTime;

        if (this.isTyping) {
            // Calculate the time required to finish typing
            const remainingCharacters =
                this.text.length - this.typingProgress;

            const timeToFinish =
                remainingCharacters / this.typingSpeed;

            // Advance the typewriter animation
            if (remainingTime < timeToFinish) {
                this.typingProgress +=
                    remainingTime * this.typingSpeed;

                this.visibleCharacters = Math.min(
                    this.text.length,
                    Math.floor(this.typingProgress)
                );

                return;
            }

            // Preserve unused frame time for the hold duration
            remainingTime -= timeToFinish;

            this.typingProgress = this.text.length;
            this.visibleCharacters = this.text.length;
            this.isTyping = false;
            this.holdElapsed = 0;
        }

        // Advance the dialogue hold duration
        this.holdElapsed += remainingTime;

        // Hide the dialogue when its duration expires
        if (this.holdElapsed >= this.holdDuration) {
            this.hide();
        }
    }

    reset() {
        // Reset dialogue content and animation state
        this.text = "";
        this.isVisible = false;
        this.isTyping = false;

        this.visibleCharacters = 0;
        this.typingProgress = 0;
        this.holdElapsed = 0;
    }

    draw(ctx, camera = null) {
        // Skip hidden dialogue
        if (!this.isVisible) {
            return;
        }

        const position = this.getPosition(camera);

        // Skip rendering without a valid target
        if (!position) {
            return;
        }

        // Preserve the canvas rendering state
        ctx.save();

        // Render independently of the world camera
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Configure pixel-perfect dialogue rendering
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";

        ctx.font = this.font;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        // Measure the full text to keep the bubble size stable
        const textWidth =
            ctx.measureText(this.text).width;

        const bubbleWidth =
            Math.ceil(textWidth) + this.padding * 2;

        const bubbleHeight =
            this.fontSize + this.padding * 2;

        // Position the bubble above the character
        const centerX = Math.round(position.x);
        const bottomY = Math.round(position.y);

        const bubbleX = Math.round(
            centerX - bubbleWidth / 2
        );

        const bubbleY =
            bottomY -
            bubbleHeight -
            this.pointerHeight;

        // Draw the dialogue background
        ctx.fillStyle = this.backgroundColor;

        ctx.fillRect(
            bubbleX,
            bubbleY,
            bubbleWidth,
            bubbleHeight
        );

        // Draw the dialogue border
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 1;

        ctx.strokeRect(
            bubbleX,
            bubbleY,
            bubbleWidth,
            bubbleHeight
        );

        // Calculate the bubble pointer position
        const pointerY =
            bubbleY + bubbleHeight;

        const halfPointerWidth =
            this.pointerWidth / 2;

        // Draw the downward-facing bubble pointer
        ctx.beginPath();

        ctx.moveTo(
            centerX - halfPointerWidth,
            pointerY
        );

        ctx.lineTo(
            centerX,
            pointerY + this.pointerHeight
        );

        ctx.lineTo(
            centerX + halfPointerWidth,
            pointerY
        );

        ctx.closePath();

        ctx.fillStyle = this.backgroundColor;
        ctx.fill();

        ctx.strokeStyle = this.borderColor;
        ctx.stroke();

        // Cover the shared border between bubble and pointer
        ctx.fillRect(
            centerX - halfPointerWidth + 1,
            pointerY - 1,
            this.pointerWidth - 2,
            2
        );

        // Render the currently visible dialogue text
        ctx.fillStyle = this.textColor;

        ctx.fillText(
            this.getVisibleText(),
            bubbleX + this.padding,
            bubbleY + this.padding
        );

        // Restore the previous canvas rendering state
        ctx.restore();
    }
}
