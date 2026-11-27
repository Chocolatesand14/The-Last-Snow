
import { describe, it, expect, beforeEach } from "vitest";
import { TileMap } from "../src/world/TileMap.js";
import { SnowyForest } from "../src/world/maps/SnowyForest.js";

// Create an independent map for unit testing
const TestMap = {
    name: "Test Map",
    tileSize: 32,

    spawnPoint: {
        x: 32,
        y: 32
    },

    tiles: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 2, 1],
        [1, 0, 3, 2, 1],
        [1, 0, 0, 2, 1],
        [1, 1, 1, 1, 1]
    ]
};

describe("TileMap", () => {
    let map;

    beforeEach(() => {
        map = new TileMap(TestMap);
    });

    describe("Map initialization", () => {
        it("should create a map with the correct dimensions", () => {
            expect(map.width).toBe(160);
            expect(map.height).toBe(160);
        });

        it("should have the correct tile size", () => {
            expect(map.tileSize).toBe(32);
        });

        it("should have a walkable player spawn point", () => {
            const { x, y } = TestMap.spawnPoint;

            expect(map.isWalkable(x, y)).toBe(true);
        });
    });

    describe("Tile walkability", () => {
        it("should allow movement on snow", () => {
            expect(map.isWalkable(32, 32)).toBe(true);
        });

        it("should allow movement on paths", () => {
            expect(map.isWalkable(96, 32)).toBe(true);
        });

        it("should block movement through trees", () => {
            expect(map.isWalkable(0, 0)).toBe(false);
        });

        it("should block movement through rocks", () => {
            expect(map.isWalkable(64, 64)).toBe(false);
        });

        it("should block movement outside the map", () => {
            expect(map.isWalkable(-1, 0)).toBe(false);
            expect(map.isWalkable(0, -1)).toBe(false);
            expect(map.isWalkable(160, 0)).toBe(false);
            expect(map.isWalkable(0, 160)).toBe(false);
        });

        it("should reject invalid coordinates", () => {
            expect(map.isWalkable(NaN, 32)).toBe(false);
            expect(map.isWalkable(32, Infinity)).toBe(false);
        });
    });

    describe("Player collision detection", () => {
        it("should allow player movement on snow", () => {
            expect(
                map.canMoveTo(32, 32, 32, 32)
            ).toBe(true);
        });

        it("should allow player movement along paths", () => {
            expect(
                map.canMoveTo(96, 32, 32, 32)
            ).toBe(true);
        });

        it("should prevent player movement through trees", () => {
            expect(
                map.canMoveTo(0, 0, 32, 32)
            ).toBe(false);
        });

        it("should prevent player movement through rocks", () => {
            expect(
                map.canMoveTo(64, 64, 32, 32)
            ).toBe(false);
        });

        it("should prevent the player from leaving the world", () => {
            expect(
                map.canMoveTo(-1, 0, 32, 32)
            ).toBe(false);

            expect(
                map.canMoveTo(129, 0, 32, 32)
            ).toBe(false);

            expect(
                map.canMoveTo(0, -1, 32, 32)
            ).toBe(false);

            expect(
                map.canMoveTo(0, 129, 32, 32)
            ).toBe(false);
        });

        it("should prevent partial overlap with a rock", () => {
            expect(
                map.canMoveTo(48, 64, 32, 32)
            ).toBe(false);
        });

        it("should allow player movement at the spawn point", () => {
            const { x, y } = TestMap.spawnPoint;

            expect(
                map.canMoveTo(x, y, 32, 32)
            ).toBe(true);
        });
    });

    describe("Snowy Forest integration", () => {
        let forest;

        beforeEach(() => {
            forest = new TileMap(SnowyForest);
        });

        it("should create the expanded forest dimensions", () => {
            expect(forest.width).toBe(1600);
            expect(forest.height).toBe(1280);
        });

        it("should have consistent row lengths", () => {
            for (const row of SnowyForest.tiles) {
                expect(row).toHaveLength(50);
            }
        });

        it("should have a valid player spawn point", () => {
            const { x, y } = SnowyForest.spawnPoint;

            expect(
                forest.canMoveTo(x, y, 32, 32)
            ).toBe(true);
        });

        it("should contain trees", () => {
            expect(SnowyForest.tiles.flat()).toContain(1);
        });

        it("should contain paths", () => {
            expect(SnowyForest.tiles.flat()).toContain(2);
        });

        it("should contain rocks", () => {
            expect(SnowyForest.tiles.flat()).toContain(3);
        });

        it("should contain walkable snow", () => {
            expect(SnowyForest.tiles.flat()).toContain(0);
        });

        it("should only contain valid tile types", () => {
            const validTiles = [0, 1, 2, 3];

            for (const tile of SnowyForest.tiles.flat()) {
                expect(validTiles).toContain(tile);
            }
        });
    });
});
