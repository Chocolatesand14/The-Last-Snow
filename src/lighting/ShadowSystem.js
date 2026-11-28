
import { Shadow } from "./Shadow.js";

export class ShadowSystem {
    constructor() {
        // Initialize static and dynamic shadow storage
        this.staticShadows = [];
        this.playerShadow = null;

        // Initialize system configuration
        this.weatherVisibility = 1;
        this.enabled = true;
    }

    addStaticShadow(
        x,
        y,
        width = 24,
        height = 10,
        opacity = 0.3
    ) {
        // Reject invalid world coordinates
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return null;
        }

        // Create a static environment shadow
        const shadow = new Shadow(
            x,
            y,
            width,
            height,
            opacity
        );

        // Apply current weather conditions
        shadow.setWeatherVisibility(
            this.weatherVisibility
        );

        // Store the shadow
        this.staticShadows.push(shadow);

        return shadow;
    }

    removeStaticShadow(shadow) {
        // Remove the specified shadow instance
        this.staticShadows = this.staticShadows.filter(
            existingShadow => existingShadow !== shadow
        );
    }

    clearStaticShadows() {
        // Remove all static environment shadows
        this.staticShadows = [];
    }

    isValidPlayer(player) {
        // Validate player position and dimensions
        return (
            player != null &&
            Number.isFinite(player.x) &&
            Number.isFinite(player.y) &&
            Number.isFinite(player.width) &&
            Number.isFinite(player.height) &&
            player.width > 0 &&
            player.height > 0
        );
    }

    createPlayerShadow(
        player,
        width = 24,
        height = 10,
        opacity = 0.3
    ) {
        // Reject invalid player objects
        if (!this.isValidPlayer(player)) {
            return null;
        }

        // Calculate the player's ground contact position
        const shadowX =
            player.x + player.width / 2;

        const shadowY =
            player.y + player.height - 2;

        // Create the dynamic player shadow
        this.playerShadow = new Shadow(
            shadowX,
            shadowY,
            width,
            height,
            opacity
        );

        // Apply current weather conditions
        this.playerShadow.setWeatherVisibility(
            this.weatherVisibility
        );

        return this.playerShadow;
    }

    updatePlayerShadow(player) {
        // Skip updates when no player shadow exists
        if (!this.playerShadow) {
            return;
        }

        // Reject invalid player objects
        if (!this.isValidPlayer(player)) {
            return;
        }

        // Calculate the updated ground contact position
        const shadowX =
            player.x + player.width / 2;

        const shadowY =
            player.y + player.height - 2;

        // Move the existing shadow with the player
        this.playerShadow.setPosition(
            shadowX,
            shadowY
        );
    }

    removePlayerShadow() {
        // Remove the dynamic player shadow
        this.playerShadow = null;
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

        // Update all static environment shadows
        for (const shadow of this.staticShadows) {
            shadow.setWeatherVisibility(
                this.weatherVisibility
            );
        }

        // Update the dynamic player shadow
        if (this.playerShadow) {
            this.playerShadow.setWeatherVisibility(
                this.weatherVisibility
            );
        }
    }

    setEnabled(enabled) {
        // Accept only boolean configuration values
        if (typeof enabled !== "boolean") {
            return;
        }

        this.enabled = enabled;
    }

    isVisible(shadow, camera = null) {
        // Render all shadows when no camera is provided
        if (!camera) {
            return true;
        }

        // Match rounded camera rendering coordinates
        const cameraX = Math.round(camera.x);
        const cameraY = Math.round(camera.y);

        // Match rounded shadow rendering coordinates
        const shadowX = Math.round(shadow.x);
        const shadowY = Math.round(shadow.y);

        // Calculate the shadow bounding area
        const halfWidth = shadow.width / 2;
        const halfHeight = shadow.height / 2;

        // Check whether the shadow intersects the viewport
        return (
            shadowX + halfWidth > cameraX &&
            shadowX - halfWidth < cameraX + camera.width &&
            shadowY + halfHeight > cameraY &&
            shadowY - halfHeight < cameraY + camera.height
        );
    }

    draw(ctx, camera = null) {
        // Skip rendering when the system is disabled
        if (!this.enabled) {
            return;
        }

        // Render visible static environment shadows
        for (const shadow of this.staticShadows) {
            if (this.isVisible(shadow, camera)) {
                shadow.draw(ctx);
            }
        }

        // Render the visible player shadow
        if (
            this.playerShadow &&
            this.isVisible(this.playerShadow, camera)
        ) {
            this.playerShadow.draw(ctx);
        }
    }

    clear() {
        // Remove all static and dynamic shadows
        this.clearStaticShadows();
        this.removePlayerShadow();
    }
}
