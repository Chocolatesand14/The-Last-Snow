
import { describe, it, expect, beforeEach } from "vitest";
import { Game } from "../src/core/Game.js";
import {
    WeatherType,
    WeatherPresets
} from "../src/weather/WeatherType.js";
import { WeatherSystem } from "../src/weather/WeatherSystem.js";
import { WeatherController } from "../src/weather/WeatherController.js";
import { WindSystem } from "../src/weather/WindSystem.js";
import { SnowParticleSystem } from "../src/effects/SnowParticleSystem.js";
import { WeatherOverlay } from "../src/effects/WeatherOverlay.js";

describe("Weather integration", () => {
    let game;

    beforeEach(() => {
        // Create a game instance without browser dependencies
        game = Object.create(Game.prototype);

        // Initialize real weather components
        game.weatherSystem = new WeatherSystem(
            WeatherType.SNOWFALL
        );

        game.weatherController = new WeatherController(
            game.weatherSystem,
            () => 0.5
        );

        game.windSystem = new WindSystem(
            game.weatherSystem.wind,
            game.weatherSystem.wind * 0.5,
            0.3
        );

        game.snowSystem = new SnowParticleSystem(
            480,
            384,
            game.weatherSystem.intensity
        );

        game.weatherOverlay = new WeatherOverlay(
            480,
            384
        );

        // Synchronize initial weather properties
        game.snowSystem.setWind(
            game.windSystem.currentWind
        );

        game.weatherOverlay.setVisibility(
            game.weatherSystem.visibility
        );
    });

    describe("Initial weather synchronization", () => {
        it("should synchronize initial snowfall intensity", () => {
            expect(game.snowSystem.particles)
                .toHaveLength(100);
        });

        it("should synchronize initial wind speed", () => {
            expect(game.snowSystem.wind).toBe(10);
        });

        it("should synchronize initial visibility", () => {
            expect(game.weatherOverlay.visibility)
                .toBe(0.85);
        });

        it("should synchronize initial overlay opacity", () => {
            expect(game.weatherOverlay.opacity)
                .toBeCloseTo(0.15);
        });
    });

    describe("Weather transition integration", () => {
        beforeEach(() => {
            game.weatherController.setEnabled(false);

            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD,
                10
            );
        });

        it("should gradually increase snowfall intensity", () => {
            game.updateWeather(5);

            expect(game.snowSystem.particles)
                .toHaveLength(225);
        });

        it("should gradually increase base wind", () => {
            game.updateWeather(5);

            expect(game.windSystem.baseWind)
                .toBeCloseTo(35);
        });

        it("should scale gust strength with base wind", () => {
            game.updateWeather(5);

            expect(game.windSystem.gustStrength)
                .toBeCloseTo(17.5);
        });

        it("should gradually reduce weather visibility", () => {
            game.updateWeather(5);

            expect(game.weatherOverlay.visibility)
                .toBeCloseTo(0.6);
        });

        it("should gradually increase overlay opacity", () => {
            game.updateWeather(5);

            expect(game.weatherOverlay.opacity)
                .toBeCloseTo(0.4);
        });

        it("should synchronize all blizzard properties", () => {
            game.updateWeather(10);

            const preset =
                WeatherPresets[WeatherType.BLIZZARD];

            expect(game.weatherSystem.currentWeather)
                .toBe(WeatherType.BLIZZARD);

            expect(game.snowSystem.particles)
                .toHaveLength(preset.intensity);

            expect(game.windSystem.baseWind)
                .toBe(preset.wind);

            expect(game.weatherOverlay.visibility)
                .toBe(preset.visibility);
        });

        it("should preserve existing particles during transitions", () => {
            const particle = game.snowSystem.particles[0];

            game.updateWeather(5);

            expect(game.snowSystem.particles[0])
                .toBe(particle);
        });
    });

    describe("Dynamic wind integration", () => {
        it("should synchronize dynamic wind with snowfall", () => {
            game.updateWeather(0.5);

            expect(game.snowSystem.wind)
                .toBe(game.windSystem.currentWind);
        });

        it("should apply dynamic wind to particle movement", () => {
            const particle = game.snowSystem.particles[0];

            particle.x = 100;
            particle.y = 50;

            // Disable sway to isolate wind movement
            particle.swayAmplitude = 0;

            game.updateWeather(0.5);

            expect(particle.x).toBeCloseTo(
                100 + game.windSystem.currentWind * 0.5
            );
        });

        it("should update individual particle movement", () => {
            const particle = game.snowSystem.particles[0];

            particle.x = 100;
            particle.y = 50;

            game.updateWeather(0.5);

            expect(particle.elapsedTime)
                .toBeCloseTo(0.5);
        });
    });

    describe("Automatic weather integration", () => {
        it("should start an automatic weather transition", () => {
            game.updateWeather(
                game.weatherController.weatherDuration
            );

            expect(game.weatherSystem.isTransitioning)
                .toBe(true);

            expect(game.weatherSystem.targetWeather)
                .toBe(WeatherType.HEAVY_SNOW);
        });

        it("should complete an automatic weather transition", () => {
            game.updateWeather(
                game.weatherController.weatherDuration
            );

            game.updateWeather(5);

            expect(game.weatherSystem.currentWeather)
                .toBe(WeatherType.HEAVY_SNOW);

            expect(game.weatherSystem.isTransitioning)
                .toBe(false);

            expect(game.snowSystem.particles)
                .toHaveLength(200);
        });

        it("should not count stable weather time during transitions", () => {
            game.updateWeather(
                game.weatherController.weatherDuration
            );

            game.updateWeather(2);

            expect(game.weatherController.elapsedTime)
                .toBe(0);
        });

        it("should resume stable weather timing after a transition", () => {
            game.updateWeather(
                game.weatherController.weatherDuration
            );

            game.updateWeather(5);
            game.updateWeather(10);

            expect(game.weatherController.elapsedTime)
                .toBeCloseTo(10);
        });

        it("should not change weather automatically when disabled", () => {
            game.weatherController.setEnabled(false);

            game.updateWeather(200);

            expect(game.weatherSystem.currentWeather)
                .toBe(WeatherType.SNOWFALL);

            expect(game.weatherSystem.isTransitioning)
                .toBe(false);
        });

        it("should allow manual transitions when automatic weather is disabled", () => {
            game.weatherController.setEnabled(false);

            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD,
                5
            );

            game.updateWeather(5);

            expect(game.weatherSystem.currentWeather)
                .toBe(WeatherType.BLIZZARD);

            expect(game.snowSystem.particles)
                .toHaveLength(350);
        });
    });

    describe("Clear weather integration", () => {
        beforeEach(() => {
            game.weatherController.setEnabled(false);

            game.weatherSystem.setWeather(
                WeatherType.CLEAR,
                5
            );

            game.updateWeather(5);
        });

        it("should remove all snow particles", () => {
            expect(game.snowSystem.particles)
                .toHaveLength(0);
        });

        it("should disable wind and gusts", () => {
            expect(game.windSystem.baseWind).toBe(0);
            expect(game.windSystem.gustStrength).toBe(0);
            expect(game.snowSystem.wind).toBe(0);
        });

        it("should restore full visibility", () => {
            expect(game.weatherOverlay.visibility)
                .toBe(1);
        });

        it("should remove the weather overlay opacity", () => {
            expect(game.weatherOverlay.opacity)
                .toBe(0);
        });
    });

    describe("Time handling", () => {
        it("should ignore invalid delta time", () => {
            game.updateWeather(NaN);
            game.updateWeather(Infinity);
            game.updateWeather(-1);
            game.updateWeather(0);

            expect(game.weatherController.elapsedTime)
                .toBe(0);

            expect(game.windSystem.elapsedTime)
                .toBe(0);

            expect(game.snowSystem.particles)
                .toHaveLength(100);
        });

        it("should remain consistent across different frame rates", () => {
            game.weatherController.setEnabled(false);

            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD,
                10
            );

            for (let frame = 0; frame < 150; frame++) {
                game.updateWeather(1 / 30);
            }

            const intensity30FPS =
                game.snowSystem.particles.length;

            const wind30FPS =
                game.windSystem.currentWind;

            const visibility30FPS =
                game.weatherOverlay.visibility;

            // Reset the weather components
            game.weatherSystem = new WeatherSystem(
                WeatherType.SNOWFALL
            );

            game.weatherController = new WeatherController(
                game.weatherSystem,
                () => 0.5
            );

            game.weatherController.setEnabled(false);

            game.windSystem = new WindSystem(10, 5, 0.3);

            game.snowSystem = new SnowParticleSystem(
                480, 384, 100
            );

            game.weatherOverlay = new WeatherOverlay(
                480, 384
            );

            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD,
                10
            );

            for (let frame = 0; frame < 300; frame++) {
                game.updateWeather(1 / 60);
            }

            expect(game.snowSystem.particles.length)
                .toBe(intensity30FPS);

            expect(game.windSystem.currentWind)
                .toBeCloseTo(wind30FPS, 5);

            expect(game.weatherOverlay.visibility)
                .toBeCloseTo(visibility30FPS, 5);
        });
    });
});
