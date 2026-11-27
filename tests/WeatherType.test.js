
import { describe, it, expect } from "vitest";
import {
    WeatherType,
    WeatherPresets
} from "../src/weather/WeatherType.js";

describe("WeatherType", () => {
    describe("Weather types", () => {
        it("should define clear weather", () => {
            expect(WeatherType.CLEAR).toBe("clear");
        });

        it("should define light snow", () => {
            expect(WeatherType.LIGHT_SNOW).toBe("light_snow");
        });

        it("should define snowfall", () => {
            expect(WeatherType.SNOWFALL).toBe("snowfall");
        });

        it("should define heavy snow", () => {
            expect(WeatherType.HEAVY_SNOW).toBe("heavy_snow");
        });

        it("should define blizzard", () => {
            expect(WeatherType.BLIZZARD).toBe("blizzard");
        });

        it("should contain exactly five weather types", () => {
            expect(Object.keys(WeatherType)).toHaveLength(5);
        });

        it("should contain unique weather values", () => {
            const values = Object.values(WeatherType);

            expect(new Set(values).size).toBe(values.length);
        });

        it("should prevent modification of weather types", () => {
            expect(Object.isFrozen(WeatherType)).toBe(true);
        });
    });

    describe("Weather presets", () => {
        it("should define clear weather properties", () => {
            expect(WeatherPresets[WeatherType.CLEAR]).toEqual({
                intensity: 0,
                wind: 0,
                visibility: 1
            });
        });

        it("should define light snow properties", () => {
            expect(WeatherPresets[WeatherType.LIGHT_SNOW]).toEqual({
                intensity: 50,
                wind: 5,
                visibility: 0.95
            });
        });

        it("should define snowfall properties", () => {
            expect(WeatherPresets[WeatherType.SNOWFALL]).toEqual({
                intensity: 100,
                wind: 10,
                visibility: 0.85
            });
        });

        it("should define heavy snow properties", () => {
            expect(WeatherPresets[WeatherType.HEAVY_SNOW]).toEqual({
                intensity: 200,
                wind: 25,
                visibility: 0.65
            });
        });

        it("should define blizzard properties", () => {
            expect(WeatherPresets[WeatherType.BLIZZARD]).toEqual({
                intensity: 350,
                wind: 60,
                visibility: 0.35
            });
        });

        it("should provide a preset for every weather type", () => {
            for (const type of Object.values(WeatherType)) {
                expect(WeatherPresets[type]).toBeDefined();
            }
        });

        it("should have valid snowfall intensity values", () => {
            for (const preset of Object.values(WeatherPresets)) {
                expect(Number.isInteger(preset.intensity))
                    .toBe(true);

                expect(preset.intensity)
                    .toBeGreaterThanOrEqual(0);
            }
        });

        it("should have valid wind values", () => {
            for (const preset of Object.values(WeatherPresets)) {
                expect(Number.isFinite(preset.wind))
                    .toBe(true);
            }
        });

        it("should have valid visibility values", () => {
            for (const preset of Object.values(WeatherPresets)) {
                expect(preset.visibility)
                    .toBeGreaterThanOrEqual(0);

                expect(preset.visibility)
                    .toBeLessThanOrEqual(1);
            }
        });

        it("should increase snowfall intensity with weather severity", () => {
            const intensities = Object.values(WeatherType)
                .map(type => WeatherPresets[type].intensity);

            for (let i = 1; i < intensities.length; i++) {
                expect(intensities[i])
                    .toBeGreaterThan(intensities[i - 1]);
            }
        });

        it("should prevent modification of weather presets", () => {
            expect(Object.isFrozen(WeatherPresets)).toBe(true);
        });

        it("should prevent modification of individual presets", () => {
            for (const preset of Object.values(WeatherPresets)) {
                expect(Object.isFrozen(preset)).toBe(true);
            }
        });
    });
});
