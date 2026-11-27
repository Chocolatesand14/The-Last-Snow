
import { describe, it, expect, beforeEach } from "vitest";
import { TileMap } from "../src/world/TileMap.js";
import { SnowyForest } from "../src/world/maps/SnowyForest.js";

describe("TileMap", () => {
    let map;

    beforeEach(() => {
        map = new TileMap(SnowyForest);
    });

    describe("Map initialization", () => {
        it("should create a map with the correct dimensions", () => {
            expect(map.width).toBe(480);
            expect(map.height).toBe(384);
        });

        it("should have the correct tile size", () => {
            expect(map.tileSize).toBe(32);
        });

        it("should have a walkable player spawn point", () => {
            const { x, y } = SnowyForest.spawnPoint;

            expect(map.isWalkable(x, y)).toBe(true);
        });
    });

    describe("Tile walkability", () => {
        it("should allow movement on snow", () => {
            expect(map.isWalkable(160, 160)).toBe(true);
        });

        it("should allow movement on paths", () => {
            expect(map.isWalkable(352, 32)).toBe(true);
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
            expect(map.isWalkable(480, 0)).toBe(false);
            expect(map.isWalkable(0, 384)).toBe(false);
        });
    });

    describe("Player collision detection", () => {
        it("should allow player movement on snow", () => {
            expect(
                map.canMoveTo(160, 160, 32, 32)
            ).toBe(true);
        });

        it("should allow player movement along paths", () => {
            expect(
                map.canMoveTo(352, 32, 32, 32)
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
                map.canMoveTo(449, 0, 32, 32)
            ).toBe(false);

            expect(
                map.canMoveTo(0, -1, 32, 32)
            ).toBe(false);

            expect(
                map.canMoveTo(0, 353, 32, 32)
            ).toBe(false);
        });

        it("should prevent partial overlap with a rock", () => {
            expect(
                map.canMoveTo(48, 64, 32, 32)
            ).toBe(false);
        });

        it("should allow player movement at the spawn point", () => {
            const { x, y } = SnowyForest.spawnPoint;

            expect(
                map.canMoveTo(x, y, 32, 32)
            ).toBe(true);
        });
    });
});
