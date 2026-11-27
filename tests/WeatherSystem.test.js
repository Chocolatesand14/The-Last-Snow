
import { describe, it, expect, beforeEach } from "vitest";
import { WeatherSystem } from "../src/weather/WeatherSystem.js";
import {
    WeatherType,
    WeatherPresets
} from "../src/weather/WeatherType.js";

describe("WeatherSystem", () => {
    let weather;

    beforeEach(() => {
        weather = new WeatherSystem(WeatherType.SNOWFALL);
    });

    describe("Initialization", () => {
        it("should initialize with the selected weather type", () => {
            expect(weather.currentWeather)
                .toBe(WeatherType.SNOWFALL);
        });

        it("should initialize with the correct snowfall intensity", () => {
            expect(weather.intensity).toBe(100);
        });

        it("should initialize with the correct wind speed", () => {
            expect(weather.wind).toBe(10);
        });

        it("should initialize with the correct visibility", () => {
            expect(weather.visibility).toBe(0.85);
        });

        it("should not be transitioning initially", () => {
            expect(weather.isTransitioning).toBe(false);
        });

        it("should support different initial weather types", () => {
            const clearWeather = new WeatherSystem(
                WeatherType.CLEAR
            );

            expect(clearWeather.intensity).toBe(0);
            expect(clearWeather.wind).toBe(0);
            expect(clearWeather.visibility).toBe(1);
        });

        it("should use snowfall as the default weather", () => {
            const defaultWeather = new WeatherSystem();

            expect(defaultWeather.currentWeather)
                .toBe(WeatherType.SNOWFALL);
        });

        it("should fall back to snowfall for invalid weather", () => {
            const invalidWeather = new WeatherSystem("invalid");

            expect(invalidWeather.currentWeather)
                .toBe(WeatherType.SNOWFALL);
        });
    });

    describe("Weather changes", () => {
        it("should support instant weather changes", () => {
            weather.setWeather(WeatherType.BLIZZARD, 0);

            expect(weather.currentWeather)
                .toBe(WeatherType.BLIZZARD);

            expect(weather.intensity).toBe(350);
            expect(weather.wind).toBe(60);
            expect(weather.visibility).toBe(0.35);
        });

        it("should start a weather transition", () => {
            weather.setWeather(WeatherType.BLIZZARD, 5);

            expect(weather.isTransitioning).toBe(true);
        });

        it("should assign the correct target weather", () => {
            weather.setWeather(WeatherType.HEAVY_SNOW, 5);

            expect(weather.targetWeather)
                .toBe(WeatherType.HEAVY_SNOW);
        });

        it("should reject invalid weather types", () => {
            weather.setWeather("invalid", 5);

            expect(weather.currentWeather)
                .toBe(WeatherType.SNOWFALL);

            expect(weather.isTransitioning).toBe(false);
        });

        it("should reject negative transition durations", () => {
            weather.setWeather(WeatherType.BLIZZARD, -5);

            expect(weather.isTransitioning).toBe(false);

            expect(weather.currentWeather)
                .toBe(WeatherType.SNOWFALL);
        });

        it("should reject non-finite transition durations", () => {
            weather.setWeather(WeatherType.BLIZZARD, NaN);
            weather.setWeather(WeatherType.BLIZZARD, Infinity);

            expect(weather.isTransitioning).toBe(false);
            expect(weather.intensity).toBe(100);
        });

        it("should not transition to the active weather unnecessarily", () => {
            weather.setWeather(WeatherType.SNOWFALL, 5);

            expect(weather.isTransitioning).toBe(false);
        });
    });

    describe("Smooth weather transitions", () => {
        beforeEach(() => {
            weather.setWeather(WeatherType.BLIZZARD, 10);
        });

        it("should gradually increase snowfall intensity", () => {
            weather.update(5);

            expect(weather.intensity).toBeGreaterThan(100);
            expect(weather.intensity).toBeLessThan(350);
        });

        it("should gradually increase wind speed", () => {
            weather.update(5);

            expect(weather.wind).toBeGreaterThan(10);
            expect(weather.wind).toBeLessThan(60);
        });

        it("should gradually reduce visibility", () => {
            weather.update(5);

            expect(weather.visibility).toBeGreaterThan(0.35);
            expect(weather.visibility).toBeLessThan(0.85);
        });

        it("should interpolate intensity halfway through a transition", () => {
            weather.update(5);

            expect(weather.intensity).toBe(225);
        });

        it("should interpolate wind halfway through a transition", () => {
            weather.update(5);

            expect(weather.wind).toBeCloseTo(35);
        });

        it("should interpolate visibility halfway through a transition", () => {
            weather.update(5);

            expect(weather.visibility).toBeCloseTo(0.6);
        });

        it("should preserve the current weather until completion", () => {
            weather.update(5);

            expect(weather.currentWeather)
                .toBe(WeatherType.SNOWFALL);
        });

        it("should complete the transition after its duration", () => {
            weather.update(10);

            expect(weather.currentWeather)
                .toBe(WeatherType.BLIZZARD);

            expect(weather.isTransitioning).toBe(false);
        });

        it("should reach the exact target weather properties", () => {
            weather.update(10);

            const preset = WeatherPresets[WeatherType.BLIZZARD];

            expect(weather.intensity).toBe(preset.intensity);
            expect(weather.wind).toBe(preset.wind);
            expect(weather.visibility).toBe(preset.visibility);
        });

        it("should not exceed the target weather properties", () => {
            weather.update(20);

            expect(weather.intensity).toBe(350);
            expect(weather.wind).toBe(60);
            expect(weather.visibility).toBe(0.35);
        });

        it("should preserve integer snowfall intensity", () => {
            weather.update(0.17);

            expect(Number.isInteger(weather.intensity)).toBe(true);
        });

        it("should support transitions back to clear weather", () => {
            weather.update(10);

            weather.setWeather(WeatherType.CLEAR, 5);
            weather.update(5);

            expect(weather.currentWeather)
                .toBe(WeatherType.CLEAR);

            expect(weather.intensity).toBe(0);
            expect(weather.wind).toBe(0);
            expect(weather.visibility).toBe(1);
        });

        it("should support changing the target during a transition", () => {
            weather.update(5);

            const previousIntensity = weather.intensity;
            const previousWind = weather.wind;
            const previousVisibility = weather.visibility;

            weather.setWeather(WeatherType.LIGHT_SNOW, 5);

            expect(weather.intensity).toBe(previousIntensity);
            expect(weather.wind).toBe(previousWind);
            expect(weather.visibility).toBe(previousVisibility);

            weather.update(5);

            expect(weather.currentWeather)
                .toBe(WeatherType.LIGHT_SNOW);

            expect(weather.intensity).toBe(50);
        });
    });

    describe("Time handling", () => {
        it("should not change weather when delta time is zero", () => {
            weather.setWeather(WeatherType.BLIZZARD, 10);
            weather.update(0);

            expect(weather.intensity).toBe(100);
            expect(weather.wind).toBe(10);
            expect(weather.visibility).toBe(0.85);
        });

        it("should ignore negative delta time", () => {
            weather.setWeather(WeatherType.BLIZZARD, 10);
            weather.update(-1);

            expect(weather.intensity).toBe(100);
        });

        it("should ignore invalid delta time", () => {
            weather.setWeather(WeatherType.BLIZZARD, 10);

            weather.update(NaN);
            weather.update(Infinity);

            expect(weather.intensity).toBe(100);
        });

        it("should remain stable without an active transition", () => {
            weather.update(100);

            expect(weather.currentWeather)
                .toBe(WeatherType.SNOWFALL);

            expect(weather.intensity).toBe(100);
        });

        it("should remain consistent across different frame rates", () => {
            const weather30FPS = new WeatherSystem();
            const weather60FPS = new WeatherSystem();

            weather30FPS.setWeather(WeatherType.BLIZZARD, 10);
            weather60FPS.setWeather(WeatherType.BLIZZARD, 10);

            for (let frame = 0; frame < 150; frame++) {
                weather30FPS.update(1 / 30);
            }

            for (let frame = 0; frame < 300; frame++) {
                weather60FPS.update(1 / 60);
            }

            expect(weather30FPS.intensity)
                .toBe(weather60FPS.intensity);

            expect(weather30FPS.wind)
                .toBeCloseTo(weather60FPS.wind, 5);

            expect(weather30FPS.visibility)
                .toBeCloseTo(weather60FPS.visibility, 5);
        });
    });
});
