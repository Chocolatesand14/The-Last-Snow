
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DecorationLayer } from "../src/world/DecorationLayer.js";
import { SnowyForest } from "../src/world/maps/SnowyForest.js";
import { Camera } from "../src/core/Camera.js";
import { Shadow } from "../src/lighting/Shadow.js";
import { ShadowSystem } from "../src/lighting/ShadowSystem.js";

describe("DecorationLayer", () => {
    let layer;

    beforeEach(() => {
        layer = new DecorationLayer(SnowyForest);
    });

    describe("Decoration generation", () => {
        it("should generate decorations", () => {
            expect(layer.decorations.length).toBeGreaterThan(0);
        });

        it("should only place decorations on snow", () => {
            for (const decoration of layer.decorations) {
                const column = Math.floor(
                    decoration.x / layer.tileSize
                );

                const row = Math.floor(
                    decoration.y / layer.tileSize
                );

                expect(layer.tiles[row][column]).toBe(0);
            }
        });

        it("should generate consistent decorations", () => {
            const secondLayer = new DecorationLayer(SnowyForest);

            expect(layer.decorations)
                .toEqual(secondLayer.decorations);
        });

        it("should keep decorations inside the map", () => {
            const width =
                SnowyForest.tiles[0].length * layer.tileSize;

            const height =
                SnowyForest.tiles.length * layer.tileSize;

            for (const decoration of layer.decorations) {
                expect(decoration.x).toBeGreaterThanOrEqual(0);
                expect(decoration.y).toBeGreaterThanOrEqual(0);

                expect(decoration.x + decoration.width)
                    .toBeLessThanOrEqual(width);

                expect(decoration.y + decoration.height)
                    .toBeLessThanOrEqual(height);
            }
        });

        it("should assign valid sprite types", () => {
            for (const decoration of layer.decorations) {
                expect(decoration.type)
                    .toBeGreaterThanOrEqual(0);

                expect(decoration.type)
                    .toBeLessThan(layer.sprites.length);
            }
        });

        it("should generate no decorations on blocked tiles", () => {
            const blockedLayer = new DecorationLayer({
                tileSize: 32,
                tiles: [
                    [1, 3],
                    [3, 1]
                ]
            });

            expect(blockedLayer.decorations).toHaveLength(0);
        });
    });

    describe("Depth sorting", () => {
        it("should return a renderable for every decoration", () => {
            expect(layer.getRenderables().length)
                .toBe(layer.decorations.length);
        });

        it("should calculate depth using the decoration base", () => {
            const renderables = layer.getRenderables();

            renderables.forEach((object, index) => {
                const decoration = layer.decorations[index];

                expect(object.depth).toBe(
                    decoration.y + decoration.height
                );
            });
        });

        it("should provide a draw function", () => {
            for (const object of layer.getRenderables()) {
                expect(typeof object.draw).toBe("function");
            }
        });
    });

    describe("Viewport culling", () => {
        let camera;

        beforeEach(() => {
            camera = new Camera(96, 96, 320, 320);

            // Create controlled decorations for visibility testing
            layer.decorations = [
                {
                    x: 32,
                    y: 32,
                    type: 0,
                    width: 24,
                    height: 24
                },
                {
                    x: 88,
                    y: 64,
                    type: 1,
                    width: 24,
                    height: 24
                },
                {
                    x: 224,
                    y: 224,
                    type: 2,
                    width: 24,
                    height: 24
                }
            ];
        });

        it("should include fully visible decorations", () => {
            expect(
                layer.isVisible(layer.decorations[0], camera)
            ).toBe(true);
        });

        it("should include partially visible decorations", () => {
            expect(
                layer.isVisible(layer.decorations[1], camera)
            ).toBe(true);
        });

        it("should exclude decorations outside the viewport", () => {
            expect(
                layer.isVisible(layer.decorations[2], camera)
            ).toBe(false);
        });

        it("should only return visible renderables", () => {
            const renderables = layer.getRenderables(camera);

            expect(renderables).toHaveLength(2);
        });

        it("should preserve depth information after culling", () => {
            const renderables = layer.getRenderables(camera);

            expect(
                renderables.map(object => object.depth)
            ).toEqual([56, 88]);
        });

        it("should update visibility when the camera moves", () => {
            camera.x = 192;
            camera.y = 192;

            const renderables = layer.getRenderables(camera);

            expect(renderables).toHaveLength(1);
            expect(renderables[0].depth).toBe(248);
        });

        it("should return all decorations without a camera", () => {
            expect(layer.getRenderables()).toHaveLength(3);
        });

        it("should not remove decorations from the world", () => {
            layer.getRenderables(camera);

            expect(layer.decorations).toHaveLength(3);
        });

        it("should exclude decorations touching the viewport edge", () => {
            const decoration = {
                x: 96,
                y: 32,
                width: 24,
                height: 24
            };

            expect(
                layer.isVisible(decoration, camera)
            ).toBe(false);
        });

        it("should return no renderables for an empty viewport", () => {
            camera.x = 128;
            camera.y = 0;

            expect(
                layer.getRenderables(camera)
            ).toHaveLength(0);
        });

        it.each([
            [-24, 32],
            [32, -24],
            [32, 96],
            [96, 32]
        ])(
            "should exclude decorations outside viewport boundaries (%s, %s)",
            (x, y) => {
                const decoration = {
                    x,
                    y,
                    width: 24,
                    height: 24
                };

                expect(
                    layer.isVisible(decoration, camera)
                ).toBe(false);
            }
        );

        it("should support an explicitly null camera", () => {
            expect(
                layer.isVisible(layer.decorations[2], null)
            ).toBe(true);
        });

        it("should use rounded camera coordinates", () => {
            camera.x = 100.6;
            camera.y = 100.6;

            const decoration = {
                x: 77,
                y: 120,
                width: 24,
                height: 24
            };

            expect(
                layer.isVisible(decoration, camera)
            ).toBe(false);
        });
    });

    describe("Sprite rendering", () => {
        it("should skip unavailable sprites", () => {
            layer.sprites[0] = null;

            const ctx = {
                drawImage: vi.fn()
            };

            layer.drawDecoration(ctx, {
                type: 0,
                x: 32,
                y: 32,
                width: 24,
                height: 24
            });

            expect(ctx.drawImage).not.toHaveBeenCalled();
        });

        it("should draw a loaded decoration sprite", () => {
            const image = {
                complete: true,
                naturalWidth: 24
            };

            layer.sprites[0] = image;

            const ctx = {
                drawImage: vi.fn()
            };

            layer.drawDecoration(ctx, {
                type: 0,
                x: 32,
                y: 64,
                width: 24,
                height: 24
            });

            expect(ctx.drawImage).toHaveBeenCalledWith(
                image,
                32,
                64,
                24,
                24
            );
        });
    });

    describe("Shadow configuration", () => {
        it("should initialize shadow presets for all decoration types", () => {
            expect(layer.shadowPresets).toHaveLength(3);
        });

        it("should define the correct bush shadow preset", () => {
            expect(layer.shadowPresets[0]).toEqual({
                width: 18,
                height: 8,
                opacity: 0.20
            });
        });

        it("should define the correct branch shadow preset", () => {
            expect(layer.shadowPresets[1]).toEqual({
                width: 20,
                height: 5,
                opacity: 0.12
            });
        });

        it("should define the correct stone shadow preset", () => {
            expect(layer.shadowPresets[2]).toEqual({
                width: 16,
                height: 6,
                opacity: 0.18
            });
        });
    });

    describe("Static shadow registration", () => {
        let shadowSystem;

        beforeEach(() => {
            shadowSystem = new ShadowSystem();

            // Create controlled decorations for shadow testing
            layer.decorations = [
                {
                    x: 32,
                    y: 64,
                    type: 0,
                    width: 24,
                    height: 24
                },
                {
                    x: 96,
                    y: 128,
                    type: 1,
                    width: 24,
                    height: 24
                },
                {
                    x: 160,
                    y: 192,
                    type: 2,
                    width: 24,
                    height: 24
                }
            ];
        });

        it("should register a shadow for every decoration", () => {
            layer.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toHaveLength(3);
        });

        it("should create real Shadow instances", () => {
            layer.registerStaticShadows(shadowSystem);

            for (const shadow of shadowSystem.staticShadows) {
                expect(shadow).toBeInstanceOf(Shadow);
            }
        });

        it("should position shadows at the decoration base", () => {
            layer.registerStaticShadows(shadowSystem);

            expect(
                shadowSystem.staticShadows.map(shadow => ({
                    x: shadow.x,
                    y: shadow.y
                }))
            ).toEqual([
                { x: 44, y: 86 },
                { x: 108, y: 150 },
                { x: 172, y: 214 }
            ]);
        });

        it.each([
            [0, 18, 8, 0.20],
            [1, 20, 5, 0.12],
            [2, 16, 6, 0.18]
        ])(
            "should apply the correct shadow properties for type %s",
            (type, width, height, opacity) => {
                layer.registerStaticShadows(shadowSystem);

                const shadow =
                    shadowSystem.staticShadows[type];

                expect(shadow.width).toBe(width);
                expect(shadow.height).toBe(height);
                expect(shadow.opacity).toBe(opacity);
            }
        );

        it("should support custom decoration dimensions", () => {
            layer.decorations = [
                {
                    x: 100,
                    y: 200,
                    type: 0,
                    width: 40,
                    height: 32
                }
            ];

            layer.registerStaticShadows(shadowSystem);

            const shadow = shadowSystem.staticShadows[0];

            expect(shadow.x).toBe(120);
            expect(shadow.y).toBe(230);
        });

        it.each([-1, 3, 99, undefined, null])(
            "should skip unsupported decoration type %s",
            (type) => {
                layer.decorations = [
                    {
                        x: 100,
                        y: 200,
                        type,
                        width: 24,
                        height: 24
                    }
                ];

                layer.registerStaticShadows(shadowSystem);

                expect(shadowSystem.staticShadows)
                    .toHaveLength(0);
            }
        );

        it("should continue registering valid decorations after an invalid type", () => {
            layer.decorations.unshift({
                x: 0,
                y: 0,
                type: 99,
                width: 24,
                height: 24
            });

            layer.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toHaveLength(3);
        });

        it("should support an empty decoration layer", () => {
            layer.decorations = [];

            layer.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toHaveLength(0);
        });

        it("should preserve existing environment shadows", () => {
            const existingShadow =
                shadowSystem.addStaticShadow(
                    400, 300, 56, 22, 0.35
                );

            layer.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toHaveLength(4);

            expect(shadowSystem.staticShadows)
                .toContain(existingShadow);
        });

        it("should preserve the existing player shadow", () => {
            shadowSystem.createPlayerShadow({
                x: 100,
                y: 50,
                width: 32,
                height: 32
            });

            const playerShadow =
                shadowSystem.playerShadow;

            layer.registerStaticShadows(shadowSystem);

            expect(shadowSystem.playerShadow)
                .toBe(playerShadow);
        });

        it("should preserve the original decoration data", () => {
            const originalDecorations =
                structuredClone(layer.decorations);

            layer.registerStaticShadows(shadowSystem);

            expect(layer.decorations)
                .toEqual(originalDecorations);
        });

        it("should support registration of generated forest decorations", () => {
            const forestLayer =
                new DecorationLayer(SnowyForest);

            forestLayer.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows.length)
                .toBe(forestLayer.decorations.length);
        });
    });

    describe("Shadow weather integration", () => {
        let shadowSystem;

        beforeEach(() => {
            shadowSystem = new ShadowSystem();

            layer.decorations = [
                {
                    x: 32,
                    y: 64,
                    type: 0,
                    width: 24,
                    height: 24
                }
            ];
        });

        it("should apply current weather to newly registered shadows", () => {
            shadowSystem.setWeatherVisibility(0.35);

            layer.registerStaticShadows(shadowSystem);

            expect(
                shadowSystem.staticShadows[0]
                    .getEffectiveOpacity()
            ).toBeCloseTo(0.07);
        });

        it.each([
            [1, 0.20],
            [0.95, 0.19],
            [0.85, 0.17],
            [0.65, 0.13],
            [0.35, 0.07]
        ])(
            "should adapt decoration shadows to weather visibility %s",
            (visibility, expectedOpacity) => {
                layer.registerStaticShadows(shadowSystem);

                shadowSystem.setWeatherVisibility(visibility);

                expect(
                    shadowSystem.staticShadows[0]
                        .getEffectiveOpacity()
                ).toBeCloseTo(expectedOpacity);
            }
        );

        it("should preserve the original shadow opacity", () => {
            layer.registerStaticShadows(shadowSystem);

            shadowSystem.setWeatherVisibility(0.35);

            expect(shadowSystem.staticShadows[0].opacity)
                .toBe(0.20);
        });

        it("should restore shadow strength when weather improves", () => {
            layer.registerStaticShadows(shadowSystem);

            shadowSystem.setWeatherVisibility(0.35);
            shadowSystem.setWeatherVisibility(1);

            expect(
                shadowSystem.staticShadows[0]
                    .getEffectiveOpacity()
            ).toBeCloseTo(0.20);
        });
    });

    describe("Shadow viewport integration", () => {
        let shadowSystem;
        let camera;

        beforeEach(() => {
            shadowSystem = new ShadowSystem();
            camera = new Camera(96, 96, 320, 320);

            layer.decorations = [
                {
                    x: 32,
                    y: 32,
                    type: 0,
                    width: 24,
                    height: 24
                },
                {
                    x: 224,
                    y: 224,
                    type: 2,
                    width: 24,
                    height: 24
                }
            ];

            layer.registerStaticShadows(shadowSystem);
        });

        it("should render only visible decoration shadows", () => {
            const visible = vi.spyOn(
                shadowSystem.staticShadows[0], "draw"
            ).mockImplementation(() => {});

            const hidden = vi.spyOn(
                shadowSystem.staticShadows[1], "draw"
            ).mockImplementation(() => {});

            shadowSystem.draw({}, camera);

            expect(visible).toHaveBeenCalledTimes(1);
            expect(hidden).not.toHaveBeenCalled();
        });

        it("should update shadow visibility when the camera moves", () => {
            camera.x = 192;
            camera.y = 192;

            expect(
                shadowSystem.isVisible(
                    shadowSystem.staticShadows[0], camera
                )
            ).toBe(false);

            expect(
                shadowSystem.isVisible(
                    shadowSystem.staticShadows[1], camera
                )
            ).toBe(true);
        });

        it("should preserve shadow world coordinates when the camera moves", () => {
            const shadow = shadowSystem.staticShadows[0];

            const originalX = shadow.x;
            const originalY = shadow.y;

            camera.x = 100;
            camera.y = 100;

            shadowSystem.isVisible(shadow, camera);

            expect(shadow.x).toBe(originalX);
            expect(shadow.y).toBe(originalY);
        });
    });

    describe("Image loading", () => {
        it("should return null when the Image constructor is unavailable", () => {
            vi.stubGlobal("Image", undefined);

            try {
                expect(layer.loadImage("test.png"))
                    .toBeNull();
            } finally {
                vi.unstubAllGlobals();
            }
        });

        it("should create an image and assign the source", () => {
            class MockImage {
                constructor() {
                    this.src = "";
                }
            }

            vi.stubGlobal("Image", MockImage);

            try {
                const image = layer.loadImage("test.png");

                expect(image).toBeInstanceOf(MockImage);
                expect(image.src).toBe("test.png");
            } finally {
                vi.unstubAllGlobals();
            }
        });

        it("should initialize all decoration sprite sources", () => {
            class MockImage {
                constructor() {
                    this.src = "";
                }
            }

            vi.stubGlobal("Image", MockImage);

            try {
                const newLayer =
                    new DecorationLayer(SnowyForest);

                expect(
                    newLayer.sprites.map(image => image.src)
                ).toEqual([
                    "assets/tilesets/forest/decorations/snowy-bush.png",
                    "assets/tilesets/forest/decorations/dry-branches.png",
                    "assets/tilesets/forest/decorations/small-stones.png"
                ]);
            } finally {
                vi.unstubAllGlobals();
            }
        });
    });

    describe("Additional sprite rendering tests", () => {
        let ctx;
        let decoration;

        beforeEach(() => {
            ctx = {
                drawImage: vi.fn()
            };

            decoration = {
                x: 32,
                y: 64,
                type: 0,
                width: 24,
                height: 24
            };
        });

        it("should skip sprites that have not finished loading", () => {
            layer.sprites[0] = {
                complete: false,
                naturalWidth: 24
            };

            layer.drawDecoration(ctx, decoration);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });

        it("should skip images with zero natural width", () => {
            layer.sprites[0] = {
                complete: true,
                naturalWidth: 0
            };

            layer.drawDecoration(ctx, decoration);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });

        it("should skip undefined sprite types", () => {
            decoration.type = 99;

            layer.drawDecoration(ctx, decoration);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });

        it("should execute the renderable draw function", () => {
            layer.decorations = [decoration];

            const image = {
                complete: true,
                naturalWidth: 24
            };

            layer.sprites[0] = image;

            const renderable = layer.getRenderables()[0];

            renderable.draw(ctx);

            expect(ctx.drawImage).toHaveBeenCalledWith(
                image,
                32,
                64,
                24,
                24
            );
        });
    });
});
