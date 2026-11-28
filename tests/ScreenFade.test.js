
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

import { ScreenFade } from "../src/effects/ScreenFade.js";

describe("ScreenFade", () => {
    let fade;
    let ctx;

    beforeEach(() => {
        fade = new ScreenFade();

        // Mock the canvas rendering context
        ctx = {
            save: vi.fn(),
            restore: vi.fn(),
            setTransform: vi.fn(),
            fillRect: vi.fn(),
            globalAlpha: 1,
            globalCompositeOperation: "source-over",
            fillStyle: ""
        };
    });

    describe("Initialization", () => {
        it("should initialize with a transparent screen", () => {
            expect(fade.opacity).toBe(0);
        });

        it("should initialize without an active transition", () => {
            expect(fade.isTransitioning).toBe(false);
        });

        it("should initialize with black as the default color", () => {
            expect(fade.color).toBe("#000000");
        });

        it("should initialize with zero elapsed time", () => {
            expect(fade.elapsedTime).toBe(0);
        });

        it("should support a custom fade color", () => {
            const custom = new ScreenFade("#ffffff");

            expect(custom.color).toBe("#ffffff");
        });

        it("should maintain independent fade instances", () => {
            const second = new ScreenFade();

            fade.fadeIn(2);

            expect(second.opacity).toBe(0);
            expect(second.isTransitioning).toBe(false);
        });
    });

    describe("Color validation", () => {
        it.each([
            null,
            undefined,
            "",
            "invalid",
            "#fff",
            "#12345",
            "#gggggg",
            123
        ])(
            "should use the default color for invalid value %s",
            (color) => {
                const custom = new ScreenFade(color);

                expect(custom.color).toBe("#000000");
            }
        );

        it("should accept valid hexadecimal colors", () => {
            fade.setColor("#182d50");

            expect(fade.color).toBe("#182d50");
        });

        it("should preserve the current color when validation fails", () => {
            fade.setColor("#182d50");
            fade.setColor("invalid");

            expect(fade.color).toBe("#182d50");
        });
    });

    describe("Fade in", () => {
        it("should begin with a fully covered screen", () => {
            fade.fadeIn(2);

            expect(fade.opacity).toBe(1);
        });

        it("should activate the transition", () => {
            fade.fadeIn(2);

            expect(fade.isTransitioning).toBe(true);
        });

        it("should configure the requested duration", () => {
            fade.fadeIn(2);

            expect(fade.duration).toBe(2);
        });

        it("should target a transparent screen", () => {
            fade.fadeIn(2);

            expect(fade.targetOpacity).toBe(0);
        });

        it.each([
            [0.5, 0.75],
            [1, 0.5],
            [1.5, 0.25],
            [2, 0]
        ])(
            "should reach opacity %s after %s seconds",
            (elapsed, expectedOpacity) => {
                fade.fadeIn(2);
                fade.update(elapsed);

                expect(fade.opacity)
                    .toBeCloseTo(expectedOpacity);
            }
        );

        it("should support incremental frame updates", () => {
            fade.fadeIn(2);

            fade.update(0.5);
            fade.update(0.5);

            expect(fade.opacity).toBeCloseTo(0.5);
        });

        it("should complete when the duration is reached", () => {
            fade.fadeIn(2);
            fade.update(2);

            expect(fade.opacity).toBe(0);
            expect(fade.isTransitioning).toBe(false);
        });

        it("should not produce negative opacity", () => {
            fade.fadeIn(2);
            fade.update(10);

            expect(fade.opacity).toBe(0);
        });

        it("should support the default fade duration", () => {
            fade.fadeIn();

            expect(fade.duration).toBe(2);
        });
    });

    describe("Fade out", () => {
        it("should begin with a transparent screen", () => {
            fade.fadeOut(2);

            expect(fade.opacity).toBe(0);
        });

        it("should target a fully covered screen", () => {
            fade.fadeOut(2);

            expect(fade.targetOpacity).toBe(1);
        });

        it("should activate the transition", () => {
            fade.fadeOut(2);

            expect(fade.isTransitioning).toBe(true);
        });

        it.each([
            [0.5, 0.25],
            [1, 0.5],
            [1.5, 0.75],
            [2, 1]
        ])(
            "should reach the expected opacity after %s seconds",
            (elapsed, expectedOpacity) => {
                fade.fadeOut(2);
                fade.update(elapsed);

                expect(fade.opacity)
                    .toBeCloseTo(expectedOpacity);
            }
        );

        it("should complete with a fully covered screen", () => {
            fade.fadeOut(2);
            fade.update(2);

            expect(fade.opacity).toBe(1);
            expect(fade.isTransitioning).toBe(false);
        });

        it("should not exceed maximum opacity", () => {
            fade.fadeOut(2);
            fade.update(10);

            expect(fade.opacity).toBe(1);
        });

        it("should support the default fade duration", () => {
            fade.fadeOut();

            expect(fade.duration).toBe(2);
        });
    });

    describe("Duration validation", () => {
        it.each([
            0,
            -1,
            NaN,
            Infinity,
            -Infinity,
            null,
            "2"
        ])(
            "should immediately complete fade in for invalid duration %s",
            (duration) => {
                fade.fadeIn(duration);

                expect(fade.opacity).toBe(0);
                expect(fade.isTransitioning).toBe(false);
            }
        );

        it.each([
            0,
            -1,
            NaN,
            Infinity,
            -Infinity,
            null,
            "2"
        ])(
            "should immediately complete fade out for invalid duration %s",
            (duration) => {
                fade.fadeOut(duration);

                expect(fade.opacity).toBe(1);
                expect(fade.isTransitioning).toBe(false);
            }
        );
    });

    describe("Opacity control", () => {
        it("should support manual opacity changes", () => {
            fade.setOpacity(0.4);

            expect(fade.opacity).toBeCloseTo(0.4);
        });

        it("should clamp opacity above one", () => {
            fade.setOpacity(2);

            expect(fade.opacity).toBe(1);
        });

        it("should clamp opacity below zero", () => {
            fade.setOpacity(-1);

            expect(fade.opacity).toBe(0);
        });

        it.each([
            NaN,
            Infinity,
            -Infinity,
            undefined,
            null,
            "0.5"
        ])(
            "should ignore invalid opacity %s",
            (opacity) => {
                fade.setOpacity(0.5);
                fade.setOpacity(opacity);

                expect(fade.opacity).toBe(0.5);
            }
        );

        it("should cancel an active transition", () => {
            fade.fadeIn(2);
            fade.setOpacity(0.3);

            expect(fade.opacity).toBeCloseTo(0.3);
            expect(fade.isTransitioning).toBe(false);
        });
    });

    describe("Delta time handling", () => {
        it.each([
            0,
            -1,
            NaN,
            Infinity,
            -Infinity,
            undefined,
            null,
            "1"
        ])(
            "should ignore invalid delta time %s",
            (deltaTime) => {
                fade.fadeIn(2);
                fade.update(deltaTime);

                expect(fade.opacity).toBe(1);
                expect(fade.elapsedTime).toBe(0);
            }
        );

        it("should ignore updates without an active transition", () => {
            fade.setOpacity(0.5);
            fade.update(1);

            expect(fade.opacity).toBe(0.5);
        });

        it("should not advance beyond the transition duration", () => {
            fade.fadeIn(2);
            fade.update(5);

            expect(fade.elapsedTime).toBe(2);
        });

        it("should preserve opacity after completing a transition", () => {
            fade.fadeIn(2);
            fade.update(2);
            fade.update(5);

            expect(fade.opacity).toBe(0);
        });
    });

    describe("Transition lifecycle", () => {
        it("should support multiple consecutive transitions", () => {
            fade.fadeIn(2);
            fade.update(2);

            fade.fadeOut(2);
            fade.update(2);

            expect(fade.opacity).toBe(1);
            expect(fade.isTransitioning).toBe(false);
        });

        it("should reset elapsed time when starting a new transition", () => {
            fade.fadeIn(2);
            fade.update(1);

            fade.fadeOut(2);

            expect(fade.elapsedTime).toBe(0);
        });

        it("should support restarting a fade in transition", () => {
            fade.fadeIn(2);
            fade.update(1);

            fade.fadeIn(2);

            expect(fade.opacity).toBe(1);
            expect(fade.elapsedTime).toBe(0);
        });

        it("should support reversing a transition without an opacity jump", () => {
            fade.fadeIn(2);
            fade.update(1);

            fade.fadeOut(2);

            expect(fade.opacity).toBeCloseTo(0.5);

            fade.update(1);

            expect(fade.opacity).toBeCloseTo(0.75);
        });
    });

    describe("Reset", () => {
        it("should restore transparent opacity", () => {
            fade.fadeIn(2);
            fade.reset();

            expect(fade.opacity).toBe(0);
        });

        it("should cancel an active transition", () => {
            fade.fadeOut(2);
            fade.reset();

            expect(fade.isTransitioning).toBe(false);
        });

        it("should reset elapsed time", () => {
            fade.fadeIn(2);
            fade.update(1);

            fade.reset();

            expect(fade.elapsedTime).toBe(0);
        });

        it("should preserve the configured color", () => {
            fade.setColor("#ffffff");
            fade.reset();

            expect(fade.color).toBe("#ffffff");
        });
    });

    describe("Rendering", () => {
        it("should not draw a transparent fade", () => {
            fade.draw(ctx, 480, 384);

            expect(ctx.fillRect)
                .not.toHaveBeenCalled();
        });

        it("should render a fully covered screen", () => {
            fade.setOpacity(1);

            fade.draw(ctx, 480, 384);

            expect(ctx.fillRect)
                .toHaveBeenCalledWith(
                    0, 0, 480, 384
                );
        });

        it("should apply the current fade opacity", () => {
            fade.setOpacity(0.5);

            fade.draw(ctx, 480, 384);

            expect(ctx.globalAlpha)
                .toBeCloseTo(0.5);
        });

        it("should render using the configured color", () => {
            fade.setColor("#182d50");
            fade.setOpacity(1);

            fade.draw(ctx, 480, 384);

            expect(ctx.fillStyle)
                .toBe("#182d50");
        });

        it("should render in screen coordinates", () => {
            fade.setOpacity(1);

            fade.draw(ctx, 480, 384);

            expect(ctx.setTransform)
                .toHaveBeenCalledWith(
                    1, 0, 0, 1, 0, 0
                );
        });

        it("should use normal canvas compositing", () => {
            fade.setOpacity(1);

            ctx.globalCompositeOperation = "lighter";

            fade.draw(ctx, 480, 384);

            expect(ctx.globalCompositeOperation)
                .toBe("source-over");
        });

        it("should preserve the canvas rendering state", () => {
            fade.setOpacity(1);

            fade.draw(ctx, 480, 384);

            expect(ctx.save)
                .toHaveBeenCalledTimes(1);

            expect(ctx.restore)
                .toHaveBeenCalledTimes(1);
        });

        it("should support different viewport dimensions", () => {
            fade.setOpacity(1);

            fade.draw(ctx, 800, 600);

            expect(ctx.fillRect)
                .toHaveBeenCalledWith(
                    0, 0, 800, 600
                );
        });

        it.each([
            [0, 384],
            [480, 0],
            [-1, 384],
            [480, -1],
            [NaN, 384],
            [480, NaN],
            [Infinity, 384],
            [480, Infinity],
            [null, 384],
            [480, undefined]
        ])(
            "should reject invalid viewport dimensions (%s, %s)",
            (width, height) => {
                fade.setOpacity(1);

                fade.draw(ctx, width, height);

                expect(ctx.fillRect)
                    .not.toHaveBeenCalled();
            }
        );

        it("should not modify transition progress during rendering", () => {
            fade.fadeIn(2);
            fade.update(0.5);

            fade.draw(ctx, 480, 384);
            fade.draw(ctx, 480, 384);

            expect(fade.opacity).toBeCloseTo(0.75);
            expect(fade.elapsedTime).toBe(0.5);
        });
    });
});
