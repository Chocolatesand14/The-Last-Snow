
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

import { TileMap } from "../src/world/TileMap.js";
import { SnowyForest } from "../src/world/maps/SnowyForest.js";
import { SnowDrift } from "../src/entities/SnowDrift.js";
import { Lantern } from "../src/entities/Lantern.js";
import { LightingSystem } from "../src/lighting/LightingSystem.js";
import { ShadowSystem } from "../src/lighting/ShadowSystem.js";

describe("Spawn Area Integration", () => {
    let world;
    let snowDrift;
    let lantern;
    let lightingSystem;
    let shadowSystem;

    const PLAYER_WIDTH = 64;
    const PLAYER_HEIGHT = 64;

    beforeEach(() => {
        world = new TileMap(SnowyForest);

        snowDrift = world.snowDrifts[0];
        lantern = world.lanterns[0];

        lightingSystem = new LightingSystem();
        shadowSystem = new ShadowSystem();

        world.registerLights(lightingSystem);
        world.registerStaticShadows(shadowSystem);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Awakening area initialization", () => {
        it("should initialize one awakening snowdrift", () => {
            expect(world.snowDrifts).toHaveLength(1);
        });

        it("should initialize one environmental lantern", () => {
            expect(world.lanterns).toHaveLength(1);
        });

        it("should create a real SnowDrift instance", () => {
            expect(snowDrift).toBeInstanceOf(SnowDrift);
        });

        it("should create a real Lantern instance", () => {
            expect(lantern).toBeInstanceOf(Lantern);
        });

        it("should preserve the configured player spawn point", () => {
            expect(world.spawnPoint)
                .toEqual(SnowyForest.spawnPoint);
        });

        it("should initialize the lantern in the lit state", () => {
            expect(lantern.isLit).toBe(true);
        });

        it("should create independent awakening areas", () => {
            const secondWorld = new TileMap(SnowyForest);

            expect(secondWorld.snowDrifts[0])
                .not.toBe(snowDrift);

            expect(secondWorld.lanterns[0])
                .not.toBe(lantern);
        });
    });

    describe("Player spawn position", () => {
        it("should position the player inside the snowdrift", () => {
            const { x, y } = world.spawnPoint;

            expect(x)
                .toBeGreaterThanOrEqual(snowDrift.x);

            expect(y)
                .toBeGreaterThanOrEqual(snowDrift.y);

            expect(x + PLAYER_WIDTH)
                .toBeLessThanOrEqual(
                    snowDrift.x + snowDrift.width
                );

            expect(y + PLAYER_HEIGHT)
                .toBeLessThanOrEqual(
                    snowDrift.y + snowDrift.height
                );
        });

        it("should provide a valid player collision area", () => {
            const { x, y } = world.spawnPoint;

            expect(
                world.canMoveTo(
                    x,
                    y,
                    PLAYER_WIDTH,
                    PLAYER_HEIGHT
                )
            ).toBe(true);
        });

        it("should position the player's feet inside the hollow", () => {
            const { x, y } = world.spawnPoint;

            const footX = x + PLAYER_WIDTH / 2;
            const footY = y + PLAYER_HEIGHT - 2;

            expect(
                snowDrift.isWalkable(footX, footY)
            ).toBe(true);
        });
    });

    describe("Snowdrift collision integration", () => {
        it("should allow the player to leave through the right opening", () => {
            const { x, y } = world.spawnPoint;

            const exitX =
                snowDrift.x + snowDrift.width;

            // Check every movement step towards the exit
            for (
                let positionX = x;
                positionX <= exitX;
                positionX++
            ) {
                expect(
                    world.canMoveTo(
                        positionX,
                        y,
                        PLAYER_WIDTH,
                        PLAYER_HEIGHT
                    )
                ).toBe(true);
            }
        });

        it("should allow the player to return to the awakening area", () => {
            const { x, y } = world.spawnPoint;

            const exitX =
                snowDrift.x + snowDrift.width;

            // Check the return path through the opening
            for (
                let positionX = exitX;
                positionX >= x;
                positionX--
            ) {
                expect(
                    world.canMoveTo(
                        positionX,
                        y,
                        PLAYER_WIDTH,
                        PLAYER_HEIGHT
                    )
                ).toBe(true);
            }
        });

        it("should prevent movement through the left snow wall", () => {
            const { x, y } = world.spawnPoint;

            expect(
                world.canMoveTo(
                    x - 24,
                    y,
                    PLAYER_WIDTH,
                    PLAYER_HEIGHT
                )
            ).toBe(false);
        });

        it("should prevent movement through the upper snow wall", () => {
            const { x, y } = world.spawnPoint;

            expect(
                world.canMoveTo(
                    x,
                    y - 32,
                    PLAYER_WIDTH,
                    PLAYER_HEIGHT
                )
            ).toBe(false);
        });

        it("should prevent movement through the lower snow wall", () => {
            const { x, y } = world.spawnPoint;

            expect(
                world.canMoveTo(
                    x,
                    y + 32,
                    PLAYER_WIDTH,
                    PLAYER_HEIGHT
                )
            ).toBe(false);
        });

        it("should preserve the opening on the right side", () => {
            expect(snowDrift.openingDirection)
                .toBe("right");
        });
    });

    describe("Lantern collision integration", () => {
        it("should position the lantern beside the snowdrift", () => {
            expect(lantern.x)
                .toBeGreaterThanOrEqual(
                    snowDrift.x + snowDrift.width
                );
        });

        it("should prevent the player from walking through the lantern base", () => {
            const x =
                lantern.x +
                lantern.width / 2 -
                PLAYER_WIDTH / 2;

            const y =
                lantern.y +
                lantern.height -
                PLAYER_HEIGHT;

            expect(
                world.canMoveTo(
                    x,
                    y,
                    PLAYER_WIDTH,
                    PLAYER_HEIGHT
                )
            ).toBe(false);
        });

        it("should allow the player to walk below the lantern", () => {
            const x =
                lantern.x +
                lantern.width / 2 -
                PLAYER_WIDTH / 2;

            const y = world.spawnPoint.y;

            expect(
                world.canMoveTo(
                    x,
                    y,
                    PLAYER_WIDTH,
                    PLAYER_HEIGHT
                )
            ).toBe(true);
        });
    });

    describe("Lantern lighting integration", () => {
        it("should register the lantern light source", () => {
            expect(lightingSystem.lightSources)
                .toHaveLength(1);

            expect(lightingSystem.lightSources)
                .toContain(lantern.lightSource);
        });

        it("should synchronize the light with the lantern position", () => {
            const position = lantern.getLightPosition();

            expect(lantern.lightSource.x)
                .toBe(position.x);

            expect(lantern.lightSource.y)
                .toBe(position.y);
        });

        it("should initialize warm lantern lighting", () => {
            expect(lantern.lightSource.color)
                .toBe("#ffcf85");

            expect(lantern.lightSource.intensity)
                .toBeCloseTo(0.65);
        });

        it("should enable flame flickering", () => {
            expect(lantern.lightSource.flickerEnabled)
                .toBe(true);
        });

        it("should update the flame intensity over time", () => {
            const initialIntensity =
                lantern.lightSource.getEffectiveIntensity();

            lightingSystem.update(0.1);

            expect(
                lantern.lightSource.getEffectiveIntensity()
            ).not.toBeCloseTo(initialIntensity);
        });

        it("should preserve the lantern position during light updates", () => {
            const originalPosition =
                lantern.getLightPosition();

            lightingSystem.update(1);
            lightingSystem.update(2);

            expect(lantern.getLightPosition())
                .toEqual(originalPosition);

            expect(lantern.lightSource.x)
                .toBe(originalPosition.x);

            expect(lantern.lightSource.y)
                .toBe(originalPosition.y);
        });

        it("should not duplicate lights during repeated registration", () => {
            const originalLight = lantern.lightSource;

            world.registerLights(lightingSystem);
            world.registerLights(lightingSystem);

            expect(lightingSystem.lightSources)
                .toHaveLength(1);

            expect(lantern.lightSource)
                .toBe(originalLight);
        });

        it("should disable the light when the lantern is extinguished", () => {
            lantern.extinguish();

            expect(lantern.lightSource.enabled)
                .toBe(false);
        });

        it("should restore the light when the lantern is ignited", () => {
            lantern.extinguish();
            lantern.ignite();

            expect(lantern.lightSource.enabled)
                .toBe(true);
        });
    });

    describe("Lantern shadow integration", () => {
        it("should register a shadow beneath the lantern", () => {
            const expectedX =
                lantern.x + lantern.width / 2;

            const expectedY =
                lantern.y + lantern.height - 2;

            const shadow =
                shadowSystem.staticShadows.find(
                    item =>
                        item.x === expectedX &&
                        item.y === expectedY &&
                        item.width === 20 &&
                        item.height === 8
                );

            expect(shadow).toBeDefined();
            expect(shadow.opacity).toBeCloseTo(0.25);
        });

        it("should synchronize the lantern shadow with weather", () => {
            shadowSystem.setWeatherVisibility(0.35);

            const shadow =
                shadowSystem.staticShadows.find(
                    item =>
                        item.x === lantern.x +
                            lantern.width / 2 &&
                        item.y === lantern.y +
                            lantern.height - 2 &&
                        item.width === 20 &&
                        item.height === 8
                );

            expect(shadow.getEffectiveOpacity())
                .toBeCloseTo(0.0875);
        });

        it("should not duplicate shadows during world registration", () => {
            const initialCount =
                shadowSystem.staticShadows.length;

            world.registerStaticShadows(shadowSystem);

            expect(shadowSystem.staticShadows)
                .toHaveLength(initialCount);
        });
    });

    describe("Awakening area rendering", () => {
        const camera = {
            x: 600,
            y: 450,
            width: 480,
            height: 384
        };

        it("should keep the snowdrift visible near the spawn point", () => {
            expect(snowDrift.isVisible(camera))
                .toBe(true);
        });

        it("should keep the lantern visible near the spawn point", () => {
            expect(lantern.isVisible(camera))
                .toBe(true);
        });

        it("should render the snowdrift above the ground tiles", () => {
            const order = [];

            vi.spyOn(world, "drawTile")
                .mockImplementation(() => {
                    order.push("ground");
                });

            vi.spyOn(snowDrift, "draw")
                .mockImplementation(() => {
                    order.push("snowdrift");
                });

            world.renderGround({}, camera);

            expect(order).toContain("ground");
            expect(order.at(-1)).toBe("snowdrift");
        });

        it("should include the lantern in the rendering queue", () => {
            const ctx = {};

            const drawSpy = vi.spyOn(lantern, "draw")
                .mockImplementation(() => {});

            vi.spyOn(world, "drawPineTree")
                .mockImplementation(() => {});

            vi.spyOn(world, "drawRock")
                .mockImplementation(() => {});

            vi.spyOn(
                world.decorationLayer,
                "getRenderables"
            ).mockReturnValue([]);

            const renderables =
                world.getRenderables(camera);

            for (const object of renderables) {
                object.draw(ctx);
            }

            expect(drawSpy)
                .toHaveBeenCalledWith(ctx);
        });

        it("should calculate lantern depth from its bottom edge", () => {
            expect(lantern.getDepth())
                .toBe(lantern.y + lantern.height);
        });
    });

    describe("Viewport culling", () => {
        const distantCamera = {
            x: 0,
            y: 0,
            width: 480,
            height: 384
        };

        it("should cull the snowdrift outside the viewport", () => {
            expect(snowDrift.isVisible(distantCamera))
                .toBe(false);
        });

        it("should cull the lantern outside the viewport", () => {
            expect(lantern.isVisible(distantCamera))
                .toBe(false);
        });

        it("should cull the lantern light outside the viewport", () => {
            expect(
                lightingSystem.isVisible(
                    lantern.lightSource,
                    distantCamera
                )
            ).toBe(false);
        });

        it("should not draw an offscreen snowdrift", () => {
            vi.spyOn(world, "drawTile")
                .mockImplementation(() => {});

            const drawSpy = vi.spyOn(snowDrift, "draw")
                .mockImplementation(() => {});

            world.renderGround({}, distantCamera);

            expect(drawSpy).not.toHaveBeenCalled();
        });

        it("should continue updating offscreen lantern lights", () => {
            const originalTime =
                lantern.lightSource.elapsedTime;

            lightingSystem.update(0.5);

            expect(lantern.lightSource.elapsedTime)
                .toBeCloseTo(originalTime + 0.5);
        });
    });
});
