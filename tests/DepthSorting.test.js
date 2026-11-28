
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TileMap } from "../src/world/TileMap.js";
import { SnowyForest } from "../src/world/maps/SnowyForest.js";

describe("Depth Sorting", () => {
    let map;

    beforeEach(() => {
        map = new TileMap(SnowyForest);
    });

    describe("Environment renderables", () => {
        it("should return environment objects", () => {
            expect(map.getRenderables().length)
                .toBeGreaterThan(0);
        });

        it("should include trees, rocks, decorations and lanterns", () => {
            const environmentCount = SnowyForest.tiles
                .flat()
                .filter(tile => tile === 1 || tile === 3)
                .length;

            const decorationCount =
                map.decorationLayer.decorations.length;

            // Include environmental lanterns
            const lanternCount = map.lanterns.length;

            expect(map.getRenderables()).toHaveLength(
                environmentCount +
                decorationCount +
                lanternCount
            );
        });

        it("should assign a valid depth to every object", () => {
            for (const object of map.getRenderables()) {
                expect(Number.isFinite(object.depth))
                    .toBe(true);

                expect(object.depth).toBeGreaterThan(0);

                expect(object.depth)
                    .toBeLessThanOrEqual(map.height);
            }
        });

        it("should calculate depth using the tile base", () => {
            const testMap = new TileMap({
                tileSize: 32,
                spawnPoint: { x: 0, y: 0 },
                tiles: [
                    [1, 3],
                    [3, 1]
                ]
            });

            const depths = testMap.getRenderables()
                .map(object => object.depth);

            expect(depths).toEqual([32, 32, 64, 64]);
        });

        it("should provide a draw function for every object", () => {
            for (const object of map.getRenderables()) {
                expect(typeof object.draw).toBe("function");
            }
        });
    });

    describe("Decoration integration", () => {
        it("should include decoration renderables", () => {
            const decoration = {
                depth: 96,
                draw: vi.fn()
            };

            vi.spyOn(map.decorationLayer, "getRenderables")
                .mockReturnValue([decoration]);

            expect(map.getRenderables())
                .toContain(decoration);
        });

        it("should keep decoration tiles walkable", () => {
            expect(map.decorationLayer.decorations.length)
                .toBeGreaterThan(0);

            for (const decoration of
                map.decorationLayer.decorations) {

                expect(
                    map.isWalkable(decoration.x, decoration.y)
                ).toBe(true);
            }
        });
    });

    describe("Rendering order", () => {
        it("should draw the ground before environment objects", () => {
            const order = [];

            vi.spyOn(map, "renderGround")
                .mockImplementation(() => {
                    order.push("ground");
                });

            vi.spyOn(map, "getRenderables")
                .mockReturnValue([
                    {
                        depth: 64,
                        draw: () => order.push("tree")
                    }
                ]);

            map.render({});

            expect(order).toEqual(["ground", "tree"]);
        });

        it("should render objects from back to front", () => {
            const order = [];

            vi.spyOn(map, "renderGround")
                .mockImplementation(() => {});

            vi.spyOn(map, "getRenderables")
                .mockReturnValue([
                    {
                        depth: 128,
                        draw: () => order.push("tree")
                    },
                    {
                        depth: 32,
                        draw: () => order.push("rock")
                    },
                    {
                        depth: 64,
                        draw: () => order.push("decoration")
                    }
                ]);

            map.render({});

            expect(order).toEqual([
                "rock",
                "decoration",
                "tree"
            ]);
        });

        it("should render objects with equal depth consistently", () => {
            const order = [];

            vi.spyOn(map, "renderGround")
                .mockImplementation(() => {});

            vi.spyOn(map, "getRenderables")
                .mockReturnValue([
                    {
                        depth: 64,
                        draw: () => order.push("tree")
                    },
                    {
                        depth: 64,
                        draw: () => order.push("decoration")
                    }
                ]);

            map.render({});

            expect(order).toEqual([
                "tree",
                "decoration"
            ]);
        });
    });
});
