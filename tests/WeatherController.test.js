
import { describe, it, expect, beforeEach, vi } from "vitest";
import { WeatherController } from "../src/weather/WeatherController.js";
import { WeatherSystem } from "../src/weather/WeatherSystem.js";
import { WeatherType } from "../src/weather/WeatherType.js";

describe("WeatherController", () => {
    let weather;
    let controller;
    let random;

    beforeEach(() => {
        weather = new WeatherSystem(WeatherType.SNOWFALL);

        // Use predictable random values for deterministic tests
        random = vi.fn(() => 0.5);

        controller = new WeatherController(weather, random);
    });

    describe("Initialization", () => {
        it("should store the weather system", () => {
            expect(controller.weatherSystem).toBe(weather);
        });

        it("should enable automatic weather changes by default", () => {
            expect(controller.enabled).toBe(true);
        });

        it("should initialize with zero elapsed time", () => {
            expect(controller.elapsedTime).toBe(0);
        });

        it("should initialize with a valid weather duration", () => {
            expect(controller.weatherDuration)
                .toBeGreaterThanOrEqual(60);

            expect(controller.weatherDuration)
                .toBeLessThanOrEqual(120);
        });

        it("should support an injected random generator", () => {
            expect(random).toHaveBeenCalled();
        });
    });

    describe("Weather duration", () => {
        it.each([
            [WeatherType.CLEAR, 60, 120],
            [WeatherType.LIGHT_SNOW, 45, 90],
            [WeatherType.SNOWFALL, 60, 120],
            [WeatherType.HEAVY_SNOW, 30, 60],
            [WeatherType.BLIZZARD, 20, 45]
        ])(
            "should generate a valid duration for %s",
            (type, minimum, maximum) => {
                const duration =
                    controller.getWeatherDuration(type);

                expect(duration)
                    .toBeGreaterThanOrEqual(minimum);

                expect(duration)
                    .toBeLessThanOrEqual(maximum);
            }
        );

        it("should support the minimum weather duration", () => {
            random.mockReturnValue(0);

            expect(
                controller.getWeatherDuration(
                    WeatherType.SNOWFALL
                )
            ).toBe(60);
        });

        it("should support durations close to the maximum", () => {
            random.mockReturnValue(0.999);

            const duration = controller.getWeatherDuration(
                WeatherType.SNOWFALL
            );

            expect(duration).toBeGreaterThan(119);
            expect(duration).toBeLessThanOrEqual(120);
        });

        it("should generate predictable durations", () => {
            random.mockReturnValue(0.5);

            expect(
                controller.getWeatherDuration(
                    WeatherType.SNOWFALL
                )
            ).toBe(90);
        });
    });

    describe("Weather transitions", () => {
        it.each([
            [WeatherType.CLEAR, [
                WeatherType.LIGHT_SNOW
            ]],
            [WeatherType.LIGHT_SNOW, [
                WeatherType.CLEAR,
                WeatherType.SNOWFALL
            ]],
            [WeatherType.SNOWFALL, [
                WeatherType.LIGHT_SNOW,
                WeatherType.HEAVY_SNOW
            ]],
            [WeatherType.HEAVY_SNOW, [
                WeatherType.SNOWFALL,
                WeatherType.BLIZZARD
            ]],
            [WeatherType.BLIZZARD, [
                WeatherType.HEAVY_SNOW
            ]]
        ])(
            "should select an allowed transition from %s",
            (currentWeather, allowedWeather) => {
                for (const value of [0, 0.5, 0.999]) {
                    random.mockReturnValue(value);

                    const nextWeather =
                        controller.getNextWeather(
                            currentWeather
                        );

                    expect(allowedWeather)
                        .toContain(nextWeather);
                }
            }
        );

        it("should never select the same weather type", () => {
            for (const type of Object.values(WeatherType)) {
                expect(
                    controller.getNextWeather(type)
                ).not.toBe(type);
            }
        });
    });

    describe("Automatic weather changes", () => {
        it("should update elapsed time", () => {
            controller.update(10);

            expect(controller.elapsedTime).toBe(10);
        });

        it("should preserve weather before its duration expires", () => {
            controller.update(20);

            expect(weather.currentWeather)
                .toBe(WeatherType.SNOWFALL);

            expect(weather.isTransitioning).toBe(false);
        });

        it("should start a transition when the duration expires", () => {
            controller.update(controller.weatherDuration);

            expect(weather.isTransitioning).toBe(true);
        });

        it("should use a gradual weather transition", () => {
            const spy = vi.spyOn(weather, "setWeather");

            random.mockReturnValue(0);

            controller.update(controller.weatherDuration);

            expect(spy).toHaveBeenCalledWith(
                WeatherType.LIGHT_SNOW,
                5
            );
        });

        it("should reset elapsed time after starting a transition", () => {
            controller.update(controller.weatherDuration);

            expect(controller.elapsedTime).toBe(0);
        });

        it("should not interrupt an active weather transition", () => {
            weather.setWeather(WeatherType.BLIZZARD, 10);

            controller.update(100);

            expect(weather.targetWeather)
                .toBe(WeatherType.BLIZZARD);
        });

        it("should not count stable weather time during transitions", () => {
            weather.setWeather(WeatherType.BLIZZARD, 10);

            controller.update(5);

            expect(controller.elapsedTime).toBe(0);
        });

        it("should assign a new duration for the next weather type", () => {
            random.mockReturnValue(0);

            controller.update(controller.weatherDuration);

            expect(weather.targetWeather)
                .toBe(WeatherType.LIGHT_SNOW);

            expect(controller.weatherDuration).toBe(45);
        });
    });

    describe("Enable and disable weather changes", () => {
        it("should support disabling automatic weather changes", () => {
            controller.setEnabled(false);

            expect(controller.enabled).toBe(false);
        });

        it("should not update elapsed time when disabled", () => {
            controller.setEnabled(false);
            controller.update(100);

            expect(controller.elapsedTime).toBe(0);
        });

        it("should not change weather when disabled", () => {
            controller.setEnabled(false);
            controller.update(200);

            expect(weather.currentWeather)
                .toBe(WeatherType.SNOWFALL);

            expect(weather.isTransitioning).toBe(false);
        });

        it("should resume automatic weather changes when enabled", () => {
            controller.setEnabled(false);
            controller.setEnabled(true);

            controller.update(controller.weatherDuration);

            expect(weather.isTransitioning).toBe(true);
        });

        it("should preserve elapsed time while paused", () => {
            controller.update(20);

            controller.setEnabled(false);
            controller.update(50);

            expect(controller.elapsedTime).toBe(20);

            controller.setEnabled(true);
            controller.update(10);

            expect(controller.elapsedTime).toBe(30);
        });
    });

    describe("Time handling", () => {
        it("should ignore zero delta time", () => {
            controller.update(0);

            expect(controller.elapsedTime).toBe(0);
        });

        it("should ignore negative delta time", () => {
            controller.update(-10);

            expect(controller.elapsedTime).toBe(0);
        });

        it("should ignore invalid delta time", () => {
            controller.update(NaN);
            controller.update(Infinity);

            expect(controller.elapsedTime).toBe(0);
        });

        it("should remain consistent across different frame rates", () => {
            const weather30FPS = new WeatherSystem();
            const weather60FPS = new WeatherSystem();

            const controller30FPS = new WeatherController(
                weather30FPS, () => 0.5
            );

            const controller60FPS = new WeatherController(
                weather60FPS, () => 0.5
            );

            for (let frame = 0; frame < 300; frame++) {
                controller30FPS.update(1 / 30);
            }

            for (let frame = 0; frame < 600; frame++) {
                controller60FPS.update(1 / 60);
            }

            expect(controller30FPS.elapsedTime)
                .toBeCloseTo(controller60FPS.elapsedTime, 5);
        });
    });
});
