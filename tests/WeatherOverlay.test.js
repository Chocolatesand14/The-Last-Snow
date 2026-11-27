
import { describe, it, expect, beforeEach, vi } from "vitest";
import { WeatherOverlay } from "../src/effects/WeatherOverlay.js";

describe("WeatherOverlay", () => {
    let overlay;
    let ctx;

    beforeEach(() => {
        overlay = new WeatherOverlay(480, 384);

        ctx = {
            save: vi.fn(),
            restore: vi.fn(),
            fillRect: vi.fn(),
            fillStyle: "",
            globalAlpha: 1
        };
    });

    describe("Initialization", () => {
        it("should have the correct viewport dimensions", () => {
            expect(overlay.width).toBe(480);
            expect(overlay.height).toBe(384);
        });

        it("should initialize with full visibility", () => {
            expect(overlay.visibility).toBe(1);
        });

        it("should initialize without overlay opacity", () => {
            expect(overlay.opacity).toBe(0);
        });

        it("should use a cold weather overlay color", () => {
            expect(overlay.color).toBe("#dce8f2");
        });
    });

    describe("Visibility handling", () => {
        it("should support full visibility", () => {
            overlay.setVisibility(1);

            expect(overlay.visibility).toBe(1);
            expect(overlay.opacity).toBe(0);
        });

        it("should support light snow visibility", () => {
            overlay.setVisibility(0.95);

            expect(overlay.opacity).toBeCloseTo(0.05);
        });

        it("should support normal snowfall visibility", () => {
            overlay.setVisibility(0.85);

            expect(overlay.opacity).toBeCloseTo(0.15);
        });

        it("should support heavy snowfall visibility", () => {
            overlay.setVisibility(0.65);

            expect(overlay.opacity).toBeCloseTo(0.35);
        });

        it("should support blizzard visibility", () => {
            overlay.setVisibility(0.35);

            expect(overlay.opacity).toBeCloseTo(0.65);
        });

        it("should support zero visibility", () => {
            overlay.setVisibility(0);

            expect(overlay.visibility).toBe(0);
            expect(overlay.opacity).toBe(1);
        });

        it("should clamp visibility above one", () => {
            overlay.setVisibility(2);

            expect(overlay.visibility).toBe(1);
            expect(overlay.opacity).toBe(0);
        });

        it("should clamp negative visibility", () => {
            overlay.setVisibility(-0.5);

            expect(overlay.visibility).toBe(0);
            expect(overlay.opacity).toBe(1);
        });

        it("should reject invalid visibility values", () => {
            overlay.setVisibility(0.5);

            overlay.setVisibility(NaN);
            overlay.setVisibility(Infinity);
            overlay.setVisibility(-Infinity);

            expect(overlay.visibility).toBe(0.5);
            expect(overlay.opacity).toBe(0.5);
        });

        it("should update opacity when visibility changes", () => {
            overlay.setVisibility(0.85);

            expect(overlay.opacity).toBeCloseTo(0.15);

            overlay.setVisibility(0.35);

            expect(overlay.opacity).toBeCloseTo(0.65);

            overlay.setVisibility(1);

            expect(overlay.opacity).toBe(0);
        });
    });

    describe("Overlay rendering", () => {
        it("should render the overlay across the viewport", () => {
            overlay.setVisibility(0.35);
            overlay.draw(ctx);

            expect(ctx.fillRect).toHaveBeenCalledWith(
                0, 0, 480, 384
            );
        });

        it("should apply the correct overlay color", () => {
            overlay.setVisibility(0.65);
            overlay.draw(ctx);

            expect(ctx.fillStyle).toBe("#dce8f2");
        });

        it("should apply the correct overlay opacity", () => {
            overlay.setVisibility(0.35);
            overlay.draw(ctx);

            expect(ctx.globalAlpha).toBeCloseTo(0.65);
        });

        it("should save and restore the canvas state", () => {
            overlay.setVisibility(0.35);
            overlay.draw(ctx);

            expect(ctx.save).toHaveBeenCalledTimes(1);
            expect(ctx.restore).toHaveBeenCalledTimes(1);
        });

        it("should not render an overlay during clear weather", () => {
            overlay.setVisibility(1);
            overlay.draw(ctx);

            expect(ctx.fillRect).not.toHaveBeenCalled();
        });

        it("should render the overlay only once per frame", () => {
            overlay.setVisibility(0.35);
            overlay.draw(ctx);

            expect(ctx.fillRect).toHaveBeenCalledTimes(1);
        });
    });
});
