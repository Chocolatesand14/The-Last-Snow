
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

import { SnowDrift } from "../src/entities/SnowDrift.js";

describe("SnowDrift", () => {
    let snowDrift;
    let ctx;

    beforeEach(() => {
        // Mock browser image loading
        vi.stubGlobal("Image", class {
            constructor() {
                this.src = "";
                this.complete = true;
                this.naturalWidth = 128;
                this.naturalHeight = 96;
            }
        });

        snowDrift = new SnowDrift(100, 200);

        // Mock the canvas rendering context
        ctx = {
            drawImage: vi.fn(),
            imageSmoothingEnabled: true
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("Initialization", () => {
        it("should initialize with the correct position", () => {
            expect(snowDrift.x).toBe(100);
            expect(snowDrift.y).toBe(200);
        });

        it("should initialize with the default dimensions", () => {
            expect(snowDrift.width).toBe(128);
            expect(snowDrift.height).toBe(96);
        });

        it("should support custom dimensions", () => {
            const drift = new SnowDrift(
                100, 200, 160, 120
            );

            expect(drift.width).toBe(160);
            expect(drift.height).toBe(120);
        });

        it("should support zero coordinates", () => {
            const drift = new SnowDrift(0, 0);

            expect(drift.x).toBe(0);
            expect(drift.y).toBe(0);
        });

        it("should support fractional coordinates", () => {
            const drift = new SnowDrift(10.5, 20.25);

            expect(drift.x).toBe(10.5);
            expect(drift.y).toBe(20.25);
        });

        it("should initialize with the correct sprite path", () => {
            expect(snowDrift.image.src).toBe(
                "assets/sprites/environment/snowdrifts/spawn-snowdrift.png"
            );
        });

        it("should initialize with an opening facing right", () => {
            expect(snowDrift.openingDirection)
                .toBe("right");
        });

        it("should maintain independent snowdrift instances", () => {
            const second = new SnowDrift(300, 400);

            expect(second.image)
                .not.toBe(snowDrift.image);

            expect(second.x).toBe(300);
            expect(second.y).toBe(400);
        });
    });

    describe("Input validation", () => {
        it.each([
            NaN,
            Infinity,
            -Infinity,
            undefined,
            null,
            "100"
        ])(
            "should replace invalid horizontal position %s",
            (value) => {
                const drift = new SnowDrift(value, 200);

                expect(drift.x).toBe(0);
            }
        );

        it.each([
            NaN,
            Infinity,
            -Infinity,
            undefined,
            null,
            "200"
        ])(
            "should replace invalid vertical position %s",
            (value) => {
                const drift = new SnowDrift(100, value);

                expect(drift.y).toBe(0);
            }
        );

        it.each([
            0,
            -10,
            NaN,
            Infinity,
            null,
            "128"
        ])(
            "should use the default width for invalid value %s",
            (value) => {
                const drift = new SnowDrift(
                    100, 200, value, 96
                );

                expect(drift.width).toBe(128);
            }
        );

        it.each([
            0,
            -10,
            NaN,
            Infinity,
            null,
            "96"
        ])(
            "should use the default height for invalid value %s",
            (value) => {
                const drift = new SnowDrift(
                    100, 200, 128, value
                );

                expect(drift.height).toBe(96);
            }
        );
    });

    describe("Spawn positioning", () => {
        it("should provide a spawn point", () => {
            const spawn = snowDrift.getSpawnPoint();

            expect(spawn).toEqual({
                x: expect.any(Number),
                y: expect.any(Number)
            });
        });

        it("should position the spawn point inside the snowdrift", () => {
            const spawn = snowDrift.getSpawnPoint();

            expect(spawn.x).toBeGreaterThan(
                snowDrift.x
            );

            expect(spawn.x).toBeLessThan(
                snowDrift.x + snowDrift.width
            );

            expect(spawn.y).toBeGreaterThan(
                snowDrift.y
            );

            expect(spawn.y).toBeLessThan(
                snowDrift.y + snowDrift.height
            );
        });

        it("should provide a walkable spawn point", () => {
            const spawn = snowDrift.getSpawnPoint();

            expect(
                snowDrift.isWalkable(spawn.x, spawn.y)
            ).toBe(true);
        });

        it("should return consistent spawn coordinates", () => {
            expect(snowDrift.getSpawnPoint())
                .toEqual(snowDrift.getSpawnPoint());
        });

        it("should protect internal spawn coordinates from external changes", () => {
            const spawn = snowDrift.getSpawnPoint();
            const original = snowDrift.getSpawnPoint();

            spawn.x = 9999;
            spawn.y = 9999;

            expect(snowDrift.getSpawnPoint())
                .toEqual(original);
        });

        it("should scale the spawn position with custom dimensions", () => {
            const larger = new SnowDrift(
                100, 200, 256, 192
            );

            const original = snowDrift.getSpawnPoint();
            const scaled = larger.getSpawnPoint();

            expect(scaled.x - larger.x)
                .toBeCloseTo(
                    (original.x - snowDrift.x) * 2
                );

            expect(scaled.y - larger.y)
                .toBeCloseTo(
                    (original.y - snowDrift.y) * 2
                );
        });
    });

    describe("Exit positioning", () => {
        it("should provide an exit point", () => {
            expect(snowDrift.getExitPoint()).toEqual({
                x: expect.any(Number),
                y: expect.any(Number)
            });
        });

        it("should position the exit to the right of the spawn", () => {
            const spawn = snowDrift.getSpawnPoint();
            const exit = snowDrift.getExitPoint();

            expect(exit.x).toBeGreaterThan(spawn.x);
        });

        it("should provide a walkable exit point", () => {
            const exit = snowDrift.getExitPoint();

            expect(
                snowDrift.isWalkable(exit.x, exit.y)
            ).toBe(true);
        });

        it("should provide an uninterrupted exit passage", () => {
            const spawn = snowDrift.getSpawnPoint();
            const exit = snowDrift.getExitPoint();

            for (let step = 0; step <= 20; step++) {
                const progress = step / 20;

                const x = spawn.x +
                    (exit.x - spawn.x) * progress;

                const y = spawn.y +
                    (exit.y - spawn.y) * progress;

                expect(
                    snowDrift.isWalkable(x, y)
                ).toBe(true);
            }
        });

        it("should allow the player to return through the opening", () => {
            const spawn = snowDrift.getSpawnPoint();
            const exit = snowDrift.getExitPoint();

            for (let step = 0; step <= 20; step++) {
                const progress = step / 20;

                const x = exit.x +
                    (spawn.x - exit.x) * progress;

                const y = exit.y +
                    (spawn.y - exit.y) * progress;

                expect(
                    snowDrift.isWalkable(x, y)
                ).toBe(true);
            }
        });
    });

    describe("Collision boundaries", () => {
        it("should provide collision boundaries", () => {
            const boundaries =
                snowDrift.getCollisionBounds();

            expect(Array.isArray(boundaries))
                .toBe(true);

            expect(boundaries.length)
                .toBeGreaterThan(0);
        });

        it("should provide valid rectangular collision boundaries", () => {
            for (
                const bounds of
                snowDrift.getCollisionBounds()
            ) {
                expect(Number.isFinite(bounds.x))
                    .toBe(true);

                expect(Number.isFinite(bounds.y))
                    .toBe(true);

                expect(bounds.width)
                    .toBeGreaterThan(0);

                expect(bounds.height)
                    .toBeGreaterThan(0);
            }
        });

        it("should keep collision boundaries inside the snowdrift", () => {
            for (
                const bounds of
                snowDrift.getCollisionBounds()
            ) {
                expect(bounds.x)
                    .toBeGreaterThanOrEqual(
                        snowDrift.x
                    );

                expect(bounds.y)
                    .toBeGreaterThanOrEqual(
                        snowDrift.y
                    );

                expect(bounds.x + bounds.width)
                    .toBeLessThanOrEqual(
                        snowDrift.x + snowDrift.width
                    );

                expect(bounds.y + bounds.height)
                    .toBeLessThanOrEqual(
                        snowDrift.y + snowDrift.height
                    );
            }
        });

        it("should block movement through solid snow", () => {
            for (
                const bounds of
                snowDrift.getCollisionBounds()
            ) {
                const x = bounds.x + bounds.width / 2;
                const y = bounds.y + bounds.height / 2;

                expect(
                    snowDrift.isWalkable(x, y)
                ).toBe(false);
            }
        });

        it("should allow movement outside the snowdrift", () => {
            expect(
                snowDrift.isWalkable(0, 0)
            ).toBe(true);

            expect(
                snowDrift.isWalkable(500, 500)
            ).toBe(true);
        });

        it.each([
            [NaN, 200],
            [100, NaN],
            [Infinity, 200],
            [100, Infinity],
            [null, 200],
            [100, null],
            ["100", 200]
        ])(
            "should reject invalid collision coordinates (%s, %s)",
            (x, y) => {
                expect(
                    snowDrift.isWalkable(x, y)
                ).toBe(false);
            }
        );

        it("should protect collision boundaries from external changes", () => {
            const original =
                snowDrift.getCollisionBounds();

            const modified =
                snowDrift.getCollisionBounds();

            modified[0].x = 9999;
            modified.push({});

            expect(snowDrift.getCollisionBounds())
                .toEqual(original);
        });
    });

    describe("Depth sorting", () => {
        it("should provide depth based on the bottom position", () => {
            expect(snowDrift.getDepth())
                .toBe(296);
        });

        it("should calculate depth using custom dimensions", () => {
            const drift = new SnowDrift(
                100, 300, 160, 120
            );

            expect(drift.getDepth())
                .toBe(420);
        });
    });

    describe("Viewport culling", () => {
        let camera;

        beforeEach(() => {
            camera = {
                x: 0,
                y: 0,
                width: 480,
                height: 384
            };
        });

        it("should detect a visible snowdrift", () => {
            expect(
                snowDrift.isVisible(camera)
            ).toBe(true);
        });

        it("should detect visibility without a camera", () => {
            expect(
                snowDrift.isVisible()
            ).toBe(true);
        });

        it("should detect visibility with a null camera", () => {
            expect(
                snowDrift.isVisible(null)
            ).toBe(true);
        });

        it.each([
            [600, 200],
            [-200, 200],
            [100, 500],
            [100, -200]
        ])(
            "should cull offscreen snowdrifts at (%s, %s)",
            (x, y) => {
                const drift = new SnowDrift(x, y);

                expect(drift.isVisible(camera))
                    .toBe(false);
            }
        );

        it.each([
            [450, 200],
            [-50, 200],
            [100, 350],
            [100, -50]
        ])(
            "should preserve partially visible snowdrifts at (%s, %s)",
            (x, y) => {
                const drift = new SnowDrift(x, y);

                expect(drift.isVisible(camera))
                    .toBe(true);
            }
        );

        it("should respect camera movement", () => {
            camera.x = 500;
            camera.y = 500;

            expect(
                snowDrift.isVisible(camera)
            ).toBe(false);
        });

        it("should exclude objects touching the viewport edge", () => {
            const drift = new SnowDrift(480, 200);

            expect(drift.isVisible(camera))
                .toBe(false);
        });
    });

    describe("Rendering", () => {
        it("should render the snowdrift sprite", () => {
            snowDrift.draw(ctx);

            expect(ctx.drawImage)
                .toHaveBeenCalledWith(
                    snowDrift.image,
                    100,
                    200,
                    128,
                    96
                );
        });

        it("should disable image smoothing", () => {
            snowDrift.draw(ctx);

            expect(ctx.imageSmoothingEnabled)
                .toBe(false);
        });

        it("should round rendering coordinates", () => {
            const drift = new SnowDrift(
                100.6, 200.4
            );

            drift.draw(ctx);

            expect(ctx.drawImage)
                .toHaveBeenCalledWith(
                    drift.image,
                    101,
                    200,
                    128,
                    96
                );
        });

        it("should support custom rendering dimensions", () => {
            const drift = new SnowDrift(
                100, 200, 160, 120
            );

            drift.draw(ctx);

            expect(ctx.drawImage)
                .toHaveBeenCalledWith(
                    drift.image,
                    100,
                    200,
                    160,
                    120
                );
        });

        it("should skip rendering when the image is not loaded", () => {
            snowDrift.image.complete = false;

            snowDrift.draw(ctx);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });

        it("should skip rendering when the image has failed to load", () => {
            snowDrift.image.naturalWidth = 0;

            snowDrift.draw(ctx);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });

        it("should skip rendering when the image is missing", () => {
            snowDrift.image = null;

            snowDrift.draw(ctx);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });

        it("should preserve world coordinates during rendering", () => {
            snowDrift.draw(ctx);
            snowDrift.draw(ctx);

            expect(snowDrift.x).toBe(100);
            expect(snowDrift.y).toBe(200);
        });

        it("should preserve collision boundaries during rendering", () => {
            const original =
                snowDrift.getCollisionBounds();

            snowDrift.draw(ctx);

            expect(snowDrift.getCollisionBounds())
                .toEqual(original);
        });

        it("should support rendering without browser image dependencies", () => {
            vi.stubGlobal("Image", undefined);

            const drift = new SnowDrift(100, 200);

            expect(drift.image).toBeNull();

            expect(() => drift.draw(ctx))
                .not.toThrow();

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });
    });
});
