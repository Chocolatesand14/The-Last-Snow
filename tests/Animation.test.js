import { describe, it, expect } from "vitest";
import { Animation } from "../src/core/Animation.js";

describe("Animation", () => {

    it("should start at frame zero", () => {
        const animation = new Animation(4, 0.15);

        expect(animation.getFrame()).toBe(0);
    });

    it("should advance to the next frame", () => {
        const animation = new Animation(4, 0.15);

        animation.update(0.15);

        expect(animation.getFrame()).toBe(1);
    });

    it("should remain on the same frame before frame duration", () => {
        const animation = new Animation(4, 0.15);

        animation.update(0.10);

        expect(animation.getFrame()).toBe(0);
    });

    it("should loop back to the first frame", () => {
        const animation = new Animation(4, 0.15);

        for (let i = 0; i < 4; i++) {
            animation.update(0.15);
        }

        expect(animation.getFrame()).toBe(0);
    });

    it("should reset the animation", () => {
        const animation = new Animation(4, 0.15);

        animation.update(0.30);
        animation.reset();

        expect(animation.getFrame()).toBe(0);
        expect(animation.elapsedTime).toBe(0);
    });

    it("should advance multiple frames", () => {
        const animation = new Animation(4, 0.15);

        animation.update(0.31);

        expect(animation.getFrame()).toBe(2);
    });

    it("should accumulate time between updates", () => {
        const animation = new Animation(4, 0.15);

        animation.update(0.10);
        animation.update(0.05);

        expect(animation.getFrame()).toBe(1);
    });

    it("should not advance when delta time is zero", () => {
        const animation = new Animation(4, 0.15);

        animation.update(0);

        expect(animation.getFrame()).toBe(0);
    });

});