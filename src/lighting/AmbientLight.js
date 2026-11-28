
import { WeatherType } from "../weather/WeatherType.js";

// Define ambient opacity for each weather condition
const WeatherOpacity = Object.freeze({
    [WeatherType.CLEAR]: 0.05,
    [WeatherType.LIGHT_SNOW]: 0.10,
    [WeatherType.SNOWFALL]: 0.15,
    [WeatherType.HEAVY_SNOW]: 0.25,
    [WeatherType.BLIZZARD]: 0.40
});

const DEFAULT_OPACITY = 0.15;
const DEFAULT_COLOR = "#182d50";
const DEFAULT_TRANSITION_DURATION = 5;

export class AmbientLight {
    constructor(
        opacity = DEFAULT_OPACITY,
        color = DEFAULT_COLOR
    ) {
        // Initialize ambient lighting properties
        this.opacity = Number.isFinite(opacity)
            ? this.clampOpacity(opacity)
            : DEFAULT_OPACITY;

        this.color = DEFAULT_COLOR;
        this.setColor(color);

        // Initialize transition properties
        this.startOpacity = this.opacity;
        this.targetOpacity = this.opacity;

        this.transitionDuration = 0;
        this.transitionElapsed = 0;
        this.isTransitioning = false;

        // Enable ambient lighting by default
        this.enabled = true;
    }

    clampOpacity(opacity) {
        // Restrict opacity to the supported range
        return Math.max(0, Math.min(1, opacity));
    }

    setColor(color) {
        // Accept only six-digit hexadecimal colors
        if (
            typeof color !== "string" ||
            !/^#[0-9a-fA-F]{6}$/.test(color)
        ) {
            return;
        }

        this.color = color;
    }

    setOpacity(opacity, duration = 0) {
        // Reject invalid opacity values
        if (!Number.isFinite(opacity)) {
            return;
        }

        const target = this.clampOpacity(opacity);

        // Apply immediate changes for invalid or zero duration
        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {
            this.applyImmediateOpacity(target);
            return;
        }

        // Avoid restarting an active transition to the same target
        if (
            this.isTransitioning &&
            this.targetOpacity === target
        ) {
            return;
        }

        // Avoid unnecessary transitions
        if (this.opacity === target) {
            this.applyImmediateOpacity(target);
            return;
        }

        // Start a transition from the current opacity
        this.startOpacity = this.opacity;
        this.targetOpacity = target;

        this.transitionDuration = duration;
        this.transitionElapsed = 0;
        this.isTransitioning = true;
    }

    applyImmediateOpacity(opacity) {
        // Synchronize all opacity properties
        this.opacity = opacity;
        this.startOpacity = opacity;
        this.targetOpacity = opacity;

        // Reset transition state
        this.transitionDuration = 0;
        this.transitionElapsed = 0;
        this.isTransitioning = false;
    }

    getWeatherOpacity(weather) {
        // Return the predefined opacity for supported weather types
        if (Object.hasOwn(WeatherOpacity, weather)) {
            return WeatherOpacity[weather];
        }

        // Use default snowfall lighting for unsupported weather
        return DEFAULT_OPACITY;
    }

    setWeather(
        weather,
        duration = DEFAULT_TRANSITION_DURATION
    ) {
        // Resolve the target ambient opacity
        const opacity = this.getWeatherOpacity(weather);

        // Apply the weather-dependent lighting transition
        this.setOpacity(opacity, duration);
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

        // Skip updates when no transition is active
        if (!this.isTransitioning) {
            return;
        }

        // Advance transition timing without exceeding its duration
        this.transitionElapsed = Math.min(
            this.transitionElapsed + deltaTime,
            this.transitionDuration
        );

        // Calculate normalized transition progress
        const progress =
            this.transitionElapsed /
            this.transitionDuration;

        // Interpolate between the start and target opacity
        this.opacity =
            this.startOpacity +
            (this.targetOpacity - this.startOpacity) *
            progress;

        // Complete the transition at the exact target
        if (progress >= 1) {
            this.applyImmediateOpacity(
                this.targetOpacity
            );
        }
    }

    draw(ctx, width, height) {
        // Skip disabled ambient lighting
        if (!this.enabled) {
            return;
        }

        // Skip fully transparent overlays
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

        // Preserve the current canvas state
        ctx.save();

        // Render ambient lighting in screen coordinates
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Configure ambient overlay compositing
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;

        // Apply ambient lighting across the viewport
        ctx.fillRect(0, 0, width, height);

        // Restore the original canvas state
        ctx.restore();
    }
}
