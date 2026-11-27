import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

import { Sprite } from "../src/core/Sprite.js";

describe("Sprite", () => {
    let sprite;
    let ctx;

    beforeEach(() => {
        // Mock browser image loading
        vi.stubGlobal("Image", class {
            constructor() {
                this.src = "";
                this.complete = true;
                this.naturalWidth = 256;
                this.naturalHeight = 64;
            }
        });

        // Mock canvas rendering context
        ctx = {
            drawImage: vi.fn(),
            imageSmoothingEnabled: true
        };

        sprite = new Sprite("snowman.png");
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("should initialize with the correct image source", () => {
        expect(sprite.image.src).toBe("snowman.png");
    });

    it("should use default frame dimensions", () => {
        expect(sprite.frameWidth).toBe(64);
        expect(sprite.frameHeight).toBe(64);
    });

    it("should support custom frame dimensions", () => {
        const customSprite = new Sprite("snowman.png", 32, 32);

        expect(customSprite.frameWidth).toBe(32);
        expect(customSprite.frameHeight).toBe(32);
    });

    it("should render the first frame", () => {
        sprite.draw(ctx, 0, 100, 100, 32, 32);

        expect(ctx.drawImage).toHaveBeenCalledWith(
            sprite.image,
            0, 0,
            64, 64,
            100, 100,
            32, 32
        );
    });

    it("should render the correct animation frame", () => {
        sprite.draw(ctx, 2, 100, 100, 32, 32);

        expect(ctx.drawImage).toHaveBeenCalledWith(
            sprite.image,
            128, 0,
            64, 64,
            100, 100,
            32, 32
        );
    });

    it("should not render an unloaded image", () => {
        sprite.image.complete = false;

        sprite.draw(ctx, 0, 100, 100, 32, 32);

        expect(ctx.drawImage).not.toHaveBeenCalled();
    });

    it("should not render an invalid image", () => {
        sprite.image.naturalWidth = 0;

        sprite.draw(ctx, 0, 100, 100, 32, 32);

        expect(ctx.drawImage).not.toHaveBeenCalled();
    });

    it("should disable image smoothing", () => {
        sprite.draw(ctx, 0, 100, 100, 32, 32);

        expect(ctx.imageSmoothingEnabled).toBe(false);
    });

    it("should round rendering coordinates", () => {
        sprite.draw(ctx, 0, 10.4, 20.7, 32, 32);

        expect(ctx.drawImage).toHaveBeenCalledWith(
            sprite.image,
            0, 0,
            64, 64,
            10, 21,
            32, 32
        );
    });
});