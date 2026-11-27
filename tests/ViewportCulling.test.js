
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TileMap } from "../src/world/TileMap.js";
import { Camera } from "../src/core/Camera.js";

describe("Viewport Culling", () => {
    let map;
    let camera;
    let ctx;

    beforeEach(() => {
        map = new TileMap({
            name: "Viewport Test Map",
            tileSize: 32,
            spawnPoint: { x: 64, y: 64 },
            tiles: Array.from(
                { length: 10 },
                () => Array(10).fill(0)
            )
        });

        camera = new Camera(
            96, 96,
            map.width,
            map.height
        );

        ctx = {};

        vi.spyOn(map, "drawTile")
            .mockImplementation(() => {});
    });

    describe("Ground rendering", () => {
        it("should only render visible ground tiles", () => {
            map.renderGround(ctx, camera);

            expect(map.drawTile)
                .toHaveBeenCalledTimes(9);
        });

        it("should render partially visible tiles", () => {
            camera.x = 16;
            camera.y = 16;

            map.renderGround(ctx, camera);

            expect(map.drawTile)
                .toHaveBeenCalledTimes(16);
        });

        it("should not render distant ground tiles", () => {
            map.renderGround(ctx, camera);

            expect(map.drawTile)
                .not.toHaveBeenCalledWith(
                    ctx, 0, 288, 288
                );
        });

        it("should update visible tiles when the camera moves", () => {
            camera.x = 64;
            camera.y = 64;

            map.renderGround(ctx, camera);

            expect(map.drawTile)
                .toHaveBeenCalledWith(
                    ctx, 0, 64, 64
                );

            expect(map.drawTile)
                .not.toHaveBeenCalledWith(
                    ctx, 0, 0, 0
                );
        });

        it("should respect world boundaries", () => {
            camera.x = 224;
            camera.y = 224;

            map.renderGround(ctx, camera);

            expect(map.drawTile)
                .toHaveBeenCalledTimes(9);
        });

        it("should render the entire map without a camera", () => {
            map.renderGround(ctx);

            expect(map.drawTile)
                .toHaveBeenCalledTimes(100);
        });
    });

    describe("Environment rendering", () => {
        beforeEach(() => {
            // Place visible and distant environment objects
            map.tiles[1][1] = 1;
            map.tiles[2][2] = 3;
            map.tiles[8][8] = 1;

            // Isolate environment object tests from decorations
            vi.spyOn(map.decorationLayer, "getRenderables")
                .mockReturnValue([]);
        });

        it("should include visible environment objects", () => {
            const renderables = map.getRenderables(camera);

            expect(renderables).toHaveLength(2);
        });

        it("should exclude distant environment objects", () => {
            const renderables = map.getRenderables(camera);

            expect(
                renderables.some(
                    object => object.depth === 288
                )
            ).toBe(false);
        });

        it("should preserve tree sprites extending into the viewport", () => {
            // Place a tall tree below the visible ground area
            map.tiles[4][1] = 1;

            const renderables = map.getRenderables(camera);

            expect(
                renderables.some(
                    object => object.depth === 160
                )
            ).toBe(true);
        });

        it("should preserve depth information", () => {
            const renderables = map.getRenderables(camera);

            expect(
                renderables.map(object => object.depth)
            ).toEqual([64, 96]);
        });

        it("should preserve rendering without a camera", () => {
            const renderables = map.getRenderables();

            expect(renderables).toHaveLength(3);
        });
    });
});
