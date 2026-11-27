
import {
    WeatherType,
    WeatherPresets
} from "./WeatherType.js";

export class WeatherSystem {
    constructor(initialWeather = WeatherType.SNOWFALL) {
        // Fall back to snowfall if the weather type is invalid
        if (!Object.hasOwn(WeatherPresets, initialWeather)) {
            initialWeather = WeatherType.SNOWFALL;
        }

        this.currentWeather = initialWeather;
        this.targetWeather = initialWeather;

        const preset = WeatherPresets[initialWeather];

        this.intensity = preset.intensity;
        this.wind = preset.wind;
        this.visibility = preset.visibility;

        // Initialize transition properties
        this.isTransitioning = false;
        this.transitionDuration = 0;
        this.transitionElapsed = 0;

        this.startIntensity = this.intensity;
        this.startWind = this.wind;
        this.startVisibility = this.visibility;
    }

    setWeather(weatherType, duration = 5) {
        // Reject invalid weather types
        if (!Object.hasOwn(WeatherPresets, weatherType)) {
            return;
        }

        // Reject invalid transition durations
        if (!Number.isFinite(duration) || duration < 0) {
            return;
        }

        // Avoid unnecessary weather transitions
        if (
            !this.isTransitioning &&
            weatherType === this.currentWeather
        ) {
            return;
        }

        this.targetWeather = weatherType;

        // Apply the weather immediately when requested
        if (duration === 0) {
            this.completeTransition();
            return;
        }

        // Store the current weather properties
        this.startIntensity = this.intensity;
        this.startWind = this.wind;
        this.startVisibility = this.visibility;

        // Initialize the transition
        this.transitionDuration = duration;
        this.transitionElapsed = 0;
        this.isTransitioning = true;
    }

    update(deltaTime) {
        // Reject invalid or negative delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Skip updates when no transition is active
        if (!this.isTransitioning) {
            return;
        }

        // Update elapsed transition time
        this.transitionElapsed += deltaTime;

        // Calculate normalized transition progress
        const progress = Math.min(
            this.transitionElapsed / this.transitionDuration,
            1
        );

        const target = WeatherPresets[this.targetWeather];

        // Gradually update snowfall intensity
        this.intensity = Math.round(
            this.lerp(
                this.startIntensity,
                target.intensity,
                progress
            )
        );

        // Gradually update wind speed
        this.wind = this.lerp(
            this.startWind,
            target.wind,
            progress
        );

        // Gradually update visibility
        this.visibility = this.lerp(
            this.startVisibility,
            target.visibility,
            progress
        );

        // Complete the transition when the target is reached
        if (progress >= 1) {
            this.completeTransition();
        }
    }

    lerp(start, end, progress) {
        // Calculate linear interpolation
        return start + (end - start) * progress;
    }

    completeTransition() {
        const preset = WeatherPresets[this.targetWeather];

        // Apply exact target weather properties
        this.intensity = preset.intensity;
        this.wind = preset.wind;
        this.visibility = preset.visibility;

        // Activate the target weather
        this.currentWeather = this.targetWeather;

        // Reset transition properties
        this.isTransitioning = false;
        this.transitionDuration = 0;
        this.transitionElapsed = 0;
    }
}
