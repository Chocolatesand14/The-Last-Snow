
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

        it("should initialize with default properties", () => {
            const defaultFootprint = new SnowFootprint(
                100, 50
            );

            expect(defaultFootprint.direction).toBe("down");
            expect(defaultFootprint.foot).toBe("left");
            expect(defaultFootprint.lifetime).toBe(60);
        });

        it("should initialize with zero accumulated fading", () => {
            expect(footprint.fadeAge).toBe(0);
        });

        it("should have the correct rounded footprint dimensions", () => {
            expect(footprint.width).toBe(6);
            expect(footprint.height).toBe(8);
        });

        it("should initialize with the correct snow indentation colors", () => {
            expect(footprint.color).toBe("#a3b9c9");
            expect(footprint.innerColor).toBe("#b8cbd9");
            expect(footprint.highlightColor).toBe("#d5e3ed");
            expect(footprint.shadowColor).toBe("#8fa9bb");
        });
    });

    describe("Lifetime validation", () => {
        it.each([
            0,
            -10,
            NaN,
            Infinity,
            -Infinity,
            null,
            "invalid"
        ])(
            "should use the default lifetime for invalid value %s",
            (lifetime) => {
                const invalidFootprint = new SnowFootprint(
                    100, 50, "down", "left", lifetime
                );

                expect(invalidFootprint.lifetime).toBe(60);
            }
        );

        it("should accept a positive fractional lifetime", () => {
            const shortFootprint = new SnowFootprint(
                100, 50, "down", "left", 0.5
            );

            expect(shortFootprint.lifetime).toBe(0.5);

            shortFootprint.update(0.5);

            expect(shortFootprint.isExpired()).toBe(true);
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

        it("should clamp accumulated fading to its lifetime", () => {
            footprint.update(100, 6);

            expect(footprint.fadeAge).toBe(60);
            expect(footprint.opacity).toBe(0);
        });

        it("should stop aging after expiration", () => {
            footprint.update(60);

            const previousAge = footprint.age;

            footprint.update(30);

            expect(footprint.age).toBe(previousAge);
            expect(footprint.fadeAge).toBe(60);
            expect(footprint.opacity).toBe(0);
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

        it("should track actual age independently of accumulated fading", () => {
            footprint.update(5, 6);

            expect(footprint.age).toBe(5);
            expect(footprint.fadeAge).toBe(30);
            expect(footprint.opacity).toBeCloseTo(0.5);
        });
    });

    describe("Footprint rotation", () => {
        it.each([
            ["up", 0],
            ["right", Math.PI / 2],
            ["down", Math.PI],
            ["left", -Math.PI / 2]
        ])(
            "should return the correct rotation for direction %s",
            (direction, expectedRotation) => {
                const directionalFootprint = new SnowFootprint(
                    100, 50, direction, "left", 60
                );

                expect(directionalFootprint.getRotation())
                    .toBeCloseTo(expectedRotation);
            }
        );

        it("should use zero rotation for an invalid direction", () => {
            const invalidFootprint = new SnowFootprint(
                100, 50, "invalid", "left", 60
            );

            expect(invalidFootprint.getRotation()).toBe(0);
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

        it.each([
            ["up", 0],
            ["right", Math.PI / 2],
            ["down", Math.PI],
            ["left", -Math.PI / 2]
        ])(
            "should apply the correct canvas rotation for direction %s",
            (direction, expectedRotation) => {
                const directionalFootprint = new SnowFootprint(
                    100, 50, direction, "left", 60
                );

                directionalFootprint.draw(ctx);

                expect(ctx.rotate)
                    .toHaveBeenCalledWith(expectedRotation);
            }
        );

        it("should render rounded front and rear edges", () => {
            footprint.draw(ctx);

            // Verify the narrow front edge
            expect(ctx.fillRect)
                .toHaveBeenCalledWith(-1, -4, 2, 1);

            // Verify the narrow rear edge
            expect(ctx.fillRect)
                .toHaveBeenCalledWith(-1, 3, 2, 1);

            // Verify the wider center
            expect(ctx.fillRect)
                .toHaveBeenCalledWith(-3, -2, 6, 4);
        });

        it("should render all footprint shading colors", () => {
            const renderedColors = new Set();

            ctx.fillRect.mockImplementation(() => {
                renderedColors.add(ctx.fillStyle);
            });

            footprint.draw(ctx);

            expect(renderedColors).toEqual(new Set([
                footprint.color,
                footprint.shadowColor,
                footprint.innerColor,
                footprint.highlightColor
            ]));
        });

        it("should not modify canvas state when expired", () => {
            footprint.update(60);
            footprint.draw(ctx);

            expect(ctx.save).not.toHaveBeenCalled();
            expect(ctx.restore).not.toHaveBeenCalled();
            expect(ctx.translate).not.toHaveBeenCalled();
            expect(ctx.rotate).not.toHaveBeenCalled();
        });
    });
});
