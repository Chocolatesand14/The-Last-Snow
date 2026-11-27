
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
});
