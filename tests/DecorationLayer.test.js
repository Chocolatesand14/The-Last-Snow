
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DecorationLayer } from "../src/world/DecorationLayer.js";
import { SnowyForest } from "../src/world/maps/SnowyForest.js";
import { Camera } from "../src/core/Camera.js";

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
            const width = SnowyForest.tiles[0].length * layer.tileSize;
            const height = SnowyForest.tiles.length * layer.tileSize;

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
                expect(decoration.type).toBeGreaterThanOrEqual(0);
                expect(decoration.type).toBeLessThan(layer.sprites.length);
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
});
