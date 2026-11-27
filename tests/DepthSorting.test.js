
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
            const renderables = map.getRenderables();

            expect(renderables.length).toBeGreaterThan(0);
        });

        it("should only include trees and rocks", () => {
            const expectedCount = SnowyForest.tiles
                .flat()
                .filter(tile => tile === 1 || tile === 3)
                .length;

            expect(map.getRenderables().length)
                .toBe(expectedCount);
        });

        it("should assign a valid depth to every object", () => {
            const renderables = map.getRenderables();

            for (const object of renderables) {
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
                    [0, 0],
                    [0, 1],
                    [3, 0]
                ]
            });

            const renderables = testMap.getRenderables();

            expect(renderables.map(object => object.depth))
                .toEqual([64, 96]);
        });

        it("should provide a draw function for every object", () => {
            const renderables = map.getRenderables();

            for (const object of renderables) {
                expect(typeof object.draw).toBe("function");
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
                        draw: () => order.push("front")
                    },
                    {
                        depth: 32,
                        draw: () => order.push("back")
                    },
                    {
                        depth: 64,
                        draw: () => order.push("middle")
                    }
                ]);

            map.render({});

            expect(order).toEqual([
                "back",
                "middle",
                "front"
            ]);
        });
    });
});
