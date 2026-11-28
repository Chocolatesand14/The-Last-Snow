
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

import { Player } from "../src/entities/Player.js";
import { Sprite } from "../src/core/Sprite.js";
import { Animation } from "../src/core/Animation.js";

describe("Player", () => {
    let player;
    let ctx;

    // Create a mock keyboard input
    function createInput(...keys) {
        return {
            isPressed: vi.fn((key) => keys.includes(key))
        };
    }

    beforeEach(() => {
        // Mock browser image loading
        vi.stubGlobal("Image", class {
            constructor() {
                this.src = "";
            }
        });

        player = new Player(100, 100);

        // Mock the canvas rendering context
        ctx = {
            imageSmoothingEnabled: true,
            drawImage: vi.fn()
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("Initialization", () => {
        it("should initialize with the correct position", () => {
            expect(player.x).toBe(100);
            expect(player.y).toBe(100);
        });

        it("should initialize with the correct dimensions", () => {
            expect(player.width).toBe(64);
            expect(player.height).toBe(64);
        });

        it("should initialize with the correct movement speed", () => {
            expect(player.speed).toBe(120);
        });

        it("should initially face down", () => {
            expect(player.direction).toBe("down");
        });

        it("should initially remain stationary", () => {
            expect(player.isMoving).toBe(false);
        });

        it("should initialize with the idle animation state", () => {
            expect(player.currentState).toBe("idle");
        });

        it("should support custom spawn coordinates", () => {
            const customPlayer = new Player(800, 640);

            expect(customPlayer.x).toBe(800);
            expect(customPlayer.y).toBe(640);
        });

        it("should support fractional spawn coordinates", () => {
            const customPlayer = new Player(10.5, 20.25);

            expect(customPlayer.x).toBe(10.5);
            expect(customPlayer.y).toBe(20.25);
        });

        it("should support zero spawn coordinates", () => {
            const customPlayer = new Player(0, 0);

            expect(customPlayer.x).toBe(0);
            expect(customPlayer.y).toBe(0);
        });

        it("should maintain independent player instances", () => {
            const secondPlayer = new Player(100, 100);

            player.update(createInput("d"), 1);

            expect(secondPlayer.x).toBe(100);
            expect(secondPlayer.y).toBe(100);
            expect(secondPlayer.currentState).toBe("idle");
        });
    });

    describe("Sprite initialization", () => {
        it("should initialize all required sprite states", () => {
            expect(Object.keys(player.sprites)).toEqual([
                "idle",
                "down",
                "up",
                "left",
                "right"
            ]);
        });

        it.each([
            "idle",
            "down",
            "up",
            "left",
            "right"
        ])(
            "should initialize a real sprite for %s",
            (state) => {
                expect(player.sprites[state])
                    .toBeInstanceOf(Sprite);
            }
        );

        it("should maintain separate sprite instances", () => {
            const sprites = Object.values(player.sprites);

            expect(new Set(sprites).size).toBe(5);
        });
    });

    describe("Animation initialization", () => {
        it("should initialize all required animation states", () => {
            expect(Object.keys(player.animations)).toEqual([
                "idle",
                "down",
                "up",
                "left",
                "right"
            ]);
        });

        it.each([
            "idle",
            "down",
            "up",
            "left",
            "right"
        ])(
            "should initialize a real animation for %s",
            (state) => {
                expect(player.animations[state])
                    .toBeInstanceOf(Animation);
            }
        );

        it("should maintain separate animation instances", () => {
            const animations = Object.values(
                player.animations
            );

            expect(new Set(animations).size).toBe(5);
        });
    });

    describe("Keyboard movement", () => {
        it("should move up when W is pressed", () => {
            player.update(createInput("w"), 1);

            expect(player.y).toBe(-20);
            expect(player.direction).toBe("up");
        });

        it("should move down when S is pressed", () => {
            player.update(createInput("s"), 1);

            expect(player.y).toBe(220);
            expect(player.direction).toBe("down");
        });

        it("should move left when A is pressed", () => {
            player.update(createInput("a"), 1);

            expect(player.x).toBe(-20);
            expect(player.direction).toBe("left");
        });

        it("should move right when D is pressed", () => {
            player.update(createInput("d"), 1);

            expect(player.x).toBe(220);
            expect(player.direction).toBe("right");
        });

        it("should remain stationary without input", () => {
            player.update(createInput(), 1);

            expect(player.x).toBe(100);
            expect(player.y).toBe(100);
            expect(player.isMoving).toBe(false);
        });

        it("should ignore unrelated keyboard input", () => {
            player.update(
                createInput("Enter", "Escape", " "),
                1
            );

            expect(player.x).toBe(100);
            expect(player.y).toBe(100);
            expect(player.isMoving).toBe(false);
        });

        it("should preserve horizontal position during vertical movement", () => {
            player.update(createInput("w"), 1);

            expect(player.x).toBe(100);
        });

        it("should preserve vertical position during horizontal movement", () => {
            player.update(createInput("d"), 1);

            expect(player.y).toBe(100);
        });

        it("should accumulate movement across multiple updates", () => {
            player.update(createInput("d"), 0.5);
            player.update(createInput("d"), 0.5);

            expect(player.x).toBe(220);
            expect(player.y).toBe(100);
        });

        it("should support changing movement direction", () => {
            player.update(createInput("d"), 1);
            player.update(createInput("a"), 1);

            expect(player.x).toBe(100);
            expect(player.direction).toBe("left");
        });
    });

    describe("Arrow key movement", () => {
        it("should support arrow keys", () => {
            player.update(createInput("ArrowUp"), 1);

            expect(player.y).toBe(-20);
            expect(player.direction).toBe("up");
        });

        it.each([
            ["ArrowUp", 100, -20, "up"],
            ["ArrowDown", 100, 220, "down"],
            ["ArrowLeft", -20, 100, "left"],
            ["ArrowRight", 220, 100, "right"]
        ])(
            "should move correctly when %s is pressed",
            (key, expectedX, expectedY, direction) => {
                player.update(createInput(key), 1);

                expect(player.x).toBe(expectedX);
                expect(player.y).toBe(expectedY);
                expect(player.direction).toBe(direction);
            }
        );

        it.each([
            ["w", "ArrowUp", 100, -20],
            ["s", "ArrowDown", 100, 220],
            ["a", "ArrowLeft", -20, 100],
            ["d", "ArrowRight", 220, 100]
        ])(
            "should not duplicate movement for %s and %s",
            (key, arrow, expectedX, expectedY) => {
                player.update(
                    createInput(key, arrow),
                    1
                );

                expect(player.x).toBe(expectedX);
                expect(player.y).toBe(expectedY);
            }
        );
    });

    describe("Diagonal movement", () => {
        it("should normalize diagonal movement", () => {
            player.update(createInput("w", "d"), 1);

            const distance = Math.hypot(
                player.x - 100,
                player.y - 100
            );

            expect(distance).toBeCloseTo(player.speed);
        });

        it.each([
            ["w", "a", -1, -1, "left"],
            ["w", "d", 1, -1, "right"],
            ["s", "a", -1, 1, "left"],
            ["s", "d", 1, 1, "right"]
        ])(
            "should normalize diagonal movement for %s and %s",
            (vertical, horizontal, dx, dy, direction) => {
                player.update(
                    createInput(vertical, horizontal),
                    1
                );

                const movement = 120 / Math.sqrt(2);

                expect(player.x)
                    .toBeCloseTo(100 + dx * movement);

                expect(player.y)
                    .toBeCloseTo(100 + dy * movement);

                expect(player.direction).toBe(direction);
                expect(player.isMoving).toBe(true);
            }
        );

        it("should support diagonal arrow key movement", () => {
            player.update(
                createInput("ArrowUp", "ArrowRight"),
                1
            );

            const distance = Math.hypot(
                player.x - 100,
                player.y - 100
            );

            expect(distance).toBeCloseTo(120);
            expect(player.direction).toBe("right");
        });

        it("should support mixed keyboard and arrow input", () => {
            player.update(
                createInput("w", "ArrowLeft"),
                1
            );

            expect(player.x).toBeLessThan(100);
            expect(player.y).toBeLessThan(100);
            expect(player.direction).toBe("left");
        });

        it("should prioritize horizontal direction during diagonal movement", () => {
            player.update(createInput("w", "d"), 1);

            expect(player.direction).toBe("right");
            expect(player.currentState).toBe("right");
        });
    });

    describe("Opposing inputs", () => {
        it("should remain stationary with opposing inputs", () => {
            player.update(createInput("w", "s"), 1);

            expect(player.y).toBe(100);
            expect(player.isMoving).toBe(false);
        });

        it.each([
            ["w", "s"],
            ["a", "d"],
            ["ArrowUp", "ArrowDown"],
            ["ArrowLeft", "ArrowRight"],
            ["w", "ArrowDown"],
            ["a", "ArrowRight"]
        ])(
            "should cancel opposing inputs %s and %s",
            (first, second) => {
                player.update(
                    createInput(first, second),
                    1
                );

                expect(player.x).toBe(100);
                expect(player.y).toBe(100);
                expect(player.isMoving).toBe(false);
                expect(player.currentState).toBe("idle");
            }
        );

        it("should remain stationary when all movement keys are pressed", () => {
            player.update(
                createInput("w", "a", "s", "d"),
                1
            );

            expect(player.x).toBe(100);
            expect(player.y).toBe(100);
            expect(player.isMoving).toBe(false);
        });

        it("should preserve valid horizontal movement when vertical inputs cancel", () => {
            player.update(
                createInput("w", "s", "d"),
                1
            );

            expect(player.x).toBe(220);
            expect(player.y).toBe(100);
            expect(player.direction).toBe("right");
        });

        it("should preserve valid vertical movement when horizontal inputs cancel", () => {
            player.update(
                createInput("a", "d", "w"),
                1
            );

            expect(player.x).toBe(100);
            expect(player.y).toBe(-20);
            expect(player.direction).toBe("up");
        });
    });

    describe("Delta time handling", () => {
        it("should use delta time when moving", () => {
            player.update(createInput("d"), 0.5);

            expect(player.x).toBe(160);
        });

        it.each([
            [0, 100],
            [0.01, 101.2],
            [0.1, 112],
            [0.25, 130],
            [0.5, 160],
            [1, 220],
            [2, 340]
        ])(
            "should calculate movement with delta time %s",
            (deltaTime, expectedX) => {
                player.update(
                    createInput("d"),
                    deltaTime
                );

                expect(player.x).toBeCloseTo(expectedX);
            }
        );

        it("should not change position with zero delta time", () => {
            player.update(createInput("w", "d"), 0);

            expect(player.x).toBe(100);
            expect(player.y).toBe(100);
        });

        it("should produce consistent movement across different frame intervals", () => {
            const secondPlayer = new Player(100, 100);

            player.update(createInput("d"), 1);

            for (let frame = 0; frame < 10; frame++) {
                secondPlayer.update(
                    createInput("d"),
                    0.1
                );
            }

            expect(secondPlayer.x)
                .toBeCloseTo(player.x);

            expect(secondPlayer.y)
                .toBeCloseTo(player.y);
        });

        it("should use the configured movement speed", () => {
            player.speed = 200;

            player.update(createInput("d"), 0.5);

            expect(player.x).toBe(200);
        });
    });

    describe("Animation state transitions", () => {
        it("should switch to walking animation", () => {
            player.update(createInput("d"), 0.1);

            expect(player.isMoving).toBe(true);
            expect(player.currentState).toBe("right");
        });

        it("should return to idle when movement stops", () => {
            player.update(createInput("d"), 0.1);
            player.update(createInput(), 0.1);

            expect(player.isMoving).toBe(false);
            expect(player.currentState).toBe("idle");
        });

        it.each([
            ["w", "up"],
            ["s", "down"],
            ["a", "left"],
            ["d", "right"]
        ])(
            "should select the correct animation for %s",
            (key, state) => {
                player.update(createInput(key), 0.1);

                expect(player.currentState).toBe(state);
            }
        );

        it("should preserve the last movement direction while idle", () => {
            player.update(createInput("a"), 0.1);
            player.update(createInput(), 0.1);

            expect(player.direction).toBe("left");
            expect(player.currentState).toBe("idle");
        });

        it("should reset the walking animation when movement begins", () => {
            const reset = vi.spyOn(
                player.animations.right,
                "reset"
            );

            player.update(createInput("d"), 0.1);

            expect(reset).toHaveBeenCalledTimes(1);
        });

        it("should reset the idle animation when movement stops", () => {
            const reset = vi.spyOn(
                player.animations.idle,
                "reset"
            );

            player.update(createInput("d"), 0.1);
            player.update(createInput(), 0.1);

            expect(reset).toHaveBeenCalledTimes(1);
        });

        it("should reset the animation when changing direction", () => {
            const reset = vi.spyOn(
                player.animations.left,
                "reset"
            );

            player.update(createInput("d"), 0.1);
            player.update(createInput("a"), 0.1);

            expect(reset).toHaveBeenCalledTimes(1);
            expect(player.currentState).toBe("left");
        });

        it("should not reset an unchanged walking animation", () => {
            player.update(createInput("d"), 0.1);

            const reset = vi.spyOn(
                player.animations.right,
                "reset"
            );

            player.update(createInput("d"), 0.1);
            player.update(createInput("d"), 0.1);

            expect(reset).not.toHaveBeenCalled();
        });

        it("should not reset an unchanged idle animation", () => {
            const reset = vi.spyOn(
                player.animations.idle,
                "reset"
            );

            player.update(createInput(), 0.1);
            player.update(createInput(), 0.1);

            expect(reset).not.toHaveBeenCalled();
        });

        it("should update the active walking animation", () => {
            const update = vi.spyOn(
                player.animations.right,
                "update"
            );

            player.update(createInput("d"), 0.15);

            expect(update)
                .toHaveBeenCalledWith(0.15);
        });

        it("should update the idle animation while stationary", () => {
            const update = vi.spyOn(
                player.animations.idle,
                "update"
            );

            player.update(createInput(), 0.3);

            expect(update)
                .toHaveBeenCalledWith(0.3);
        });

        it("should not update inactive animations", () => {
            const idle = vi.spyOn(
                player.animations.idle,
                "update"
            );

            const left = vi.spyOn(
                player.animations.left,
                "update"
            );

            const right = vi.spyOn(
                player.animations.right,
                "update"
            );

            player.update(createInput("d"), 0.1);

            expect(idle).not.toHaveBeenCalled();
            expect(left).not.toHaveBeenCalled();
            expect(right).toHaveBeenCalledTimes(1);
        });

        it("should reset the animation before updating the new state", () => {
            const order = [];

            vi.spyOn(
                player.animations.right,
                "reset"
            ).mockImplementation(() => {
                order.push("reset");
            });

            vi.spyOn(
                player.animations.right,
                "update"
            ).mockImplementation(() => {
                order.push("update");
            });

            player.update(createInput("d"), 0.1);

            expect(order).toEqual([
                "reset",
                "update"
            ]);
        });
    });

    describe("Player rendering", () => {
        it("should render the idle sprite while stationary", () => {
            const draw = vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            player.draw(ctx);

            expect(draw).toHaveBeenCalledWith(
                ctx,
                player.animations.idle.getFrame(),
                100,
                100,
                64,
                64
            );
        });

        it("should disable image smoothing", () => {
            vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            player.draw(ctx);

            expect(ctx.imageSmoothingEnabled)
                .toBe(false);
        });

        it.each([
            ["w", "up"],
            ["s", "down"],
            ["a", "left"],
            ["d", "right"]
        ])(
            "should render the correct sprite for %s",
            (key, state) => {
                player.update(createInput(key), 0.1);

                const draw = vi.spyOn(
                    player.sprites[state],
                    "draw"
                ).mockImplementation(() => {});

                player.draw(ctx);

                expect(draw).toHaveBeenCalledWith(
                    ctx,
                    player.animations[state].getFrame(),
                    player.x,
                    player.y,
                    player.width,
                    player.height
                );
            }
        );

        it("should render the current animation frame", () => {
            vi.spyOn(
                player.animations.idle,
                "getFrame"
            ).mockReturnValue(3);

            const draw = vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            player.draw(ctx);

            expect(draw).toHaveBeenCalledWith(
                ctx,
                3,
                100,
                100,
                64,
                64
            );
        });

        it("should query the current animation frame once per draw", () => {
            const getFrame = vi.spyOn(
                player.animations.idle,
                "getFrame"
            );

            vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            player.draw(ctx);

            expect(getFrame).toHaveBeenCalledTimes(1);
        });

        it("should render at the current player position", () => {
            player.x = 250;
            player.y = 175;

            const draw = vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            player.draw(ctx);

            expect(draw).toHaveBeenCalledWith(
                ctx,
                expect.any(Number),
                250,
                175,
                64,
                64
            );
        });

        it("should forward fractional world coordinates to the sprite", () => {
            player.x = 100.75;
            player.y = 200.25;

            const draw = vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            player.draw(ctx);

            expect(draw).toHaveBeenCalledWith(
                ctx,
                expect.any(Number),
                100.75,
                200.25,
                64,
                64
            );
        });

        it("should use the current player dimensions", () => {
            player.width = 96;
            player.height = 80;

            const draw = vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            player.draw(ctx);

            expect(draw).toHaveBeenCalledWith(
                ctx,
                expect.any(Number),
                100,
                100,
                96,
                80
            );
        });

        it("should not render inactive sprites", () => {
            const spies = Object.entries(
                player.sprites
            ).map(([state, sprite]) => ({
                state,
                draw: vi.spyOn(
                    sprite,
                    "draw"
                ).mockImplementation(() => {})
            }));

            player.update(createInput("d"), 0.1);
            player.draw(ctx);

            for (const { state, draw } of spies) {
                if (state === "right") {
                    expect(draw).toHaveBeenCalledTimes(1);
                } else {
                    expect(draw).not.toHaveBeenCalled();
                }
            }
        });

        it("should render the idle sprite after movement stops", () => {
            player.update(createInput("d"), 0.1);
            player.update(createInput(), 0.1);

            const draw = vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            player.draw(ctx);

            expect(draw).toHaveBeenCalledTimes(1);
            expect(player.currentState).toBe("idle");
        });

        it("should preserve player position during rendering", () => {
            vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            player.draw(ctx);
            player.draw(ctx);

            expect(player.x).toBe(100);
            expect(player.y).toBe(100);
        });

        it("should preserve animation state during rendering", () => {
            vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            const originalFrame =
                player.animations.idle.getFrame();

            player.draw(ctx);
            player.draw(ctx);

            expect(player.currentState).toBe("idle");

            expect(player.animations.idle.getFrame())
                .toBe(originalFrame);
        });

        it("should not advance animations during rendering", () => {
            const update = vi.spyOn(
                player.animations.idle,
                "update"
            );

            vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation(() => {});

            player.draw(ctx);

            expect(update).not.toHaveBeenCalled();
        });

        it("should disable smoothing before rendering the sprite", () => {
            vi.spyOn(
                player.sprites.idle,
                "draw"
            ).mockImplementation((context) => {
                expect(context.imageSmoothingEnabled)
                    .toBe(false);
            });

            player.draw(ctx);
        });
    });
});
