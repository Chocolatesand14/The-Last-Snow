
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AmbientLight } from "../src/lighting/AmbientLight.js";
import { WeatherType } from "../src/weather/WeatherType.js";

describe("AmbientLight", () => {
    let light;

    beforeEach(() => {
        light = new AmbientLight();
    });

    describe("Initialization", () => {
        it("should initialize with the default winter color", () => {
            expect(light.color).toBe("#182d50");
        });

        it("should initialize with the default opacity", () => {
            expect(light.opacity).toBe(0.15);
        });

        it("should initialize with the correct target opacity", () => {
            expect(light.targetOpacity).toBe(0.15);
        });

        it("should initialize as enabled", () => {
            expect(light.enabled).toBe(true);
        });

        it("should initialize without an active transition", () => {
            expect(light.isTransitioning).toBe(false);
        });

        it("should initialize transition timing to zero", () => {
            expect(light.transitionDuration).toBe(0);
            expect(light.transitionElapsed).toBe(0);
        });

        it("should support custom initial opacity", () => {
            const customLight = new AmbientLight(0.4);

            expect(customLight.opacity).toBe(0.4);
            expect(customLight.targetOpacity).toBe(0.4);
        });

        it("should support a custom ambient color", () => {
            const customLight = new AmbientLight(
                0.3, "#243b55"
            );

            expect(customLight.color).toBe("#243b55");
        });

        it.each([NaN, Infinity, -Infinity, null])(
            "should use default opacity for invalid value %s",
            (opacity) => {
                const invalidLight = new AmbientLight(opacity);

                expect(invalidLight.opacity).toBe(0.15);
                expect(invalidLight.targetOpacity).toBe(0.15);
            }
        );

        it.each([
            [-1, 0],
            [2, 1]
        ])(
            "should clamp initial opacity %s to %s",
            (opacity, expected) => {
                const customLight = new AmbientLight(opacity);

                expect(customLight.opacity).toBe(expected);
                expect(customLight.targetOpacity).toBe(expected);
            }
        );
    });

    describe("Immediate opacity changes", () => {
        it("should update opacity immediately", () => {
            light.setOpacity(0.5);

            expect(light.opacity).toBe(0.5);
            expect(light.targetOpacity).toBe(0.5);
        });

        it("should support fully transparent ambient lighting", () => {
            light.setOpacity(0);

            expect(light.opacity).toBe(0);
        });

        it("should support maximum ambient opacity", () => {
            light.setOpacity(1);

            expect(light.opacity).toBe(1);
        });

        it("should clamp opacity above one", () => {
            light.setOpacity(2);

            expect(light.opacity).toBe(1);
        });

        it("should clamp opacity below zero", () => {
            light.setOpacity(-0.5);

            expect(light.opacity).toBe(0);
        });

        it.each([NaN, Infinity, -Infinity, null, undefined])(
            "should reject invalid opacity %s",
            (opacity) => {
                light.setOpacity(opacity);

                expect(light.opacity).toBe(0.15);
                expect(light.targetOpacity).toBe(0.15);
            }
        );

        it("should cancel an active transition", () => {
            light.setOpacity(0.6, 10);
            light.update(5);

            light.setOpacity(0.2);

            expect(light.opacity).toBe(0.2);
            expect(light.targetOpacity).toBe(0.2);
            expect(light.isTransitioning).toBe(false);
            expect(light.transitionDuration).toBe(0);
            expect(light.transitionElapsed).toBe(0);
        });
    });

    describe("Color handling", () => {
        it("should support changing the ambient color", () => {
            light.setColor("#243b55");

            expect(light.color).toBe("#243b55");
        });

        it("should support uppercase hexadecimal colors", () => {
            light.setColor("#ABCDEF");

            expect(light.color).toBe("#ABCDEF");
        });

        it.each([
            "",
            "invalid",
            "#123",
            "#12345678",
            "#GGGGGG",
            null,
            undefined,
            123
        ])(
            "should reject invalid ambient color %s",
            (color) => {
                light.setColor(color);

                expect(light.color).toBe("#182d50");
            }
        );

        it("should use the default color for invalid constructor input", () => {
            const invalidLight = new AmbientLight(
                0.3, "invalid"
            );

            expect(invalidLight.color).toBe("#182d50");
        });
    });

    describe("Gradual light transitions", () => {
        it("should initialize a gradual transition", () => {
            light.setOpacity(0.4, 10);

            expect(light.opacity).toBe(0.15);
            expect(light.targetOpacity).toBe(0.4);
            expect(light.transitionDuration).toBe(10);
            expect(light.transitionElapsed).toBe(0);
            expect(light.isTransitioning).toBe(true);
        });

        it("should gradually increase ambient opacity", () => {
            light.setOpacity(0.45, 10);

            light.update(5);

            expect(light.opacity).toBeCloseTo(0.3);
        });

        it("should gradually decrease ambient opacity", () => {
            light.setOpacity(0.6);
            light.setOpacity(0.2, 10);

            light.update(5);

            expect(light.opacity).toBeCloseTo(0.4);
        });

        it.each([
            [2.5, 0.25],
            [5, 0.35],
            [7.5, 0.45],
            [10, 0.55]
        ])(
            "should interpolate opacity after %s seconds",
            (elapsed, expectedOpacity) => {
                light.setOpacity(0.55, 10);

                light.update(elapsed);

                expect(light.opacity)
                    .toBeCloseTo(expectedOpacity);
            }
        );

        it("should accumulate transition time across updates", () => {
            light.setOpacity(0.55, 10);

            light.update(2);
            light.update(3);

            expect(light.transitionElapsed).toBe(5);
            expect(light.opacity).toBeCloseTo(0.35);
        });

        it("should complete the transition at the target opacity", () => {
            light.setOpacity(0.4, 10);

            light.update(10);

            expect(light.opacity).toBe(0.4);
            expect(light.isTransitioning).toBe(false);
        });

        it("should not overshoot the target opacity", () => {
            light.setOpacity(0.4, 10);

            light.update(20);

            expect(light.opacity).toBe(0.4);
            expect(light.isTransitioning).toBe(false);
        });

        it("should preserve opacity after a completed transition", () => {
            light.setOpacity(0.4, 5);

            light.update(5);
            light.update(10);

            expect(light.opacity).toBe(0.4);
        });

        it("should support replacing an active transition", () => {
            light.setOpacity(0.55, 10);
            light.update(5);

            expect(light.opacity).toBeCloseTo(0.35);

            light.setOpacity(0.75, 10);
            light.update(5);

            expect(light.opacity).toBeCloseTo(0.55);
        });

        it("should not jump when replacing a transition", () => {
            light.setOpacity(0.55, 10);
            light.update(5);

            const previousOpacity = light.opacity;

            light.setOpacity(0.8, 10);

            expect(light.opacity).toBe(previousOpacity);
        });

        it("should support an immediate transition with zero duration", () => {
            light.setOpacity(0.4, 0);

            expect(light.opacity).toBe(0.4);
            expect(light.isTransitioning).toBe(false);
        });

        it.each([
            -1, NaN, Infinity, -Infinity, null
        ])(
            "should apply opacity immediately for invalid duration %s",
            (duration) => {
                light.setOpacity(0.4, duration);

                expect(light.opacity).toBe(0.4);
                expect(light.isTransitioning).toBe(false);
            }
        );

        it("should not start an unnecessary transition", () => {
            light.setOpacity(0.15, 10);

            expect(light.isTransitioning).toBe(false);
        });

        it("should clamp a transition target above one", () => {
            light.setOpacity(2, 10);

            expect(light.targetOpacity).toBe(1);

            light.update(10);

            expect(light.opacity).toBe(1);
        });

        it("should clamp a transition target below zero", () => {
            light.setOpacity(-1, 10);

            expect(light.targetOpacity).toBe(0);

            light.update(10);

            expect(light.opacity).toBe(0);
        });

        it("should preserve an active transition after invalid opacity input", () => {
            light.setOpacity(0.6, 10);

            light.setOpacity(NaN, 5);

            expect(light.targetOpacity).toBe(0.6);
            expect(light.transitionDuration).toBe(10);
            expect(light.isTransitioning).toBe(true);
        });

        it("should not restart a transition to the same target", () => {
            light.setOpacity(0.55, 10);
            light.update(5);

            light.setOpacity(0.55, 10);
            light.update(5);

            expect(light.opacity).toBe(0.55);
            expect(light.isTransitioning).toBe(false);
        });
    });

    describe("Time validation", () => {
        it.each([
            0, -1, NaN, Infinity, -Infinity, null, undefined
        ])(
            "should reject invalid delta time %s",
            (deltaTime) => {
                light.setOpacity(0.6, 10);

                light.update(deltaTime);

                expect(light.opacity).toBe(0.15);
                expect(light.transitionElapsed).toBe(0);
                expect(light.isTransitioning).toBe(true);
            }
        );

        it("should preserve opacity without an active transition", () => {
            light.update(10);

            expect(light.opacity).toBe(0.15);
        });

        it("should support fractional delta time", () => {
            light.setOpacity(0.55, 10);

            light.update(0.5);

            expect(light.opacity).toBeCloseTo(0.17);
            expect(light.transitionElapsed).toBe(0.5);
        });
    });

    describe("Weather-dependent ambient lighting", () => {
        it.each([
            [WeatherType.CLEAR, 0.05],
            [WeatherType.LIGHT_SNOW, 0.10],
            [WeatherType.SNOWFALL, 0.15],
            [WeatherType.HEAVY_SNOW, 0.25],
            [WeatherType.BLIZZARD, 0.40]
        ])(
            "should return the correct ambient opacity for %s",
            (weather, expectedOpacity) => {
                expect(light.getWeatherOpacity(weather))
                    .toBe(expectedOpacity);
            }
        );

        it.each([
            "invalid", null, undefined, 123
        ])(
            "should use default opacity for unsupported weather %s",
            (weather) => {
                expect(light.getWeatherOpacity(weather))
                    .toBe(0.15);
            }
        );

        it("should immediately apply clear weather lighting", () => {
            light.setWeather(WeatherType.CLEAR, 0);

            expect(light.opacity).toBe(0.05);
            expect(light.isTransitioning).toBe(false);
        });

        it("should immediately apply blizzard lighting", () => {
            light.setWeather(WeatherType.BLIZZARD, 0);

            expect(light.opacity).toBe(0.40);
        });

        it("should use a default weather transition duration", () => {
            light.setWeather(WeatherType.BLIZZARD);

            expect(light.targetOpacity).toBe(0.40);
            expect(light.transitionDuration).toBe(5);
            expect(light.isTransitioning).toBe(true);
        });

        it("should gradually adapt lighting during heavy snowfall", () => {
            light.setWeather(WeatherType.HEAVY_SNOW, 10);

            light.update(5);

            expect(light.opacity).toBeCloseTo(0.20);
        });

        it("should gradually restore lighting when weather improves", () => {
            light.setWeather(WeatherType.BLIZZARD, 0);
            light.setWeather(WeatherType.CLEAR, 10);

            light.update(5);

            expect(light.opacity).toBeCloseTo(0.225);
        });

        it("should not restart an existing weather transition", () => {
            light.setWeather(WeatherType.BLIZZARD, 10);

            light.update(5);

            light.setWeather(WeatherType.BLIZZARD, 10);

            light.update(5);

            expect(light.opacity).toBe(0.40);
            expect(light.isTransitioning).toBe(false);
        });

        it("should use default lighting for unsupported weather", () => {
            light.setOpacity(0.5);

            light.setWeather("invalid", 0);

            expect(light.opacity).toBe(0.15);
        });
    });

    describe("System configuration", () => {
        it("should support disabling ambient lighting", () => {
            light.setEnabled(false);

            expect(light.enabled).toBe(false);
        });

        it("should support enabling ambient lighting", () => {
            light.setEnabled(false);
            light.setEnabled(true);

            expect(light.enabled).toBe(true);
        });

        it.each(["false", 0, null, undefined])(
            "should reject invalid enabled value %s",
            (enabled) => {
                light.setEnabled(enabled);

                expect(light.enabled).toBe(true);
            }
        );

        it("should preserve opacity while disabled", () => {
            light.setEnabled(false);

            expect(light.opacity).toBe(0.15);
        });

        it("should continue transitions while disabled", () => {
            light.setOpacity(0.55, 10);
            light.setEnabled(false);

            light.update(5);

            expect(light.opacity).toBeCloseTo(0.35);
        });
    });

    describe("Ambient light rendering", () => {
        let ctx;

        beforeEach(() => {
            ctx = {
                save: vi.fn(),
                restore: vi.fn(),
                setTransform: vi.fn(),
                fillRect: vi.fn(),
                globalAlpha: 1,
                fillStyle: "",
                globalCompositeOperation: "source-over"
            };
        });

        it("should render an ambient lighting overlay", () => {
            light.draw(ctx, 480, 384);

            expect(ctx.fillRect)
                .toHaveBeenCalledWith(0, 0, 480, 384);
        });

        it("should render using the configured ambient color", () => {
            light.draw(ctx, 480, 384);

            expect(ctx.fillStyle).toBe("#182d50");
        });

        it("should render using the current opacity", () => {
            light.setOpacity(0.4);

            light.draw(ctx, 480, 384);

            expect(ctx.globalAlpha).toBe(0.4);
        });

        it("should render in screen coordinates", () => {
            light.draw(ctx, 480, 384);

            expect(ctx.setTransform)
                .toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
        });

        it("should use normal overlay compositing", () => {
            ctx.globalCompositeOperation = "multiply";

            light.draw(ctx, 480, 384);

            expect(ctx.globalCompositeOperation)
                .toBe("source-over");
        });

        it("should preserve the canvas state", () => {
            light.draw(ctx, 480, 384);

            expect(ctx.save).toHaveBeenCalledTimes(1);
            expect(ctx.restore).toHaveBeenCalledTimes(1);
        });

        it("should not render when disabled", () => {
            light.setEnabled(false);

            light.draw(ctx, 480, 384);

            expect(ctx.fillRect).not.toHaveBeenCalled();
            expect(ctx.save).not.toHaveBeenCalled();
        });

        it("should not render fully transparent ambient lighting", () => {
            light.setOpacity(0);

            light.draw(ctx, 480, 384);

            expect(ctx.fillRect).not.toHaveBeenCalled();
        });

        it("should render again when enabled", () => {
            light.setEnabled(false);
            light.draw(ctx, 480, 384);

            light.setEnabled(true);
            light.draw(ctx, 480, 384);

            expect(ctx.fillRect).toHaveBeenCalledTimes(1);
        });

        it("should render using custom viewport dimensions", () => {
            light.draw(ctx, 800, 600);

            expect(ctx.fillRect)
                .toHaveBeenCalledWith(0, 0, 800, 600);
        });

        it.each([
            [0, 384],
            [480, 0],
            [-480, 384],
            [480, -384],
            [NaN, 384],
            [480, NaN],
            [Infinity, 384],
            [480, Infinity],
            [null, 384],
            [480, null]
        ])(
            "should reject invalid viewport dimensions (%s, %s)",
            (width, height) => {
                light.draw(ctx, width, height);

                expect(ctx.fillRect).not.toHaveBeenCalled();
                expect(ctx.save).not.toHaveBeenCalled();
            }
        );

        it("should render the interpolated opacity during transitions", () => {
            light.setOpacity(0.55, 10);
            light.update(5);

            light.draw(ctx, 480, 384);

            expect(ctx.globalAlpha).toBeCloseTo(0.35);
        });
    });
});
