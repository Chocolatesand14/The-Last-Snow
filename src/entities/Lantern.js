
export class Lantern {
    constructor(x = 0, y = 0, width = 24, height = 40) {
        // Validate world coordinates
        this.x = Number.isFinite(x) ? x : 0;
        this.y = Number.isFinite(y) ? y : 0;

        // Validate lantern dimensions
        this.width =
            Number.isFinite(width) && width > 0
                ? width
                : 24;

        this.height =
            Number.isFinite(height) && height > 0
                ? height
                : 40;

        // Configure the initial lantern state
        this.isLit = true;

        // Configure warm light
        this.lightRadius = 80;
        this.lightIntensity = 0.65;
        this.lightColor = "#ffcf85";

        // Configure subtle flame flickering
        this.flickerAmplitude = 0.08;
        this.flickerFrequency = 1.5;

        // Store lighting system references
        this.lightSource = null;
        this.lightingSystem = null;

        // Load the lantern sprite
        this.image = this.loadImage();
    }

    loadImage() {
        // Support environments without browser image dependencies
        if (typeof Image === "undefined") {
            return null;
        }

        const image = new Image();

        image.src =
            "assets/sprites/environment/lanterns/lantern.png";

        return image;
    }

    getLightPosition() {
        // Position the light near the lantern flame
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height * 0.45
        };
    }

    registerLight(lightingSystem) {
        // Reuse an existing light registered in the same system
        if (
            this.lightSource &&
            this.lightingSystem === lightingSystem &&
            lightingSystem.lightSources.includes(this.lightSource)
        ) {
            return this.lightSource;
        }

        // Remove the previous light registration
        this.unregisterLight();

        const position = this.getLightPosition();

        // Register a dynamic world light
        this.lightSource = lightingSystem.addLight(
            position.x,
            position.y,
            this.lightRadius,
            this.lightIntensity,
            this.lightColor
        );

        this.lightingSystem = lightingSystem;

        // Configure dynamic flame flickering
        this.lightSource.setFlickerEnabled(true);

        this.lightSource.setFlickerAmplitude(
            this.flickerAmplitude
        );

        this.lightSource.setFlickerFrequency(
            this.flickerFrequency
        );

        // Synchronize the light with the lantern state
        this.lightSource.setEnabled(this.isLit);

        return this.lightSource;
    }

    unregisterLight() {
        // Remove the light from its current lighting system
        if (this.lightSource && this.lightingSystem) {
            this.lightingSystem.removeLight(
                this.lightSource
            );
        }

        // Clear stored references
        this.lightSource = null;
        this.lightingSystem = null;
    }

    registerShadow(shadowSystem) {
        // Position a small oval shadow beneath the lantern
        const centerX = this.x + this.width / 2;
        const baseY = this.y + this.height - 2;

        return shadowSystem.addStaticShadow(
            centerX,
            baseY,
            20,
            8,
            0.25
        );
    }

    ignite() {
        // Enable the lantern flame
        this.isLit = true;

        if (this.lightSource) {
            this.lightSource.setEnabled(true);
        }
    }

    extinguish() {
        // Disable the lantern flame
        this.isLit = false;

        if (this.lightSource) {
            this.lightSource.setEnabled(false);
        }
    }

    toggle() {
        // Toggle between lit and extinguished states
        if (this.isLit) {
            this.extinguish();
        } else {
            this.ignite();
        }
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

        // Check whether the lantern intersects the viewport
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

        // Render the physical lantern at its world position
        ctx.drawImage(
            this.image,
            Math.round(this.x),
            Math.round(this.y),
            this.width,
            this.height
        );
    }
}
