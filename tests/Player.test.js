import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Player } from "../src/entities/Player.js";

describe("Player", () => {
    let player;

    // Create a mock keyboard input
    function createInput(...keys) {
        return {
            isPressed: vi.fn((key) => keys.includes(key))
        };
    }

    beforeEach(() => {
        // Mock browser image loading
        vi.stubGlobal("Image", class {
            constructor() {
                this.src = "";
            }
        });

        player = new Player(100, 100);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("should initialize with the correct position", () => {
        expect(player.x).toBe(100);
        expect(player.y).toBe(100);
    });

    it("should move up when W is pressed", () => {
        player.update(createInput("w"), 1);

        expect(player.y).toBe(-20);
        expect(player.direction).toBe("up");
    });

    it("should move down when S is pressed", () => {
        player.update(createInput("s"), 1);

        expect(player.y).toBe(220);
        expect(player.direction).toBe("down");
    });

    it("should move left when A is pressed", () => {
        player.update(createInput("a"), 1);

        expect(player.x).toBe(-20);
        expect(player.direction).toBe("left");
    });

    it("should move right when D is pressed", () => {
        player.update(createInput("d"), 1);

        expect(player.x).toBe(220);
        expect(player.direction).toBe("right");
    });

    it("should remain stationary without input", () => {
        player.update(createInput(), 1);

        expect(player.x).toBe(100);
        expect(player.y).toBe(100);
        expect(player.isMoving).toBe(false);
    });

    it("should normalize diagonal movement", () => {
        player.update(createInput("w", "d"), 1);

        const distance = Math.hypot(
            player.x - 100,
            player.y - 100
        );

        expect(distance).toBeCloseTo(player.speed);
    });

    it("should use delta time when moving", () => {
        player.update(createInput("d"), 0.5);

        expect(player.x).toBe(160);
    });

    it("should switch to walking animation", () => {
        player.update(createInput("d"), 0.1);

        expect(player.isMoving).toBe(true);
        expect(player.currentState).toBe("right");
    });

    it("should return to idle when movement stops", () => {
        player.update(createInput("d"), 0.1);
        player.update(createInput(), 0.1);

        expect(player.isMoving).toBe(false);
        expect(player.currentState).toBe("idle");
    });

    it("should support arrow keys", () => {
        player.update(createInput("ArrowUp"), 1);

        expect(player.y).toBe(-20);
        expect(player.direction).toBe("up");
    });

    it("should remain stationary with opposing inputs", () => {
        player.update(createInput("w", "s"), 1);

        expect(player.y).toBe(100);
        expect(player.isMoving).toBe(false);
    });
});