
import { describe, it, expect, beforeEach, vi } from "vitest";
import { LightSource } from "../src/lighting/LightSource.js";

describe("LightSource", () => {
    let light;

    beforeEach(() => {
        light = new LightSource(100, 200);
    });

    describe("Initialization", () => {
        it("should initialize with the correct position", () => {
            expect(light.x).toBe(100);
            expect(light.y).toBe(200);
        });

        it("should initialize with the default radius", () => {
            expect(light.radius).toBe(64);
        });

        it("should initialize with the default intensity", () => {
            expect(light.intensity).toBe(0.8);
        });

        it("should initialize with a warm light color", () => {
            expect(light.color).toBe("#ffcf85");
        });

        it("should initialize as enabled", () => {
            expect(light.enabled).toBe(true);
        });

        it("should initialize with flickering disabled", () => {
            expect(light.flickerEnabled).toBe(false);
        });

        it("should initialize with default flicker settings", () => {
            expect(light.flickerAmplitude).toBe(0.1);
            expect(light.flickerFrequency).toBe(2);
            expect(light.elapsedTime).toBe(0);
        });

        it("should support custom light properties", () => {
            const customLight = new LightSource(
                50,
                75,
                120,
                0.6,
                "#80dfff"
            );

            expect(customLight.x).toBe(50);
            expect(customLight.y).toBe(75);
            expect(customLight.radius).toBe(120);
            expect(customLight.intensity).toBe(0.6);
            expect(customLight.color).toBe("#80dfff");
        });

        it("should support negative world coordinates", () => {
            const customLight = new LightSource(-20, -40);

            expect(customLight.x).toBe(-20);
            expect(customLight.y).toBe(-40);
        });

        it.each([
            NaN, Infinity, -Infinity, null
        ])(
            "should use zero for an invalid initial x coordinate",
            (x) => {
                const customLight = new LightSource(x, 100);

                expect(customLight.x).toBe(0);
                expect(customLight.y).toBe(100);
            }
        );

        it.each([
            NaN, Infinity, -Infinity, null
        ])(
            "should use zero for an invalid initial y coordinate",
            (y) => {
                const customLight = new LightSource(100, y);

                expect(customLight.x).toBe(100);
                expect(customLight.y).toBe(0);
            }
        );

        it.each([
            0, -1, NaN, Infinity, -Infinity, null
        ])(
            "should use the default radius for invalid input %s",
            (radius) => {
                const customLight = new LightSource(
                    100, 200, radius
                );

                expect(customLight.radius).toBe(64);
            }
        );

        it.each([
            NaN, Infinity, -Infinity, null
        ])(
            "should use the default intensity for invalid input %s",
            (intensity) => {
                const customLight = new LightSource(
                    100, 200, 64, intensity
                );

                expect(customLight.intensity).toBe(0.8);
            }
        );

        it.each([
            [-1, 0],
            [2, 1]
        ])(
            "should clamp initial intensity %s to %s",
            (intensity, expected) => {
                const customLight = new LightSource(
                    100, 200, 64, intensity
                );

                expect(customLight.intensity).toBe(expected);
            }
        );

        it("should use the default color for invalid input", () => {
            const customLight = new LightSource(
                100, 200, 64, 0.8, "invalid"
            );

            expect(customLight.color).toBe("#ffcf85");
        });
    });

    describe("Position handling", () => {
        it("should update the light position", () => {
            light.setPosition(300, 400);

            expect(light.x).toBe(300);
            expect(light.y).toBe(400);
        });

        it("should support fractional coordinates", () => {
            light.setPosition(100.5, 200.75);

            expect(light.x).toBe(100.5);
            expect(light.y).toBe(200.75);
        });

        it("should support negative coordinates", () => {
            light.setPosition(-50, -75);

            expect(light.x).toBe(-50);
            expect(light.y).toBe(-75);
        });

        it("should support zero coordinates", () => {
            light.setPosition(0, 0);

            expect(light.x).toBe(0);
            expect(light.y).toBe(0);
        });

        it.each([
            [NaN, 300],
            [300, NaN],
            [Infinity, 300],
            [300, Infinity],
            [-Infinity, 300],
            [300, -Infinity],
            [null, 300],
            [300, undefined]
        ])(
            "should reject invalid coordinates (%s, %s)",
            (x, y) => {
                light.setPosition(x, y);

                expect(light.x).toBe(100);
                expect(light.y).toBe(200);
            }
        );
    });

    describe("Radius handling", () => {
        it("should update the light radius", () => {
            light.setRadius(128);

            expect(light.radius).toBe(128);
        });

        it("should support small light sources", () => {
            light.setRadius(1);

            expect(light.radius).toBe(1);
        });

        it("should support fractional radius values", () => {
            light.setRadius(32.5);

            expect(light.radius).toBe(32.5);
        });

        it.each([
            0, -1, NaN, Infinity,
            -Infinity, null, undefined
        ])(
            "should reject invalid radius %s",
            (radius) => {
                light.setRadius(radius);

                expect(light.radius).toBe(64);
            }
        );
    });

    describe("Intensity handling", () => {
        it("should update light intensity", () => {
            light.setIntensity(0.5);

            expect(light.intensity).toBe(0.5);
        });

        it("should support zero intensity", () => {
            light.setIntensity(0);

            expect(light.intensity).toBe(0);
        });

        it("should support maximum intensity", () => {
            light.setIntensity(1);

            expect(light.intensity).toBe(1);
        });

        it("should clamp intensity above one", () => {
            light.setIntensity(2);

            expect(light.intensity).toBe(1);
        });

        it("should clamp intensity below zero", () => {
            light.setIntensity(-1);

            expect(light.intensity).toBe(0);
        });

        it.each([
            NaN, Infinity, -Infinity, null, undefined
        ])(
            "should reject invalid intensity %s",
            (intensity) => {
                light.setIntensity(intensity);

                expect(light.intensity).toBe(0.8);
            }
        );

        it("should return the base intensity without flickering", () => {
            expect(light.getEffectiveIntensity())
                .toBe(0.8);
        });
    });

    describe("Color handling", () => {
        it("should support changing the light color", () => {
            light.setColor("#80dfff");

            expect(light.color).toBe("#80dfff");
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
            "should reject invalid color %s",
            (color) => {
                light.setColor(color);

                expect(light.color).toBe("#ffcf85");
            }
        );
    });

    describe("System configuration", () => {
        it("should support disabling the light", () => {
            light.setEnabled(false);

            expect(light.enabled).toBe(false);
        });

        it("should support enabling the light", () => {
            light.setEnabled(false);
            light.setEnabled(true);

            expect(light.enabled).toBe(true);
        });

        it.each([
            "false", 0, null, undefined
        ])(
            "should reject invalid enabled value %s",
            (enabled) => {
                light.setEnabled(enabled);

                expect(light.enabled).toBe(true);
            }
        );

        it("should preserve light properties when disabled", () => {
            light.setEnabled(false);

            expect(light.radius).toBe(64);
            expect(light.intensity).toBe(0.8);
            expect(light.color).toBe("#ffcf85");
        });
    });

    describe("Flickering configuration", () => {
        it("should enable flickering", () => {
            light.setFlickerEnabled(true);

            expect(light.flickerEnabled).toBe(true);
        });

        it("should disable flickering", () => {
            light.setFlickerEnabled(true);
            light.setFlickerEnabled(false);

            expect(light.flickerEnabled).toBe(false);
        });

        it.each([
            "true", 1, null, undefined
        ])(
            "should reject invalid flicker state %s",
            (enabled) => {
                light.setFlickerEnabled(enabled);

                expect(light.flickerEnabled).toBe(false);
            }
        );

        it("should update flicker amplitude", () => {
            light.setFlickerAmplitude(0.2);

            expect(light.flickerAmplitude).toBe(0.2);
        });

        it("should support zero flicker amplitude", () => {
            light.setFlickerAmplitude(0);

            expect(light.flickerAmplitude).toBe(0);
        });

        it("should clamp flicker amplitude above one", () => {
            light.setFlickerAmplitude(2);

            expect(light.flickerAmplitude).toBe(1);
        });

        it("should clamp flicker amplitude below zero", () => {
            light.setFlickerAmplitude(-1);

            expect(light.flickerAmplitude).toBe(0);
        });

        it.each([
            NaN, Infinity, -Infinity, null, undefined
        ])(
            "should reject invalid flicker amplitude %s",
            (amplitude) => {
                light.setFlickerAmplitude(amplitude);

                expect(light.flickerAmplitude).toBe(0.1);
            }
        );

        it("should update flicker frequency", () => {
            light.setFlickerFrequency(4);

            expect(light.flickerFrequency).toBe(4);
        });

        it("should support fractional flicker frequency", () => {
            light.setFlickerFrequency(0.5);

            expect(light.flickerFrequency).toBe(0.5);
        });

        it.each([
            0, -1, NaN, Infinity,
            -Infinity, null, undefined
        ])(
            "should reject invalid flicker frequency %s",
            (frequency) => {
                light.setFlickerFrequency(frequency);

                expect(light.flickerFrequency).toBe(2);
            }
        );
    });

    describe("Dynamic flickering", () => {
        beforeEach(() => {
            light.setFlickerEnabled(true);
            light.setFlickerAmplitude(0.2);
            light.setFlickerFrequency(1);
            light.setIntensity(0.5);
        });

        it("should begin at the base intensity", () => {
            expect(light.getEffectiveIntensity())
                .toBeCloseTo(0.5);
        });

        it("should increase intensity during a flicker cycle", () => {
            light.update(0.25);

            expect(light.getEffectiveIntensity())
                .toBeCloseTo(0.7);
        });

        it("should decrease intensity during a flicker cycle", () => {
            light.update(0.75);

            expect(light.getEffectiveIntensity())
                .toBeCloseTo(0.3);
        });

        it("should return to base intensity after a full cycle", () => {
            light.update(1);

            expect(light.getEffectiveIntensity())
                .toBeCloseTo(0.5);
        });

        it("should accumulate elapsed time", () => {
            light.update(0.1);
            light.update(0.2);

            expect(light.elapsedTime)
                .toBeCloseTo(0.3);
        });

        it("should preserve the original intensity", () => {
            light.update(0.25);

            expect(light.intensity).toBe(0.5);
        });

        it("should never exceed maximum intensity", () => {
            light.setIntensity(0.95);
            light.update(0.25);

            expect(light.getEffectiveIntensity())
                .toBe(1);
        });

        it("should never fall below zero intensity", () => {
            light.setIntensity(0.05);
            light.update(0.75);

            expect(light.getEffectiveIntensity())
                .toBe(0);
        });

        it("should remain stable with zero flicker amplitude", () => {
            light.setFlickerAmplitude(0);
            light.update(0.25);

            expect(light.getEffectiveIntensity())
                .toBe(0.5);
        });

        it("should return to base intensity when flickering is disabled", () => {
            light.update(0.25);
            light.setFlickerEnabled(false);

            expect(light.getEffectiveIntensity())
                .toBe(0.5);
        });

        it("should produce deterministic flickering", () => {
            const secondLight = new LightSource(
                100, 200, 64, 0.5
            );

            secondLight.setFlickerEnabled(true);
            secondLight.setFlickerAmplitude(0.2);
            secondLight.setFlickerFrequency(1);

            light.update(0.25);
            secondLight.update(0.25);

            expect(light.getEffectiveIntensity())
                .toBe(secondLight.getEffectiveIntensity());
        });

        it("should continue flickering while rendering is disabled", () => {
            light.setEnabled(false);
            light.update(0.25);

            expect(light.getEffectiveIntensity())
                .toBeCloseTo(0.7);
        });

        it("should keep zero base intensity fully dark", () => {
            light.setIntensity(0);
            light.update(0.25);

            expect(light.getEffectiveIntensity())
                .toBe(0);
        });
    });

    describe("Time validation", () => {
        it.each([
            0, -1, NaN, Infinity,
            -Infinity, null, undefined
        ])(
            "should reject invalid delta time %s",
            (deltaTime) => {
                light.setFlickerEnabled(true);

                light.update(deltaTime);

                expect(light.elapsedTime).toBe(0);
            }
        );

        it("should support fractional delta time", () => {
            light.update(0.125);

            expect(light.elapsedTime).toBe(0.125);
        });
    });

    describe("Light rendering", () => {
        let ctx;
        let gradient;

        beforeEach(() => {
            gradient = {
                addColorStop: vi.fn()
            };

            ctx = {
                save: vi.fn(),
                restore: vi.fn(),
                beginPath: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),

                createRadialGradient:
                    vi.fn(() => gradient),

                fillStyle: "",
                globalAlpha: 1,
                globalCompositeOperation: "source-over"
            };
        });

        it("should create a radial light gradient", () => {
            light.draw(ctx);

            expect(ctx.createRadialGradient)
                .toHaveBeenCalledWith(
                    100, 200, 0,
                    100, 200, 64
                );
        });

        it("should draw a circular light source", () => {
            light.draw(ctx);

            expect(ctx.arc)
                .toHaveBeenCalledWith(
                    100,
                    200,
                    64,
                    0,
                    Math.PI * 2
                );

            expect(ctx.fill).toHaveBeenCalledTimes(1);
        });

        it("should use the configured light color", () => {
            light.draw(ctx);

            expect(gradient.addColorStop)
                .toHaveBeenCalledWith(0, "#ffcf85");
        });

        it("should fade the outer edge to transparency", () => {
            light.draw(ctx);

            expect(gradient.addColorStop)
                .toHaveBeenCalledWith(1, "transparent");
        });

        it("should use the effective light intensity", () => {
            light.setIntensity(0.5);
            light.draw(ctx);

            expect(ctx.globalAlpha).toBe(0.5);
        });

        it("should use additive light compositing", () => {
            light.draw(ctx);

            expect(ctx.globalCompositeOperation)
                .toBe("lighter");
        });

        it("should assign the radial gradient as the fill style", () => {
            light.draw(ctx);

            expect(ctx.fillStyle).toBe(gradient);
        });

        it("should begin a new drawing path", () => {
            light.draw(ctx);

            expect(ctx.beginPath)
                .toHaveBeenCalledTimes(1);
        });

        it("should preserve the canvas state", () => {
            light.draw(ctx);

            expect(ctx.save).toHaveBeenCalledTimes(1);
            expect(ctx.restore).toHaveBeenCalledTimes(1);
        });

        it("should not render disabled light sources", () => {
            light.setEnabled(false);

            light.draw(ctx);

            expect(ctx.fill).not.toHaveBeenCalled();
            expect(ctx.save).not.toHaveBeenCalled();
        });

        it("should not render lights with zero intensity", () => {
            light.setIntensity(0);

            light.draw(ctx);

            expect(ctx.fill).not.toHaveBeenCalled();
        });

        it("should skip lights with zero effective intensity", () => {
            light.setIntensity(0.1);
            light.setFlickerEnabled(true);
            light.setFlickerAmplitude(0.2);
            light.setFlickerFrequency(1);

            light.update(0.75);
            light.draw(ctx);

            expect(ctx.fill).not.toHaveBeenCalled();
        });

        it("should render again when enabled", () => {
            light.setEnabled(false);
            light.draw(ctx);

            light.setEnabled(true);
            light.draw(ctx);

            expect(ctx.fill).toHaveBeenCalledTimes(1);
        });

        it("should render using the updated radius", () => {
            light.setRadius(128);

            light.draw(ctx);

            expect(ctx.createRadialGradient)
                .toHaveBeenCalledWith(
                    100, 200, 0,
                    100, 200, 128
                );
        });

        it("should render using the updated position", () => {
            light.setPosition(300, 400);

            light.draw(ctx);

            expect(ctx.createRadialGradient)
                .toHaveBeenCalledWith(
                    300, 400, 0,
                    300, 400, 64
                );
        });

        it("should render using the updated color", () => {
            light.setColor("#80dfff");

            light.draw(ctx);

            expect(gradient.addColorStop)
                .toHaveBeenCalledWith(0, "#80dfff");
        });

        it("should render using the current flicker intensity", () => {
            light.setIntensity(0.5);
            light.setFlickerEnabled(true);
            light.setFlickerAmplitude(0.2);
            light.setFlickerFrequency(1);

            light.update(0.25);
            light.draw(ctx);

            expect(ctx.globalAlpha)
                .toBeCloseTo(0.7);
        });
    });
});
