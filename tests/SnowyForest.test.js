
import { describe, it, expect } from "vitest";
import { SnowyForest } from "../src/world/maps/SnowyForest.js";

describe("SnowyForest", () => {
    describe("Map configuration", () => {
        it("should have the correct map name", () => {
            expect(SnowyForest.name).toBe("Snowy Forest");
        });

        it("should use a tile size of 32 pixels", () => {
            expect(SnowyForest.tileSize).toBe(32);
        });

        it("should contain 40 rows", () => {
            expect(SnowyForest.tiles).toHaveLength(40);
        });

        it("should contain 50 columns in every row", () => {
            for (const row of SnowyForest.tiles) {
                expect(row).toHaveLength(50);
            }
        });

        it("should have the correct world dimensions", () => {
            const width =
                SnowyForest.tiles[0].length *
                SnowyForest.tileSize;

            const height =
                SnowyForest.tiles.length *
                SnowyForest.tileSize;

            expect(width).toBe(1600);
            expect(height).toBe(1280);
        });

        it("should only contain valid terrain types", () => {
            const validTypes = [0, 1, 2, 3];

            for (const row of SnowyForest.tiles) {
                for (const tile of row) {
                    expect(validTypes).toContain(tile);
                }
            }
        });
    });

    describe("Terrain generation", () => {
        it.each([
            [0, "snow"],
            [1, "trees"],
            [2, "paths"],
            [3, "rocks"]
        ])(
            "should contain terrain type %s (%s)",
            (type) => {
                expect(SnowyForest.tiles.flat())
                    .toContain(type);
            }
        );

        it("should preserve the northern path exit", () => {
            expect(SnowyForest.tiles[0][33])
                .toBe(2);
        });

        it("should surround the western boundary with trees", () => {
            for (const row of SnowyForest.tiles) {
                expect(row[0]).toBe(1);
            }
        });

        it("should surround the eastern boundary with trees", () => {
            for (const row of SnowyForest.tiles) {
                expect(row[row.length - 1]).toBe(1);
            }
        });

        it("should surround the southern boundary with trees", () => {
            const lastRow = SnowyForest.tiles.at(-1);

            expect(lastRow.every(tile => tile === 1))
                .toBe(true);
        });

        it("should surround the northern boundary except at the exit", () => {
            const firstRow = SnowyForest.tiles[0];

            firstRow.forEach((tile, column) => {
                expect(tile).toBe(
                    column === 33 ? 2 : 1
                );
            });
        });

        it("should maintain a connected forest path", () => {
            const pathPoints = [
                [26, 20],
                [29, 20],
                [29, 14],
                [24, 14],
                [24, 8],
                [33, 8],
                [33, 0]
            ];

            for (const [column, row] of pathPoints) {
                expect(SnowyForest.tiles[row][column])
                    .toBe(2);
            }
        });
    });

    describe("Player spawn point", () => {
        it("should provide the correct spawn coordinates", () => {
            expect(SnowyForest.spawnPoint).toEqual({
                x: 800,
                y: 640
            });
        });

        it("should align the spawn point with the tile grid", () => {
            expect(
                SnowyForest.spawnPoint.x %
                SnowyForest.tileSize
            ).toBe(0);

            expect(
                SnowyForest.spawnPoint.y %
                SnowyForest.tileSize
            ).toBe(0);
        });

        it("should keep the spawn tile clear", () => {
            expect(SnowyForest.tiles[20][25])
                .toBe(0);
        });

        it("should maintain a clearing around the spawn point", () => {
            for (let row = 15; row <= 25; row++) {
                for (
                    let column = 20;
                    column <= 30;
                    column++
                ) {
                    const distance = Math.hypot(
                        column - 25,
                        row - 20
                    );

                    if (distance <= 5) {
                        expect([0, 2]).toContain(
                            SnowyForest.tiles[row][column]
                        );
                    }
                }
            }
        });

        it("should keep the player inside the world", () => {
            const { x, y } = SnowyForest.spawnPoint;

            expect(x).toBeGreaterThanOrEqual(0);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(x + 64).toBeLessThanOrEqual(1600);
            expect(y + 64).toBeLessThanOrEqual(1280);
        });
    });

    describe("Snowdrift configuration", () => {
        it("should contain a snowdrift awakening area", () => {
            expect(SnowyForest.snowDrifts)
                .toHaveLength(1);
        });

        it("should configure the correct snowdrift dimensions", () => {
            const drift = SnowyForest.snowDrifts[0];

            expect(drift.width).toBe(128);
            expect(drift.height).toBe(120);
        });

        it("should configure the correct snowdrift position", () => {
            const drift = SnowyForest.snowDrifts[0];

            expect(drift.x).toBe(768);
            expect(drift.y).toBe(624);
        });

        it("should position the player within the snowdrift bounds", () => {
            const drift = SnowyForest.snowDrifts[0];
            const spawn = SnowyForest.spawnPoint;

            expect(spawn.x)
                .toBeGreaterThanOrEqual(drift.x);

            expect(spawn.y)
                .toBeGreaterThanOrEqual(drift.y);

            expect(spawn.x + 64)
                .toBeLessThanOrEqual(
                    drift.x + drift.width
                );

            expect(spawn.y + 64)
                .toBeLessThanOrEqual(
                    drift.y + drift.height
                );
        });

        it("should keep the snowdrift inside the world", () => {
            const drift = SnowyForest.snowDrifts[0];

            expect(drift.x).toBeGreaterThanOrEqual(0);
            expect(drift.y).toBeGreaterThanOrEqual(0);

            expect(drift.x + drift.width)
                .toBeLessThanOrEqual(1600);

            expect(drift.y + drift.height)
                .toBeLessThanOrEqual(1280);
        });
    });

    describe("Lantern configuration", () => {
        it("should contain a spawn lantern", () => {
            expect(SnowyForest.lanterns)
                .toHaveLength(1);
        });

        it("should configure the correct lantern dimensions", () => {
            const lantern = SnowyForest.lanterns[0];

            expect(lantern.width).toBe(24);
            expect(lantern.height).toBe(40);
        });

        it("should configure the correct lantern position", () => {
            const lantern = SnowyForest.lanterns[0];

            expect(lantern.x).toBe(904);
            expect(lantern.y).toBe(632);
        });

        it("should position the lantern beside the snowdrift", () => {
            const drift = SnowyForest.snowDrifts[0];
            const lantern = SnowyForest.lanterns[0];

            expect(lantern.x)
                .toBe(drift.x + drift.width + 8);
        });

        it("should not overlap the snowdrift", () => {
            const drift = SnowyForest.snowDrifts[0];
            const lantern = SnowyForest.lanterns[0];

            expect(lantern.x)
                .toBeGreaterThanOrEqual(
                    drift.x + drift.width
                );
        });

        it("should keep the lantern above the player's exit passage", () => {
            const lantern = SnowyForest.lanterns[0];
            const spawn = SnowyForest.spawnPoint;

            const playerFootY = spawn.y + 64 - 2;

            expect(lantern.y + lantern.height)
                .toBeLessThan(playerFootY);
        });

        it("should keep the lantern inside the world", () => {
            const lantern = SnowyForest.lanterns[0];

            expect(lantern.x).toBeGreaterThanOrEqual(0);
            expect(lantern.y).toBeGreaterThanOrEqual(0);

            expect(lantern.x + lantern.width)
                .toBeLessThanOrEqual(1600);

            expect(lantern.y + lantern.height)
                .toBeLessThanOrEqual(1280);
        });
    });
});
