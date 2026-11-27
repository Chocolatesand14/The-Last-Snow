
import { SnowFootprint } from "./SnowFootprint.js";

// Define fading multipliers for different snowfall intensities
const FadePresets = Object.freeze([
    { intensity: 0, multiplier: 1 / 3 },
    { intensity: 50, multiplier: 0.5 },
    { intensity: 100, multiplier: 1 },
    { intensity: 200, multiplier: 2 },
    { intensity: 350, multiplier: 6 }
]);

// Define supported movement directions
const ValidDirections = Object.freeze([
    "up",
    "down",
    "left",
    "right"
]);

export class SnowFootprintSystem {
    constructor(
        stepDistance = 12,
        footOffset = 4,
        footprintLifetime = 60
    ) {
        // Initialize footprint configuration
        this.stepDistance =
            Number.isFinite(stepDistance) && stepDistance > 0
                ? stepDistance
                : 12;

        this.footOffset =
            Number.isFinite(footOffset) && footOffset >= 0
                ? footOffset
                : 4;

        this.footprintLifetime =
            Number.isFinite(footprintLifetime) &&
            footprintLifetime > 0
                ? footprintLifetime
                : 60;

        // Initialize footprint storage
        this.footprints = [];

        // Initialize movement tracking
        this.nextFoot = "left";
        this.accumulatedDistance = 0;
    }

    addFootprint(x, y, direction) {
        // Reject invalid world coordinates
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return;
        }

        // Reject unsupported movement directions
        if (!ValidDirections.includes(direction)) {
            return;
        }

        // Calculate the individual foot position
        const position = this.getFootPosition(
            x,
            y,
            direction,
            this.nextFoot
        );

        // Create a new footprint in world coordinates
        const footprint = new SnowFootprint(
            position.x,
            position.y,
            direction,
            this.nextFoot,
            this.footprintLifetime
        );

        this.footprints.push(footprint);

        // Alternate between left and right footprints
        this.nextFoot =
            this.nextFoot === "left"
                ? "right"
                : "left";
    }

    getFootPosition(x, y, direction, foot) {
        // Determine the lateral foot offset
        const offset =
            foot === "left"
                ? this.footOffset
                : -this.footOffset;

        // Position the footprint relative to movement direction
        switch (direction) {
            case "up":
                return {
                    x: x - offset,
                    y
                };

            case "down":
                return {
                    x: x + offset,
                    y
                };

            case "left":
                return {
                    x,
                    y: y + offset
                };

            case "right":
                return {
                    x,
                    y: y - offset
                };

            default:
                return { x, y };
        }
    }

    trackMovement(
        previousX,
        previousY,
        currentX,
        currentY,
        direction
    ) {
        // Reject invalid movement coordinates
        if (
            !Number.isFinite(previousX) ||
            !Number.isFinite(previousY) ||
            !Number.isFinite(currentX) ||
            !Number.isFinite(currentY)
        ) {
            return;
        }

        // Reject unsupported movement directions
        if (!ValidDirections.includes(direction)) {
            return;
        }

        // Calculate actual movement distance
        const deltaX = currentX - previousX;
        const deltaY = currentY - previousY;

        const distance = Math.hypot(
            deltaX,
            deltaY
        );

        // Skip stationary or invalid movement
        if (!Number.isFinite(distance) || distance <= 0) {
            return;
        }

        // Calculate the distance to the next footprint
        let nextStep =
            this.stepDistance - this.accumulatedDistance;

        // Distribute footprints along the movement path
        while (nextStep <= distance) {
            const progress = nextStep / distance;

            const footprintX =
                previousX + deltaX * progress;

            const footprintY =
                previousY + deltaY * progress;

            this.addFootprint(
                footprintX,
                footprintY,
                direction
            );

            nextStep += this.stepDistance;
        }

        // Preserve remaining movement distance
        this.accumulatedDistance =
            (this.accumulatedDistance + distance) %
            this.stepDistance;
    }

    getFadeMultiplier(intensity) {
        // Fall back to normal snowfall for invalid intensity
        if (!Number.isFinite(intensity)) {
            return 1;
        }

        // Clamp intensity to supported weather limits
        const clampedIntensity = Math.max(
            0,
            Math.min(350, intensity)
        );

        // Interpolate between neighboring weather presets
        for (let i = 0; i < FadePresets.length - 1; i++) {
            const current = FadePresets[i];
            const next = FadePresets[i + 1];

            if (clampedIntensity <= next.intensity) {
                const progress =
                    (clampedIntensity - current.intensity) /
                    (next.intensity - current.intensity);

                return current.multiplier +
                    (next.multiplier - current.multiplier) *
                    progress;
            }
        }

        return FadePresets[
            FadePresets.length - 1
        ].multiplier;
    }

    update(deltaTime, snowfallIntensity = 100) {
        // Reject invalid or negative delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Calculate weather-dependent fading speed
        const fadeMultiplier = this.getFadeMultiplier(
            snowfallIntensity
        );

        // Update all footprints, including off-screen footprints
        for (const footprint of this.footprints) {
            footprint.update(
                deltaTime,
                fadeMultiplier
            );
        }

        // Remove completely faded footprints
        this.footprints = this.footprints.filter(
            footprint => !footprint.isExpired()
        );
    }

    isVisible(footprint, camera = null) {
        // Render all footprints when no camera is provided
        if (!camera) {
            return true;
        }

        // Match the rounded camera rendering coordinates
        const cameraX = Math.round(camera.x);
        const cameraY = Math.round(camera.y);

        const footprintX = Math.round(footprint.x);
        const footprintY = Math.round(footprint.y);

        // Include padding for rotated footprint dimensions
        const padding = Math.ceil(
            Math.max(
                footprint.width,
                footprint.height
            ) / 2
        );

        // Check whether the footprint intersects the viewport
        return (
            footprintX + padding > cameraX &&
            footprintX - padding < cameraX + camera.width &&
            footprintY + padding > cameraY &&
            footprintY - padding < cameraY + camera.height
        );
    }

    draw(ctx, camera = null) {
        // Render only footprints visible inside the viewport
        for (const footprint of this.footprints) {
            if (this.isVisible(footprint, camera)) {
                footprint.draw(ctx);
            }
        }
    }

    clear() {
        // Remove all footprints
        this.footprints = [];

        // Reset movement tracking
        this.accumulatedDistance = 0;
        this.nextFoot = "left";
    }
}
