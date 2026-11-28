
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

import { Game } from "../src/core/Game.js";
import { Input } from "../src/core/Input.js";
import { Camera } from "../src/core/Camera.js";
import { Player } from "../src/entities/Player.js";
import { TileMap } from "../src/world/TileMap.js";
import { SnowyForest } from "../src/world/maps/SnowyForest.js";

import { SnowParticleSystem } from "../src/effects/SnowParticleSystem.js";
import { SnowFootprintSystem } from "../src/effects/SnowFootprintSystem.js";
import { WeatherOverlay } from "../src/effects/WeatherOverlay.js";

import { WeatherType } from "../src/weather/WeatherType.js";
import { WeatherSystem } from "../src/weather/WeatherSystem.js";
import { WeatherController } from "../src/weather/WeatherController.js";
import { WindSystem } from "../src/weather/WindSystem.js";

import { ShadowSystem } from "../src/lighting/ShadowSystem.js";
import { LightingSystem } from "../src/lighting/LightingSystem.js";

describe("Game lifecycle", () => {
    let game;
    let canvas;
    let ctx;
    let requestFrame;
    let mockWindow;

    beforeEach(() => {
        // Mock browser keyboard event registration
        mockWindow = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };

        vi.stubGlobal("window", mockWindow);

        // Mock browser image loading
        vi.stubGlobal("Image", class {
            constructor() {
                this.src = "";
                this.complete = false;
                this.naturalWidth = 0;
                this.naturalHeight = 0;
            }
        });

        // Mock animation frame scheduling
        requestFrame = vi.fn(() => 1);

        vi.stubGlobal(
            "requestAnimationFrame",
            requestFrame
        );

        // Mock the canvas rendering context
        ctx = {
            clearRect: vi.fn(),
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            drawImage: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            scale: vi.fn(),
            setTransform: vi.fn(),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),

            createRadialGradient: vi.fn(() => ({
                addColorStop: vi.fn()
            })),

            imageSmoothingEnabled: true,
            globalAlpha: 1,
            globalCompositeOperation: "source-over",
            fillStyle: "",
            strokeStyle: ""
        };

        // Create a controlled canvas instance
        canvas = {
            width: 0,
            height: 0,
            getContext: vi.fn(() => ctx)
        };

        // Initialize the real game
        game = new Game(canvas);
    });

    afterEach(() => {
        // Restore mocks and browser globals
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("Canvas initialization", () => {
        it("should preserve the provided canvas", () => {
            expect(game.canvas).toBe(canvas);
        });

        it("should request a 2D rendering context", () => {
            expect(canvas.getContext)
                .toHaveBeenCalledWith("2d");
        });

        it("should preserve the rendering context", () => {
            expect(game.ctx).toBe(ctx);
        });

        it("should configure the canvas width", () => {
            expect(canvas.width).toBe(480);
        });

        it("should configure the canvas height", () => {
            expect(canvas.height).toBe(384);
        });

        it("should disable image smoothing", () => {
            expect(ctx.imageSmoothingEnabled)
                .toBe(false);
        });

        it("should not schedule animation frames during initialization", () => {
            expect(requestFrame)
                .not.toHaveBeenCalled();
        });
    });

    describe("Input initialization", () => {
        it("should initialize a real input system", () => {
            expect(game.input)
                .toBeInstanceOf(Input);
        });

        it("should register keyboard input events", () => {
            expect(mockWindow.addEventListener)
                .toHaveBeenCalledWith(
                    "keydown",
                    expect.any(Function)
                );

            expect(mockWindow.addEventListener)
                .toHaveBeenCalledWith(
                    "keyup",
                    expect.any(Function)
                );
        });

        it("should register window focus handling", () => {
            expect(mockWindow.addEventListener)
                .toHaveBeenCalledWith(
                    "blur",
                    expect.any(Function)
                );
        });

        it("should initialize without pressed keys", () => {
            expect(game.input.isPressed("w"))
                .toBe(false);
        });
    });

    describe("World initialization", () => {
        it("should initialize a real tile map", () => {
            expect(game.world)
                .toBeInstanceOf(TileMap);
        });

        it("should initialize the snowy forest map", () => {
            expect(game.world.tiles)
                .toEqual(SnowyForest.tiles);
        });

        it("should initialize the correct world width", () => {
            expect(game.world.width).toBe(1600);
        });

        it("should initialize the correct world height", () => {
            expect(game.world.height).toBe(1280);
        });

        it("should preserve the world spawn point", () => {
            expect(game.world.spawnPoint)
                .toEqual(SnowyForest.spawnPoint);
        });

        it("should initialize the correct tile size", () => {
            expect(game.world.tileSize)
                .toBe(SnowyForest.tileSize);
        });
    });

    describe("Player initialization", () => {
        it("should initialize a real player", () => {
            expect(game.player)
                .toBeInstanceOf(Player);
        });

        it("should position the player at the world spawn point", () => {
            expect(game.player.x)
                .toBe(game.world.spawnPoint.x);

            expect(game.player.y)
                .toBe(game.world.spawnPoint.y);
        });

        it("should initialize the current player dimensions", () => {
            expect(game.player.width).toBe(64);
            expect(game.player.height).toBe(64);
        });

        it("should initialize the player in the idle state", () => {
            expect(game.player.currentState)
                .toBe("idle");

            expect(game.player.isMoving)
                .toBe(false);
        });

        it("should initially face down", () => {
            expect(game.player.direction)
                .toBe("down");
        });
    });

    describe("Camera initialization", () => {
        it("should initialize a real camera", () => {
            expect(game.camera)
                .toBeInstanceOf(Camera);
        });

        it("should match the canvas width", () => {
            expect(game.camera.width)
                .toBe(canvas.width);
        });

        it("should match the canvas height", () => {
            expect(game.camera.height)
                .toBe(canvas.height);
        });

        it("should initially center the camera on the player horizontally", () => {
            const expectedX = Math.max(
                0,
                Math.min(
                    game.player.x +
                    game.player.width / 2 -
                    canvas.width / 2,
                    game.world.width - canvas.width
                )
            );

            expect(game.camera.x)
                .toBeCloseTo(expectedX);
        });

        it("should initially center the camera on the player vertically", () => {
            const expectedY = Math.max(
                0,
                Math.min(
                    game.player.y +
                    game.player.height / 2 -
                    canvas.height / 2,
                    game.world.height - canvas.height
                )
            );

            expect(game.camera.y)
                .toBeCloseTo(expectedY);
        });
    });

    describe("Weather initialization", () => {
        it("should initialize a real weather system", () => {
            expect(game.weatherSystem)
                .toBeInstanceOf(WeatherSystem);
        });

        it("should initialize with snowfall", () => {
            expect(game.weatherSystem.currentWeather)
                .toBe(WeatherType.SNOWFALL);
        });

        it("should initialize the correct snowfall intensity", () => {
            expect(game.weatherSystem.intensity)
                .toBe(100);
        });

        it("should initialize the correct weather visibility", () => {
            expect(game.weatherSystem.visibility)
                .toBeCloseTo(0.85);
        });

        it("should initialize the correct base wind", () => {
            expect(game.weatherSystem.wind)
                .toBe(10);
        });

        it("should initialize a real weather controller", () => {
            expect(game.weatherController)
                .toBeInstanceOf(WeatherController);
        });

        it("should initialize a real wind system", () => {
            expect(game.windSystem)
                .toBeInstanceOf(WindSystem);
        });

        it("should initialize a finite wind speed", () => {
            expect(
                Number.isFinite(
                    game.windSystem.currentWind
                )
            ).toBe(true);
        });
    });

    describe("Effect initialization", () => {
        it("should initialize a real snow particle system", () => {
            expect(game.snowSystem)
                .toBeInstanceOf(SnowParticleSystem);
        });

        it("should initialize a real footprint system", () => {
            expect(game.footprintSystem)
                .toBeInstanceOf(SnowFootprintSystem);
        });

        it("should initialize without player footprints", () => {
            expect(game.footprintSystem.footprints)
                .toHaveLength(0);
        });

        it("should initialize a real weather overlay", () => {
            expect(game.weatherOverlay)
                .toBeInstanceOf(WeatherOverlay);
        });
    });

    describe("Shadow initialization", () => {
        it("should initialize a real shadow system", () => {
            expect(game.shadowSystem)
                .toBeInstanceOf(ShadowSystem);
        });

        it("should register static environment shadows", () => {
            expect(
                game.shadowSystem.staticShadows.length
            ).toBeGreaterThan(0);
        });

        it("should create a player shadow", () => {
            expect(game.shadowSystem.playerShadow)
                .not.toBeNull();
        });

        it("should position the player shadow horizontally", () => {
            expect(game.shadowSystem.playerShadow.x)
                .toBe(
                    game.player.x +
                    game.player.width / 2
                );
        });

        it("should position the player shadow vertically", () => {
            expect(game.shadowSystem.playerShadow.y)
                .toBe(
                    game.player.y +
                    game.player.height - 2
                );
        });

        it("should initialize the correct shadow dimensions", () => {
            expect(
                game.shadowSystem.playerShadow.width
            ).toBe(24);

            expect(
                game.shadowSystem.playerShadow.height
            ).toBe(10);
        });

        it("should initialize the correct player shadow opacity", () => {
            expect(
                game.shadowSystem.playerShadow.opacity
            ).toBeCloseTo(0.3);
        });

        it("should synchronize shadows with the initial weather", () => {
            expect(
                game.shadowSystem.weatherVisibility
            ).toBeCloseTo(
                game.weatherSystem.visibility
            );
        });

        it("should initialize the correct effective shadow opacity", () => {
            expect(
                game.shadowSystem.playerShadow
                    .getEffectiveOpacity()
            ).toBeCloseTo(0.255);
        });

        it("should synchronize all static shadows with weather visibility", () => {
            for (
                const shadow of
                game.shadowSystem.staticShadows
            ) {
                expect(shadow.weatherVisibility)
                    .toBeCloseTo(0.85);
            }
        });
    });

    describe("Lighting initialization", () => {
        it("should initialize a real lighting system", () => {
            expect(game.lightingSystem)
                .toBeInstanceOf(LightingSystem);
        });

        it("should initialize with lighting enabled", () => {
            expect(game.lightingSystem.enabled)
                .toBe(true);
        });

        it("should initialize without individual light sources", () => {
            expect(game.lightingSystem.lightSources)
                .toHaveLength(0);
        });

        it("should initialize the weather-dependent ambient opacity", () => {
            expect(
                game.lightingSystem.ambientLight.opacity
            ).toBeCloseTo(0.15);
        });

        it("should apply initial lighting without a transition", () => {
            expect(
                game.lightingSystem.ambientLight
                    .isTransitioning
            ).toBe(false);
        });
    });

    describe("Lighting time handling", () => {
        it.each([
            0,
            -0.1,
            -1,
            NaN,
            Infinity,
            -Infinity,
            undefined,
            null,
            "1"
        ])(
            "should ignore invalid lighting delta time %s",
            (deltaTime) => {
                const setWeather = vi.spyOn(
                    game.lightingSystem,
                    "setWeather"
                );

                const update = vi.spyOn(
                    game.lightingSystem,
                    "update"
                );

                game.updateLighting(deltaTime);

                expect(setWeather)
                    .not.toHaveBeenCalled();

                expect(update)
                    .not.toHaveBeenCalled();
            }
        );

        it("should use the target weather during transitions", () => {
            game.weatherSystem.setWeather(
                WeatherType.BLIZZARD,
                5
            );

            const setWeather = vi.spyOn(
                game.lightingSystem,
                "setWeather"
            );

            game.updateLighting(0.1);

            expect(setWeather).toHaveBeenCalledWith(
                WeatherType.BLIZZARD,
                5
            );
        });

        it.each([null, undefined])(
            "should use current weather when target weather is %s",
            (targetWeather) => {
                game.weatherSystem.targetWeather =
                    targetWeather;

                game.weatherSystem.currentWeather =
                    WeatherType.CLEAR;

                const setWeather = vi.spyOn(
                    game.lightingSystem,
                    "setWeather"
                );

                game.updateLighting(0.1);

                expect(setWeather)
                    .toHaveBeenCalledWith(
                        WeatherType.CLEAR,
                        5
                    );
            }
        );

        it("should forward valid delta time to the lighting system", () => {
            const update = vi.spyOn(
                game.lightingSystem,
                "update"
            );

            game.updateLighting(0.25);

            expect(update)
                .toHaveBeenCalledWith(0.25);
        });
    });

    describe("Game startup", () => {
        it("should initialize without a previous frame timestamp", () => {
            expect(game.lastTime).toBeNull();
        });

        it("should expose a callable game loop", () => {
            expect(typeof game.gameLoop)
                .toBe("function");
        });

        it("should schedule the first animation frame", () => {
            game.start();

            expect(requestFrame)
                .toHaveBeenCalledTimes(1);
        });

        it("should schedule the game loop callback", () => {
            game.start();

            expect(requestFrame)
                .toHaveBeenCalledWith(game.gameLoop);
        });

        it("should not update the game before the first frame", () => {
            const update = vi.spyOn(
                game,
                "update"
            ).mockImplementation(() => {});

            game.start();

            expect(update)
                .not.toHaveBeenCalled();
        });

        it("should not render before the first frame", () => {
            const draw = vi.spyOn(
                game,
                "draw"
            ).mockImplementation(() => {});

            game.start();

            expect(draw)
                .not.toHaveBeenCalled();
        });
    });

    describe("Game loop", () => {
        let updateSpy;
        let drawSpy;

        beforeEach(() => {
            // Isolate frame scheduling and timing
            updateSpy = vi.spyOn(
                game,
                "update"
            ).mockImplementation(() => {});

            drawSpy = vi.spyOn(
                game,
                "draw"
            ).mockImplementation(() => {});
        });

        it("should use zero delta time on the first frame", () => {
            game.gameLoop(1000);

            expect(updateSpy)
                .toHaveBeenCalledWith(0);
        });

        it("should store the first frame timestamp", () => {
            game.gameLoop(1000);

            expect(game.lastTime).toBe(1000);
        });

        it("should render the first frame", () => {
            game.gameLoop(1000);

            expect(drawSpy)
                .toHaveBeenCalledTimes(1);
        });

        it("should schedule the next frame", () => {
            game.gameLoop(1000);

            expect(requestFrame)
                .toHaveBeenCalledWith(game.gameLoop);
        });

        it("should calculate elapsed time in seconds", () => {
            game.lastTime = 1000;

            game.gameLoop(1050);

            expect(updateSpy)
                .toHaveBeenCalledWith(0.05);
        });

        it.each([
            [16, 0.016],
            [20, 0.02],
            [33, 0.033],
            [50, 0.05],
            [100, 0.1]
        ])(
            "should calculate delta time for a %s ms frame",
            (elapsed, expectedDelta) => {
                game.lastTime = 1000;

                game.gameLoop(1000 + elapsed);

                expect(updateSpy)
                    .toHaveBeenCalledWith(
                        expectedDelta
                    );
            }
        );

        it.each([
            101,
            250,
            500,
            1000,
            5000
        ])(
            "should clamp long frames of %s ms",
            (elapsed) => {
                game.lastTime = 1000;

                game.gameLoop(1000 + elapsed);

                expect(updateSpy)
                    .toHaveBeenCalledWith(0.1);
            }
        );

        it("should support repeated frame timestamps", () => {
            game.lastTime = 1000;

            game.gameLoop(1000);

            expect(updateSpy)
                .toHaveBeenCalledWith(0);
        });

        it("should update the timestamp after every frame", () => {
            game.gameLoop(1000);
            game.gameLoop(1050);
            game.gameLoop(1100);

            expect(game.lastTime).toBe(1100);
        });

        it("should update the game once per frame", () => {
            game.gameLoop(1000);
            game.gameLoop(1016);
            game.gameLoop(1032);

            expect(updateSpy)
                .toHaveBeenCalledTimes(3);
        });

        it("should render the game once per frame", () => {
            game.gameLoop(1000);
            game.gameLoop(1016);
            game.gameLoop(1032);

            expect(drawSpy)
                .toHaveBeenCalledTimes(3);
        });

        it("should schedule exactly one next frame per iteration", () => {
            game.gameLoop(1000);
            game.gameLoop(1016);
            game.gameLoop(1032);

            expect(requestFrame)
                .toHaveBeenCalledTimes(3);
        });

        it("should update before rendering and scheduling the next frame", () => {
            const order = [];

            updateSpy.mockImplementation(() => {
                order.push("update");
            });

            drawSpy.mockImplementation(() => {
                order.push("draw");
            });

            requestFrame.mockImplementation(() => {
                order.push("schedule");
                return 1;
            });

            game.gameLoop(1000);

            expect(order).toEqual([
                "update",
                "draw",
                "schedule"
            ]);
        });

        it("should preserve the correct game context when called externally", () => {
            const callback = game.gameLoop;

            expect(() => callback(1000))
                .not.toThrow();

            expect(updateSpy)
                .toHaveBeenCalledWith(0);

            expect(drawSpy)
                .toHaveBeenCalledTimes(1);
        });

        it("should use the most recent timestamp after a long frame", () => {
            game.gameLoop(1000);
            game.gameLoop(6000);
            game.gameLoop(6050);

            expect(updateSpy)
                .toHaveBeenNthCalledWith(1, 0);

            expect(updateSpy)
                .toHaveBeenNthCalledWith(2, 0.1);

            expect(updateSpy)
                .toHaveBeenNthCalledWith(3, 0.05);
        });

        it("should support the animation callback scheduled by start", () => {
            game.start();

            const callback =
                requestFrame.mock.calls[0][0];

            callback(1000);

            expect(updateSpy)
                .toHaveBeenCalledWith(0);

            expect(drawSpy)
                .toHaveBeenCalledTimes(1);

            expect(requestFrame)
                .toHaveBeenCalledTimes(2);
        });
    });

    describe("Complete game integration", () => {
        it("should update all initialized systems without throwing", () => {
            expect(() => game.update(0.1))
                .not.toThrow();
        });

        it("should render the initialized game without throwing", () => {
            expect(() => game.draw())
                .not.toThrow();
        });

        it("should execute a complete game frame", () => {
            expect(() => game.gameLoop(1000))
                .not.toThrow();

            expect(game.lastTime).toBe(1000);

            expect(ctx.clearRect)
                .toHaveBeenCalledWith(
                    0, 0, 480, 384
                );

            expect(requestFrame)
                .toHaveBeenCalledWith(game.gameLoop);
        });

        it("should execute consecutive game frames", () => {
            game.gameLoop(1000);
            game.gameLoop(1016);
            game.gameLoop(1032);

            expect(game.lastTime).toBe(1032);

            expect(ctx.clearRect)
                .toHaveBeenCalledTimes(3);
        });

        it("should preserve the player position without input", () => {
            const originalX = game.player.x;
            const originalY = game.player.y;

            game.update(0.1);

            expect(game.player.x).toBe(originalX);
            expect(game.player.y).toBe(originalY);
        });

        it("should preserve static shadows across game frames", () => {
            const originalShadows = [
                ...game.shadowSystem.staticShadows
            ];

            game.gameLoop(1000);
            game.gameLoop(1016);

            expect(game.shadowSystem.staticShadows)
                .toEqual(originalShadows);
        });

        it("should update lighting during a complete game frame", () => {
            const update = vi.spyOn(
                game.lightingSystem,
                "update"
            );

            game.lastTime = 1000;

            game.gameLoop(1050);

            expect(update)
                .toHaveBeenCalledWith(0.05);
        });

        it("should render lighting during a complete game frame", () => {
            const draw = vi.spyOn(
                game.lightingSystem,
                "draw"
            );

            game.gameLoop(1000);

            expect(draw).toHaveBeenCalledWith(
                ctx,
                480,
                384,
                game.camera
            );
        });
    });
});
