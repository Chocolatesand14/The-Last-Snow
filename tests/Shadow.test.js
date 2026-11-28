
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Shadow } from "../src/lighting/Shadow.js";

describe("Shadow", () => {
    let shadow;

    beforeEach(() => {
        shadow = new Shadow(100, 50, 24, 10, 0.3);
    });

    describe("Initialization", () => {
        it("should initialize with the correct world position", () => {
            expect(shadow.x).toBe(100);
            expect(shadow.y).toBe(50);
        });

        it("should initialize with the correct dimensions", () => {
            expect(shadow.width).toBe(24);
            expect(shadow.height).toBe(10);
        });

        it("should initialize with the correct opacity", () => {
            expect(shadow.opacity).toBe(0.3);
        });

        it("should initialize with default properties", () => {
            const defaultShadow = new Shadow(100, 50);

            expect(defaultShadow.width).toBe(24);
            expect(defaultShadow.height).toBe(10);
            expect(defaultShadow.opacity).toBe(0.3);
        });

        it("should initialize with a soft shadow color", () => {
            expect(shadow.color).toBe("#344b60");
        });

        it("should initialize as visible", () => {
            expect(shadow.visible).toBe(true);
        });
    });

    describe("Dimension validation", () => {
        it.each([
            0, -10, NaN, Infinity, null
        ])(
            "should reject invalid width %s",
            (width) => {
                const invalidShadow = new Shadow(
                    100, 50, width, 10
                );

                expect(invalidShadow.width).toBe(24);
            }
        );

        it.each([
            0, -10, NaN, Infinity, null
        ])(
            "should reject invalid height %s",
            (height) => {
                const invalidShadow = new Shadow(
                    100, 50, 24, height
                );

                expect(invalidShadow.height).toBe(10);
            }
        );

        it("should support custom dimensions", () => {
            const customShadow = new Shadow(
                100, 50, 64, 20
            );

            expect(customShadow.width).toBe(64);
            expect(customShadow.height).toBe(20);
        });
    });

    describe("Position handling", () => {
        it("should update its world position", () => {
            shadow.setPosition(200, 150);

            expect(shadow.x).toBe(200);
            expect(shadow.y).toBe(150);
        });

        it("should support negative world coordinates", () => {
            shadow.setPosition(-20, -30);

            expect(shadow.x).toBe(-20);
            expect(shadow.y).toBe(-30);
        });

        it("should support fractional coordinates", () => {
            shadow.setPosition(100.5, 50.7);

            expect(shadow.x).toBe(100.5);
            expect(shadow.y).toBe(50.7);
        });

        it.each([
            [NaN, 50],
            [100, NaN],
            [Infinity, 50],
            [100, Infinity]
        ])(
            "should reject invalid position (%s, %s)",
            (x, y) => {
                shadow.setPosition(x, y);

                expect(shadow.x).toBe(100);
                expect(shadow.y).toBe(50);
            }
        );
    });

    describe("Size handling", () => {
        it("should update shadow dimensions", () => {
            shadow.setSize(40, 16);

            expect(shadow.width).toBe(40);
            expect(shadow.height).toBe(16);
        });

        it("should support fractional dimensions", () => {
            shadow.setSize(24.5, 10.5);

            expect(shadow.width).toBe(24.5);
            expect(shadow.height).toBe(10.5);
        });

        it.each([
            [0, 10],
            [24, 0],
            [-10, 10],
            [24, -10],
            [NaN, 10],
            [24, NaN],
            [Infinity, 10],
            [24, Infinity]
        ])(
            "should reject invalid dimensions (%s, %s)",
            (width, height) => {
                shadow.setSize(width, height);

                expect(shadow.width).toBe(24);
                expect(shadow.height).toBe(10);
            }
        );
    });

    describe("Opacity handling", () => {
        it("should update shadow opacity", () => {
            shadow.setOpacity(0.6);

            expect(shadow.opacity).toBe(0.6);
        });

        it("should support fully transparent shadows", () => {
            shadow.setOpacity(0);

            expect(shadow.opacity).toBe(0);
        });

        it("should support fully opaque shadows", () => {
            shadow.setOpacity(1);

            expect(shadow.opacity).toBe(1);
        });

        it("should clamp opacity above one", () => {
            shadow.setOpacity(2);

            expect(shadow.opacity).toBe(1);
        });

        it("should clamp opacity below zero", () => {
            shadow.setOpacity(-0.5);

            expect(shadow.opacity).toBe(0);
        });

        it.each([
            NaN, Infinity, -Infinity, null
        ])(
            "should reject invalid opacity %s",
            (opacity) => {
                shadow.setOpacity(opacity);

                expect(shadow.opacity).toBe(0.3);
            }
        );

        it("should clamp initial opacity above one", () => {
            const opaqueShadow = new Shadow(
                100, 50, 24, 10, 2
            );

            expect(opaqueShadow.opacity).toBe(1);
        });

        it("should clamp initial opacity below zero", () => {
            const transparentShadow = new Shadow(
                100, 50, 24, 10, -1
            );

            expect(transparentShadow.opacity).toBe(0);
        });

        it("should use default opacity for invalid initial opacity", () => {
            const invalidShadow = new Shadow(
                100, 50, 24, 10, NaN
            );

            expect(invalidShadow.opacity).toBe(0.3);
        });
    });

    describe("Visibility handling", () => {
        it("should support hiding shadows", () => {
            shadow.setVisible(false);

            expect(shadow.visible).toBe(false);
        });

        it("should support showing hidden shadows", () => {
            shadow.setVisible(false);
            shadow.setVisible(true);

            expect(shadow.visible).toBe(true);
        });

        it("should reject invalid visibility values", () => {
            shadow.setVisible("invalid");

            expect(shadow.visible).toBe(true);
        });
    });

    describe("Weather-dependent shadows", () => {
        it("should preserve full shadow opacity in clear weather", () => {
            shadow.setWeatherVisibility(1);

            expect(shadow.getEffectiveOpacity())
                .toBeCloseTo(0.3);
        });

        it("should reduce shadow opacity during snowfall", () => {
            shadow.setWeatherVisibility(0.85);

            expect(shadow.getEffectiveOpacity())
                .toBeCloseTo(0.255);
        });

        it("should reduce shadow opacity during heavy snowfall", () => {
            shadow.setWeatherVisibility(0.65);

            expect(shadow.getEffectiveOpacity())
                .toBeCloseTo(0.195);
        });

        it("should create softer shadows during blizzards", () => {
            shadow.setWeatherVisibility(0.35);

            expect(shadow.getEffectiveOpacity())
                .toBeCloseTo(0.105);
        });

        it("should restore effective opacity when weather improves", () => {
            shadow.setWeatherVisibility(0.35);
            shadow.setWeatherVisibility(1);

            expect(shadow.getEffectiveOpacity())
                .toBeCloseTo(0.3);
        });

        it("should preserve the original shadow opacity", () => {
            shadow.setWeatherVisibility(0.35);

            expect(shadow.opacity).toBe(0.3);
        });

        it("should clamp weather visibility above one", () => {
            shadow.setWeatherVisibility(2);

            expect(shadow.getEffectiveOpacity())
                .toBeCloseTo(0.3);
        });

        it("should clamp weather visibility below zero", () => {
            shadow.setWeatherVisibility(-1);

            expect(shadow.getEffectiveOpacity()).toBe(0);
        });

        it.each([
            NaN, Infinity, -Infinity, null
        ])(
            "should reject invalid weather visibility %s",
            (visibility) => {
                shadow.setWeatherVisibility(visibility);

                expect(shadow.getEffectiveOpacity())
                    .toBeCloseTo(0.3);
            }
        );
    });

    describe("Shadow rendering", () => {
        let ctx;
        let gradient;

        beforeEach(() => {
            gradient = {
                addColorStop: vi.fn()
            };

            ctx = {
                save: vi.fn(),
                restore: vi.fn(),
                translate: vi.fn(),
                scale: vi.fn(),
                beginPath: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                createRadialGradient: vi.fn(() => gradient),
                globalAlpha: 1,
                fillStyle: ""
            };
        });

        it("should render a visible shadow", () => {
            shadow.draw(ctx);

            expect(ctx.fill).toHaveBeenCalled();
        });

        it("should not render hidden shadows", () => {
            shadow.setVisible(false);
            shadow.draw(ctx);

            expect(ctx.fill).not.toHaveBeenCalled();
        });

        it("should not render fully transparent shadows", () => {
            shadow.setOpacity(0);
            shadow.draw(ctx);

            expect(ctx.fill).not.toHaveBeenCalled();
        });

        it("should render at the correct world position", () => {
            shadow.draw(ctx);

            expect(ctx.translate)
                .toHaveBeenCalledWith(100, 50);
        });

        it("should render using rounded pixel coordinates", () => {
            shadow.setPosition(100.4, 50.7);
            shadow.draw(ctx);

            expect(ctx.translate)
                .toHaveBeenCalledWith(100, 51);
        });

        it("should scale the shadow to an oval shape", () => {
            shadow.draw(ctx);

            expect(ctx.scale)
                .toHaveBeenCalledWith(12, 5);
        });

        it("should create a soft radial gradient", () => {
            shadow.draw(ctx);

            expect(ctx.createRadialGradient)
                .toHaveBeenCalled();

            expect(gradient.addColorStop)
                .toHaveBeenCalledWith(
                    0, shadow.color
                );

            expect(gradient.addColorStop)
                .toHaveBeenCalledWith(
                    1, "transparent"
                );
        });

        it("should render using effective weather opacity", () => {
            shadow.setWeatherVisibility(0.65);
            shadow.draw(ctx);

            expect(ctx.globalAlpha)
                .toBeCloseTo(0.195);
        });

        it("should save and restore the canvas state", () => {
            shadow.draw(ctx);

            expect(ctx.save).toHaveBeenCalledTimes(1);
            expect(ctx.restore).toHaveBeenCalledTimes(1);
        });

        it("should not render when effective opacity is zero", () => {
            shadow.setWeatherVisibility(0);
            shadow.draw(ctx);

            expect(ctx.fill).not.toHaveBeenCalled();
        });
    });
});
