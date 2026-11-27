
import { WeatherType } from "./WeatherType.js";

// Define the duration range for each weather type
const WeatherDurations = Object.freeze({
    [WeatherType.CLEAR]: [60, 120],
    [WeatherType.LIGHT_SNOW]: [45, 90],
    [WeatherType.SNOWFALL]: [60, 120],
    [WeatherType.HEAVY_SNOW]: [30, 60],
    [WeatherType.BLIZZARD]: [20, 45]
});

// Define allowed transitions between weather types
const WeatherTransitions = Object.freeze({
    [WeatherType.CLEAR]: [
        WeatherType.LIGHT_SNOW
    ],

    [WeatherType.LIGHT_SNOW]: [
        WeatherType.CLEAR,
        WeatherType.SNOWFALL
    ],

    [WeatherType.SNOWFALL]: [
        WeatherType.LIGHT_SNOW,
        WeatherType.HEAVY_SNOW
    ],

    [WeatherType.HEAVY_SNOW]: [
        WeatherType.SNOWFALL,
        WeatherType.BLIZZARD
    ],

    [WeatherType.BLIZZARD]: [
        WeatherType.HEAVY_SNOW
    ]
});

export class WeatherController {
    constructor(weatherSystem, random = Math.random) {
        this.weatherSystem = weatherSystem;
        this.random = random;

        // Initialize automatic weather changes
        this.enabled = true;
        this.elapsedTime = 0;
        this.transitionDuration = 5;

        this.activeWeather = weatherSystem.currentWeather;

        // Generate the initial weather duration
        this.weatherDuration = this.getWeatherDuration(
            this.activeWeather
        );
    }

    getWeatherDuration(weatherType) {
        // Fall back to snowfall for invalid weather types
        const range = Object.hasOwn(
            WeatherDurations,
            weatherType
        )
            ? WeatherDurations[weatherType]
            : WeatherDurations[WeatherType.SNOWFALL];

        const [minimum, maximum] = range;

        // Generate a random duration within the allowed range
        return minimum +
            this.random() * (maximum - minimum);
    }

    getNextWeather(currentWeather) {
        // Retrieve allowed weather transitions
        const allowedWeather = Object.hasOwn(
            WeatherTransitions,
            currentWeather
        )
            ? WeatherTransitions[currentWeather]
            : WeatherTransitions[WeatherType.SNOWFALL];

        // Select a random weather type
        const index = Math.floor(
            this.random() * allowedWeather.length
        );

        return allowedWeather[index];
    }

    setEnabled(enabled) {
        // Reject invalid state values
        if (typeof enabled !== "boolean") {
            return;
        }

        this.enabled = enabled;
    }

    update(deltaTime) {
        // Reject invalid or negative delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Skip automatic changes when disabled
        if (!this.enabled) {
            return;
        }

        // Wait until the current transition is complete
        if (this.weatherSystem.isTransitioning) {
            return;
        }

        // Synchronize externally triggered weather changes
        if (
            this.activeWeather !==
            this.weatherSystem.currentWeather
        ) {
            this.activeWeather =
                this.weatherSystem.currentWeather;

            this.elapsedTime = 0;

            this.weatherDuration = this.getWeatherDuration(
                this.activeWeather
            );
        }

        // Update the stable weather timer
        this.elapsedTime += deltaTime;

        // Wait until the current weather duration expires
        if (this.elapsedTime < this.weatherDuration) {
            return;
        }

        // Select the next weather type
        const nextWeather = this.getNextWeather(
            this.weatherSystem.currentWeather
        );

        // Start a gradual weather transition
        this.weatherSystem.setWeather(
            nextWeather,
            this.transitionDuration
        );

        // Prepare the next weather cycle
        this.activeWeather = nextWeather;
        this.elapsedTime = 0;

        this.weatherDuration = this.getWeatherDuration(
            nextWeather
        );
    }
}
