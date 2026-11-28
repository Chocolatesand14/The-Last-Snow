
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Game } from "../src/core/Game.js";
import { Shadow } from "../src/lighting/Shadow.js";
import { ShadowSystem } from "../src/lighting/ShadowSystem.js";
import { SnowFootprintSystem } from "../src/effects/SnowFootprintSystem.js";
import { WeatherSystem } from "../src/weather/WeatherSystem.js";
import { WeatherType } from "../src/weather/WeatherType.js";
import { TileMap } from "../src/world/TileMap.js";

describe("Shadow integration", () => {
    let game;

    beforeEach(() => {
        // Create a game instance without browser dependencies
        game = Object.create(Game.prototype);

        // Initialize real game systems
        game.shadowSystem = new ShadowSystem();

        game.footprintSystem = new SnowFootprintSystem(
            12, 4, 60
        );

        game.weatherSystem = new WeatherSystem(
            WeatherType.SNOWFALL
        );

        // Create a controlled player instance
        game.player = {
            x: 100,
            y: 50,
            width: 32,
            height: 32,
            direction: "down",
            update: vi.fn(),
            draw: vi.fn()
        };

        // Initialize the player shadow
        game.shadowSystem.createPlayerShadow(
            game.player
        );

        game.shadowSystem.setWeatherVisibility(
            game.weatherSystem.visibility
        );

        // Create a controlled camera
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

        // Mock the canvas rendering context
        game.ctx = {
            clearRect: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            scale: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            fillRect: vi.fn(),
            createRadialGradient: vi.fn(() => ({
                addColorStop: vi.fn()
            })),
            globalAlpha: 1,
            fillStyle: ""
        };
    });

    describe("Shadow initialization", () => {
        it("should initialize a real player shadow", () => {
            expect(game.shadowSystem.playerShadow)
                .toBeInstanceOf(Shadow);
        });

        it("should position the shadow beneath the player", () => {
            expect(game.shadowSystem.playerShadow.x)
                .toBe(116);

            expect(game.shadowSystem.playerShadow.y)
                .toBe(80);
        });

        it("should initialize with the current weather visibility", () => {
            expect(game.shadowSystem.weatherVisibility)
                .toBe(0.85);
        });

        it("should initialize with weather-dependent opacity", () => {
            expect(
                game.shadowSystem.playerShadow
                    .getEffectiveOpacity()
            ).toBeCloseTo(0.255);
        });
    });

    describe("Player movement integration", () => {
        it.each([
            [12, 0],
            [-12, 0],
            [0, 12],
            [0, -12],
            [12, 12],
            [-12, -12],
            [-12, 12],
            [12, -12]
        ])(
            "should follow player movement (%s, %s)",
            (deltaX, deltaY) => {
                game.player.update.mockImplementation(() => {
                    game.player.x += deltaX;
                    game.player.y += deltaY;
                });

                game.update(0.1);

                expect(game.shadowSystem.playerShadow.x)
                    .toBe(116 + deltaX);

                expect(game.shadowSystem.playerShadow.y)
                    .toBe(80 + deltaY);
            }
        );

        it("should preserve the shadow position while stationary", () => {
            game.update(0.1);

            expect(game.shadowSystem.playerShadow.x)
                .toBe(116);

            expect(game.shadowSystem.playerShadow.y)
                .toBe(80);
        });

        it("should reuse the existing player shadow", () => {
            const originalShadow =
                game.shadowSystem.playerShadow;

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
            });

            game.update(0.1);
            game.update(0.1);

            expect(game.shadowSystem.playerShadow)
                .toBe(originalShadow);
        });

        it("should preserve shadow dimensions during movement", () => {
            game.player.update.mockImplementation(() => {
                game.player.y += 12;
            });

            game.update(0.1);

            expect(game.shadowSystem.playerShadow.width)
                .toBe(24);

            expect(game.shadowSystem.playerShadow.height)
                .toBe(10);
        });

        it("should follow fractional player coordinates", () => {
            game.player.update.mockImplementation(() => {
                game.player.x += 2.5;
                game.player.y += 1.5;
            });

            game.update(0.1);

            expect(game.shadowSystem.playerShadow.x)
                .toBeCloseTo(118.5);

            expect(game.shadowSystem.playerShadow.y)
                .toBeCloseTo(81.5);
        });
    });

    describe("Collision integration", () => {
        it("should preserve shadow position when movement is blocked", () => {
            game.world.canMoveTo.mockReturnValue(false);

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
                game.player.y += 12;
            });

            game.update(0.1);

            expect(game.player.x).toBe(100);
            expect(game.player.y).toBe(50);

            expect(game.shadowSystem.playerShadow.x)
                .toBe(116);

            expect(game.shadowSystem.playerShadow.y)
                .toBe(80);
        });

        it("should follow successful movement after collision handling", () => {
            game.player.update.mockImplementation(() => {
                game.player.x += 12;
            });

            game.update(0.1);

            expect(game.player.x).toBe(112);

            expect(game.shadowSystem.playerShadow.x)
                .toBe(128);
        });

        it("should respect horizontal collisions", () => {
            game.world.canMoveTo
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
                game.player.y += 12;
            });

            game.update(0.1);

            expect(game.player.x).toBe(100);
            expect(game.player.y).toBe(62);

            expect(game.shadowSystem.playerShadow.x)
                .toBe(116);

            expect(game.shadowSystem.playerShadow.y)
                .toBe(92);
        });

        it("should respect vertical collisions", () => {
            game.world.canMoveTo
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
                game.player.y += 12;
            });

            game.update(0.1);

            expect(game.player.x).toBe(112);
            expect(game.player.y).toBe(50);

            expect(game.shadowSystem.playerShadow.x)
                .toBe(128);

            expect(game.shadowSystem.playerShadow.y)
                .toBe(80);
        });
    });

    describe("Static shadow integration", () => {
        beforeEach(() => {
            game.shadowSystem.addStaticShadow(
                200, 150, 42, 16, 0.3
            );

            game.shadowSystem.addStaticShadow(
                300, 250, 24, 10, 0.25
            );
        });

        it("should preserve environment shadow positions during player movement", () => {
            const originalPositions =
                game.shadowSystem.staticShadows.map(
                    shadow => ({
                        x: shadow.x,
                        y: shadow.y
                    })
                );

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
                game.player.y += 12;
            });

            game.update(0.1);

            expect(
                game.shadowSystem.staticShadows.map(
                    shadow => ({
                        x: shadow.x,
                        y: shadow.y
                    })
                )
            ).toEqual(originalPositions);
        });

        it("should preserve environment shadow instances", () => {
            const originalShadows = [
                ...game.shadowSystem.staticShadows
            ];

            game.update(0.1);

            game.shadowSystem.staticShadows.forEach(
                (shadow, index) => {
                    expect(shadow)
                        .toBe(originalShadows[index]);
                }
            );
        });

        it("should not duplicate static shadows during game updates", () => {
            for (let frame = 0; frame < 10; frame++) {
                game.update(0.1);
            }

            expect(game.shadowSystem.staticShadows)
                .toHaveLength(2);
        });

        it("should register real map shadows without removing the player shadow", () => {
            const world = new TileMap({
                tileSize: 32,
                spawnPoint: { x: 32, y: 32 },
                tiles: [
                    [1, 1, 1],
                    [1, 0, 3],
                    [1, 2, 1]
                ]
            });

            world.decorationLayer.decorations = [];

            const playerShadow =
                game.shadowSystem.playerShadow;

            world.registerStaticShadows(
                game.shadowSystem
            );

            expect(game.shadowSystem.staticShadows)
                .toHaveLength(7);

            expect(game.shadowSystem.playerShadow)
                .toBe(playerShadow);
        });
    });

    describe("Weather integration", () => {
        it.each([
            [WeatherType.CLEAR, 1, 0.3],
            [WeatherType.LIGHT_SNOW, 0.95, 0.285],
            [WeatherType.SNOWFALL, 0.85, 0.255],
            [WeatherType.HEAVY_SNOW, 0.65, 0.195],
            [WeatherType.BLIZZARD, 0.35, 0.105]
        ])(
            "should update player shadows during %s",
            (weather, visibility, opacity) => {
                game.weatherSystem.setWeather(
                    weather, 0
                );

                game.updateShadows();

                expect(game.shadowSystem.weatherVisibility)
                    .toBeCloseTo(visibility);

                expect(
                    game.shadowSystem.playerShadow
                        .getEffectiveOpacity()
                ).toBeCloseTo(opacity);
            }
        );

        it("should update environment shadows with the current weather", () => {
            const shadow =
                game.shadowSystem.addStaticShadow(
                    200, 150, 42, 16, 0.3
                );

            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.updateShadows();

            expect(shadow.getEffectiveOpacity())
                .toBeCloseTo(0.105);
        });

        it("should restore shadow strength when weather improves", () => {
            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.updateShadows();

            game.weatherSystem.setWeather(
                WeatherType.CLEAR, 0
            );

            game.updateShadows();

            expect(
                game.shadowSystem.playerShadow
                    .getEffectiveOpacity()
            ).toBeCloseTo(0.3);
        });

        it("should preserve original opacity during weather changes", () => {
            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.updateShadows();

            expect(game.shadowSystem.playerShadow.opacity)
                .toBe(0.3);
        });

        it("should respond to gradual weather transitions", () => {
            game.weatherSystem.setWeather(
                WeatherType.HEAVY_SNOW, 10
            );

            game.weatherSystem.update(5);

            game.updateShadows();

            expect(game.shadowSystem.weatherVisibility)
                .toBeCloseTo(0.75);

            expect(
                game.shadowSystem.playerShadow
                    .getEffectiveOpacity()
            ).toBeCloseTo(0.225);
        });

        it("should update shadows while the player is stationary", () => {
            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.update(0.1);

            expect(
                game.shadowSystem.playerShadow
                    .getEffectiveOpacity()
            ).toBeCloseTo(0.105);
        });
    });

    describe("Camera integration", () => {
        it("should preserve player shadow world coordinates", () => {
            const shadow =
                game.shadowSystem.playerShadow;

            const originalX = shadow.x;
            const originalY = shadow.y;

            game.camera.x = 50;
            game.camera.y = 25;

            game.draw();

            expect(shadow.x).toBe(originalX);
            expect(shadow.y).toBe(originalY);
        });

        it("should render a visible player shadow", () => {
            const spy = vi.spyOn(
                game.shadowSystem.playerShadow,
                "draw"
            );

            game.draw();

            expect(spy)
                .toHaveBeenCalledWith(game.ctx);
        });

        it("should skip player shadows outside the viewport", () => {
            game.camera.x = 500;
            game.camera.y = 500;

            const spy = vi.spyOn(
                game.shadowSystem.playerShadow,
                "draw"
            );

            game.draw();

            expect(spy).not.toHaveBeenCalled();
        });

        it("should render visible environment shadows", () => {
            const shadow =
                game.shadowSystem.addStaticShadow(
                    200, 200
                );

            const spy = vi.spyOn(shadow, "draw");

            game.draw();

            expect(spy)
                .toHaveBeenCalledWith(game.ctx);
        });

        it("should skip environment shadows outside the viewport", () => {
            const shadow =
                game.shadowSystem.addStaticShadow(
                    800, 600
                );

            const spy = vi.spyOn(shadow, "draw");

            game.draw();

            expect(spy).not.toHaveBeenCalled();
        });

        it("should render partially visible shadows", () => {
            const shadow =
                game.shadowSystem.addStaticShadow(
                    485, 200, 24, 10
                );

            const spy = vi.spyOn(shadow, "draw");

            game.draw();

            expect(spy)
                .toHaveBeenCalledWith(game.ctx);
        });

        it("should apply rounded camera coordinates during rendering", () => {
            game.camera.x = 32.6;
            game.camera.y = 16.4;

            game.draw();

            expect(game.ctx.translate)
                .toHaveBeenCalledWith(-33, -16);
        });
    });

    describe("Rendering order", () => {
        it("should render shadows above ground and footprints", () => {
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

            game.draw();

            expect(order).toEqual([
                "ground",
                "footprints",
                "shadows"
            ]);
        });

        it("should render shadows beneath the player and environment objects", () => {
            const order = [];

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

            game.draw();

            expect(order).toEqual([
                "shadows",
                "environment",
                "player"
            ]);
        });

        it("should render weather effects above shadows", () => {
            const order = [];

            vi.spyOn(game.shadowSystem, "draw")
                .mockImplementation(() => {
                    order.push("shadows");
                });

            game.weatherOverlay.draw.mockImplementation(() => {
                order.push("overlay");
            });

            game.snowSystem.draw.mockImplementation(() => {
                order.push("snow");
            });

            game.draw();

            expect(order).toEqual([
                "shadows",
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
                "overlay",
                "snow"
            ]);
        });

        it("should forward the rendering context and camera", () => {
            const spy = vi.spyOn(
                game.shadowSystem, "draw"
            );

            game.draw();

            expect(spy).toHaveBeenCalledWith(
                game.ctx,
                game.camera
            );
        });
    });

    describe("Footprint and shadow integration", () => {
        it("should create footprints while moving the player shadow", () => {
            game.player.update.mockImplementation(() => {
                game.player.y += 12;
            });

            game.update(0.1);

            expect(game.footprintSystem.footprints)
                .toHaveLength(1);

            expect(game.shadowSystem.playerShadow.y)
                .toBe(92);
        });

        it("should preserve existing footprints while the shadow follows the player", () => {
            game.player.update.mockImplementation(() => {
                game.player.y += 12;
            });

            game.update(0.1);

            const footprint =
                game.footprintSystem.footprints[0];

            const originalX = footprint.x;
            const originalY = footprint.y;

            game.update(0.1);

            expect(footprint.x).toBe(originalX);
            expect(footprint.y).toBe(originalY);

            expect(game.shadowSystem.playerShadow.y)
                .toBe(104);
        });

        it("should prevent both footprint creation and shadow movement during collisions", () => {
            game.world.canMoveTo.mockReturnValue(false);

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
            });

            game.update(0.1);

            expect(game.footprintSystem.footprints)
                .toHaveLength(0);

            expect(game.shadowSystem.playerShadow.x)
                .toBe(116);
        });

        it("should fade footprints and reduce shadow opacity during a blizzard", () => {
            game.footprintSystem.addFootprint(
                100, 50, "down"
            );

            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.update(5);

            expect(
                game.footprintSystem.footprints[0].opacity
            ).toBeCloseTo(0.5);

            expect(
                game.shadowSystem.playerShadow
                    .getEffectiveOpacity()
            ).toBeCloseTo(0.105);
        });

        it("should remove expired footprints without removing the player shadow", () => {
            game.footprintSystem.addFootprint(
                100, 50, "down"
            );

            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.update(10);

            expect(game.footprintSystem.footprints)
                .toHaveLength(0);

            expect(game.shadowSystem.playerShadow)
                .toBeInstanceOf(Shadow);
        });
    });

    describe("System configuration", () => {
        it("should skip shadow rendering when disabled", () => {
            const spy = vi.spyOn(
                game.shadowSystem.playerShadow,
                "draw"
            );

            game.shadowSystem.setEnabled(false);

            game.draw();

            expect(spy).not.toHaveBeenCalled();
        });

        it("should continue rendering the player when shadows are disabled", () => {
            game.shadowSystem.setEnabled(false);

            game.draw();

            expect(game.player.draw)
                .toHaveBeenCalledWith(game.ctx);
        });

        it("should continue updating shadow positions when disabled", () => {
            game.shadowSystem.setEnabled(false);

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
            });

            game.update(0.1);

            expect(game.shadowSystem.playerShadow.x)
                .toBe(128);
        });

        it("should resume shadow rendering when enabled again", () => {
            const spy = vi.spyOn(
                game.shadowSystem.playerShadow,
                "draw"
            );

            game.shadowSystem.setEnabled(false);
            game.draw();

            game.shadowSystem.setEnabled(true);
            game.draw();

            expect(spy).toHaveBeenCalledTimes(1);
        });
    });
});
