
export class SnowDrift {
    constructor(x = 0, y = 0, width = 128, height = 96) {
        // Validate world coordinates
        this.x = Number.isFinite(x) ? x : 0;
        this.y = Number.isFinite(y) ? y : 0;

        // Validate snowdrift dimensions
        this.width =
            Number.isFinite(width) && width > 0
                ? width
                : 128;

        this.height =
            Number.isFinite(height) && height > 0
                ? height
                : 96;

        // Configure the opening direction
        this.openingDirection = "right";

        // Load the snowdrift sprite
        this.image = this.loadImage();
    }

    loadImage() {
        // Support environments without browser image dependencies
        if (typeof Image === "undefined") {
            return null;
        }

        const image = new Image();

        image.src =
            "assets/sprites/environment/snowdrifts/spawn-snowdrift.png";

        return image;
    }

    getSpawnPoint() {
        // Calculate the center of the hollow area
        return {
            x: this.x + this.width * 0.5,
            y: this.y + this.height * 0.65
        };
    }

    getExitPoint() {
        // Position the exit beyond the right edge
        return {
            x: this.x + this.width * 1.1,
            y: this.y + this.height * 0.65
        };
    }

    getCollisionBounds() {
        // Define collision boundaries around the hollow area
        // Keep the right side open for player movement
        return [
            {
                // Upper snow boundary
                x: this.x + this.width * 0.15,
                y: this.y + this.height * 0.15,
                width: this.width * 0.65,
                height: this.height * 0.25
            },
            {
                // Left snow boundary
                x: this.x + this.width * 0.08,
                y: this.y + this.height * 0.4,
                width: this.width * 0.22,
                height: this.height * 0.45
            },
            {
                // Lower snow boundary
                x: this.x + this.width * 0.15,
                y: this.y + this.height * 0.85,
                width: this.width * 0.55,
                height: this.height * 0.12
            }
        ];
    }

    isWalkable(x, y) {
        // Reject invalid world coordinates
        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y)
        ) {
            return false;
        }

        // Check whether the point intersects solid snow
        for (const bounds of this.getCollisionBounds()) {
            if (
                x >= bounds.x &&
                x < bounds.x + bounds.width &&
                y >= bounds.y &&
                y < bounds.y + bounds.height
            ) {
                return false;
            }
        }

        // Allow movement through the hollow and opening
        return true;
    }

    getDepth() {
        // Calculate rendering depth from the bottom edge
        return this.y + this.height;
    }

    isVisible(camera = null) {
        // Render without culling when no camera is provided
        if (!camera) {
            return true;
        }

        // Use rounded camera coordinates for pixel alignment
        const cameraX = Math.round(camera.x);
        const cameraY = Math.round(camera.y);

        // Check whether the snowdrift intersects the viewport
        return (
            this.x < cameraX + camera.width &&
            this.x + this.width > cameraX &&
            this.y < cameraY + camera.height &&
            this.y + this.height > cameraY
        );
    }

    draw(ctx) {
        // Skip rendering when the image is unavailable
        if (
            !this.image ||
            !this.image.complete ||
            this.image.naturalWidth <= 0
        ) {
            return;
        }

        // Preserve sharp pixel art when scaling
        ctx.imageSmoothingEnabled = false;

        // Render the snowdrift at its world position
        ctx.drawImage(
            this.image,
            Math.round(this.x),
            Math.round(this.y),
            this.width,
            this.height
        );
    }
}
