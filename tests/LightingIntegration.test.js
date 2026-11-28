
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Game } from "../src/core/Game.js";
import { LightingSystem } from "../src/lighting/LightingSystem.js";
import { AmbientLight } from "../src/lighting/AmbientLight.js";
import { LightSource } from "../src/lighting/LightSource.js";
import { ShadowSystem } from "../src/lighting/ShadowSystem.js";
import { SnowFootprintSystem } from "../src/effects/SnowFootprintSystem.js";
import { WeatherSystem } from "../src/weather/WeatherSystem.js";
import { WeatherType } from "../src/weather/WeatherType.js";

describe("Lighting integration", () => {
    let game;

    beforeEach(() => {
        // Create a game instance without browser dependencies
        game = Object.create(Game.prototype);

        // Initialize real game systems
        game.lightingSystem = new LightingSystem();
        game.shadowSystem = new ShadowSystem();

        game.footprintSystem = new SnowFootprintSystem(
            12, 4, 60
        );

        game.weatherSystem = new WeatherSystem(
            WeatherType.SNOWFALL
        );

        // Initialize a controlled player
        game.player = {
            x: 100,
            y: 50,
            width: 32,
            height: 32,
            direction: "down",
            update: vi.fn(),
            draw: vi.fn()
        };

        game.shadowSystem.createPlayerShadow(
            game.player
        );

        game.lightingSystem.setWeather(
            WeatherType.SNOWFALL,
            0
        );

        // Initialize camera
        game.camera = {
            x: 0,
            y: 0,
            width: 480,
            height: 384,
            follow: vi.fn()
        };

        // Mock unrelated game dependencies
        game.input = {};

        game.world = {
            canMoveTo: vi.fn(() => true),
            renderGround: vi.fn(),
            getRenderables: vi.fn(() => [])
        };

        game.updateWeather = vi.fn();

        game.weatherOverlay = {
            draw: vi.fn()
        };

        game.snowSystem = {
            draw: vi.fn()
        };

        game.canvas = {
            width: 480,
            height: 384
        };

        // Mock browser canvas rendering
        game.ctx = {
            clearRect: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            scale: vi.fn(),
            setTransform: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            fillRect: vi.fn(),

            createRadialGradient: vi.fn(() => ({
                addColorStop: vi.fn()
            })),

            globalAlpha: 1,
            fillStyle: "",
            globalCompositeOperation: "source-over"
        };
    });

    describe("Lighting initialization", () => {
        it("should initialize a real lighting system", () => {
            expect(game.lightingSystem)
                .toBeInstanceOf(LightingSystem);
        });

        it("should initialize real ambient lighting", () => {
            expect(game.lightingSystem.ambientLight)
                .toBeInstanceOf(AmbientLight);
        });

        it("should initialize snowfall lighting", () => {
            expect(game.lightingSystem.ambientLight.opacity)
                .toBe(0.15);
        });

        it("should initialize with lighting enabled", () => {
            expect(game.lightingSystem.enabled)
                .toBe(true);
        });

        it("should support registering world light sources", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            expect(light).toBeInstanceOf(LightSource);

            expect(game.lightingSystem.lightSources)
                .toContain(light);
        });
    });

    describe("Game update integration", () => {
        it("should update lighting during game updates", () => {
            const spy = vi.spyOn(
                game.lightingSystem,
                "update"
            );

            game.update(0.1);

            expect(spy)
                .toHaveBeenCalledWith(0.1);
        });

        it("should update lighting while the player is stationary", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            game.update(0.5);

            expect(light.elapsedTime)
                .toBeCloseTo(0.5);
        });

        it("should update lighting while the player moves", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
            });

            game.update(0.1);

            expect(game.player.x).toBe(112);
            expect(light.elapsedTime).toBeCloseTo(0.1);
        });

        it("should update lighting when player movement is blocked", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            game.world.canMoveTo.mockReturnValue(false);

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
            });

            game.update(0.1);

            expect(game.player.x).toBe(100);
            expect(light.elapsedTime).toBeCloseTo(0.1);
        });

        it("should preserve registered light instances", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            game.update(0.1);
            game.update(0.1);

            expect(game.lightingSystem.lightSources[0])
                .toBe(light);
        });

        it("should not duplicate lights during game updates", () => {
            game.lightingSystem.addLight(200, 150);

            for (let frame = 0; frame < 10; frame++) {
                game.update(0.1);
            }

            expect(game.lightingSystem.lightSources)
                .toHaveLength(1);
        });
    });

    describe("Weather-dependent lighting", () => {
        it.each([
            [WeatherType.CLEAR, 0.05],
            [WeatherType.LIGHT_SNOW, 0.10],
            [WeatherType.SNOWFALL, 0.15],
            [WeatherType.HEAVY_SNOW, 0.25],
            [WeatherType.BLIZZARD, 0.40]
        ])(
            "should adapt ambient lighting to weather %s",
            (weather, expectedOpacity) => {
                game.weatherSystem.setWeather(weather, 0);

                game.updateLighting(5);

                expect(game.lightingSystem.ambientLight.opacity)
                    .toBeCloseTo(expectedOpacity);
            }
        );

        it("should gradually darken the world during a blizzard", () => {
            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.updateLighting(2.5);

            expect(game.lightingSystem.ambientLight.opacity)
                .toBeCloseTo(0.275);
        });

        it("should gradually restore clear weather lighting", () => {
            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.updateLighting(5);

            game.weatherSystem.setWeather(
                WeatherType.CLEAR, 0
            );

            game.updateLighting(2.5);

            expect(game.lightingSystem.ambientLight.opacity)
                .toBeCloseTo(0.225);
        });

        it("should not restart lighting transitions every frame", () => {
            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            for (let frame = 0; frame < 10; frame++) {
                game.updateLighting(0.5);
            }

            expect(game.lightingSystem.ambientLight.opacity)
                .toBeCloseTo(0.40);

            expect(
                game.lightingSystem.ambientLight.isTransitioning
            ).toBe(false);
        });

        it("should preserve individual light intensity during weather changes", () => {
            const light = game.lightingSystem.addLight(
                200, 150, 64, 0.7
            );

            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.updateLighting(5);

            expect(light.intensity)
                .toBe(0.7);
        });

        it("should preserve individual light colors during weather changes", () => {
            const light = game.lightingSystem.addLight(
                200, 150, 64, 0.7, "#80dfff"
            );

            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.updateLighting(5);

            expect(light.color)
                .toBe("#80dfff");
        });
    });

    describe("Dynamic light sources", () => {
        it("should update flickering during game updates", () => {
            const light = game.lightingSystem.addLight(
                200, 150, 64, 0.5
            );

            light.setFlickerEnabled(true);
            light.setFlickerAmplitude(0.2);
            light.setFlickerFrequency(1);

            game.update(0.25);

            expect(light.getEffectiveIntensity())
                .toBeCloseTo(0.7);
        });

        it("should preserve static light positions during player movement", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
                game.player.y += 12;
            });

            game.update(0.1);

            expect(light.x).toBe(200);
            expect(light.y).toBe(150);
        });

        it("should update multiple light sources simultaneously", () => {
            const first = game.lightingSystem.addLight(
                200, 150
            );

            const second = game.lightingSystem.addLight(
                300, 250
            );

            game.update(0.5);

            expect(first.elapsedTime).toBeCloseTo(0.5);
            expect(second.elapsedTime).toBeCloseTo(0.5);
        });

        it("should update off-screen lights", () => {
            const light = game.lightingSystem.addLight(
                900, 900
            );

            game.update(0.5);

            expect(light.elapsedTime)
                .toBeCloseTo(0.5);
        });
    });

    describe("Camera integration", () => {
        it("should render visible world lights", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            const spy = vi.spyOn(light, "draw");

            game.draw();

            expect(spy)
                .toHaveBeenCalledWith(game.ctx);
        });

        it("should skip lights outside the viewport", () => {
            const light = game.lightingSystem.addLight(
                900, 900
            );

            const spy = vi.spyOn(light, "draw");

            game.draw();

            expect(spy)
                .not.toHaveBeenCalled();
        });

        it("should render partially visible lights", () => {
            const light = game.lightingSystem.addLight(
                500, 150, 64
            );

            const spy = vi.spyOn(light, "draw");

            game.draw();

            expect(spy)
                .toHaveBeenCalled();
        });

        it("should render lights when the camera moves into range", () => {
            const light = game.lightingSystem.addLight(
                800, 200
            );

            const spy = vi.spyOn(light, "draw");

            game.draw();

            expect(spy)
                .not.toHaveBeenCalled();

            game.camera.x = 500;

            game.draw();

            expect(spy)
                .toHaveBeenCalledTimes(1);
        });

        it("should preserve light world coordinates during camera movement", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            game.camera.x = 50;
            game.camera.y = 25;

            game.draw();

            expect(light.x).toBe(200);
            expect(light.y).toBe(150);
        });

        it("should forward the camera and viewport dimensions", () => {
            const spy = vi.spyOn(
                game.lightingSystem,
                "draw"
            );

            game.draw();

            expect(spy).toHaveBeenCalledWith(
                game.ctx,
                game.canvas.width,
                game.canvas.height,
                game.camera
            );
        });
    });

    describe("Shadow and lighting integration", () => {
        it("should update shadows and lighting simultaneously", () => {
            const shadowSpy = vi.spyOn(
                game.shadowSystem,
                "updatePlayerShadow"
            );

            const lightingSpy = vi.spyOn(
                game.lightingSystem,
                "update"
            );

            game.update(0.1);

            expect(shadowSpy)
                .toHaveBeenCalledWith(game.player);

            expect(lightingSpy)
                .toHaveBeenCalledWith(0.1);
        });

        it("should reduce shadow visibility while darkening ambient lighting", () => {
            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.updateShadows();
            game.updateLighting(5);

            expect(
                game.shadowSystem.playerShadow
                    .getEffectiveOpacity()
            ).toBeCloseTo(0.105);

            expect(
                game.lightingSystem.ambientLight.opacity
            ).toBeCloseTo(0.40);
        });

        it("should preserve environment shadows during lighting updates", () => {
            const shadow = game.shadowSystem.addStaticShadow(
                200, 150
            );

            game.lightingSystem.addLight(
                200, 150
            );

            game.update(0.1);

            expect(game.shadowSystem.staticShadows)
                .toContain(shadow);

            expect(shadow.x).toBe(200);
            expect(shadow.y).toBe(150);
        });

        it("should support lighting without shadow rendering", () => {
            game.shadowSystem.setEnabled(false);

            const light = game.lightingSystem.addLight(
                200, 150
            );

            const spy = vi.spyOn(light, "draw");

            game.draw();

            expect(spy)
                .toHaveBeenCalled();
        });

        it("should preserve shadow rendering when lighting is disabled", () => {
            game.lightingSystem.setEnabled(false);

            const spy = vi.spyOn(
                game.shadowSystem.playerShadow,
                "draw"
            );

            game.draw();

            expect(spy)
                .toHaveBeenCalled();
        });
    });

    describe("Rendering order", () => {
        it("should render lighting above the player", () => {
            const order = [];

            game.player.draw.mockImplementation(() => {
                order.push("player");
            });

            vi.spyOn(game.lightingSystem, "draw")
                .mockImplementation(() => {
                    order.push("lighting");
                });

            game.draw();

            expect(order).toEqual([
                "player",
                "lighting"
            ]);
        });

        it("should render weather effects above lighting", () => {
            const order = [];

            vi.spyOn(game.lightingSystem, "draw")
                .mockImplementation(() => {
                    order.push("lighting");
                });

            game.weatherOverlay.draw.mockImplementation(() => {
                order.push("overlay");
            });

            game.snowSystem.draw.mockImplementation(() => {
                order.push("snow");
            });

            game.draw();

            expect(order).toEqual([
                "lighting",
                "overlay",
                "snow"
            ]);
        });

        it("should preserve the complete rendering order", () => {
            const order = [];

            game.world.renderGround.mockImplementation(() => {
                order.push("ground");
            });

            vi.spyOn(game.footprintSystem, "draw")
                .mockImplementation(() => {
                    order.push("footprints");
                });

            vi.spyOn(game.shadowSystem, "draw")
                .mockImplementation(() => {
                    order.push("shadows");
                });

            game.world.getRenderables.mockReturnValue([
                {
                    depth: 40,
                    draw: () => order.push("environment")
                }
            ]);

            game.player.draw.mockImplementation(() => {
                order.push("player");
            });

            vi.spyOn(game.lightingSystem.ambientLight, "draw")
                .mockImplementation(() => {
                    order.push("ambient");
                });

            const light = game.lightingSystem.addLight(
                200, 150
            );

            vi.spyOn(light, "draw")
                .mockImplementation(() => {
                    order.push("light");
                });

            game.weatherOverlay.draw.mockImplementation(() => {
                order.push("overlay");
            });

            game.snowSystem.draw.mockImplementation(() => {
                order.push("snow");
            });

            game.draw();

            expect(order).toEqual([
                "ground",
                "footprints",
                "shadows",
                "environment",
                "player",
                "ambient",
                "light",
                "overlay",
                "snow"
            ]);
        });
    });

    describe("Lighting configuration", () => {
        it("should skip ambient rendering when lighting is disabled", () => {
            const spy = vi.spyOn(
                game.lightingSystem.ambientLight,
                "draw"
            );

            game.lightingSystem.setEnabled(false);

            game.draw();

            expect(spy)
                .not.toHaveBeenCalled();
        });

        it("should skip individual lights when lighting is disabled", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            const spy = vi.spyOn(light, "draw");

            game.lightingSystem.setEnabled(false);

            game.draw();

            expect(spy)
                .not.toHaveBeenCalled();
        });

        it("should continue updating lights while rendering is disabled", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            game.lightingSystem.setEnabled(false);

            game.update(0.5);

            expect(light.elapsedTime)
                .toBeCloseTo(0.5);
        });

        it("should resume lighting after being enabled", () => {
            const light = game.lightingSystem.addLight(
                200, 150
            );

            const spy = vi.spyOn(light, "draw");

            game.lightingSystem.setEnabled(false);
            game.draw();

            game.lightingSystem.setEnabled(true);
            game.draw();

            expect(spy)
                .toHaveBeenCalledTimes(1);
        });

        it("should preserve other game systems when clearing lights", () => {
            const shadow = game.shadowSystem.playerShadow;

            game.lightingSystem.addLight(
                200, 150
            );

            game.lightingSystem.clearLights();

            expect(game.lightingSystem.lightSources)
                .toHaveLength(0);

            expect(game.shadowSystem.playerShadow)
                .toBe(shadow);

            expect(game.footprintSystem)
                .toBeInstanceOf(SnowFootprintSystem);
        });
    });
});
