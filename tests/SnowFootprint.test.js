
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnowFootprint } from "../src/effects/SnowFootprint.js";

describe("SnowFootprint", () => {
    let footprint;

    beforeEach(() => {
        footprint = new SnowFootprint(
            100, 50, "down", "left", 60
        );
    });

    describe("Initialization", () => {
        it("should have the correct world position", () => {
            expect(footprint.x).toBe(100);
            expect(footprint.y).toBe(50);
        });

        it("should have the correct direction", () => {
            expect(footprint.direction).toBe("down");
        });

        it("should have the correct foot type", () => {
            expect(footprint.foot).toBe("left");
        });

        it("should have the correct lifetime", () => {
            expect(footprint.lifetime).toBe(60);
        });

        it("should initialize with zero age", () => {
            expect(footprint.age).toBe(0);
        });

        it("should initialize with full opacity", () => {
            expect(footprint.opacity).toBe(1);
        });

        it("should not be expired initially", () => {
            expect(footprint.isExpired()).toBe(false);
        });

        it("should support different directions", () => {
            for (const direction of [
                "up", "down", "left", "right"
            ]) {
                const directionalFootprint =
                    new SnowFootprint(
                        100, 50, direction, "left", 60
                    );

                expect(directionalFootprint.direction)
                    .toBe(direction);
            }
        });

        it("should support both left and right footprints", () => {
            const rightFootprint = new SnowFootprint(
                100, 50, "down", "right", 60
            );

            expect(footprint.foot).toBe("left");
            expect(rightFootprint.foot).toBe("right");
        });
    });

    describe("Footprint aging", () => {
        it("should increase age over time", () => {
            footprint.update(10);

            expect(footprint.age).toBe(10);
        });

        it("should gradually reduce opacity", () => {
            footprint.update(15);

            expect(footprint.opacity).toBeCloseTo(0.75);
        });

        it("should have half opacity halfway through its lifetime", () => {
            footprint.update(30);

            expect(footprint.opacity).toBeCloseTo(0.5);
        });

        it("should expire when its lifetime is reached", () => {
            footprint.update(60);

            expect(footprint.isExpired()).toBe(true);
        });

        it("should have zero opacity when expired", () => {
            footprint.update(60);

            expect(footprint.opacity).toBe(0);
        });

        it("should never have negative opacity", () => {
            footprint.update(100);

            expect(footprint.opacity).toBe(0);
        });

        it("should preserve its world position while aging", () => {
            footprint.update(20);

            expect(footprint.x).toBe(100);
            expect(footprint.y).toBe(50);
        });

        it("should support different footprint lifetimes", () => {
            const shortLivedFootprint = new SnowFootprint(
                100, 50, "down", "left", 10
            );

            shortLivedFootprint.update(10);

            expect(shortLivedFootprint.isExpired())
                .toBe(true);
        });
    });

    describe("Weather influence", () => {
        it("should support normal fading speed", () => {
            footprint.update(10, 1);

            expect(footprint.opacity)
                .toBeCloseTo(5 / 6);
        });

        it("should fade faster during heavy snowfall", () => {
            footprint.update(10, 2);

            expect(footprint.opacity)
                .toBeCloseTo(2 / 3);
        });

        it("should fade significantly faster during blizzards", () => {
            footprint.update(10, 6);

            expect(footprint.opacity).toBe(0);
            expect(footprint.isExpired()).toBe(true);
        });

        it("should fade more slowly during clear weather", () => {
            footprint.update(30, 1 / 3);

            expect(footprint.opacity)
                .toBeCloseTo(5 / 6);
        });

        it("should support paused fading", () => {
            footprint.update(10, 0);

            expect(footprint.age).toBe(10);
            expect(footprint.opacity).toBe(1);
        });

        it("should accumulate fading across weather changes", () => {
            // Normal snowfall
            footprint.update(10, 1);

            // Heavy snowfall
            footprint.update(10, 2);

            expect(footprint.opacity)
                .toBeCloseTo(0.5);
        });

        it("should not restore opacity when weather improves", () => {
            footprint.update(5, 6);

            const previousOpacity = footprint.opacity;

            // Clear weather
            footprint.update(5, 1 / 3);

            expect(footprint.opacity)
                .toBeLessThan(previousOpacity);
        });

        it("should not restore expired footprints", () => {
            footprint.update(10, 6);
            footprint.update(10, 1 / 3);

            expect(footprint.isExpired()).toBe(true);
            expect(footprint.opacity).toBe(0);
        });

        it("should ignore invalid fading multipliers", () => {
            footprint.update(10, -1);
            footprint.update(10, NaN);
            footprint.update(10, Infinity);

            expect(footprint.age).toBe(0);
            expect(footprint.opacity).toBe(1);
        });
    });

    describe("Time handling", () => {
        it("should ignore zero delta time", () => {
            footprint.update(0);

            expect(footprint.age).toBe(0);
            expect(footprint.opacity).toBe(1);
        });

        it("should ignore negative delta time", () => {
            footprint.update(-10);

            expect(footprint.age).toBe(0);
            expect(footprint.opacity).toBe(1);
        });

        it("should ignore invalid delta time", () => {
            footprint.update(NaN);
            footprint.update(Infinity);

            expect(footprint.age).toBe(0);
            expect(footprint.opacity).toBe(1);
        });

        it("should remain consistent across different frame rates", () => {
            const footprint30FPS = new SnowFootprint(
                100, 50, "down", "left", 60
            );

            const footprint60FPS = new SnowFootprint(
                100, 50, "down", "left", 60
            );

            for (let frame = 0; frame < 300; frame++) {
                footprint30FPS.update(1 / 30, 2);
            }

            for (let frame = 0; frame < 600; frame++) {
                footprint60FPS.update(1 / 60, 2);
            }

            expect(footprint30FPS.age)
                .toBeCloseTo(footprint60FPS.age, 5);

            expect(footprint30FPS.opacity)
                .toBeCloseTo(footprint60FPS.opacity, 5);
        });
    });

    describe("Footprint rendering", () => {
        let ctx;

        beforeEach(() => {
            ctx = {
                save: vi.fn(),
                restore: vi.fn(),
                translate: vi.fn(),
                rotate: vi.fn(),
                fillRect: vi.fn(),
                fillStyle: "",
                globalAlpha: 1
            };
        });

        it("should render an active footprint", () => {
            footprint.draw(ctx);

            expect(ctx.fillRect).toHaveBeenCalled();
        });

        it("should render at the correct world position", () => {
            footprint.draw(ctx);

            expect(ctx.translate)
                .toHaveBeenCalledWith(100, 50);
        });

        it("should render using the current opacity", () => {
            footprint.update(30);
            footprint.draw(ctx);

            expect(ctx.globalAlpha).toBeCloseTo(0.5);
        });

        it("should save and restore the canvas state", () => {
            footprint.draw(ctx);

            expect(ctx.save).toHaveBeenCalledTimes(1);
            expect(ctx.restore).toHaveBeenCalledTimes(1);
        });

        it("should not render expired footprints", () => {
            footprint.update(60);
            footprint.draw(ctx);

            expect(ctx.fillRect).not.toHaveBeenCalled();
        });

        it("should render using whole pixel positions", () => {
            footprint.x = 100.4;
            footprint.y = 50.7;

            footprint.draw(ctx);

            expect(ctx.translate)
                .toHaveBeenCalledWith(100, 51);
        });
    });
});
