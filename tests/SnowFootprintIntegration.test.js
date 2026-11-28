
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Game } from "../src/core/Game.js";
import { SnowFootprintSystem } from "../src/effects/SnowFootprintSystem.js";
import { SnowFootprint } from "../src/effects/SnowFootprint.js";
import { WeatherSystem } from "../src/weather/WeatherSystem.js";
import { WeatherType } from "../src/weather/WeatherType.js";

describe("Snow footprint integration", () => {
    let game;

    beforeEach(() => {
        // Create a game instance without browser dependencies
        game = Object.create(Game.prototype);

       // Mock the shadow system to isolate footprint integration tests
game.shadowSystem = {
    updatePlayerShadow: vi.fn(),
    setWeatherVisibility: vi.fn(),
    draw: vi.fn()
};

// Mock lighting dependencies
game.lightingSystem = {
    setWeather: vi.fn(),
    update: vi.fn(),
    draw: vi.fn()
};

        // Initialize the real footprint and weather systems
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

        game.ctx = {
            clearRect: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            fillRect: vi.fn(),
            globalAlpha: 1,
            fillStyle: ""
        };
    });

    describe("Player movement integration", () => {
        it("should create footprints when the player moves", () => {
            game.player.y = 62;

            game.updateFootprints(100, 50, 0.1);

            expect(game.footprintSystem.footprints)
                .toHaveLength(1);
        });

        it("should create real SnowFootprint instances", () => {
            game.player.y = 62;

            game.updateFootprints(100, 50, 0.1);

            expect(game.footprintSystem.footprints[0])
                .toBeInstanceOf(SnowFootprint);
        });

        it("should not create footprints while stationary", () => {
            game.updateFootprints(100, 50, 1);

            expect(game.footprintSystem.footprints)
                .toHaveLength(0);
        });

        it("should accumulate movement across game updates", () => {
            game.player.y = 56;
            game.updateFootprints(100, 50, 0.1);

            game.player.y = 62;
            game.updateFootprints(100, 56, 0.1);

            expect(game.footprintSystem.footprints)
                .toHaveLength(1);
        });

        it("should create multiple footprints during longer movements", () => {
            game.player.y = 86;

            game.updateFootprints(100, 50, 0.3);

            expect(game.footprintSystem.footprints)
                .toHaveLength(3);
        });

        it("should alternate between left and right footprints", () => {
            game.player.y = 86;

            game.updateFootprints(100, 50, 0.3);

            expect(
                game.footprintSystem.footprints.map(
                    footprint => footprint.foot
                )
            ).toEqual(["left", "right", "left"]);
        });

        it("should create footprints through the game update method", () => {
            game.player.update.mockImplementation(() => {
                game.player.y += 12;
            });

            game.update(0.1);

            expect(game.footprintSystem.footprints)
                .toHaveLength(1);
        });
    });

    describe("Ground contact positioning", () => {
        it("should place footprints at the player's feet", () => {
            game.player.y = 62;

            game.updateFootprints(100, 50, 0.1);

            const footprint =
                game.footprintSystem.footprints[0];

            expect(footprint.x).toBe(120);
            expect(footprint.y).toBe(92);
        });

        it("should use actual movement instead of sprite direction", () => {
            game.player.direction = "up";
            game.player.x = 112;

            game.updateFootprints(100, 50, 0.1);

            expect(
                game.footprintSystem.footprints[0].direction
            ).toBe("right");
        });

        it.each([
            [112, 50, "right"],
            [88, 50, "left"],
            [100, 38, "up"],
            [100, 62, "down"]
        ])(
            "should determine movement direction at (%s, %s)",
            (x, y, expectedDirection) => {
                game.player.x = x;
                game.player.y = y;

                game.updateFootprints(100, 50, 0.1);

                expect(
                    game.footprintSystem.footprints[0].direction
                ).toBe(expectedDirection);
            }
        );
    });

    describe("Collision integration", () => {
        it("should not create footprints when movement is blocked", () => {
            game.world.canMoveTo.mockReturnValue(false);

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
                game.player.y += 12;
            });

            game.update(0.1);

            expect(game.player.x).toBe(100);
            expect(game.player.y).toBe(50);

            expect(game.footprintSystem.footprints)
                .toHaveLength(0);
        });

        it("should create footprints along successful movement", () => {
            game.world.canMoveTo.mockReturnValue(true);

            game.player.update.mockImplementation(() => {
                game.player.x += 12;
            });

            game.update(0.1);

            expect(game.player.x).toBe(112);

            expect(game.footprintSystem.footprints)
                .toHaveLength(1);
        });

        it("should respect horizontal collision during diagonal movement", () => {
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

            expect(game.footprintSystem.footprints)
                .toHaveLength(1);

            expect(
                game.footprintSystem.footprints[0].direction
            ).toBe("down");
        });

        it("should respect vertical collision during diagonal movement", () => {
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

            expect(
                game.footprintSystem.footprints[0].direction
            ).toBe("right");
        });
    });

    describe("Weather integration", () => {
        beforeEach(() => {
            game.footprintSystem.addFootprint(
                100, 50, "down"
            );
        });

        it("should fade footprints during normal snowfall", () => {
            game.updateFootprints(100, 50, 10);

            expect(
                game.footprintSystem.footprints[0].opacity
            ).toBeCloseTo(5 / 6);
        });

        it("should fade footprints more slowly during clear weather", () => {
            game.weatherSystem.setWeather(
                WeatherType.CLEAR, 0
            );

            game.updateFootprints(100, 50, 30);

            expect(
                game.footprintSystem.footprints[0].opacity
            ).toBeCloseTo(5 / 6);
        });

        it("should fade footprints faster during heavy snowfall", () => {
            game.weatherSystem.setWeather(
                WeatherType.HEAVY_SNOW, 0
            );

            game.updateFootprints(100, 50, 10);

            expect(
                game.footprintSystem.footprints[0].opacity
            ).toBeCloseTo(2 / 3);
        });

        it("should remove footprints during a blizzard", () => {
            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.updateFootprints(100, 50, 10);

            expect(game.footprintSystem.footprints)
                .toHaveLength(0);
        });

        it("should accumulate fading across weather changes", () => {
            game.updateFootprints(100, 50, 10);

            game.weatherSystem.setWeather(
                WeatherType.HEAVY_SNOW, 0
            );

            game.updateFootprints(100, 50, 10);

            expect(
                game.footprintSystem.footprints[0].opacity
            ).toBeCloseTo(0.5);
        });

        it("should not restore opacity when weather improves", () => {
            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD, 0
            );

            game.updateFootprints(100, 50, 5);

            const previousOpacity =
                game.footprintSystem.footprints[0].opacity;

            game.weatherSystem.setWeather(
                WeatherType.CLEAR, 0
            );

            game.updateFootprints(100, 50, 5);

            expect(
                game.footprintSystem.footprints[0].opacity
            ).toBeLessThan(previousOpacity);
        });

        it("should continue fading while the player is stationary", () => {
            game.updateFootprints(100, 50, 30);

            expect(
                game.footprintSystem.footprints[0].opacity
            ).toBeCloseTo(0.5);
        });

        it("should respond to gradual weather transitions", () => {
            game.weatherSystem.setWeather(
                WeatherType.HEAVY_SNOW, 10
            );

            game.weatherSystem.update(5);

            expect(game.weatherSystem.intensity).toBe(150);

            game.updateFootprints(100, 50, 10);

            expect(
                game.footprintSystem.footprints[0].opacity
            ).toBeCloseTo(0.75);
        });
    });

    describe("Camera integration", () => {
        it("should preserve footprint world coordinates when the camera moves", () => {
            game.footprintSystem.addFootprint(
                200, 200, "down"
            );

            const footprint =
                game.footprintSystem.footprints[0];

            const originalX = footprint.x;
            const originalY = footprint.y;

            game.camera.x = 100;
            game.camera.y = 100;

            game.draw();

            expect(footprint.x).toBe(originalX);
            expect(footprint.y).toBe(originalY);
        });

        it("should render visible footprints", () => {
            game.footprintSystem.addFootprint(
                200, 200, "down"
            );

            const spy = vi.spyOn(
                game.footprintSystem.footprints[0],
                "draw"
            );

            game.draw();

            expect(spy).toHaveBeenCalledWith(game.ctx);
        });

        it("should not render footprints outside the viewport", () => {
            game.footprintSystem.addFootprint(
                700, 600, "down"
            );

            const spy = vi.spyOn(
                game.footprintSystem.footprints[0],
                "draw"
            );

            game.draw();

            expect(spy).not.toHaveBeenCalled();
        });

        it("should continue aging footprints outside the viewport", () => {
            game.footprintSystem.addFootprint(
                700, 600, "down"
            );

            game.updateFootprints(100, 50, 10);

            expect(
                game.footprintSystem.footprints[0].age
            ).toBe(10);
        });
    });

    describe("Rendering order", () => {
        it("should render footprints above ground tiles", () => {
            const order = [];

            game.world.renderGround.mockImplementation(() => {
                order.push("ground");
            });

            vi.spyOn(
                game.footprintSystem, "draw"
            ).mockImplementation(() => {
                order.push("footprints");
            });

            game.draw();

            expect(order).toEqual([
                "ground",
                "footprints"
            ]);
        });

        it("should render footprints beneath world objects and the player", () => {
            const order = [];

            vi.spyOn(
                game.footprintSystem, "draw"
            ).mockImplementation(() => {
                order.push("footprints");
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
                "footprints",
                "environment",
                "player"
            ]);
        });

        it("should render weather effects above footprints", () => {
            const order = [];

            vi.spyOn(
                game.footprintSystem, "draw"
            ).mockImplementation(() => {
                order.push("footprints");
            });

            game.weatherOverlay.draw.mockImplementation(() => {
                order.push("overlay");
            });

            game.snowSystem.draw.mockImplementation(() => {
                order.push("snow");
            });

            game.draw();

            expect(order).toEqual([
                "footprints",
                "overlay",
                "snow"
            ]);
        });
    });

    describe("Time handling", () => {
        it("should ignore zero delta time", () => {
            game.player.y = 62;

            game.updateFootprints(100, 50, 0);

            expect(game.footprintSystem.footprints)
                .toHaveLength(0);
        });

        it("should ignore negative delta time", () => {
            game.player.y = 62;

            game.updateFootprints(100, 50, -1);

            expect(game.footprintSystem.footprints)
                .toHaveLength(0);
        });

        it("should ignore invalid delta time", () => {
            game.player.y = 62;

            game.updateFootprints(100, 50, NaN);
            game.updateFootprints(100, 50, Infinity);

            expect(game.footprintSystem.footprints)
                .toHaveLength(0);
        });
    });
});
