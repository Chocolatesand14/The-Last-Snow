
import { describe, it, expect, beforeEach } from "vitest";
import { Camera } from "../src/core/Camera.js";

describe("Camera", () => {
    let camera;

    beforeEach(() => {
        camera = new Camera(480, 384, 1600, 1200);
    });

    describe("Initialization", () => {
        it("should start at position zero", () => {
            expect(camera.x).toBe(0);
            expect(camera.y).toBe(0);
        });

        it("should have the correct viewport dimensions", () => {
            expect(camera.width).toBe(480);
            expect(camera.height).toBe(384);
        });
    });

    describe("Player tracking", () => {
        it("should center the camera on the player", () => {
            camera.follow({
                x: 800,
                y: 600,
                width: 32,
                height: 32
            });

            expect(camera.x).toBe(576);
            expect(camera.y).toBe(424);
        });

        it("should follow horizontal player movement", () => {
            const player = {
                x: 800,
                y: 600,
                width: 32,
                height: 32
            };

            camera.follow(player);

            const previousX = camera.x;

            player.x += 100;
            camera.follow(player);

            expect(camera.x).toBe(previousX + 100);
        });

        it("should follow vertical player movement", () => {
            const player = {
                x: 800,
                y: 600,
                width: 32,
                height: 32
            };

            camera.follow(player);

            const previousY = camera.y;

            player.y += 100;
            camera.follow(player);

            expect(camera.y).toBe(previousY + 100);
        });
    });

    describe("World boundaries", () => {
        it("should respect the left boundary", () => {
            camera.follow({
                x: 0,
                y: 600,
                width: 32,
                height: 32
            });

            expect(camera.x).toBe(0);
        });

        it("should respect the top boundary", () => {
            camera.follow({
                x: 800,
                y: 0,
                width: 32,
                height: 32
            });

            expect(camera.y).toBe(0);
        });

        it("should respect the right boundary", () => {
            camera.follow({
                x: 1568,
                y: 600,
                width: 32,
                height: 32
            });

            expect(camera.x).toBe(1120);
        });

        it("should respect the bottom boundary", () => {
            camera.follow({
                x: 800,
                y: 1168,
                width: 32,
                height: 32
            });

            expect(camera.y).toBe(816);
        });

        it("should handle worlds smaller than the viewport", () => {
            const smallCamera = new Camera(
                480, 384, 320, 320
            );

            smallCamera.follow({
                x: 160,
                y: 160,
                width: 32,
                height: 32
            });

            expect(smallCamera.x).toBe(0);
            expect(smallCamera.y).toBe(0);
        });
    });

    describe("Smooth camera movement", () => {
        let player;

        beforeEach(() => {
            player = {
                x: 800,
                y: 600,
                width: 32,
                height: 32
            };

            // Center the camera before testing smooth movement
            camera.follow(player);
        });

        it("should have a positive default follow speed", () => {
            expect(camera.followSpeed).toBeGreaterThan(0);
        });

        it("should smoothly follow horizontal movement", () => {
            const previousX = camera.x;

            player.x += 100;

            camera.follow(player, 1 / 60);

            expect(camera.x).toBeGreaterThan(previousX);
            expect(camera.x).toBeLessThan(previousX + 100);
        });

        it("should smoothly follow vertical movement", () => {
            const previousY = camera.y;

            player.y += 100;

            camera.follow(player, 1 / 60);

            expect(camera.y).toBeGreaterThan(previousY);
            expect(camera.y).toBeLessThan(previousY + 100);
        });

        it("should gradually approach the target position", () => {
            player.x += 100;

            const targetX = 676;

            for (let frame = 0; frame < 600; frame++) {
                camera.follow(player, 1 / 60);
            }

            expect(camera.x).toBeCloseTo(targetX, 2);
        });

        it("should not move when delta time is zero", () => {
            const previousX = camera.x;
            const previousY = camera.y;

            player.x += 100;
            player.y += 100;

            camera.follow(player, 0);

            expect(camera.x).toBe(previousX);
            expect(camera.y).toBe(previousY);
        });

        it("should not overshoot the target position", () => {
            player.x += 100;

            camera.follow(player, 10);

            expect(camera.x).toBeGreaterThan(576);
            expect(camera.x).toBeLessThanOrEqual(676);
        });

        it("should remain inside the world boundaries", () => {
            player.x = 2000;
            player.y = 2000;

            for (let frame = 0; frame < 600; frame++) {
                camera.follow(player, 1 / 60);

                expect(camera.x).toBeGreaterThanOrEqual(0);
                expect(camera.y).toBeGreaterThanOrEqual(0);
                expect(camera.x).toBeLessThanOrEqual(1120);
                expect(camera.y).toBeLessThanOrEqual(816);
            }

            expect(camera.x).toBeCloseTo(1120, 2);
            expect(camera.y).toBeCloseTo(816, 2);
        });

        it("should support adjustable follow speed", () => {
            const slowCamera = new Camera(
                480, 384, 1600, 1200
            );

            const fastCamera = new Camera(
                480, 384, 1600, 1200
            );

            slowCamera.followSpeed = 2;
            fastCamera.followSpeed = 10;

            slowCamera.follow(player);
            fastCamera.follow(player);

            player.x += 100;

            slowCamera.follow(player, 1 / 60);
            fastCamera.follow(player, 1 / 60);

            expect(fastCamera.x)
                .toBeGreaterThan(slowCamera.x);
        });

        it("should remain consistent across different frame rates", () => {
            const camera30FPS = new Camera(
                480, 384, 1600, 1200
            );

            const camera60FPS = new Camera(
                480, 384, 1600, 1200
            );

            camera30FPS.follow(player);
            camera60FPS.follow(player);

            player.x += 100;
            player.y += 100;

            // Simulate one second at 30 FPS
            for (let frame = 0; frame < 30; frame++) {
                camera30FPS.follow(player, 1 / 30);
            }

            // Simulate one second at 60 FPS
            for (let frame = 0; frame < 60; frame++) {
                camera60FPS.follow(player, 1 / 60);
            }

            expect(camera30FPS.x)
                .toBeCloseTo(camera60FPS.x, 5);

            expect(camera30FPS.y)
                .toBeCloseTo(camera60FPS.y, 5);
        });

        it("should support instant camera positioning", () => {
            player.x += 100;
            player.y += 100;

            camera.follow(player);

            expect(camera.x).toBe(676);
            expect(camera.y).toBe(524);
        });
    });
});
