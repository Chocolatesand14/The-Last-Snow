
import { AmbientLight } from "./AmbientLight.js";
import { LightSource } from "./LightSource.js";

export class LightingSystem {
    constructor(
        ambientOpacity = 0.15,
        ambientColor = "#182d50"
    ) {
        // Initialize ambient lighting
        this.ambientLight = new AmbientLight(
            ambientOpacity,
            ambientColor
        );

        // Store registered world light sources
        this.lightSources = [];

        // Enable the lighting system by default
        this.enabled = true;
    }

    addLight(
        x,
        y,
        radius = 64,
        intensity = 0.8,
        color = "#ffcf85"
    ) {
        // Reject invalid world coordinates
        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y)
        ) {
            return null;
        }

        // Create an independent light source
        const light = new LightSource(
            x,
            y,
            radius,
            intensity,
            color
        );

        // Register the light source
        this.lightSources.push(light);

        return light;
    }

    removeLight(light) {
        // Remove the specified light by object identity
        this.lightSources = this.lightSources.filter(
            source => source !== light
        );
    }

    clearLights() {
        // Remove world lights while preserving ambient lighting
        this.lightSources = [];
    }

    setAmbientOpacity(opacity, duration = 0) {
        // Delegate opacity changes to the ambient light
        this.ambientLight.setOpacity(
            opacity,
            duration
        );
    }

    setAmbientColor(color) {
        // Delegate color validation to the ambient light
        this.ambientLight.setColor(color);
    }

    setAmbientEnabled(enabled) {
        // Control ambient lighting independently
        this.ambientLight.setEnabled(enabled);
    }

    setWeather(weather, duration = 5) {
        // Adapt ambient lighting to current weather conditions
        this.ambientLight.setWeather(
            weather,
            duration
        );
    }

    setEnabled(enabled) {
        // Accept only boolean configuration values
        if (typeof enabled !== "boolean") {
            return;
        }

        this.enabled = enabled;
    }

    update(deltaTime) {
        // Reject invalid or non-positive delta time
        if (
            !Number.isFinite(deltaTime) ||
            deltaTime <= 0
        ) {
            return;
        }

        // Update ambient lighting transitions
        this.ambientLight.update(deltaTime);

        // Update all light sources, including off-screen lights
        for (const light of this.lightSources) {
            light.update(deltaTime);
        }
    }

    isVisible(light, camera = null) {
        // Include all light sources without a camera
        if (!camera) {
            return true;
        }

        // Match the rounded camera coordinates used by Game
        const cameraX = Math.round(camera.x);
        const cameraY = Math.round(camera.y);

        // Calculate the complete light gradient bounds
        const left = light.x - light.radius;
        const right = light.x + light.radius;
        const top = light.y - light.radius;
        const bottom = light.y + light.radius;

        // Check for an intersection with the viewport
        return (
            left < cameraX + camera.width &&
            right > cameraX &&
            top < cameraY + camera.height &&
            bottom > cameraY
        );
    }

    draw(ctx, width, height, camera = null) {
        // Skip rendering when the lighting system is disabled
        if (!this.enabled) {
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

        // Render ambient lighting in screen coordinates
        this.ambientLight.draw(
            ctx,
            width,
            height
        );

        // Preserve the canvas state
        ctx.save();

        // Reset the transformation before rendering world lights
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Apply the camera offset to world light sources
        if (camera) {
            ctx.translate(
                -Math.round(camera.x),
                -Math.round(camera.y)
            );
        }

        // Render only lights intersecting the viewport
        for (const light of this.lightSources) {
            if (this.isVisible(light, camera)) {
                light.draw(ctx);
            }
        }

        // Restore the original canvas state
        ctx.restore();
    }
}
