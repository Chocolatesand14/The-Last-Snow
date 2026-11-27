import { describe, it, expect } from "vitest";
import { TileMap } from "../src/world/TileMap.js";
import { SnowyForest } from "../src/world/maps/SnowyForest.js";

describe("TileMap", () => {
    it("should create a map with the correct dimensions", () => {
        const map = new TileMap(SnowyForest);

        expect(map.width).toBe(320);
        expect(map.height).toBe(320);
    });

    it("should allow movement on snow", () => {
        const map = new TileMap(SnowyForest);

        expect(map.isWalkable(160, 160)).toBe(true);
    });

    it("should block movement through trees", () => {
        const map = new TileMap(SnowyForest);

        expect(map.isWalkable(0, 0)).toBe(false);
    });

    it("should block movement through rocks", () => {
        const map = new TileMap(SnowyForest);

        expect(map.isWalkable(64, 64)).toBe(false);
    });

    it("should block movement outside the map", () => {
        const map = new TileMap(SnowyForest);

        expect(map.isWalkable(-1, -1)).toBe(false);
    });
});