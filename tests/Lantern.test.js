
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

import { Lantern } from "../src/entities/Lantern.js";
import { LightSource } from "../src/lighting/LightSource.js";
import { LightingSystem } from "../src/lighting/LightingSystem.js";
import { ShadowSystem } from "../src/lighting/ShadowSystem.js";

describe("Lantern", () => {
    let lantern;
    let lightingSystem;
    let shadowSystem;
    let ctx;

    beforeEach(() => {
        // Mock browser image loading
        vi.stubGlobal("Image", class {
            constructor() {
                this.src = "";
                this.complete = true;
                this.naturalWidth = 24;
                this.naturalHeight = 40;
            }
        });

        lantern = new Lantern(100, 200);
        lightingSystem = new LightingSystem();
        shadowSystem = new ShadowSystem();

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
            expect(lantern.x).toBe(100);
            expect(lantern.y).toBe(200);
        });

        it("should initialize with default dimensions", () => {
            expect(lantern.width).toBe(24);
            expect(lantern.height).toBe(40);
        });

        it("should support custom dimensions", () => {
            const custom = new Lantern(
                100, 200, 32, 48
            );

            expect(custom.width).toBe(32);
            expect(custom.height).toBe(48);
        });

        it("should initialize with the correct sprite path", () => {
            expect(lantern.image.src).toBe(
                "assets/sprites/environment/lanterns/lantern.png"
            );
        });

        it("should initialize in the lit state", () => {
            expect(lantern.isLit).toBe(true);
        });

        it("should initialize with the default light radius", () => {
            expect(lantern.lightRadius).toBe(80);
        });

        it("should initialize with the default light intensity", () => {
            expect(lantern.lightIntensity)
                .toBeCloseTo(0.65);
        });

        it("should initialize with a warm light color", () => {
            expect(lantern.lightColor)
                .toBe("#ffcf85");
        });

        it("should initialize with the default flicker amplitude", () => {
            expect(lantern.flickerAmplitude)
                .toBeCloseTo(0.08);
        });

        it("should initialize with the default flicker frequency", () => {
            expect(lantern.flickerFrequency)
                .toBeCloseTo(1.5);
        });

        it("should initialize without a registered light source", () => {
            expect(lantern.lightSource).toBeNull();
        });

        it("should support zero coordinates", () => {
            const custom = new Lantern(0, 0);

            expect(custom.x).toBe(0);
            expect(custom.y).toBe(0);
        });

        it("should support fractional coordinates", () => {
            const custom = new Lantern(10.5, 20.25);

            expect(custom.x).toBe(10.5);
            expect(custom.y).toBe(20.25);
        });

        it("should maintain independent lantern instances", () => {
            const second = new Lantern(300, 400);

            lantern.extinguish();

            expect(second.isLit).toBe(true);
            expect(second.image).not.toBe(lantern.image);
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
                const custom = new Lantern(value, 200);

                expect(custom.x).toBe(0);
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
                const custom = new Lantern(100, value);

                expect(custom.y).toBe(0);
            }
        );

        it.each([
            0,
            -10,
            NaN,
            Infinity,
            null,
            "24"
        ])(
            "should use the default width for invalid value %s",
            (value) => {
                const custom = new Lantern(
                    100, 200, value, 40
                );

                expect(custom.width).toBe(24);
            }
        );

        it.each([
            0,
            -10,
            NaN,
            Infinity,
            null,
            "40"
        ])(
            "should use the default height for invalid value %s",
            (value) => {
                const custom = new Lantern(
                    100, 200, 24, value
                );

                expect(custom.height).toBe(40);
            }
        );
    });

    describe("Light positioning", () => {
        it("should position the light at the horizontal center", () => {
            const position = lantern.getLightPosition();

            expect(position.x).toBe(112);
        });

        it("should position the light near the lantern flame", () => {
            const position = lantern.getLightPosition();

            expect(position.y).toBe(218);
        });

        it("should scale the light position with custom dimensions", () => {
            const custom = new Lantern(
                100, 200, 48, 80
            );

            expect(custom.getLightPosition()).toEqual({
                x: 124,
                y: 236
            });
        });

        it("should return independent light position objects", () => {
            const position = lantern.getLightPosition();

            position.x = 9999;

            expect(lantern.getLightPosition().x)
                .toBe(112);
        });
    });

    describe("Light source registration", () => {
        it("should register a real light source", () => {
            lantern.registerLight(lightingSystem);

            expect(lantern.lightSource)
                .toBeInstanceOf(LightSource);
        });

        it("should add the light to the lighting system", () => {
            lantern.registerLight(lightingSystem);

            expect(lightingSystem.lightSources)
                .toContain(lantern.lightSource);
        });

        it("should return the registered light source", () => {
            const light = lantern.registerLight(
                lightingSystem
            );

            expect(light).toBe(lantern.lightSource);
        });

        it("should register the correct light position", () => {
            lantern.registerLight(lightingSystem);

            expect(lantern.lightSource.x).toBe(112);
            expect(lantern.lightSource.y).toBe(218);
        });

        it("should register the correct light radius", () => {
            lantern.registerLight(lightingSystem);

            expect(lantern.lightSource.radius)
                .toBe(80);
        });

        it("should register the correct light intensity", () => {
            lantern.registerLight(lightingSystem);

            expect(lantern.lightSource.intensity)
                .toBeCloseTo(0.65);
        });

        it("should register the correct light color", () => {
            lantern.registerLight(lightingSystem);

            expect(lantern.lightSource.color)
                .toBe("#ffcf85");
        });

        it("should enable flickering", () => {
            lantern.registerLight(lightingSystem);

            expect(lantern.lightSource.flickerEnabled)
                .toBe(true);
        });

        it("should configure flicker amplitude", () => {
            lantern.registerLight(lightingSystem);

            expect(
                lantern.lightSource.flickerAmplitude
            ).toBeCloseTo(0.08);
        });

        it("should configure flicker frequency", () => {
            lantern.registerLight(lightingSystem);

            expect(
                lantern.lightSource.flickerFrequency
            ).toBeCloseTo(1.5);
        });

        it("should not duplicate registered light sources", () => {
            lantern.registerLight(lightingSystem);
            lantern.registerLight(lightingSystem);
            lantern.registerLight(lightingSystem);

            expect(lightingSystem.lightSources)
                .toHaveLength(1);
        });

        it("should preserve the existing light source", () => {
            const original = lantern.registerLight(
                lightingSystem
            );

            const second = lantern.registerLight(
                lightingSystem
            );

            expect(second).toBe(original);
        });

        it("should support multiple independent lanterns", () => {
            const second = new Lantern(300, 400);

            lantern.registerLight(lightingSystem);
            second.registerLight(lightingSystem);

            expect(lightingSystem.lightSources)
                .toHaveLength(2);

            expect(lantern.lightSource)
                .not.toBe(second.lightSource);
        });

        it("should register an extinguished lantern as disabled", () => {
            lantern.extinguish();
            lantern.registerLight(lightingSystem);

            expect(lantern.lightSource.enabled)
                .toBe(false);
        });

        it("should move registration to another lighting system", () => {
            const secondSystem = new LightingSystem();

            lantern.registerLight(lightingSystem);
            lantern.registerLight(secondSystem);

            expect(lightingSystem.lightSources)
                .toHaveLength(0);

            expect(secondSystem.lightSources)
                .toContain(lantern.lightSource);
        });
    });

    describe("Light source removal", () => {
        it("should remove the registered light source", () => {
            lantern.registerLight(lightingSystem);
            lantern.unregisterLight();

            expect(lightingSystem.lightSources)
                .toHaveLength(0);
        });

        it("should clear the stored light source", () => {
            lantern.registerLight(lightingSystem);
            lantern.unregisterLight();

            expect(lantern.lightSource).toBeNull();
        });

        it("should support removal without registration", () => {
            expect(() => lantern.unregisterLight())
                .not.toThrow();
        });

        it("should support repeated removal", () => {
            lantern.registerLight(lightingSystem);

            lantern.unregisterLight();
            lantern.unregisterLight();

            expect(lightingSystem.lightSources)
                .toHaveLength(0);
        });

        it("should support registering again after removal", () => {
            lantern.registerLight(lightingSystem);
            lantern.unregisterLight();
            lantern.registerLight(lightingSystem);

            expect(lightingSystem.lightSources)
                .toHaveLength(1);
        });

        it("should preserve unrelated light sources", () => {
            const unrelated = lightingSystem.addLight(
                300, 400
            );

            lantern.registerLight(lightingSystem);
            lantern.unregisterLight();

            expect(lightingSystem.lightSources)
                .toEqual([unrelated]);
        });
    });

    describe("Lantern state", () => {
        it("should extinguish the lantern", () => {
            lantern.extinguish();

            expect(lantern.isLit).toBe(false);
        });

        it("should ignite an extinguished lantern", () => {
            lantern.extinguish();
            lantern.ignite();

            expect(lantern.isLit).toBe(true);
        });

        it("should disable the light when extinguished", () => {
            lantern.registerLight(lightingSystem);
            lantern.extinguish();

            expect(lantern.lightSource.enabled)
                .toBe(false);
        });

        it("should enable the light when ignited", () => {
            lantern.registerLight(lightingSystem);

            lantern.extinguish();
            lantern.ignite();

            expect(lantern.lightSource.enabled)
                .toBe(true);
        });

        it("should toggle from lit to extinguished", () => {
            lantern.toggle();

            expect(lantern.isLit).toBe(false);
        });

        it("should toggle from extinguished to lit", () => {
            lantern.extinguish();
            lantern.toggle();

            expect(lantern.isLit).toBe(true);
        });

        it("should synchronize the registered light when toggled", () => {
            lantern.registerLight(lightingSystem);

            lantern.toggle();

            expect(lantern.lightSource.enabled)
                .toBe(false);

            lantern.toggle();

            expect(lantern.lightSource.enabled)
                .toBe(true);
        });

        it("should preserve the light source when extinguished", () => {
            const light = lantern.registerLight(
                lightingSystem
            );

            lantern.extinguish();

            expect(lantern.lightSource).toBe(light);

            expect(lightingSystem.lightSources)
                .toHaveLength(1);
        });

        it("should preserve light configuration when toggled", () => {
            lantern.registerLight(lightingSystem);

            lantern.extinguish();
            lantern.ignite();

            expect(lantern.lightSource.radius)
                .toBe(80);

            expect(lantern.lightSource.intensity)
                .toBeCloseTo(0.65);

            expect(lantern.lightSource.color)
                .toBe("#ffcf85");
        });

        it("should support repeated ignition", () => {
            lantern.ignite();
            lantern.ignite();

            expect(lantern.isLit).toBe(true);
        });

        it("should support repeated extinguishing", () => {
            lantern.extinguish();
            lantern.extinguish();

            expect(lantern.isLit).toBe(false);
        });
    });

    describe("Dynamic flickering", () => {
        it("should vary the effective light intensity over time", () => {
            lantern.registerLight(lightingSystem);

            const initialIntensity =
                lantern.lightSource.getEffectiveIntensity();

            lightingSystem.update(0.1);

            expect(
                lantern.lightSource.getEffectiveIntensity()
            ).not.toBeCloseTo(initialIntensity);
        });

        it("should preserve the base light intensity while flickering", () => {
            lantern.registerLight(lightingSystem);

            lightingSystem.update(1);

            expect(lantern.lightSource.intensity)
                .toBeCloseTo(0.65);
        });

        it("should keep flickering within the configured amplitude", () => {
            lantern.registerLight(lightingSystem);

            for (let frame = 0; frame < 100; frame++) {
                lightingSystem.update(0.016);

                const intensity =
                    lantern.lightSource
                        .getEffectiveIntensity();

                expect(intensity)
                    .toBeGreaterThanOrEqual(0.57 - 1e-10);

                expect(intensity)
                    .toBeLessThanOrEqual(0.73 + 1e-10);
            }
        });

        it("should preserve the lantern world position during flickering", () => {
            lantern.registerLight(lightingSystem);

            lightingSystem.update(5);

            expect(lantern.x).toBe(100);
            expect(lantern.y).toBe(200);
        });
    });

    describe("Shadow registration", () => {
        it("should register a static lantern shadow", () => {
            lantern.registerShadow(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toHaveLength(1);
        });

        it("should position the shadow beneath the lantern", () => {
            const shadow = lantern.registerShadow(
                shadowSystem
            );

            expect(shadow.x).toBe(112);
            expect(shadow.y).toBe(238);
        });

        it("should configure a small oval shadow", () => {
            const shadow = lantern.registerShadow(
                shadowSystem
            );

            expect(shadow.width).toBe(20);
            expect(shadow.height).toBe(8);
            expect(shadow.opacity).toBeCloseTo(0.25);
        });

        it("should preserve unrelated environment shadows", () => {
            const original = shadowSystem.addStaticShadow(
                300, 400
            );

            lantern.registerShadow(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toContain(original);

            expect(shadowSystem.staticShadows)
                .toHaveLength(2);
        });

        it("should preserve the shadow when the lantern is extinguished", () => {
            const shadow = lantern.registerShadow(
                shadowSystem
            );

            lantern.extinguish();

            expect(shadowSystem.staticShadows)
                .toContain(shadow);
        });

        it("should respect weather-dependent shadow visibility", () => {
            shadowSystem.setWeatherVisibility(0.35);

            const shadow = lantern.registerShadow(
                shadowSystem
            );

            expect(shadow.getEffectiveOpacity())
                .toBeCloseTo(0.0875);
        });
    });

    describe("Depth sorting", () => {
        it("should calculate depth from the bottom edge", () => {
            expect(lantern.getDepth()).toBe(240);
        });

        it("should support custom rendering dimensions", () => {
            const custom = new Lantern(
                100, 200, 32, 48
            );

            expect(custom.getDepth()).toBe(248);
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

        it("should detect a visible lantern", () => {
            expect(lantern.isVisible(camera))
                .toBe(true);
        });

        it("should support rendering without a camera", () => {
            expect(lantern.isVisible())
                .toBe(true);
        });

        it("should support a null camera", () => {
            expect(lantern.isVisible(null))
                .toBe(true);
        });

        it.each([
            [600, 200],
            [-100, 200],
            [100, 500],
            [100, -100]
        ])(
            "should cull offscreen lanterns at (%s, %s)",
            (x, y) => {
                const custom = new Lantern(x, y);

                expect(custom.isVisible(camera))
                    .toBe(false);
            }
        );

        it.each([
            [470, 200],
            [-10, 200],
            [100, 370],
            [100, -20]
        ])(
            "should preserve partially visible lanterns at (%s, %s)",
            (x, y) => {
                const custom = new Lantern(x, y);

                expect(custom.isVisible(camera))
                    .toBe(true);
            }
        );

        it("should exclude lanterns touching the viewport edge", () => {
            const custom = new Lantern(480, 200);

            expect(custom.isVisible(camera))
                .toBe(false);
        });

        it("should respect camera movement", () => {
            camera.x = 500;
            camera.y = 500;

            expect(lantern.isVisible(camera))
                .toBe(false);
        });
    });

    describe("Rendering", () => {
        it("should render the lantern sprite", () => {
            lantern.draw(ctx);

            expect(ctx.drawImage)
                .toHaveBeenCalledWith(
                    lantern.image,
                    100,
                    200,
                    24,
                    40
                );
        });

        it("should disable image smoothing", () => {
            lantern.draw(ctx);

            expect(ctx.imageSmoothingEnabled)
                .toBe(false);
        });

        it("should round rendering coordinates", () => {
            const custom = new Lantern(
                100.6, 200.4
            );

            custom.draw(ctx);

            expect(ctx.drawImage)
                .toHaveBeenCalledWith(
                    custom.image,
                    101,
                    200,
                    24,
                    40
                );
        });

        it("should support custom rendering dimensions", () => {
            const custom = new Lantern(
                100, 200, 32, 48
            );

            custom.draw(ctx);

            expect(ctx.drawImage)
                .toHaveBeenCalledWith(
                    custom.image,
                    100,
                    200,
                    32,
                    48
                );
        });

        it("should render the physical lantern when extinguished", () => {
            lantern.extinguish();

            lantern.draw(ctx);

            expect(ctx.drawImage)
                .toHaveBeenCalledTimes(1);
        });

        it("should skip rendering when the image is not loaded", () => {
            lantern.image.complete = false;

            lantern.draw(ctx);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });

        it("should skip rendering when image loading fails", () => {
            lantern.image.naturalWidth = 0;

            lantern.draw(ctx);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });

        it("should skip rendering when the image is missing", () => {
            lantern.image = null;

            lantern.draw(ctx);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });

        it("should preserve world coordinates during rendering", () => {
            lantern.draw(ctx);
            lantern.draw(ctx);

            expect(lantern.x).toBe(100);
            expect(lantern.y).toBe(200);
        });

        it("should not register lights during rendering", () => {
            lantern.draw(ctx);

            expect(lantern.lightSource).toBeNull();
        });

        it("should support environments without browser image dependencies", () => {
            vi.stubGlobal("Image", undefined);

            const custom = new Lantern(100, 200);

            expect(custom.image).toBeNull();

            expect(() => custom.draw(ctx))
                .not.toThrow();

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });
    });
});
