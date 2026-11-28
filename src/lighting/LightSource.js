
const DEFAULT_RADIUS = 64;
const DEFAULT_INTENSITY = 0.8;
const DEFAULT_COLOR = "#ffcf85";

const DEFAULT_FLICKER_AMPLITUDE = 0.1;
const DEFAULT_FLICKER_FREQUENCY = 2;

export class LightSource {
    constructor(
        x = 0,
        y = 0,
        radius = DEFAULT_RADIUS,
        intensity = DEFAULT_INTENSITY,
        color = DEFAULT_COLOR
    ) {
        // Initialize world position
        this.x = Number.isFinite(x) ? x : 0;
        this.y = Number.isFinite(y) ? y : 0;

        // Initialize light radius
        this.radius =
            Number.isFinite(radius) && radius > 0
                ? radius
                : DEFAULT_RADIUS;

        // Initialize light intensity
        this.intensity = Number.isFinite(intensity)
            ? this.clamp(intensity)
            : DEFAULT_INTENSITY;

        // Initialize light color
        this.color = DEFAULT_COLOR;
        this.setColor(color);

        // Enable the light by default
        this.enabled = true;

        // Initialize flickering properties
        this.flickerEnabled = false;
        this.flickerAmplitude = DEFAULT_FLICKER_AMPLITUDE;
        this.flickerFrequency = DEFAULT_FLICKER_FREQUENCY;

        // Track elapsed time for deterministic flickering
        this.elapsedTime = 0;
    }

    clamp(value) {
        // Restrict normalized values to the supported range
        return Math.max(0, Math.min(1, value));
    }

    setPosition(x, y) {
        // Reject invalid world coordinates
        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y)
        ) {
            return;
        }

        this.x = x;
        this.y = y;
    }

    setRadius(radius) {
        // Reject invalid or non-positive radius values
        if (
            !Number.isFinite(radius) ||
            radius <= 0
        ) {
            return;
        }

        this.radius = radius;
    }

    setIntensity(intensity) {
        // Reject invalid intensity values
        if (!Number.isFinite(intensity)) {
            return;
        }

        this.intensity = this.clamp(intensity);
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

    setEnabled(enabled) {
        // Accept only boolean configuration values
        if (typeof enabled !== "boolean") {
            return;
        }

        this.enabled = enabled;
    }

    setFlickerEnabled(enabled) {
        // Validate the flickering configuration
        if (typeof enabled !== "boolean") {
            return;
        }

        this.flickerEnabled = enabled;
    }

    setFlickerAmplitude(amplitude) {
        // Reject invalid flicker amplitude values
        if (!Number.isFinite(amplitude)) {
            return;
        }

        this.flickerAmplitude = this.clamp(amplitude);
    }

    setFlickerFrequency(frequency) {
        // Reject invalid or non-positive frequency values
        if (
            !Number.isFinite(frequency) ||
            frequency <= 0
        ) {
            return;
        }

        this.flickerFrequency = frequency;
    }

    getEffectiveIntensity() {
        // Keep completely dark light sources inactive
        if (this.intensity === 0) {
            return 0;
        }

        // Return the base intensity when flickering is disabled
        if (!this.flickerEnabled) {
            return this.intensity;
        }

        // Calculate smooth time-based intensity variation
        const flicker = Math.sin(
            this.elapsedTime *
            this.flickerFrequency *
            Math.PI * 2
        ) * this.flickerAmplitude;

        // Keep the effective intensity within valid limits
        return this.clamp(
            this.intensity + flicker
        );
    }

    update(deltaTime) {
        // Reject invalid or non-positive delta time
        if (
            !Number.isFinite(deltaTime) ||
            deltaTime <= 0
        ) {
            return;
        }

        // Advance the internal animation clock
        this.elapsedTime += deltaTime;
    }

    draw(ctx) {
        // Skip disabled light sources
        if (!this.enabled) {
            return;
        }

        // Calculate the current light intensity
        const intensity = this.getEffectiveIntensity();

        // Skip invisible light sources
        if (intensity <= 0) {
            return;
        }

        // Preserve the current canvas state
        ctx.save();

        // Use additive blending for light accumulation
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = intensity;

        // Create a smooth radial light gradient
        const gradient = ctx.createRadialGradient(
            this.x,
            this.y,
            0,
            this.x,
            this.y,
            this.radius
        );

        // Fade the light from its center to the outer edge
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;

        // Render the circular light source
        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Restore the original canvas state
        ctx.restore();
    }
}
