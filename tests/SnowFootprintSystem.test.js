
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnowFootprint } from "../src/effects/SnowFootprint.js";
import { SnowFootprintSystem } from "../src/effects/SnowFootprintSystem.js";

describe("SnowFootprintSystem", () => {
    let system;

    beforeEach(() => {
        system = new SnowFootprintSystem(12, 4, 60);
    });

    describe("Initialization", () => {
        it("should initialize without footprints", () => {
            expect(system.footprints).toHaveLength(0);
        });

        it("should have the correct step distance", () => {
            expect(system.stepDistance).toBe(12);
        });

        it("should have the correct foot offset", () => {
            expect(system.footOffset).toBe(4);
        });

        it("should have the correct footprint lifetime", () => {
            expect(system.footprintLifetime).toBe(60);
        });

        it("should start with the left foot", () => {
            expect(system.nextFoot).toBe("left");
        });

        it("should initialize with zero accumulated distance", () => {
            expect(system.accumulatedDistance).toBe(0);
        });
    });

    describe("Footprint creation", () => {
        it("should create a SnowFootprint instance", () => {
            system.addFootprint(100, 50, "down");

            expect(system.footprints[0])
                .toBeInstanceOf(SnowFootprint);
        });

        it("should create a footprint with the correct direction", () => {
            system.addFootprint(100, 50, "up");

            expect(system.footprints[0].direction)
                .toBe("up");
        });

        it("should assign the configured lifetime", () => {
            system.addFootprint(100, 50, "down");

            expect(system.footprints[0].lifetime)
                .toBe(60);
        });

        it("should alternate between left and right footprints", () => {
            system.addFootprint(100, 50, "down");
            system.addFootprint(100, 62, "down");
            system.addFootprint(100, 74, "down");

            expect(
                system.footprints.map(footprint => footprint.foot)
            ).toEqual(["left", "right", "left"]);
        });

        it("should reject invalid footprint positions", () => {
            system.addFootprint(NaN, 50, "down");
            system.addFootprint(100, Infinity, "down");

            expect(system.footprints).toHaveLength(0);
        });

        it("should reject invalid movement directions", () => {
            system.addFootprint(100, 50, "invalid");

            expect(system.footprints).toHaveLength(0);
        });
    });

    describe("Directional foot placement", () => {
        it.each([
            ["up", 96, 50],
            ["down", 104, 50],
            ["left", 100, 54],
            ["right", 100, 46]
        ])(
            "should correctly position the left foot when moving %s",
            (direction, expectedX, expectedY) => {
                system.addFootprint(100, 50, direction);

                expect(system.footprints[0].x)
                    .toBe(expectedX);

                expect(system.footprints[0].y)
                    .toBe(expectedY);
            }
        );

        it.each([
            ["up", 104, 50],
            ["down", 96, 50],
            ["left", 100, 46],
            ["right", 100, 54]
        ])(
            "should correctly position the right foot when moving %s",
            (direction, expectedX, expectedY) => {
                system.nextFoot = "right";

                system.addFootprint(100, 50, direction);

                expect(system.footprints[0].x)
                    .toBe(expectedX);

                expect(system.footprints[0].y)
                    .toBe(expectedY);
            }
        );
    });

    describe("Distance-based placement", () => {
        it("should not create footprints without movement", () => {
            system.trackMovement(
                100, 50,
                100, 50,
                "down"
            );

            expect(system.footprints).toHaveLength(0);
        });

        it("should accumulate movement below the step distance", () => {
            system.trackMovement(
                100, 50,
                100, 56,
                "down"
            );

            expect(system.accumulatedDistance).toBe(6);
            expect(system.footprints).toHaveLength(0);
        });

        it("should create a footprint after reaching the step distance", () => {
            system.trackMovement(
                100, 50,
                100, 62,
                "down"
            );

            expect(system.footprints).toHaveLength(1);
            expect(system.accumulatedDistance).toBe(0);
        });

        it("should accumulate movement across multiple updates", () => {
            system.trackMovement(
                100, 50,
                100, 56,
                "down"
            );

            system.trackMovement(
                100, 56,
                100, 62,
                "down"
            );

            expect(system.footprints).toHaveLength(1);
        });

        it("should create multiple footprints during longer movements", () => {
            system.trackMovement(
                100, 50,
                100, 86,
                "down"
            );

            expect(system.footprints).toHaveLength(3);
        });

        it("should preserve remaining movement distance", () => {
            system.trackMovement(
                100, 50,
                100, 70,
                "down"
            );

            expect(system.footprints).toHaveLength(1);
            expect(system.accumulatedDistance).toBe(8);
        });

        it("should distribute footprints along the movement path", () => {
            system.trackMovement(
                100, 50,
                100, 86,
                "down"
            );

            expect(
                system.footprints.map(footprint => footprint.y)
            ).toEqual([62, 74, 86]);
        });

        it("should support diagonal movement", () => {
            system.trackMovement(
                100, 50,
                109, 59,
                "right"
            );

            expect(system.footprints).toHaveLength(1);

            expect(system.accumulatedDistance)
                .toBeCloseTo(Math.hypot(9, 9) - 12);
        });

        it("should ignore invalid movement coordinates", () => {
            system.trackMovement(
                100, 50,
                NaN, 62,
                "down"
            );

            expect(system.footprints).toHaveLength(0);
            expect(system.accumulatedDistance).toBe(0);
        });

        it("should remain consistent across different movement update sizes", () => {
            const smallSteps = new SnowFootprintSystem(
                12, 4, 60
            );

            const largeSteps = new SnowFootprintSystem(
                12, 4, 60
            );

            for (let i = 0; i < 12; i++) {
                smallSteps.trackMovement(
                    100, 50 + i * 3,
                    100, 53 + i * 3,
                    "down"
                );
            }

            largeSteps.trackMovement(
                100, 50,
                100, 86,
                "down"
            );

            const getPositions = footprintSystem =>
                footprintSystem.footprints.map(
                    footprint => ({
                        x: footprint.x,
                        y: footprint.y,
                        foot: footprint.foot
                    })
                );

            expect(getPositions(smallSteps))
                .toEqual(getPositions(largeSteps));
        });
    });

    describe("Weather-dependent fading", () => {
        beforeEach(() => {
            system.addFootprint(100, 50, "down");
        });

        it.each([
            [0, 1 / 3],
            [50, 0.5],
            [100, 1],
            [200, 2],
            [350, 6]
        ])(
            "should calculate the correct fading multiplier for intensity %s",
            (intensity, expectedMultiplier) => {
                expect(
                    system.getFadeMultiplier(intensity)
                ).toBeCloseTo(expectedMultiplier);
            }
        );

        it("should interpolate fading between weather intensities", () => {
            expect(system.getFadeMultiplier(150))
                .toBeCloseTo(1.5);
        });

        it("should update all active footprints", () => {
            system.addFootprint(100, 62, "down");

            system.update(10, 100);

            for (const footprint of system.footprints) {
                expect(footprint.age).toBe(10);

                expect(footprint.opacity)
                    .toBeCloseTo(5 / 6);
            }
        });

        it("should fade footprints slowly during clear weather", () => {
            system.update(30, 0);

            expect(system.footprints[0].opacity)
                .toBeCloseTo(5 / 6);
        });

        it("should fade footprints faster during heavy snowfall", () => {
            system.update(10, 200);

            expect(system.footprints[0].opacity)
                .toBeCloseTo(2 / 3);
        });

        it("should remove footprints quickly during blizzards", () => {
            system.update(10, 350);

            expect(system.footprints).toHaveLength(0);
        });

        it("should accumulate fading across weather changes", () => {
            system.update(10, 100);
            system.update(10, 200);

            expect(system.footprints[0].opacity)
                .toBeCloseTo(0.5);
        });

        it("should not restore opacity when weather improves", () => {
            system.update(5, 350);

            const previousOpacity =
                system.footprints[0].opacity;

            system.update(5, 0);

            expect(system.footprints[0].opacity)
                .toBeLessThan(previousOpacity);
        });

        it("should clamp snowfall intensity to supported limits", () => {
            expect(system.getFadeMultiplier(-10))
                .toBeCloseTo(1 / 3);

            expect(system.getFadeMultiplier(500))
                .toBe(6);
        });

        it("should use normal fading for invalid snowfall intensity", () => {
            expect(system.getFadeMultiplier(NaN)).toBe(1);
            expect(system.getFadeMultiplier(Infinity)).toBe(1);
        });
    });

    describe("Footprint cleanup", () => {
        it("should remove expired footprints", () => {
            system.addFootprint(100, 50, "down");

            system.update(60, 100);

            expect(system.footprints).toHaveLength(0);
        });

        it("should preserve footprints that have not expired", () => {
            system.addFootprint(100, 50, "down");

            system.update(30, 100);

            expect(system.footprints).toHaveLength(1);
        });

        it("should remove only expired footprints", () => {
            system.addFootprint(100, 50, "down");
            system.update(50, 100);

            system.addFootprint(100, 62, "down");

            const newestFootprint = system.footprints[1];

            system.update(10, 100);

            expect(system.footprints).toHaveLength(1);

            expect(system.footprints[0])
                .toBe(newestFootprint);
        });

        it("should support clearing all footprints", () => {
            system.addFootprint(100, 50, "down");
            system.addFootprint(100, 62, "down");

            system.clear();

            expect(system.footprints).toHaveLength(0);
        });

        it("should reset movement tracking when cleared", () => {
            system.addFootprint(100, 50, "down");

            system.trackMovement(
                100, 50,
                100, 56,
                "down"
            );

            system.clear();

            expect(system.accumulatedDistance).toBe(0);
            expect(system.nextFoot).toBe("left");
        });
    });

    describe("Viewport culling", () => {
        const camera = {
            x: 100,
            y: 100,
            width: 480,
            height: 384
        };

        it("should detect visible footprints", () => {
            system.addFootprint(200, 200, "down");

            expect(
                system.isVisible(system.footprints[0], camera)
            ).toBe(true);
        });

        it("should detect footprints outside the viewport", () => {
            system.addFootprint(700, 600, "down");

            expect(
                system.isVisible(system.footprints[0], camera)
            ).toBe(false);
        });

        it("should include partially visible footprints", () => {
            const footprint = new SnowFootprint(
                99, 200, "up", "left", 60
            );

            expect(
                system.isVisible(footprint, camera)
            ).toBe(true);
        });

        it("should support rendering without a camera", () => {
            system.addFootprint(700, 600, "down");

            expect(
                system.isVisible(system.footprints[0])
            ).toBe(true);
        });

        it("should update footprints outside the viewport", () => {
            system.addFootprint(700, 600, "down");

            system.update(10, 100);

            expect(system.footprints[0].age).toBe(10);
        });
    });

    describe("Footprint rendering", () => {
        it("should draw every footprint without a camera", () => {
            system.addFootprint(100, 50, "down");
            system.addFootprint(100, 62, "down");

            const spies = system.footprints.map(footprint =>
                vi.spyOn(footprint, "draw")
                    .mockImplementation(() => {})
            );

            const ctx = {};

            system.draw(ctx);

            for (const spy of spies) {
                expect(spy).toHaveBeenCalledWith(ctx);
            }
        });

        it("should only draw visible footprints", () => {
            system.addFootprint(200, 200, "down");
            system.addFootprint(700, 600, "down");

            const camera = {
                x: 100,
                y: 100,
                width: 480,
                height: 384
            };

            const visibleSpy = vi.spyOn(
                system.footprints[0], "draw"
            ).mockImplementation(() => {});

            const hiddenSpy = vi.spyOn(
                system.footprints[1], "draw"
            ).mockImplementation(() => {});

            system.draw({}, camera);

            expect(visibleSpy).toHaveBeenCalledTimes(1);
            expect(hiddenSpy).not.toHaveBeenCalled();
        });
    });

    describe("Time handling", () => {
        it("should ignore zero delta time", () => {
            system.addFootprint(100, 50, "down");

            system.update(0, 350);

            expect(system.footprints[0].opacity).toBe(1);
        });

        it("should ignore negative delta time", () => {
            system.addFootprint(100, 50, "down");

            system.update(-10, 350);

            expect(system.footprints[0].age).toBe(0);
        });

        it("should ignore invalid delta time", () => {
            system.addFootprint(100, 50, "down");

            system.update(NaN, 350);
            system.update(Infinity, 350);

            expect(system.footprints[0].age).toBe(0);
        });
    });

    describe("Configuration validation", () => {
        it("should initialize with default configuration", () => {
            const defaults = new SnowFootprintSystem();
            expect(defaults.stepDistance).toBe(12);
            expect(defaults.footOffset).toBe(4);
            expect(defaults.footprintLifetime).toBe(60);
        });

        it.each([0, -12, NaN, Infinity, -Infinity, null])(
            "should reject invalid step distance %s", (value) => {
                expect(new SnowFootprintSystem(value, 4, 60).stepDistance).toBe(12);
            }
        );

        it.each([-4, NaN, Infinity, -Infinity, null])(
            "should reject invalid foot offset %s", (value) => {
                expect(new SnowFootprintSystem(12, value, 60).footOffset).toBe(4);
            }
        );

        it.each([0, -60, NaN, Infinity, -Infinity, null])(
            "should reject invalid footprint lifetime %s", (value) => {
                expect(new SnowFootprintSystem(12, 4, value).footprintLifetime).toBe(60);
            }
        );

        it("should accept custom configuration", () => {
            const custom = new SnowFootprintSystem(20, 6, 90);
            expect(custom.stepDistance).toBe(20);
            expect(custom.footOffset).toBe(6);
            expect(custom.footprintLifetime).toBe(90);
        });

        it("should support zero foot offset", () => {
            const centered = new SnowFootprintSystem(12, 0, 60);
            centered.addFootprint(100, 50, "down");
            expect(centered.footprints[0].x).toBe(100);
            expect(centered.footprints[0].y).toBe(50);
        });
    });

    describe("Movement edge cases", () => {
        it("should preserve the original position for an unknown direction", () => {
            expect(system.getFootPosition(100, 50, "invalid", "left"))
                .toEqual({ x: 100, y: 50 });
        });

        it("should reject invalid directions during movement tracking", () => {
            system.trackMovement(100, 50, 100, 74, "invalid");
            expect(system.footprints).toHaveLength(0);
            expect(system.accumulatedDistance).toBe(0);
            expect(system.nextFoot).toBe("left");
        });

        it.each([
            [NaN, 50, 100, 62],
            [100, NaN, 100, 62],
            [100, 50, NaN, 62],
            [100, 50, 100, NaN],
            [Infinity, 50, 100, 62],
            [100, 50, 100, Infinity]
        ])("should reject invalid movement coordinates (%s, %s, %s, %s)",
            (previousX, previousY, currentX, currentY) => {
                system.trackMovement(previousX, previousY, currentX, currentY, "down");
                expect(system.footprints).toHaveLength(0);
                expect(system.accumulatedDistance).toBe(0);
            }
        );

        it("should reject movement distances that overflow", () => {
            system.trackMovement(-Number.MAX_VALUE, 50, Number.MAX_VALUE, 50, "right");
            expect(system.footprints).toHaveLength(0);
            expect(system.accumulatedDistance).toBe(0);
        });

        it("should not alternate feet after rejected placement", () => {
            system.addFootprint(NaN, 50, "down");
            system.addFootprint(100, 50, "invalid");
            expect(system.nextFoot).toBe("left");
            system.addFootprint(100, 50, "down");
            expect(system.footprints[0].foot).toBe("left");
        });
    });

    describe("Weather edge cases", () => {
        it("should use normal snowfall intensity by default", () => {
            system.addFootprint(100, 50, "down");
            system.update(10);
            expect(system.footprints[0].opacity).toBeCloseTo(5 / 6);
        });

        it.each([[25, 5 / 12], [75, 0.75], [150, 1.5], [275, 4]])(
            "should interpolate between weather presets at intensity %s",
            (intensity, expectedMultiplier) => {
                expect(system.getFadeMultiplier(intensity)).toBeCloseTo(expectedMultiplier);
            }
        );

        it("should support updating an empty footprint system", () => {
            system.update(10, 100);
            expect(system.footprints).toHaveLength(0);
        });
    });

    describe("Viewport edge cases", () => {
        const camera = { x: 100, y: 100, width: 480, height: 384 };

        it.each([[90, 200], [590, 200], [200, 90], [200, 494]])(
            "should reject footprints outside the viewport at (%s, %s)", (x, y) => {
                expect(system.isVisible(new SnowFootprint(x, y), camera)).toBe(false);
            }
        );

        it.each([[99, 200], [581, 200], [200, 99], [200, 485]])(
            "should preserve partially visible footprints at (%s, %s)", (x, y) => {
                expect(system.isVisible(new SnowFootprint(x, y), camera)).toBe(true);
            }
        );

        it("should support an explicitly null camera", () => {
            expect(system.isVisible(new SnowFootprint(700, 600), null)).toBe(true);
        });

        it("should use rounded camera coordinates", () => {
            const fractionalCamera = { ...camera, x: 100.6, y: 100.6 };
            expect(system.isVisible(new SnowFootprint(97, 200), fractionalCamera)).toBe(false);
        });

        it("should support drawing an empty footprint system", () => {
            const ctx = { fillRect: vi.fn() };
            system.draw(ctx, camera);
            expect(ctx.fillRect).not.toHaveBeenCalled();
        });
    });
});
