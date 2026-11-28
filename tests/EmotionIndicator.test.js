
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

import { EmotionIndicator } from "../src/ui/EmotionIndicator.js";

describe("EmotionIndicator", () => {
    let indicator;
    let target;
    let ctx;

    beforeEach(() => {
        indicator = new EmotionIndicator();

        // Create a controlled character target
        target = {
            x: 100,
            y: 200,
            width: 64,
            height: 64
        };

        // Mock the canvas rendering context
        ctx = {
            save: vi.fn(),
            restore: vi.fn(),
            setTransform: vi.fn(),
            fillText: vi.fn(),
            strokeText: vi.fn(),
            font: "",
            fillStyle: "",
            strokeStyle: "",
            textAlign: "center",
            textBaseline: "middle",
            globalAlpha: 1,
            globalCompositeOperation: "source-over",
            imageSmoothingEnabled: true,
            lineWidth: 1
        };
    });

    describe("Initialization", () => {
        it("should initialize with no active emotion", () => {
            expect(indicator.emotion).toBe("none");
        });

        it("should initialize as hidden", () => {
            expect(indicator.isVisible).toBe(false);
        });

        it("should initialize without a target", () => {
            expect(indicator.target).toBeNull();
        });

        it("should initialize with zero elapsed time", () => {
            expect(indicator.elapsedTime).toBe(0);
        });

        it("should initialize with the pixel font", () => {
            expect(indicator.font)
                .toBe('10px "Press Start 2P", monospace');
        });

        it("should initialize with the default vertical offset", () => {
            expect(indicator.offsetY).toBe(12);
        });

        it("should maintain independent indicator instances", () => {
            const second = new EmotionIndicator();

            indicator.show("sleeping");

            expect(second.emotion).toBe("none");
            expect(second.isVisible).toBe(false);
        });
    });

    describe("Emotion states", () => {
        it.each([
            "sleeping",
            "surprised",
            "confused"
        ])(
            "should support the %s emotion",
            emotion => {
                indicator.show(emotion);

                expect(indicator.emotion).toBe(emotion);
                expect(indicator.isVisible).toBe(true);
            }
        );

        it("should return the sleeping symbol", () => {
            indicator.show("sleeping");

            expect(indicator.getSymbol()).toBe("Zzz");
        });

        it("should return the surprised symbol", () => {
            indicator.show("surprised");

            expect(indicator.getSymbol()).toBe("!");
        });

        it("should return the confused symbol", () => {
            indicator.show("confused");

            expect(indicator.getSymbol()).toBe("?");
        });

        it("should return an empty symbol without an emotion", () => {
            expect(indicator.getSymbol()).toBe("");
        });

        it("should replace the active emotion", () => {
            indicator.show("sleeping");
            indicator.show("surprised");

            expect(indicator.emotion).toBe("surprised");
            expect(indicator.getSymbol()).toBe("!");
        });

        it("should hide when the emotion is none", () => {
            indicator.show("sleeping");
            indicator.show("none");

            expect(indicator.emotion).toBe("none");
            expect(indicator.isVisible).toBe(false);
        });

        it.each([
            "",
            "unknown",
            "happy",
            null,
            undefined,
            123,
            {},
            []
        ])(
            "should reject invalid emotion %s",
            emotion => {
                indicator.show(emotion);

                expect(indicator.emotion).toBe("none");
                expect(indicator.isVisible).toBe(false);
            }
        );

        it("should preserve the active emotion after invalid input", () => {
            indicator.show("sleeping");
            indicator.show("invalid");

            expect(indicator.emotion).toBe("sleeping");
        });
    });

    describe("Target positioning", () => {
        it("should attach to a character", () => {
            indicator.setTarget(target);

            expect(indicator.target).toBe(target);
        });

        it("should center the indicator above the character", () => {
            indicator.setTarget(target);

            expect(indicator.getPosition()).toEqual({
                x: 132,
                y: 188
            });
        });

        it("should follow horizontal movement", () => {
            indicator.setTarget(target);

            target.x = 150;

            expect(indicator.getPosition().x).toBe(182);
        });

        it("should follow vertical movement", () => {
            indicator.setTarget(target);

            target.y = 250;

            expect(indicator.getPosition().y).toBe(238);
        });

        it("should respect different character dimensions", () => {
            indicator.setTarget({
                x: 100,
                y: 200,
                width: 32,
                height: 48
            });

            expect(indicator.getPosition()).toEqual({
                x: 116,
                y: 188
            });
        });

        it("should return null without a target", () => {
            expect(indicator.getPosition()).toBeNull();
        });

        it("should support detaching the target", () => {
            indicator.setTarget(target);
            indicator.setTarget(null);

            expect(indicator.target).toBeNull();
        });

        it.each([
            {},
            { x: NaN, y: 200, width: 64, height: 64 },
            { x: 100, y: Infinity, width: 64, height: 64 },
            { x: 100, y: 200, width: 0, height: 64 },
            { x: 100, y: 200, width: 64, height: -1 }
        ])(
            "should reject invalid character targets",
            invalidTarget => {
                indicator.setTarget(invalidTarget);

                expect(indicator.target).toBeNull();
            }
        );
    });

    describe("Camera integration", () => {
        beforeEach(() => {
            indicator.setTarget(target);
        });

        it("should convert world coordinates to screen coordinates", () => {
            expect(
                indicator.getPosition({
                    x: 50,
                    y: 100
                })
            ).toEqual({
                x: 82,
                y: 88
            });
        });

        it("should use rounded camera coordinates", () => {
            expect(
                indicator.getPosition({
                    x: 50.6,
                    y: 100.4
                })
            ).toEqual({
                x: 81,
                y: 88
            });
        });

        it("should follow camera movement", () => {
            const camera = {
                x: 50,
                y: 100
            };

            camera.x = 80;
            camera.y = 150;

            expect(indicator.getPosition(camera)).toEqual({
                x: 52,
                y: 38
            });
        });

        it("should preserve character world coordinates", () => {
            indicator.getPosition({
                x: 50,
                y: 100
            });

            expect(target.x).toBe(100);
            expect(target.y).toBe(200);
        });
    });

    describe("Animation timing", () => {
        it("should advance animation time while visible", () => {
            indicator.show("sleeping");
            indicator.update(0.5);

            expect(indicator.elapsedTime).toBeCloseTo(0.5);
        });

        it("should accumulate multiple frame updates", () => {
            indicator.show("sleeping");

            indicator.update(0.1);
            indicator.update(0.2);

            expect(indicator.elapsedTime).toBeCloseTo(0.3);
        });

        it("should reset animation time when changing emotion", () => {
            indicator.show("sleeping");
            indicator.update(1);

            indicator.show("surprised");

            expect(indicator.elapsedTime).toBe(0);
        });

        it("should ignore updates while hidden", () => {
            indicator.update(5);

            expect(indicator.elapsedTime).toBe(0);
        });

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
            "should reject invalid delta time %s",
            deltaTime => {
                indicator.show("sleeping");
                indicator.update(deltaTime);

                expect(indicator.elapsedTime).toBe(0);
            }
        );
    });

    describe("Emotion duration", () => {
        it("should remain visible without a duration limit", () => {
            indicator.show("sleeping");
            indicator.update(100);

            expect(indicator.isVisible).toBe(true);
        });

        it("should support a timed emotion", () => {
            indicator.show("surprised", 1);

            indicator.update(0.5);

            expect(indicator.isVisible).toBe(true);
        });

        it("should hide when the duration expires", () => {
            indicator.show("surprised", 1);

            indicator.update(1);

            expect(indicator.isVisible).toBe(false);
            expect(indicator.emotion).toBe("none");
        });

        it("should handle updates exceeding the duration", () => {
            indicator.show("confused", 2);

            indicator.update(5);

            expect(indicator.isVisible).toBe(false);
        });

        it("should reset the duration when showing a new emotion", () => {
            indicator.show("surprised", 1);
            indicator.update(0.5);

            indicator.show("sleeping");
            indicator.update(10);

            expect(indicator.isVisible).toBe(true);
        });

        it.each([
            0,
            -1,
            NaN,
            Infinity,
            -Infinity,
            null,
            "2"
        ])(
            "should treat invalid duration %s as unlimited",
            duration => {
                indicator.show("sleeping", duration);
                indicator.update(10);

                expect(indicator.isVisible).toBe(true);
            }
        );
    });

    describe("Animation offsets", () => {
        it("should return zero offset without an active emotion", () => {
            expect(indicator.getAnimationOffset()).toEqual({
                x: 0,
                y: 0
            });
        });

        it("should move sleeping symbols upwards", () => {
            indicator.show("sleeping");

            const initialOffset =
                indicator.getAnimationOffset();

            indicator.update(0.5);

            expect(indicator.getAnimationOffset().y)
                .toBeLessThan(initialOffset.y);
        });

        it("should repeat the sleeping animation", () => {
            indicator.show("sleeping");

            indicator.update(0.5);

            const initialOffset =
                indicator.getAnimationOffset();

            indicator.update(2);

            expect(indicator.getAnimationOffset().y)
                .toBeCloseTo(initialOffset.y);
        });

        it("should bounce the surprised symbol upwards", () => {
            indicator.show("surprised");

            const initialOffset =
                indicator.getAnimationOffset();

            indicator.update(0.25);

            expect(indicator.getAnimationOffset().y)
                .toBeLessThan(initialOffset.y);
        });

        it("should settle the surprised symbol after bouncing", () => {
            indicator.show("surprised");
            indicator.update(1);

            expect(indicator.getAnimationOffset().y)
                .toBeCloseTo(0);
        });

        it("should sway the confused symbol horizontally", () => {
            indicator.show("confused");
            indicator.update(0.25);

            expect(indicator.getAnimationOffset().x)
                .not.toBeCloseTo(0);
        });

        it.each([
            "sleeping",
            "surprised",
            "confused"
        ])(
            "should produce finite animation offsets for %s",
            emotion => {
                indicator.show(emotion);
                indicator.update(0.3);

                const offset =
                    indicator.getAnimationOffset();

                expect(Number.isFinite(offset.x)).toBe(true);
                expect(Number.isFinite(offset.y)).toBe(true);
            }
        );

        it("should not modify the character position", () => {
            indicator.setTarget(target);
            indicator.show("surprised");

            indicator.update(0.25);
            indicator.getAnimationOffset();

            expect(target.x).toBe(100);
            expect(target.y).toBe(200);
        });
    });

    describe("Hiding and resetting", () => {
        it("should hide the active indicator", () => {
            indicator.show("sleeping");
            indicator.hide();

            expect(indicator.isVisible).toBe(false);
        });

        it("should clear the active emotion when hidden", () => {
            indicator.show("sleeping");
            indicator.hide();

            expect(indicator.emotion).toBe("none");
        });

        it("should support repeated hide calls", () => {
            indicator.hide();
            indicator.hide();

            expect(indicator.isVisible).toBe(false);
        });

        it("should reset elapsed animation time", () => {
            indicator.show("sleeping");
            indicator.update(1);

            indicator.reset();

            expect(indicator.elapsedTime).toBe(0);
        });

        it("should reset the active emotion", () => {
            indicator.show("confused");
            indicator.reset();

            expect(indicator.emotion).toBe("none");
            expect(indicator.isVisible).toBe(false);
        });

        it("should preserve the assigned character when resetting", () => {
            indicator.setTarget(target);
            indicator.reset();

            expect(indicator.target).toBe(target);
        });

        it("should support reuse after resetting", () => {
            indicator.show("sleeping");
            indicator.reset();
            indicator.show("surprised");

            expect(indicator.emotion).toBe("surprised");
            expect(indicator.isVisible).toBe(true);
        });
    });

    describe("Rendering", () => {
        beforeEach(() => {
            indicator.setTarget(target);
        });

        it("should not render while hidden", () => {
            indicator.draw(ctx);

            expect(ctx.fillText).not.toHaveBeenCalled();
        });

        it("should not render without a target", () => {
            indicator.setTarget(null);
            indicator.show("sleeping");

            indicator.draw(ctx);

            expect(ctx.fillText).not.toHaveBeenCalled();
        });

        it.each([
            ["sleeping", "Zzz"],
            ["surprised", "!"],
            ["confused", "?"]
        ])(
            "should render the %s symbol",
            (emotion, symbol) => {
                indicator.show(emotion);
                indicator.draw(ctx);

                expect(ctx.fillText).toHaveBeenCalledWith(
                    symbol,
                    expect.any(Number),
                    expect.any(Number)
                );
            }
        );

        it("should render a readable symbol outline", () => {
            indicator.show("sleeping");
            indicator.draw(ctx);

            expect(ctx.strokeText).toHaveBeenCalledWith(
                "Zzz",
                expect.any(Number),
                expect.any(Number)
            );
        });

        it("should use the configured pixel font", () => {
            indicator.show("sleeping");
            indicator.draw(ctx);

            expect(ctx.font).toBe(indicator.font);
        });

        it("should disable image smoothing", () => {
            indicator.show("sleeping");
            indicator.draw(ctx);

            expect(ctx.imageSmoothingEnabled).toBe(false);
        });

        it("should render with centered text alignment", () => {
            indicator.show("sleeping");
            indicator.draw(ctx);

            expect(ctx.textAlign).toBe("center");
        });

        it("should render independently of the world transform", () => {
            indicator.show("surprised");

            indicator.draw(ctx, {
                x: 50,
                y: 100
            });

            expect(ctx.setTransform)
                .toHaveBeenCalledWith(
                    1, 0, 0, 1, 0, 0
                );
        });

        it("should render at the camera-adjusted character position", () => {
            indicator.show("surprised");

            indicator.draw(ctx, {
                x: 50,
                y: 100
            });

            expect(ctx.fillText)
                .toHaveBeenCalledWith("!", 82, 88);
        });

        it("should apply animation offsets while rendering", () => {
            indicator.show("sleeping");
            indicator.update(0.5);

            const position = indicator.getPosition();
            const offset = indicator.getAnimationOffset();

            indicator.draw(ctx);

            expect(ctx.fillText).toHaveBeenCalledWith(
                "Zzz",
                Math.round(position.x + offset.x),
                Math.round(position.y + offset.y)
            );
        });

        it("should preserve the canvas rendering state", () => {
            indicator.show("confused");
            indicator.draw(ctx);

            expect(ctx.save).toHaveBeenCalledTimes(1);
            expect(ctx.restore).toHaveBeenCalledTimes(1);
        });

        it("should not advance animation time during rendering", () => {
            indicator.show("sleeping");
            indicator.update(0.5);

            indicator.draw(ctx);
            indicator.draw(ctx);

            expect(indicator.elapsedTime).toBeCloseTo(0.5);
        });

        it("should stop rendering after the emotion expires", () => {
            indicator.show("surprised", 1);
            indicator.update(1);

            indicator.draw(ctx);

            expect(ctx.fillText).not.toHaveBeenCalled();
        });
    });
});
