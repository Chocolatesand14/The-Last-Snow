
import { describe, it, expect, beforeEach, vi } from "vitest";
import { LightingSystem } from "../src/lighting/LightingSystem.js";
import { AmbientLight } from "../src/lighting/AmbientLight.js";
import { LightSource } from "../src/lighting/LightSource.js";
import { WeatherType } from "../src/weather/WeatherType.js";

describe("LightingSystem", () => {
    let system;
    let ctx;
    let camera;

    beforeEach(() => {
        system = new LightingSystem();

        camera = {
            x: 0,
            y: 0,
            width: 480,
            height: 384
        };

        // Create a controlled canvas rendering context
        ctx = {
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            setTransform: vi.fn(),
            fillRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),

            createRadialGradient: vi.fn(() => ({
                addColorStop: vi.fn()
            })),

            globalAlpha: 1,
            fillStyle: "",
            globalCompositeOperation: "source-over"
        };
    });

    describe("Initialization", () => {
        it("should initialize a real ambient light", () => {
            expect(system.ambientLight)
                .toBeInstanceOf(AmbientLight);
        });

        it("should initialize with no light sources", () => {
            expect(system.lightSources)
                .toEqual([]);
        });

        it("should initialize as enabled", () => {
            expect(system.enabled).toBe(true);
        });

        it("should initialize with default ambient opacity", () => {
            expect(system.ambientLight.opacity)
                .toBe(0.15);
        });

        it("should initialize with the default winter color", () => {
            expect(system.ambientLight.color)
                .toBe("#182d50");
        });

        it("should support custom ambient settings", () => {
            const customSystem = new LightingSystem(
                0.4,
                "#243b55"
            );

            expect(customSystem.ambientLight.opacity)
                .toBe(0.4);

            expect(customSystem.ambientLight.color)
                .toBe("#243b55");
        });

        it("should maintain independent system instances", () => {
            const secondSystem = new LightingSystem();

            system.addLight(100, 200);

            expect(secondSystem.lightSources)
                .toHaveLength(0);

            expect(secondSystem.ambientLight)
                .not.toBe(system.ambientLight);
        });
    });

    describe("Light registration", () => {
        it("should create a real LightSource instance", () => {
            const light = system.addLight(100, 200);

            expect(light).toBeInstanceOf(LightSource);
        });

        it("should register the created light source", () => {
            const light = system.addLight(100, 200);

            expect(system.lightSources)
                .toContain(light);
        });

        it("should preserve the world position", () => {
            const light = system.addLight(100, 200);

            expect(light.x).toBe(100);
            expect(light.y).toBe(200);
        });

        it("should apply default light properties", () => {
            const light = system.addLight(100, 200);

            expect(light.radius).toBe(64);
            expect(light.intensity).toBe(0.8);
            expect(light.color).toBe("#ffcf85");
        });

        it("should support custom light properties", () => {
            const light = system.addLight(
                100,
                200,
                120,
                0.6,
                "#80dfff"
            );

            expect(light.radius).toBe(120);
            expect(light.intensity).toBe(0.6);
            expect(light.color).toBe("#80dfff");
        });

        it("should register multiple light sources", () => {
            system.addLight(100, 200);
            system.addLight(300, 400);
            system.addLight(500, 600);

            expect(system.lightSources)
                .toHaveLength(3);
        });

        it("should create independent light sources", () => {
            const first = system.addLight(100, 200);
            const second = system.addLight(100, 200);

            expect(first).not.toBe(second);

            first.setIntensity(0.2);

            expect(second.intensity).toBe(0.8);
        });

        it("should preserve light registration order", () => {
            const first = system.addLight(100, 200);
            const second = system.addLight(300, 400);

            expect(system.lightSources)
                .toEqual([first, second]);
        });

        it("should support negative world coordinates", () => {
            const light = system.addLight(-50, -100);

            expect(light.x).toBe(-50);
            expect(light.y).toBe(-100);
        });

        it("should support zero world coordinates", () => {
            const light = system.addLight(0, 0);

            expect(light.x).toBe(0);
            expect(light.y).toBe(0);
        });

        it.each([
            [NaN, 100],
            [100, NaN],
            [Infinity, 100],
            [100, Infinity],
            [-Infinity, 100],
            [100, -Infinity],
            [null, 100],
            [100, undefined]
        ])(
            "should reject invalid light coordinates (%s, %s)",
            (x, y) => {
                expect(system.addLight(x, y))
                    .toBeNull();

                expect(system.lightSources)
                    .toHaveLength(0);
            }
        );
    });

    describe("Light removal", () => {
        it("should remove a registered light", () => {
            const light = system.addLight(100, 200);

            system.removeLight(light);

            expect(system.lightSources)
                .toHaveLength(0);
        });

        it("should preserve other registered lights", () => {
            const first = system.addLight(100, 200);
            const second = system.addLight(300, 400);

            system.removeLight(first);

            expect(system.lightSources)
                .toEqual([second]);
        });

        it("should remove lights by object identity", () => {
            const first = system.addLight(100, 200);
            const second = system.addLight(100, 200);

            system.removeLight(first);

            expect(system.lightSources)
                .toEqual([second]);
        });

        it("should ignore unregistered light sources", () => {
            const light = system.addLight(100, 200);

            system.removeLight(
                new LightSource(100, 200)
            );

            expect(system.lightSources)
                .toEqual([light]);
        });

        it("should ignore repeated removal requests", () => {
            const light = system.addLight(100, 200);

            system.removeLight(light);
            system.removeLight(light);

            expect(system.lightSources)
                .toHaveLength(0);
        });

        it.each([null, undefined, {}, 123])(
            "should ignore invalid removal input",
            (value) => {
                const light = system.addLight(100, 200);

                system.removeLight(value);

                expect(system.lightSources)
                    .toEqual([light]);
            }
        );
    });

    describe("Clearing light sources", () => {
        it("should remove all registered light sources", () => {
            system.addLight(100, 200);
            system.addLight(300, 400);

            system.clearLights();

            expect(system.lightSources)
                .toHaveLength(0);
        });

        it("should support clearing an empty system", () => {
            expect(() => system.clearLights())
                .not.toThrow();
        });

        it("should preserve the ambient light instance", () => {
            const ambient = system.ambientLight;

            system.addLight(100, 200);
            system.clearLights();

            expect(system.ambientLight)
                .toBe(ambient);
        });

        it("should preserve ambient lighting properties", () => {
            system.setAmbientOpacity(0.4);
            system.setAmbientColor("#243b55");

            system.clearLights();

            expect(system.ambientLight.opacity)
                .toBe(0.4);

            expect(system.ambientLight.color)
                .toBe("#243b55");
        });

        it("should allow registration after clearing", () => {
            system.addLight(100, 200);
            system.clearLights();

            const light = system.addLight(300, 400);

            expect(system.lightSources)
                .toEqual([light]);
        });
    });

    describe("Ambient lighting integration", () => {
        it("should update ambient opacity immediately", () => {
            system.setAmbientOpacity(0.5);

            expect(system.ambientLight.opacity)
                .toBe(0.5);
        });

        it("should support gradual ambient transitions", () => {
            system.setAmbientOpacity(0.55, 10);

            system.update(5);

            expect(system.ambientLight.opacity)
                .toBeCloseTo(0.35);
        });

        it("should complete ambient transitions", () => {
            system.setAmbientOpacity(0.55, 10);

            system.update(10);

            expect(system.ambientLight.opacity)
                .toBe(0.55);

            expect(system.ambientLight.isTransitioning)
                .toBe(false);
        });

        it("should update ambient color", () => {
            system.setAmbientColor("#243b55");

            expect(system.ambientLight.color)
                .toBe("#243b55");
        });

        it("should reject invalid ambient colors", () => {
            system.setAmbientColor("invalid");

            expect(system.ambientLight.color)
                .toBe("#182d50");
        });

        it("should reject invalid ambient opacity", () => {
            system.setAmbientOpacity(NaN);

            expect(system.ambientLight.opacity)
                .toBe(0.15);
        });

        it("should clamp ambient opacity to valid limits", () => {
            system.setAmbientOpacity(2);

            expect(system.ambientLight.opacity)
                .toBe(1);

            system.setAmbientOpacity(-1);

            expect(system.ambientLight.opacity)
                .toBe(0);
        });

        it("should support disabling only ambient lighting", () => {
            const light = system.addLight(100, 200);

            system.setAmbientEnabled(false);

            expect(system.ambientLight.enabled)
                .toBe(false);

            expect(light.enabled).toBe(true);
            expect(system.enabled).toBe(true);
        });

        it("should support enabling ambient lighting again", () => {
            system.setAmbientEnabled(false);
            system.setAmbientEnabled(true);

            expect(system.ambientLight.enabled)
                .toBe(true);
        });
    });

    describe("Weather integration", () => {
        it.each([
            [WeatherType.CLEAR, 0.05],
            [WeatherType.LIGHT_SNOW, 0.10],
            [WeatherType.SNOWFALL, 0.15],
            [WeatherType.HEAVY_SNOW, 0.25],
            [WeatherType.BLIZZARD, 0.40]
        ])(
            "should apply ambient lighting for weather %s",
            (weather, expectedOpacity) => {
                system.setWeather(weather, 0);

                expect(system.ambientLight.opacity)
                    .toBe(expectedOpacity);
            }
        );

        it("should use the default weather transition duration", () => {
            system.setWeather(WeatherType.BLIZZARD);

            expect(
                system.ambientLight.transitionDuration
            ).toBe(5);
        });

        it("should gradually adapt lighting to weather changes", () => {
            system.setWeather(
                WeatherType.BLIZZARD, 10
            );

            system.update(5);

            expect(system.ambientLight.opacity)
                .toBeCloseTo(0.275);
        });

        it("should restore ambient lighting when weather improves", () => {
            system.setWeather(
                WeatherType.BLIZZARD, 0
            );

            system.setWeather(
                WeatherType.CLEAR, 10
            );

            system.update(10);

            expect(system.ambientLight.opacity)
                .toBe(0.05);
        });

        it("should not restart an existing weather transition", () => {
            system.setWeather(
                WeatherType.BLIZZARD, 10
            );

            system.update(5);

            system.setWeather(
                WeatherType.BLIZZARD, 10
            );

            system.update(5);

            expect(system.ambientLight.opacity)
                .toBe(0.40);

            expect(system.ambientLight.isTransitioning)
                .toBe(false);
        });

        it("should use default ambient lighting for unsupported weather", () => {
            system.setAmbientOpacity(0.6);

            system.setWeather("invalid", 0);

            expect(system.ambientLight.opacity)
                .toBe(0.15);
        });

        it("should preserve individual light intensity during weather changes", () => {
            const light = system.addLight(
                100, 200, 64, 0.7
            );

            system.setWeather(
                WeatherType.BLIZZARD, 0
            );

            expect(light.intensity).toBe(0.7);
        });

        it("should preserve light positions during weather changes", () => {
            const light = system.addLight(100, 200);

            system.setWeather(
                WeatherType.BLIZZARD, 0
            );

            expect(light.x).toBe(100);
            expect(light.y).toBe(200);
        });
    });

    describe("System updates", () => {
        it("should update the ambient light", () => {
            const spy = vi.spyOn(
                system.ambientLight,
                "update"
            );

            system.update(0.1);

            expect(spy)
                .toHaveBeenCalledWith(0.1);
        });

        it("should update every registered light source", () => {
            const first = system.addLight(100, 200);
            const second = system.addLight(300, 400);

            const firstSpy = vi.spyOn(first, "update");
            const secondSpy = vi.spyOn(second, "update");

            system.update(0.1);

            expect(firstSpy)
                .toHaveBeenCalledWith(0.1);

            expect(secondSpy)
                .toHaveBeenCalledWith(0.1);
        });

        it("should update dynamic flickering", () => {
            const light = system.addLight(
                100, 200, 64, 0.5
            );

            light.setFlickerEnabled(true);
            light.setFlickerAmplitude(0.2);
            light.setFlickerFrequency(1);

            system.update(0.25);

            expect(light.getEffectiveIntensity())
                .toBeCloseTo(0.7);
        });

        it("should accumulate elapsed time", () => {
            const light = system.addLight(100, 200);

            system.update(0.1);
            system.update(0.2);

            expect(light.elapsedTime)
                .toBeCloseTo(0.3);
        });

        it("should update ambient lighting and flickering simultaneously", () => {
            const light = system.addLight(
                100, 200, 64, 0.5
            );

            light.setFlickerEnabled(true);
            light.setFlickerFrequency(1);
            light.setFlickerAmplitude(0.2);

            system.setAmbientOpacity(0.55, 1);

            system.update(0.25);

            expect(system.ambientLight.opacity)
                .toBeCloseTo(0.25);

            expect(light.getEffectiveIntensity())
                .toBeCloseTo(0.7);
        });

        it.each([
            0, -1, NaN, Infinity,
            -Infinity, null, undefined
        ])(
            "should reject invalid delta time %s",
            (deltaTime) => {
                const light = system.addLight(100, 200);

                const ambientSpy = vi.spyOn(
                    system.ambientLight,
                    "update"
                );

                const lightSpy = vi.spyOn(
                    light,
                    "update"
                );

                system.update(deltaTime);

                expect(ambientSpy)
                    .not.toHaveBeenCalled();

                expect(lightSpy)
                    .not.toHaveBeenCalled();
            }
        );

        it("should support updating an empty lighting system", () => {
            expect(() => system.update(0.1))
                .not.toThrow();
        });

        it("should update lights outside the viewport", () => {
            const light = system.addLight(900, 900);

            system.update(0.5);

            expect(light.elapsedTime)
                .toBe(0.5);
        });
    });

    describe("Viewport culling", () => {
        it("should include fully visible light sources", () => {
            const light = system.addLight(
                100, 200, 32
            );

            expect(system.isVisible(light, camera))
                .toBe(true);
        });

        it.each([
            [-10, 100],
            [490, 100],
            [100, -10],
            [100, 394]
        ])(
            "should include partially visible lights (%s, %s)",
            (x, y) => {
                const light = system.addLight(
                    x, y, 32
                );

                expect(system.isVisible(light, camera))
                    .toBe(true);
            }
        );

        it.each([
            [-100, 100],
            [600, 100],
            [100, -100],
            [100, 500]
        ])(
            "should exclude lights outside the viewport (%s, %s)",
            (x, y) => {
                const light = system.addLight(
                    x, y, 32
                );

                expect(system.isVisible(light, camera))
                    .toBe(false);
            }
        );

        it.each([
            [-32, 100],
            [512, 100],
            [100, -32],
            [100, 416]
        ])(
            "should exclude lights touching viewport boundaries (%s, %s)",
            (x, y) => {
                const light = system.addLight(
                    x, y, 32
                );

                expect(system.isVisible(light, camera))
                    .toBe(false);
            }
        );

        it("should include light sources without a camera", () => {
            const light = system.addLight(
                900, 900
            );

            expect(system.isVisible(light))
                .toBe(true);
        });

        it("should support an explicitly null camera", () => {
            const light = system.addLight(
                900, 900
            );

            expect(system.isVisible(light, null))
                .toBe(true);
        });

        it("should update visibility when the camera moves", () => {
            const light = system.addLight(
                600, 200, 32
            );

            expect(system.isVisible(light, camera))
                .toBe(false);

            camera.x = 300;

            expect(system.isVisible(light, camera))
                .toBe(true);
        });

        it("should update visibility when the light radius changes", () => {
            const light = system.addLight(
                520, 200, 32
            );

            expect(system.isVisible(light, camera))
                .toBe(false);

            light.setRadius(64);

            expect(system.isVisible(light, camera))
                .toBe(true);
        });

        it("should update visibility when the light moves", () => {
            const light = system.addLight(
                900, 900, 32
            );

            expect(system.isVisible(light, camera))
                .toBe(false);

            light.setPosition(100, 200);

            expect(system.isVisible(light, camera))
                .toBe(true);
        });

        it("should use rounded camera coordinates", () => {
            camera.x = 100.6;
            camera.y = 0;

            const light = system.addLight(
                69, 100, 32
            );

            expect(system.isVisible(light, camera))
                .toBe(false);
        });

        it("should preserve light world coordinates", () => {
            const light = system.addLight(100, 200);

            camera.x = 50;
            camera.y = 75;

            system.isVisible(light, camera);

            expect(light.x).toBe(100);
            expect(light.y).toBe(200);
        });
    });

    describe("System configuration", () => {
        it("should support disabling the lighting system", () => {
            system.setEnabled(false);

            expect(system.enabled).toBe(false);
        });

        it("should support enabling the lighting system", () => {
            system.setEnabled(false);
            system.setEnabled(true);

            expect(system.enabled).toBe(true);
        });

        it.each([
            "false", 0, null, undefined
        ])(
            "should reject invalid enabled state %s",
            (enabled) => {
                system.setEnabled(enabled);

                expect(system.enabled).toBe(true);
            }
        );

        it("should preserve registered light sources while disabled", () => {
            const light = system.addLight(100, 200);

            system.setEnabled(false);

            expect(system.lightSources)
                .toEqual([light]);
        });

        it("should preserve individual light enabled states", () => {
            const light = system.addLight(100, 200);

            light.setEnabled(false);

            system.setEnabled(false);
            system.setEnabled(true);

            expect(light.enabled).toBe(false);
        });

        it("should continue ambient transitions while disabled", () => {
            system.setAmbientOpacity(0.55, 10);

            system.setEnabled(false);
            system.update(5);

            expect(system.ambientLight.opacity)
                .toBeCloseTo(0.35);
        });

        it("should continue flickering while disabled", () => {
            const light = system.addLight(
                100, 200, 64, 0.5
            );

            light.setFlickerEnabled(true);
            light.setFlickerAmplitude(0.2);
            light.setFlickerFrequency(1);

            system.setEnabled(false);
            system.update(0.25);

            expect(light.getEffectiveIntensity())
                .toBeCloseTo(0.7);
        });
    });

    describe("Lighting rendering", () => {
        it("should render the ambient light", () => {
            const spy = vi.spyOn(
                system.ambientLight,
                "draw"
            );

            system.draw(ctx, 480, 384, camera);

            expect(spy).toHaveBeenCalledWith(
                ctx, 480, 384
            );
        });

        it("should render visible light sources", () => {
            const light = system.addLight(100, 200);

            const spy = vi.spyOn(light, "draw");

            system.draw(ctx, 480, 384, camera);

            expect(spy).toHaveBeenCalledWith(ctx);
        });

        it("should skip lights outside the viewport", () => {
            const light = system.addLight(900, 900);

            const spy = vi.spyOn(light, "draw");

            system.draw(ctx, 480, 384, camera);

            expect(spy).not.toHaveBeenCalled();
        });

        it("should render partially visible light sources", () => {
            const light = system.addLight(
                500, 200, 64
            );

            const spy = vi.spyOn(light, "draw");

            system.draw(ctx, 480, 384, camera);

            expect(spy).toHaveBeenCalledWith(ctx);
        });

        it("should render multiple visible lights", () => {
            const first = system.addLight(100, 200);
            const second = system.addLight(200, 300);

            const firstSpy = vi.spyOn(first, "draw");
            const secondSpy = vi.spyOn(second, "draw");

            system.draw(ctx, 480, 384, camera);

            expect(firstSpy)
                .toHaveBeenCalledTimes(1);

            expect(secondSpy)
                .toHaveBeenCalledTimes(1);
        });

        it("should render all light sources without a camera", () => {
            const light = system.addLight(900, 900);

            const spy = vi.spyOn(light, "draw");

            system.draw(ctx, 480, 384);

            expect(spy)
                .toHaveBeenCalledWith(ctx);
        });

        it("should render ambient lighting before individual lights", () => {
            const order = [];

            const light = system.addLight(100, 200);

            vi.spyOn(system.ambientLight, "draw")
                .mockImplementation(() => {
                    order.push("ambient");
                });

            vi.spyOn(light, "draw")
                .mockImplementation(() => {
                    order.push("light");
                });

            system.draw(ctx, 480, 384, camera);

            expect(order).toEqual([
                "ambient",
                "light"
            ]);
        });

        it("should apply camera translation to world lights", () => {
            camera.x = 50;
            camera.y = 75;

            system.addLight(100, 200);

            system.draw(ctx, 480, 384, camera);

            expect(ctx.translate)
                .toHaveBeenCalledWith(-50, -75);
        });

        it("should use rounded camera coordinates during rendering", () => {
            camera.x = 50.6;
            camera.y = 75.4;

            system.addLight(100, 200);

            system.draw(ctx, 480, 384, camera);

            expect(ctx.translate)
                .toHaveBeenCalledWith(-51, -75);
        });

        it("should use screen coordinates before applying camera translation", () => {
            const light = system.addLight(100, 200);

            vi.spyOn(system.ambientLight, "draw")
                .mockImplementation(() => {});

            vi.spyOn(light, "draw")
                .mockImplementation(() => {});

            system.draw(ctx, 480, 384, camera);

            expect(ctx.setTransform)
                .toHaveBeenCalledWith(
                    1, 0, 0, 1, 0, 0
                );
        });

        it("should not translate the context without a camera", () => {
            system.addLight(100, 200);

            system.draw(ctx, 480, 384);

            expect(ctx.translate)
                .not.toHaveBeenCalled();
        });

        it("should preserve the canvas state", () => {
            system.addLight(100, 200);

            system.draw(ctx, 480, 384, camera);

            expect(ctx.save.mock.calls.length)
                .toBe(ctx.restore.mock.calls.length);

            expect(ctx.save)
                .toHaveBeenCalled();
        });

        it("should not render when the system is disabled", () => {
            const light = system.addLight(100, 200);

            const ambientSpy = vi.spyOn(
                system.ambientLight,
                "draw"
            );

            const lightSpy = vi.spyOn(light, "draw");

            system.setEnabled(false);

            system.draw(ctx, 480, 384, camera);

            expect(ambientSpy)
                .not.toHaveBeenCalled();

            expect(lightSpy)
                .not.toHaveBeenCalled();

            expect(ctx.save)
                .not.toHaveBeenCalled();
        });

        it("should resume rendering after being enabled", () => {
            const light = system.addLight(100, 200);

            const spy = vi.spyOn(light, "draw");

            system.setEnabled(false);
            system.draw(ctx, 480, 384, camera);

            system.setEnabled(true);
            system.draw(ctx, 480, 384, camera);

            expect(spy)
                .toHaveBeenCalledTimes(1);
        });

        it("should render individual lights without ambient lighting", () => {
            system.setAmbientEnabled(false);

            system.addLight(100, 200);

            system.draw(ctx, 480, 384, camera);

            expect(ctx.fillRect)
                .not.toHaveBeenCalled();

            expect(ctx.arc)
                .toHaveBeenCalled();
        });

        it("should not render disabled individual lights", () => {
            const light = system.addLight(100, 200);

            light.setEnabled(false);

            system.draw(ctx, 480, 384, camera);

            expect(ctx.arc)
                .not.toHaveBeenCalled();
        });

        it("should render an empty system without errors", () => {
            expect(() => {
                system.draw(ctx, 480, 384, camera);
            }).not.toThrow();
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
                system.addLight(100, 200);

                system.draw(
                    ctx, width, height, camera
                );

                expect(ctx.save)
                    .not.toHaveBeenCalled();

                expect(ctx.fillRect)
                    .not.toHaveBeenCalled();

                expect(ctx.arc)
                    .not.toHaveBeenCalled();
            }
        );

        it("should preserve light positions during rendering", () => {
            const light = system.addLight(100, 200);

            camera.x = 50;
            camera.y = 75;

            system.draw(ctx, 480, 384, camera);

            expect(light.x).toBe(100);
            expect(light.y).toBe(200);
        });
    });
});
