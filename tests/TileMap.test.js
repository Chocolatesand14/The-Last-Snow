
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TileMap } from "../src/world/TileMap.js";
import { SnowyForest } from "../src/world/maps/SnowyForest.js";
import { Shadow } from "../src/lighting/Shadow.js";
import { ShadowSystem } from "../src/lighting/ShadowSystem.js";

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

// Create a controlled canvas rendering context
function createContext() {
    const pixels = [];

    const ctx = {
        imageSmoothingEnabled: true,
        fillStyle: "",
        drawImage: vi.fn(),
        fillRect: vi.fn((x, y, width, height) => {
            pixels.push({
                x,
                y,
                width,
                height,
                color: ctx.fillStyle
            });
        })
    };

    return { ctx, pixels };
}

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

        it("should initialize the correct number of rows and columns", () => {
            expect(map.rows).toBe(5);
            expect(map.columns).toBe(5);
        });

        it("should initialize all tree sprite variations", () => {
            expect(
                map.treeSprites.map(tree => ({
                    width: tree.width,
                    height: tree.height
                }))
            ).toEqual([
                { width: 32, height: 48 },
                { width: 48, height: 64 },
                { width: 64, height: 96 }
            ]);
        });

        it("should initialize the decoration layer", () => {
            expect(map.decorationLayer).toBeDefined();
            expect(map.decorationLayer.tileSize).toBe(32);
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

        it.each([
            [Infinity, 32],
            [-Infinity, 32],
            [32, NaN],
            [32, -Infinity],
            [null, 32],
            [32, undefined]
        ])(
            "should reject invalid world coordinates (%s, %s)",
            (x, y) => {
                expect(map.isWalkable(x, y)).toBe(false);
            }
        );
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

        it("should allow the collision box to overlap walkable tiles", () => {
            expect(
                map.canMoveTo(48, 32, 32, 32)
            ).toBe(true);
        });

        it("should detect collisions across multiple tile rows", () => {
            expect(
                map.canMoveTo(64, 40, 32, 32)
            ).toBe(false);
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

    describe("Static shadow registration", () => {
        let shadowSystem;

        beforeEach(() => {
            shadowSystem = new ShadowSystem();

            // Disable generated decorations for controlled tile tests
            map.decorationLayer.decorations = [];
        });

        it("should register a shadow for every tree and rock", () => {
            map.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toHaveLength(17);
        });

        it("should create real Shadow instances", () => {
            map.registerStaticShadows(shadowSystem);

            for (const shadow of shadowSystem.staticShadows) {
                expect(shadow).toBeInstanceOf(Shadow);
            }
        });

        it.each([
            [16, 30, 28, 12, 0.25],
            [48, 30, 42, 16, 0.30],
            [80, 30, 56, 22, 0.35]
        ])(
            "should register the correct tree shadow at (%s, %s)",
            (x, y, width, height, opacity) => {
                map.registerStaticShadows(shadowSystem);

                const shadow =
                    shadowSystem.staticShadows.find(
                        item => item.x === x && item.y === y
                    );

                expect(shadow).toBeDefined();
                expect(shadow.width).toBe(width);
                expect(shadow.height).toBe(height);
                expect(shadow.opacity).toBe(opacity);
            }
        );

        it("should register a rock shadow at the correct position", () => {
            map.registerStaticShadows(shadowSystem);

            const shadow =
                shadowSystem.staticShadows.find(
                    item => item.x === 80 && item.y === 94
                );

            expect(shadow).toBeDefined();
            expect(shadow.width).toBe(24);
            expect(shadow.height).toBe(10);
            expect(shadow.opacity).toBe(0.25);
        });

        it("should not register shadows for snow and path tiles", () => {
            const emptyMap = new TileMap({
                tileSize: 32,
                spawnPoint: { x: 0, y: 0 },
                tiles: [
                    [0, 2],
                    [2, 0]
                ]
            });

            emptyMap.decorationLayer.decorations = [];

            emptyMap.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toHaveLength(0);
        });

        it("should register decoration shadows together with tile shadows", () => {
            map.decorationLayer.decorations = [
                {
                    x: 36,
                    y: 40,
                    type: 0,
                    width: 24,
                    height: 24
                }
            ];

            map.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toHaveLength(18);

            const decorationShadow =
                shadowSystem.staticShadows.find(
                    shadow =>
                        shadow.x === 48 &&
                        shadow.y === 62
                );

            expect(decorationShadow).toBeDefined();
            expect(decorationShadow.width).toBe(18);
            expect(decorationShadow.height).toBe(8);
            expect(decorationShadow.opacity).toBe(0.20);
        });

        it("should not duplicate shadows during repeated registration", () => {
            map.registerStaticShadows(shadowSystem);

            const initialCount =
                shadowSystem.staticShadows.length;

            map.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows.length)
                .toBe(initialCount);
        });

        it("should not duplicate decoration shadows during registration", () => {
            map.decorationLayer.decorations = [
                {
                    x: 36,
                    y: 40,
                    type: 0,
                    width: 24,
                    height: 24
                }
            ];

            map.registerStaticShadows(shadowSystem);
            map.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toHaveLength(18);
        });

        it("should remove previous environment shadows during registration", () => {
            const previousShadow =
                shadowSystem.addStaticShadow(999, 999);

            map.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows)
                .not.toContain(previousShadow);
        });

        it("should preserve the player shadow", () => {
            shadowSystem.createPlayerShadow({
                x: 32,
                y: 32,
                width: 32,
                height: 32
            });

            const playerShadow =
                shadowSystem.playerShadow;

            map.registerStaticShadows(shadowSystem);

            expect(shadowSystem.playerShadow)
                .toBe(playerShadow);
        });

        it("should preserve the original map tiles", () => {
            const originalTiles =
                structuredClone(map.tiles);

            map.registerStaticShadows(shadowSystem);

            expect(map.tiles).toEqual(originalTiles);
        });

        it("should register all shadows in the full forest", () => {
            const forest = new TileMap(SnowyForest);

            forest.registerStaticShadows(shadowSystem);

            const tileShadowCount =
                forest.tiles.flat().filter(
                    tile => tile === 1 || tile === 3
                ).length;

            const decorationShadowCount =
                forest.decorationLayer.decorations.length;

            expect(shadowSystem.staticShadows.length)
                .toBe(
                    tileShadowCount + decorationShadowCount
                );
        });
    });

    describe("Shadow weather integration", () => {
        let shadowSystem;

        beforeEach(() => {
            shadowSystem = new ShadowSystem();

            map.decorationLayer.decorations = [];
        });

        it("should apply current weather to newly registered shadows", () => {
            shadowSystem.setWeatherVisibility(0.35);

            map.registerStaticShadows(shadowSystem);

            for (const shadow of shadowSystem.staticShadows) {
                expect(shadow.getEffectiveOpacity())
                    .toBeCloseTo(shadow.opacity * 0.35);
            }
        });

        it.each([1, 0.95, 0.85, 0.65, 0.35])(
            "should adapt environment shadows to weather visibility %s",
            (visibility) => {
                map.registerStaticShadows(shadowSystem);

                shadowSystem.setWeatherVisibility(
                    visibility
                );

                for (const shadow of shadowSystem.staticShadows) {
                    expect(shadow.getEffectiveOpacity())
                        .toBeCloseTo(
                            shadow.opacity * visibility
                        );
                }
            }
        );

        it("should restore original opacity when weather improves", () => {
            map.registerStaticShadows(shadowSystem);

            shadowSystem.setWeatherVisibility(0.35);
            shadowSystem.setWeatherVisibility(1);

            for (const shadow of shadowSystem.staticShadows) {
                expect(shadow.getEffectiveOpacity())
                    .toBeCloseTo(shadow.opacity);
            }
        });

        it("should preserve weather conditions during repeated registration", () => {
            shadowSystem.setWeatherVisibility(0.65);

            map.registerStaticShadows(shadowSystem);
            map.registerStaticShadows(shadowSystem);

            expect(shadowSystem.weatherVisibility)
                .toBe(0.65);

            for (const shadow of shadowSystem.staticShadows) {
                expect(shadow.weatherVisibility)
                    .toBe(0.65);
            }
        });
    });

    describe("Shadow viewport integration", () => {
        let shadowSystem;

        beforeEach(() => {
            shadowSystem = new ShadowSystem();

            map.decorationLayer.decorations = [];

            map.registerStaticShadows(shadowSystem);
        });

        it("should render only visible environment shadows", () => {
            const camera = {
                x: 0,
                y: 0,
                width: 64,
                height: 64
            };

            const visibleShadow =
                shadowSystem.staticShadows.find(
                    shadow =>
                        shadow.x === 16 &&
                        shadow.y === 30
                );

            const hiddenShadow =
                shadowSystem.staticShadows.find(
                    shadow =>
                        shadow.x === 144 &&
                        shadow.y === 158
                );

            const visibleSpy = vi.spyOn(
                visibleShadow, "draw"
            ).mockImplementation(() => {});

            const hiddenSpy = vi.spyOn(
                hiddenShadow, "draw"
            ).mockImplementation(() => {});

            // Isolate canvas rendering from viewport selection
            for (const shadow of shadowSystem.staticShadows) {
                if (
                    shadow !== visibleShadow &&
                    shadow !== hiddenShadow
                ) {
                    vi.spyOn(shadow, "draw")
                        .mockImplementation(() => {});
                }
            }

            shadowSystem.draw({}, camera);

            expect(visibleSpy).toHaveBeenCalled();
            expect(hiddenSpy).not.toHaveBeenCalled();
        });

        it("should preserve static shadow positions when the camera moves", () => {
            const originalPositions =
                shadowSystem.staticShadows.map(shadow => ({
                    x: shadow.x,
                    y: shadow.y
                }));

            const camera = {
                x: 64,
                y: 64,
                width: 64,
                height: 64
            };

            for (const shadow of shadowSystem.staticShadows) {
                shadowSystem.isVisible(shadow, camera);
            }

            expect(
                shadowSystem.staticShadows.map(shadow => ({
                    x: shadow.x,
                    y: shadow.y
                }))
            ).toEqual(originalPositions);
        });
    });

    describe("Image loading", () => {
        it("should return null when Image is unavailable", () => {
            vi.stubGlobal("Image", undefined);

            try {
                expect(map.loadImage("test.png"))
                    .toBeNull();
            } finally {
                vi.unstubAllGlobals();
            }
        });

        it("should create an image with the correct source", () => {
            class MockImage {
                constructor() {
                    this.src = "";
                }
            }

            vi.stubGlobal("Image", MockImage);

            try {
                const image = map.loadImage("test.png");

                expect(image).toBeInstanceOf(MockImage);
                expect(image.src).toBe("test.png");
            } finally {
                vi.unstubAllGlobals();
            }
        });

        it("should initialize the correct environment image sources", () => {
            class MockImage {
                constructor() {
                    this.src = "";
                }
            }

            vi.stubGlobal("Image", MockImage);

            try {
                const loadedMap = new TileMap(TestMap);

                expect(
                    loadedMap.treeSprites.map(
                        tree => tree.image.src
                    )
                ).toEqual([
                    "assets/tilesets/forest/pine-small.png",
                    "assets/tilesets/forest/pine-medium.png",
                    "assets/tilesets/forest/pine-large.png"
                ]);

                expect(loadedMap.rockSprite.src)
                    .toBe(
                        "assets/tilesets/forest/rock.png"
                    );
            } finally {
                vi.unstubAllGlobals();
            }
        });

        it.each([
            null,
            undefined,
            { complete: false, naturalWidth: 32 },
            { complete: true, naturalWidth: 0 }
        ])(
            "should reject unavailable or unloaded images",
            (image) => {
                expect(map.isImageLoaded(image))
                    .toBe(false);
            }
        );

        it("should accept a fully loaded image", () => {
            expect(
                map.isImageLoaded({
                    complete: true,
                    naturalWidth: 32
                })
            ).toBe(true);
        });
    });

    describe("Path detection", () => {
        it("should identify path tiles", () => {
            expect(map.isPath(3, 1)).toBe(true);
        });

        it.each([
            [1, 1],
            [0, 0],
            [2, 2],
            [-1, 1],
            [5, 1],
            [1, -1],
            [1, 5]
        ])(
            "should reject non-path or unavailable tiles (%s, %s)",
            (column, row) => {
                expect(map.isPath(column, row))
                    .toBe(false);
            }
        );
    });

    describe("Visible tile bounds", () => {
        it("should return the complete map without a camera", () => {
            expect(map.getVisibleTileBounds())
                .toEqual({
                    startColumn: 0,
                    endColumn: 4,
                    startRow: 0,
                    endRow: 4
                });
        });

        it("should support an explicitly null camera", () => {
            expect(map.getVisibleTileBounds(null))
                .toEqual({
                    startColumn: 0,
                    endColumn: 4,
                    startRow: 0,
                    endRow: 4
                });
        });

        it("should return tiles inside the viewport", () => {
            expect(
                map.getVisibleTileBounds({
                    x: 32,
                    y: 32,
                    width: 64,
                    height: 64
                })
            ).toEqual({
                startColumn: 1,
                endColumn: 2,
                startRow: 1,
                endRow: 2
            });
        });

        it("should include partially visible tiles", () => {
            expect(
                map.getVisibleTileBounds({
                    x: 16,
                    y: 16,
                    width: 32,
                    height: 32
                })
            ).toEqual({
                startColumn: 0,
                endColumn: 1,
                startRow: 0,
                endRow: 1
            });
        });

        it("should expand visible bounds using padding", () => {
            expect(
                map.getVisibleTileBounds({
                    x: 64,
                    y: 64,
                    width: 32,
                    height: 32
                }, 32)
            ).toEqual({
                startColumn: 1,
                endColumn: 3,
                startRow: 1,
                endRow: 3
            });
        });

        it("should clamp padded bounds to the map", () => {
            expect(
                map.getVisibleTileBounds({
                    x: 0,
                    y: 0,
                    width: 160,
                    height: 160
                }, 96)
            ).toEqual({
                startColumn: 0,
                endColumn: 4,
                startRow: 0,
                endRow: 4
            });
        });

        it("should use rounded camera coordinates", () => {
            expect(
                map.getVisibleTileBounds({
                    x: 31.6,
                    y: 31.6,
                    width: 32,
                    height: 32
                })
            ).toEqual({
                startColumn: 1,
                endColumn: 1,
                startRow: 1,
                endRow: 1
            });
        });
    });

    describe("Viewport culling", () => {
        const camera = {
            x: 32,
            y: 32,
            width: 64,
            height: 64
        };

        it("should include fully visible objects", () => {
            expect(
                map.isVisible(40, 40, 24, 24, camera)
            ).toBe(true);
        });

        it.each([
            [20, 40],
            [90, 40],
            [40, 20],
            [40, 90]
        ])(
            "should include partially visible objects (%s, %s)",
            (x, y) => {
                expect(
                    map.isVisible(x, y, 24, 24, camera)
                ).toBe(true);
            }
        );

        it.each([
            [8, 40],
            [96, 40],
            [40, 8],
            [40, 96]
        ])(
            "should exclude objects outside the viewport (%s, %s)",
            (x, y) => {
                expect(
                    map.isVisible(x, y, 24, 24, camera)
                ).toBe(false);
            }
        );

        it("should render objects without a camera", () => {
            expect(
                map.isVisible(800, 600, 32, 32)
            ).toBe(true);
        });

        it("should support an explicitly null camera", () => {
            expect(
                map.isVisible(800, 600, 32, 32, null)
            ).toBe(true);
        });

        it("should match rounded camera coordinates", () => {
            expect(
                map.isVisible(8, 40, 24, 24, {
                    x: 31.6,
                    y: 31.6,
                    width: 64,
                    height: 64
                })
            ).toBe(false);
        });
    });

    describe("Ground rendering", () => {
        it("should render every tile without a camera", () => {
            const { ctx } = createContext();

            const spy = vi.spyOn(map, "drawTile")
                .mockImplementation(() => {});

            map.renderGround(ctx);

            expect(spy).toHaveBeenCalledTimes(25);
        });

        it("should render only visible ground tiles", () => {
            const { ctx } = createContext();

            const spy = vi.spyOn(map, "drawTile")
                .mockImplementation(() => {});

            const camera = {
                x: 32,
                y: 32,
                width: 64,
                height: 64
            };

            map.renderGround(ctx, camera);

            expect(spy).toHaveBeenCalledTimes(4);

            expect(spy.mock.calls).toEqual([
                [ctx, 0, 32, 32],
                [ctx, 0, 64, 32],
                [ctx, 0, 32, 64],
                [ctx, 3, 64, 64]
            ]);
        });

        it("should disable image smoothing", () => {
            const { ctx } = createContext();

            vi.spyOn(map, "drawTile")
                .mockImplementation(() => {});

            map.renderGround(ctx);

            expect(ctx.imageSmoothingEnabled)
                .toBe(false);
        });

        it("should not render ground outside the map", () => {
            const { ctx } = createContext();

            const spy = vi.spyOn(map, "drawTile")
                .mockImplementation(() => {});

            map.renderGround(ctx, {
                x: 500,
                y: 500,
                width: 32,
                height: 32
            });

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe("Tile rendering", () => {
        it.each([0, 1, 3])(
            "should draw snow beneath tile type %s",
            (tile) => {
                const { ctx } = createContext();

                const snowSpy = vi.spyOn(map, "drawSnow")
                    .mockImplementation(() => {});

                const pathSpy = vi.spyOn(map, "drawPath")
                    .mockImplementation(() => {});

                map.drawTile(ctx, tile, 32, 64);

                expect(snowSpy)
                    .toHaveBeenCalledWith(ctx, 32, 64);

                expect(pathSpy)
                    .not.toHaveBeenCalled();
            }
        );

        it("should draw a path above the snow base", () => {
            const { ctx } = createContext();

            const order = [];

            vi.spyOn(map, "drawSnow")
                .mockImplementation(() => {
                    order.push("snow");
                });

            vi.spyOn(map, "drawPath")
                .mockImplementation(() => {
                    order.push("path");
                });

            map.drawTile(ctx, 2, 96, 32);

            expect(order).toEqual(["snow", "path"]);
        });
    });

    describe("Snow rendering", () => {
        it("should draw the base snow color", () => {
            const { ctx, pixels } = createContext();

            map.drawSnow(ctx, 32, 32);

            expect(pixels[0]).toEqual({
                x: 32,
                y: 32,
                width: 32,
                height: 32,
                color: "#e1eaf0"
            });
        });

        it("should draw deterministic snow textures", () => {
            const first = createContext();
            const second = createContext();

            map.drawSnow(first.ctx, 32, 32);
            map.drawSnow(second.ctx, 32, 32);

            expect(first.pixels)
                .toEqual(second.pixels);
        });

        it("should draw all snow texture color variations", () => {
            const { ctx, pixels } = createContext();

            for (let row = 0; row < 5; row++) {
                for (let column = 0; column < 5; column++) {
                    map.drawSnow(
                        ctx,
                        column * 32,
                        row * 32
                    );
                }
            }

            const colors = pixels.map(pixel => pixel.color);

            expect(colors).toContain("#f4f8fc");
            expect(colors).toContain("#cbdbe6");
            expect(colors).toContain("#d4e2eb");
        });

        it("should draw snowdrift shadows and highlights", () => {
            const { ctx, pixels } = createContext();

            map.drawSnow(ctx, 0, 0);

            expect(pixels).toContainEqual({
                x: 6,
                y: 22,
                width: 18,
                height: 3,
                color: "#c6d7e4"
            });

            expect(pixels).toContainEqual({
                x: 10,
                y: 17,
                width: 10,
                height: 3,
                color: "#f3f8fc"
            });
        });

        it("should skip snowdrifts on non-matching tiles", () => {
            const { ctx, pixels } = createContext();

            map.drawSnow(ctx, 32, 0);

            expect(
                pixels.some(
                    pixel => pixel.color === "#c6d7e4"
                )
            ).toBe(false);
        });

        it("should keep snow details inside the rendered tile", () => {
            const { ctx, pixels } = createContext();

            map.drawSnow(ctx, 64, 64);

            for (const pixel of pixels) {
                expect(pixel.x).toBeGreaterThanOrEqual(64);
                expect(pixel.y).toBeGreaterThanOrEqual(64);

                expect(pixel.x + pixel.width)
                    .toBeLessThanOrEqual(96);

                expect(pixel.y + pixel.height)
                    .toBeLessThanOrEqual(96);
            }
        });
    });

    describe("Path rendering", () => {
        function createPathMap(tiles) {
            return new TileMap({
                tileSize: 32,
                spawnPoint: { x: 32, y: 32 },
                tiles
            });
        }

        it("should draw compacted snow in the path center", () => {
            const { ctx, pixels } = createContext();

            map.drawPath(ctx, 96, 64);

            const center = pixels.find(
                pixel =>
                    pixel.x === 112 &&
                    pixel.y === 80
            );

            expect(center).toBeDefined();

            expect([
                "#bacbda",
                "#b0c2d2"
            ]).toContain(center.color);
        });

        it("should draw all path color variations", () => {
            const pathMap = createPathMap([
                [0, 0, 0],
                [0, 2, 0],
                [0, 0, 0]
            ]);

            const { ctx, pixels } = createContext();

            pathMap.drawPath(ctx, 32, 32);

            const colors =
                pixels.map(pixel => pixel.color);

            expect(colors).toContain("#bacbda");
            expect(colors).toContain("#b0c2d2");
            expect(colors).toContain("#c5d4e0");
            expect(colors).toContain("#d4e0e9");
        });

        it("should leave the corners of an isolated path untouched", () => {
            const pathMap = createPathMap([
                [0, 0, 0],
                [0, 2, 0],
                [0, 0, 0]
            ]);

            const { ctx, pixels } = createContext();

            pathMap.drawPath(ctx, 32, 32);

            expect(
                pixels.some(
                    pixel =>
                        pixel.x === 32 &&
                        pixel.y === 32
                )
            ).toBe(false);
        });

        it("should connect paths in all four directions", () => {
            const pathMap = createPathMap([
                [0, 2, 0],
                [2, 2, 2],
                [0, 2, 0]
            ]);

            const { ctx, pixels } = createContext();

            pathMap.drawPath(ctx, 32, 32);

            const connections = [
                [48, 32],
                [48, 62],
                [32, 48],
                [62, 48]
            ];

            for (const [x, y] of connections) {
                const pixel = pixels.find(
                    item =>
                        item.x === x &&
                        item.y === y
                );

                expect(pixel).toBeDefined();

                expect([
                    "#bacbda",
                    "#b0c2d2"
                ]).toContain(pixel.color);
            }
        });

        it("should connect paths to the northern map boundary", () => {
            const pathMap = createPathMap([
                [0, 2, 0],
                [0, 0, 0]
            ]);

            const { ctx, pixels } = createContext();

            pathMap.drawPath(ctx, 32, 0);

            const edge = pixels.find(
                pixel =>
                    pixel.x === 48 &&
                    pixel.y === 0
            );

            expect(edge).toBeDefined();
        });

        it("should render consistent path textures", () => {
            const first = createContext();
            const second = createContext();

            map.drawPath(first.ctx, 96, 64);
            map.drawPath(second.ctx, 96, 64);

            expect(first.pixels)
                .toEqual(second.pixels);
        });
    });

    describe("Tree sprite rendering", () => {
        it.each([
            [0, 0, 32, 48, 0, -16],
            [32, 0, 48, 64, 24, -32],
            [64, 0, 64, 96, 48, -64]
        ])(
            "should draw the correct tree variation at (%s, %s)",
            (x, y, width, height, drawX, drawY) => {
                const { ctx } = createContext();

                const index =
                    Math.floor(x / 32) % 3;

                const image = {
                    complete: true,
                    naturalWidth: width
                };

                map.treeSprites[index].image = image;

                map.drawPineTree(ctx, x, y);

                expect(ctx.drawImage)
                    .toHaveBeenCalledWith(
                        image,
                        drawX,
                        drawY,
                        width,
                        height
                    );
            }
        );

        it("should draw a fallback tree when the image is unavailable", () => {
            const { ctx } = createContext();

            map.treeSprites[0].image = null;

            const fallbackSpy = vi.spyOn(
                map, "drawFallbackTree"
            );

            map.drawPineTree(ctx, 0, 0);

            expect(fallbackSpy)
                .toHaveBeenCalledWith(ctx, 0, 0);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();
        });

        it("should render fallback trees with trunk, branches and snow", () => {
            const { ctx, pixels } = createContext();

            map.drawFallbackTree(ctx, 32, 64);

            const colors =
                pixels.map(pixel => pixel.color);

            expect(colors).toContain("#59483d");
            expect(colors).toContain("#183830");
            expect(colors).toContain("#f4f8fb");

            expect(ctx.fillRect)
                .toHaveBeenCalledTimes(9);

            expect(pixels).toContainEqual({
                x: 45,
                y: 86,
                width: 6,
                height: 8,
                color: "#59483d"
            });
        });
    });

    describe("Rock sprite rendering", () => {
        it("should render a loaded rock image", () => {
            const { ctx } = createContext();

            const image = {
                complete: true,
                naturalWidth: 32
            };

            map.rockSprite = image;

            map.drawRock(ctx, 64, 64);

            expect(ctx.drawImage)
                .toHaveBeenCalledWith(
                    image,
                    64,
                    64,
                    32,
                    32
                );
        });

        it("should render a fallback rock when the image is unavailable", () => {
            const { ctx, pixels } = createContext();

            map.rockSprite = null;

            map.drawRock(ctx, 64, 64);

            expect(ctx.drawImage)
                .not.toHaveBeenCalled();

            expect(pixels).toContainEqual({
                x: 70,
                y: 76,
                width: 20,
                height: 14,
                color: "#778594"
            });
        });

        it("should center a rock on a larger tile", () => {
            const largerMap = new TileMap({
                tileSize: 64,
                spawnPoint: { x: 0, y: 0 },
                tiles: [[3]]
            });

            const { ctx } = createContext();

            const image = {
                complete: true,
                naturalWidth: 32
            };

            largerMap.rockSprite = image;

            largerMap.drawRock(ctx, 0, 0);

            expect(ctx.drawImage)
                .toHaveBeenCalledWith(
                    image,
                    16,
                    32,
                    32,
                    32
                );
        });
    });

    describe("Environment renderables", () => {
        beforeEach(() => {
            map.decorationLayer.decorations = [];
        });

        it("should return all trees and rocks without a camera", () => {
            expect(map.getRenderables())
                .toHaveLength(17);
        });

        it("should include decoration renderables", () => {
            map.decorationLayer.decorations = [
                {
                    x: 36,
                    y: 40,
                    type: 0,
                    width: 24,
                    height: 24
                }
            ];

            expect(map.getRenderables())
                .toHaveLength(18);
        });

        it("should assign depth using the bottom of each tile", () => {
            const renderables =
                map.getRenderables();

            expect(renderables[0].depth).toBe(32);

            expect(
                renderables.every(
                    object => object.depth % 32 === 0
                )
            ).toBe(true);
        });

        it("should execute tree and rock draw functions", () => {
            const { ctx } = createContext();

            const treeSpy = vi.spyOn(
                map, "drawPineTree"
            ).mockImplementation(() => {});

            const rockSpy = vi.spyOn(
                map, "drawRock"
            ).mockImplementation(() => {});

            for (const object of map.getRenderables()) {
                object.draw(ctx);
            }

            expect(treeSpy)
                .toHaveBeenCalledTimes(16);

            expect(rockSpy)
                .toHaveBeenCalledTimes(1);

            expect(rockSpy)
                .toHaveBeenCalledWith(ctx, 64, 64);
        });

        it("should exclude environment objects outside the viewport", () => {
            const renderables =
                map.getRenderables({
                    x: 500,
                    y: 500,
                    width: 32,
                    height: 32
                });

            expect(renderables)
                .toHaveLength(0);
        });

        it("should include oversized trees whose base is outside the viewport", () => {
            const treeMap = new TileMap({
                tileSize: 32,
                spawnPoint: { x: 0, y: 0 },
                tiles: [
                    [0, 0, 0],
                    [0, 0, 0],
                    [1, 0, 0]
                ]
            });

            treeMap.decorationLayer.decorations = [];

            const renderables =
                treeMap.getRenderables({
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32
                });

            expect(renderables)
                .toHaveLength(1);

            expect(renderables[0].depth)
                .toBe(96);
        });

        it("should include a tree when fallback bounds are visible", () => {
            const treeMap = new TileMap({
                tileSize: 32,
                spawnPoint: { x: 0, y: 0 },
                tiles: [[1]]
            });

            treeMap.decorationLayer.decorations = [];

            // Exercise the alternate fallback visibility check
            vi.spyOn(treeMap, "isVisible")
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);

            expect(
                treeMap.getRenderables({
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32
                })
            ).toHaveLength(1);
        });

        it("should include a rock when fallback bounds are visible", () => {
            const rockMap = new TileMap({
                tileSize: 32,
                spawnPoint: { x: 0, y: 0 },
                tiles: [[3]]
            });

            rockMap.decorationLayer.decorations = [];

            // Exercise the alternate fallback visibility check
            vi.spyOn(rockMap, "isVisible")
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);

            expect(
                rockMap.getRenderables({
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32
                })
            ).toHaveLength(1);
        });

        it.each([1, 3])(
            "should exclude tile type %s when both bounds are outside the viewport",
            (tile) => {
                const objectMap = new TileMap({
                    tileSize: 32,
                    spawnPoint: { x: 0, y: 0 },
                    tiles: [[tile]]
                });

                objectMap.decorationLayer.decorations = [];

                const renderables =
                    objectMap.getRenderables({
                        x: 64,
                        y: 64,
                        width: 16,
                        height: 16
                    });

                expect(renderables)
                    .toHaveLength(0);
            }
        );

        it("should preserve world data during viewport culling", () => {
            const originalTiles =
                structuredClone(map.tiles);

            map.getRenderables({
                x: 32,
                y: 32,
                width: 64,
                height: 64
            });

            expect(map.tiles)
                .toEqual(originalTiles);
        });
    });

    describe("World rendering order", () => {
        it("should render ground before environment objects", () => {
            const { ctx } = createContext();

            const order = [];

            vi.spyOn(map, "renderGround")
                .mockImplementation(() => {
                    order.push("ground");
                });

            vi.spyOn(map, "getRenderables")
                .mockReturnValue([
                    {
                        depth: 32,
                        draw: () => order.push("tree")
                    }
                ]);

            map.render(ctx);

            expect(order).toEqual([
                "ground",
                "tree"
            ]);
        });

        it("should render objects from back to front", () => {
            const { ctx } = createContext();

            const order = [];

            vi.spyOn(map, "renderGround")
                .mockImplementation(() => {});

            vi.spyOn(map, "getRenderables")
                .mockReturnValue([
                    {
                        depth: 96,
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

            map.render(ctx);

            expect(order).toEqual([
                "back",
                "middle",
                "front"
            ]);
        });

        it("should forward the camera to the rendering methods", () => {
            const { ctx } = createContext();

            const camera = {
                x: 32,
                y: 32,
                width: 64,
                height: 64
            };

            const groundSpy = vi.spyOn(
                map, "renderGround"
            ).mockImplementation(() => {});

            const renderablesSpy = vi.spyOn(
                map, "getRenderables"
            ).mockReturnValue([]);

            map.render(ctx, camera);

            expect(groundSpy)
                .toHaveBeenCalledWith(ctx, camera);

            expect(renderablesSpy)
                .toHaveBeenCalledWith(camera);
        });

        it("should support rendering without environment objects", () => {
            const { ctx } = createContext();

            vi.spyOn(map, "renderGround")
                .mockImplementation(() => {});

            vi.spyOn(map, "getRenderables")
                .mockReturnValue([]);

            expect(() => map.render(ctx))
                .not.toThrow();
        });

        it("should render the complete test map without errors", () => {
            const { ctx } = createContext();

            expect(() => map.render(ctx))
                .not.toThrow();

            expect(ctx.fillRect)
                .toHaveBeenCalled();
        });
    });
});
