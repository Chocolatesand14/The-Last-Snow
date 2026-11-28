
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

import { Player } from "../src/entities/Player.js";

const { drawSprite } = vi.hoisted(() => ({
    drawSprite: vi.fn()
}));

// Mock sprite rendering without loading image assets
vi.mock("../src/core/Sprite.js", () => ({
    Sprite: class {
        constructor(path) {
            this.path = path;
        }

        draw(ctx, frame, x, y, width, height) {
            drawSprite(
                this.path,
                frame,
                x,
                y,
                width,
                height
            );
        }
    }
}));

describe("Player Appearance", () => {
    let player;
    let ctx;

    const basePath = "assets/sprites/player/base/";

    const directions = [
        ["w", "up"],
        ["s", "down"],
        ["a", "left"],
        ["d", "right"]
    ];

    function createInput(key = null) {
        return {
            isPressed: vi.fn(
                pressedKey => pressedKey === key
            )
        };
    }

    beforeEach(() => {
        vi.clearAllMocks();

        player = new Player(100, 200, {
            useBaseAppearance: true
        });

        ctx = {
            imageSmoothingEnabled: true
        };
    });

    describe("Initial appearance", () => {
        it("should use the unequipped awakening sprite", () => {
            player.draw(ctx);

            expect(drawSprite).toHaveBeenCalledWith(
                "assets/sprites/player/awakening/awakening.png",
                0,
                100,
                200,
                64,
                64
            );
        });

        it("should preserve the original equipped appearance", () => {
            const equippedPlayer = new Player(100, 200);

            equippedPlayer.draw(ctx);

            expect(drawSprite).toHaveBeenCalledWith(
                "assets/sprites/player/idle/idle.png",
                0,
                100,
                200,
                64,
                64
            );
        });
    });

    describe("Directional movement", () => {
        it.each(directions)(
            "should use key %s to display the unequipped %s sprite",
            (key, direction) => {
                player.update(createInput(key), 0.1);
                player.draw(ctx);

                expect(player.direction).toBe(direction);
                expect(player.isMoving).toBe(true);

                expect(drawSprite).toHaveBeenCalledWith(
                    `${basePath}walk-${direction}.png`,
                    expect.any(Number),
                    player.x,
                    player.y,
                    64,
                    64
                );
            }
        );

        it("should preserve the equipped walking sprites", () => {
            const equippedPlayer = new Player(100, 200);

            equippedPlayer.update(createInput("d"), 0.1);
            equippedPlayer.draw(ctx);

            expect(drawSprite).toHaveBeenCalledWith(
                "assets/sprites/player/walk/walk-right.png",
                expect.any(Number),
                equippedPlayer.x,
                equippedPlayer.y,
                64,
                64
            );
        });
    });

    describe("Stationary directions", () => {
        it.each(["left", "right", "up"])(
            "should face %s without moving",
            direction => {
                player.direction = direction;

                player.updateAwakening(0.3);
                player.draw(ctx);

                expect(player.x).toBe(100);
                expect(player.y).toBe(200);
                expect(player.isMoving).toBe(false);

                expect(drawSprite).toHaveBeenCalledWith(
                    `${basePath}walk-${direction}.png`,
                    0,
                    100,
                    200,
                    64,
                    64
                );
            }
        );

        it("should preserve the facing direction after movement stops", () => {
            player.update(createInput("a"), 0.1);
            player.update(createInput(), 0.1);

            player.draw(ctx);

            expect(player.direction).toBe("left");
            expect(player.isMoving).toBe(false);

            expect(drawSprite).toHaveBeenCalledWith(
                `${basePath}walk-left.png`,
                0,
                player.x,
                player.y,
                64,
                64
            );
        });

        it("should return to the awakening sprite when facing down", () => {
            player.direction = "down";

            player.updateAwakening(0.1);
            player.draw(ctx);

            expect(drawSprite).toHaveBeenCalledWith(
                "assets/sprites/player/awakening/awakening.png",
                expect.any(Number),
                100,
                200,
                64,
                64
            );
        });
    });
});
