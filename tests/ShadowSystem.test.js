
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Shadow } from "../src/lighting/Shadow.js";
import { ShadowSystem } from "../src/lighting/ShadowSystem.js";

describe("ShadowSystem", () => {
    let system;

    beforeEach(() => {
        system = new ShadowSystem();
    });

    describe("Initialization", () => {
        it("should initialize without static shadows", () => {
            expect(system.staticShadows).toHaveLength(0);
        });

        it("should initialize without a player shadow", () => {
            expect(system.playerShadow).toBeNull();
        });

        it("should initialize with full weather visibility", () => {
            expect(system.weatherVisibility).toBe(1);
        });

        it("should initialize as enabled", () => {
            expect(system.enabled).toBe(true);
        });
    });

    describe("Static shadow management", () => {
        it("should create a static shadow", () => {
            system.addStaticShadow(100, 50, 40, 16, 0.3);

            expect(system.staticShadows).toHaveLength(1);
        });

        it("should create real Shadow instances", () => {
            const shadow = system.addStaticShadow(
                100, 50, 40, 16, 0.3
            );

            expect(shadow).toBeInstanceOf(Shadow);
        });

        it("should initialize static shadows with correct properties", () => {
            const shadow = system.addStaticShadow(
                100, 50, 40, 16, 0.4
            );

            expect(shadow.x).toBe(100);
            expect(shadow.y).toBe(50);
            expect(shadow.width).toBe(40);
            expect(shadow.height).toBe(16);
            expect(shadow.opacity).toBe(0.4);
        });

        it("should support default static shadow properties", () => {
            const shadow = system.addStaticShadow(
                100, 50
            );

            expect(shadow.width).toBe(24);
            expect(shadow.height).toBe(10);
            expect(shadow.opacity).toBe(0.3);
        });

        it("should support multiple static shadows", () => {
            system.addStaticShadow(100, 50);
            system.addStaticShadow(200, 150);
            system.addStaticShadow(300, 250);

            expect(system.staticShadows).toHaveLength(3);
        });

        it.each([
            [NaN, 50],
            [100, NaN],
            [Infinity, 50],
            [100, Infinity]
        ])(
            "should reject invalid static shadow coordinates (%s, %s)",
            (x, y) => {
                const shadow = system.addStaticShadow(x, y);

                expect(shadow).toBeNull();
                expect(system.staticShadows).toHaveLength(0);
            }
        );

        it("should remove a specific static shadow", () => {
            const first = system.addStaticShadow(100, 50);
            const second = system.addStaticShadow(200, 150);

            system.removeStaticShadow(first);

            expect(system.staticShadows).toEqual([second]);
        });

        it("should ignore removal of unknown shadows", () => {
            const existing = system.addStaticShadow(100, 50);
            const unknown = new Shadow(200, 150);

            system.removeStaticShadow(unknown);

            expect(system.staticShadows).toEqual([existing]);
        });

        it("should clear all static shadows", () => {
            system.addStaticShadow(100, 50);
            system.addStaticShadow(200, 150);

            system.clearStaticShadows();

            expect(system.staticShadows).toHaveLength(0);
        });
    });

    describe("Player shadow management", () => {
        let player;

        beforeEach(() => {
            player = {
                x: 100,
                y: 50,
                width: 32,
                height: 32
            };
        });

        it("should create a player shadow", () => {
            system.createPlayerShadow(player);

            expect(system.playerShadow)
                .toBeInstanceOf(Shadow);
        });

        it("should position the shadow beneath the player's feet", () => {
            system.createPlayerShadow(player);

            expect(system.playerShadow.x).toBe(116);
            expect(system.playerShadow.y).toBe(80);
        });

        it("should initialize with default player shadow dimensions", () => {
            system.createPlayerShadow(player);

            expect(system.playerShadow.width).toBe(24);
            expect(system.playerShadow.height).toBe(10);
            expect(system.playerShadow.opacity).toBe(0.3);
        });

        it("should support custom player shadow dimensions", () => {
            system.createPlayerShadow(
                player, 28, 12, 0.4
            );

            expect(system.playerShadow.width).toBe(28);
            expect(system.playerShadow.height).toBe(12);
            expect(system.playerShadow.opacity).toBe(0.4);
        });

        it("should follow horizontal player movement", () => {
            system.createPlayerShadow(player);

            player.x = 150;
            system.updatePlayerShadow(player);

            expect(system.playerShadow.x).toBe(166);
            expect(system.playerShadow.y).toBe(80);
        });

        it("should follow vertical player movement", () => {
            system.createPlayerShadow(player);

            player.y = 100;
            system.updatePlayerShadow(player);

            expect(system.playerShadow.x).toBe(116);
            expect(system.playerShadow.y).toBe(130);
        });

        it("should follow diagonal player movement", () => {
            system.createPlayerShadow(player);

            player.x = 150;
            player.y = 100;

            system.updatePlayerShadow(player);

            expect(system.playerShadow.x).toBe(166);
            expect(system.playerShadow.y).toBe(130);
        });

        it("should preserve the existing shadow instance", () => {
            system.createPlayerShadow(player);

            const originalShadow = system.playerShadow;

            player.x += 20;
            system.updatePlayerShadow(player);

            expect(system.playerShadow).toBe(originalShadow);
        });

        it("should preserve shadow dimensions during movement", () => {
            system.createPlayerShadow(player);

            player.x += 20;
            system.updatePlayerShadow(player);

            expect(system.playerShadow.width).toBe(24);
            expect(system.playerShadow.height).toBe(10);
        });

        it("should ignore updates when no player shadow exists", () => {
            system.updatePlayerShadow(player);

            expect(system.playerShadow).toBeNull();
        });

        it.each([null, undefined, {}])(
            "should reject invalid player objects",
            (invalidPlayer) => {
                system.createPlayerShadow(invalidPlayer);

                expect(system.playerShadow).toBeNull();
            }
        );

        it.each([
            { x: NaN, y: 50, width: 32, height: 32 },
            { x: 100, y: Infinity, width: 32, height: 32 },
            { x: 100, y: 50, width: 0, height: 32 },
            { x: 100, y: 50, width: 32, height: -10 }
        ])(
            "should reject invalid player properties",
            (invalidPlayer) => {
                system.createPlayerShadow(invalidPlayer);

                expect(system.playerShadow).toBeNull();
            }
        );

        it("should preserve the previous shadow position during invalid updates", () => {
            system.createPlayerShadow(player);

            player.x = NaN;
            system.updatePlayerShadow(player);

            expect(system.playerShadow.x).toBe(116);
            expect(system.playerShadow.y).toBe(80);
        });

        it("should remove the player shadow", () => {
            system.createPlayerShadow(player);

            system.removePlayerShadow();

            expect(system.playerShadow).toBeNull();
        });

        it("should replace an existing player shadow", () => {
            system.createPlayerShadow(player);

            const previousShadow = system.playerShadow;

            system.createPlayerShadow(player, 30, 12);

            expect(system.playerShadow)
                .not.toBe(previousShadow);

            expect(system.playerShadow.width).toBe(30);
        });

        it("should preserve the player shadow when clearing static shadows", () => {
            system.createPlayerShadow(player);
            system.addStaticShadow(200, 150);

            system.clearStaticShadows();

            expect(system.playerShadow)
                .toBeInstanceOf(Shadow);

            expect(system.staticShadows).toHaveLength(0);
        });
    });

    describe("Weather integration", () => {
        beforeEach(() => {
            system.createPlayerShadow({
                x: 100,
                y: 50,
                width: 32,
                height: 32
            });

            system.addStaticShadow(200, 150);
            system.addStaticShadow(300, 250);
        });

        it("should update system weather visibility", () => {
            system.setWeatherVisibility(0.65);

            expect(system.weatherVisibility).toBe(0.65);
        });

        it("should apply weather visibility to the player shadow", () => {
            system.setWeatherVisibility(0.35);

            expect(
                system.playerShadow.getEffectiveOpacity()
            ).toBeCloseTo(0.105);
        });

        it("should apply weather visibility to all static shadows", () => {
            system.setWeatherVisibility(0.65);

            for (const shadow of system.staticShadows) {
                expect(shadow.getEffectiveOpacity())
                    .toBeCloseTo(0.195);
            }
        });

        it.each([
            [1, 0.3],
            [0.95, 0.285],
            [0.85, 0.255],
            [0.65, 0.195],
            [0.35, 0.105]
        ])(
            "should calculate effective opacity for weather visibility %s",
            (visibility, expectedOpacity) => {
                system.setWeatherVisibility(visibility);

                expect(
                    system.playerShadow.getEffectiveOpacity()
                ).toBeCloseTo(expectedOpacity);
            }
        );

        it("should restore shadow strength when weather improves", () => {
            system.setWeatherVisibility(0.35);
            system.setWeatherVisibility(1);

            expect(
                system.playerShadow.getEffectiveOpacity()
            ).toBeCloseTo(0.3);
        });

        it("should preserve original shadow opacity", () => {
            system.setWeatherVisibility(0.35);

            expect(system.playerShadow.opacity).toBe(0.3);

            for (const shadow of system.staticShadows) {
                expect(shadow.opacity).toBe(0.3);
            }
        });

        it("should apply current weather to newly created static shadows", () => {
            system.setWeatherVisibility(0.35);

            const shadow = system.addStaticShadow(
                400, 300
            );

            expect(shadow.getEffectiveOpacity())
                .toBeCloseTo(0.105);
        });

        it("should apply current weather to a newly created player shadow", () => {
            system.setWeatherVisibility(0.35);

            system.createPlayerShadow({
                x: 100,
                y: 50,
                width: 32,
                height: 32
            });

            expect(
                system.playerShadow.getEffectiveOpacity()
            ).toBeCloseTo(0.105);
        });

        it("should clamp visibility above one", () => {
            system.setWeatherVisibility(2);

            expect(system.weatherVisibility).toBe(1);
        });

        it("should clamp visibility below zero", () => {
            system.setWeatherVisibility(-1);

            expect(system.weatherVisibility).toBe(0);

            expect(
                system.playerShadow.getEffectiveOpacity()
            ).toBe(0);
        });

        it.each([
            NaN, Infinity, -Infinity, null
        ])(
            "should reject invalid weather visibility %s",
            (visibility) => {
                system.setWeatherVisibility(visibility);

                expect(system.weatherVisibility).toBe(1);
            }
        );

        it("should support weather updates without existing shadows", () => {
            const emptySystem = new ShadowSystem();

            emptySystem.setWeatherVisibility(0.65);

            expect(emptySystem.weatherVisibility).toBe(0.65);
        });
    });

    describe("Viewport culling", () => {
        const camera = {
            x: 100,
            y: 100,
            width: 480,
            height: 384
        };

        it("should detect visible shadows", () => {
            const shadow = new Shadow(200, 200);

            expect(system.isVisible(shadow, camera))
                .toBe(true);
        });

        it.each([
            [50, 200],
            [650, 200],
            [200, 50],
            [200, 550]
        ])(
            "should reject shadows outside the viewport at (%s, %s)",
            (x, y) => {
                const shadow = new Shadow(x, y);

                expect(system.isVisible(shadow, camera))
                    .toBe(false);
            }
        );

        it.each([
            [95, 200],
            [585, 200],
            [200, 98],
            [200, 486]
        ])(
            "should include partially visible shadows at (%s, %s)",
            (x, y) => {
                const shadow = new Shadow(x, y);

                expect(system.isVisible(shadow, camera))
                    .toBe(true);
            }
        );

        it("should account for larger shadow dimensions", () => {
            const shadow = new Shadow(
                70, 200, 80, 20
            );

            expect(system.isVisible(shadow, camera))
                .toBe(true);
        });

        it("should support rendering without a camera", () => {
            const shadow = new Shadow(800, 600);

            expect(system.isVisible(shadow)).toBe(true);
        });

        it("should support an explicitly null camera", () => {
            const shadow = new Shadow(800, 600);

            expect(system.isVisible(shadow, null))
                .toBe(true);
        });

        it("should use rounded camera coordinates", () => {
            const fractionalCamera = {
                x: 100.6,
                y: 100.6,
                width: 480,
                height: 384
            };

            const shadow = new Shadow(89, 200);

            expect(
                system.isVisible(shadow, fractionalCamera)
            ).toBe(false);
        });

        it("should preserve shadow world coordinates", () => {
            const shadow = new Shadow(200, 200);

            system.isVisible(shadow, camera);

            expect(shadow.x).toBe(200);
            expect(shadow.y).toBe(200);
        });
    });

    describe("System visibility", () => {
        it("should support disabling the shadow system", () => {
            system.setEnabled(false);

            expect(system.enabled).toBe(false);
        });

        it("should support enabling the shadow system", () => {
            system.setEnabled(false);
            system.setEnabled(true);

            expect(system.enabled).toBe(true);
        });

        it("should reject invalid enabled values", () => {
            system.setEnabled("invalid");

            expect(system.enabled).toBe(true);
        });

        it("should preserve shadows when disabled", () => {
            system.addStaticShadow(100, 50);

            system.setEnabled(false);

            expect(system.staticShadows).toHaveLength(1);
        });
    });

    describe("Shadow rendering", () => {
        let ctx;
        let camera;

        beforeEach(() => {
            ctx = {};

            camera = {
                x: 100,
                y: 100,
                width: 480,
                height: 384
            };
        });

        it("should render all static shadows without a camera", () => {
            const first = system.addStaticShadow(200, 200);
            const second = system.addStaticShadow(700, 600);

            const firstSpy = vi.spyOn(first, "draw")
                .mockImplementation(() => {});

            const secondSpy = vi.spyOn(second, "draw")
                .mockImplementation(() => {});

            system.draw(ctx);

            expect(firstSpy).toHaveBeenCalledWith(ctx);
            expect(secondSpy).toHaveBeenCalledWith(ctx);
        });

        it("should render only visible static shadows", () => {
            const visible = system.addStaticShadow(200, 200);
            const hidden = system.addStaticShadow(700, 600);

            const visibleSpy = vi.spyOn(visible, "draw")
                .mockImplementation(() => {});

            const hiddenSpy = vi.spyOn(hidden, "draw")
                .mockImplementation(() => {});

            system.draw(ctx, camera);

            expect(visibleSpy).toHaveBeenCalledWith(ctx);
            expect(hiddenSpy).not.toHaveBeenCalled();
        });

        it("should render the player shadow", () => {
            system.createPlayerShadow({
                x: 200,
                y: 200,
                width: 32,
                height: 32
            });

            const spy = vi.spyOn(
                system.playerShadow, "draw"
            ).mockImplementation(() => {});

            system.draw(ctx, camera);

            expect(spy).toHaveBeenCalledWith(ctx);
        });

        it("should skip the player shadow outside the viewport", () => {
            system.createPlayerShadow({
                x: 800,
                y: 600,
                width: 32,
                height: 32
            });

            const spy = vi.spyOn(
                system.playerShadow, "draw"
            ).mockImplementation(() => {});

            system.draw(ctx, camera);

            expect(spy).not.toHaveBeenCalled();
        });

        it("should not render shadows when the system is disabled", () => {
            const shadow = system.addStaticShadow(200, 200);

            const spy = vi.spyOn(shadow, "draw")
                .mockImplementation(() => {});

            system.setEnabled(false);
            system.draw(ctx, camera);

            expect(spy).not.toHaveBeenCalled();
        });

        it("should not render the player shadow when disabled", () => {
            system.createPlayerShadow({
                x: 200,
                y: 200,
                width: 32,
                height: 32
            });

            const spy = vi.spyOn(
                system.playerShadow, "draw"
            ).mockImplementation(() => {});

            system.setEnabled(false);
            system.draw(ctx, camera);

            expect(spy).not.toHaveBeenCalled();
        });

        it("should resume rendering when enabled again", () => {
            const shadow = system.addStaticShadow(200, 200);

            const spy = vi.spyOn(shadow, "draw")
                .mockImplementation(() => {});

            system.setEnabled(false);
            system.draw(ctx, camera);

            system.setEnabled(true);
            system.draw(ctx, camera);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        it("should support rendering an empty shadow system", () => {
            expect(() => system.draw(ctx, camera))
                .not.toThrow();
        });

        it("should render static shadows before the player shadow", () => {
            const order = [];

            const shadow = system.addStaticShadow(200, 200);

            system.createPlayerShadow({
                x: 200,
                y: 200,
                width: 32,
                height: 32
            });

            vi.spyOn(shadow, "draw")
                .mockImplementation(() => {
                    order.push("static");
                });

            vi.spyOn(system.playerShadow, "draw")
                .mockImplementation(() => {
                    order.push("player");
                });

            system.draw(ctx, camera);

            expect(order).toEqual(["static", "player"]);
        });
    });

    describe("System cleanup", () => {
        it("should remove all shadows when cleared", () => {
            system.addStaticShadow(100, 50);
            system.addStaticShadow(200, 150);

            system.createPlayerShadow({
                x: 100,
                y: 50,
                width: 32,
                height: 32
            });

            system.clear();

            expect(system.staticShadows).toHaveLength(0);
            expect(system.playerShadow).toBeNull();
        });

        it("should preserve weather configuration when cleared", () => {
            system.setWeatherVisibility(0.35);
            system.clear();

            expect(system.weatherVisibility).toBe(0.35);
        });

        it("should preserve enabled state when cleared", () => {
            system.setEnabled(false);
            system.clear();

            expect(system.enabled).toBe(false);
        });

        it("should support clearing an empty system", () => {
            expect(() => system.clear()).not.toThrow();
        });
    });
});
