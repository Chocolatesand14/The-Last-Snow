
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnowParticle } from "../src/effects/SnowParticle.js";

describe("SnowParticle", () => {
    let particle;

    beforeEach(() => {
        particle = new SnowParticle(100, 50, 2, 40);
    });

    describe("Initialization", () => {
        it("should have the correct initial position", () => {
            expect(particle.x).toBe(100);
            expect(particle.y).toBe(50);
        });

        it("should have the correct particle size", () => {
            expect(particle.size).toBe(2);
        });

        it("should have the correct falling speed", () => {
            expect(particle.speed).toBe(40);
        });
    });

    describe("Particle movement", () => {
        it("should move downward over time", () => {
            particle.update(1);

            expect(particle.y).toBe(90);
        });

        it("should respect delta time", () => {
            particle.update(0.5);

            expect(particle.y).toBe(70);
        });

        it("should not move when delta time is zero", () => {
            particle.update(0);

            expect(particle.x).toBe(100);
            expect(particle.y).toBe(50);
        });

        it("should ignore negative delta time", () => {
            particle.update(-1);

            expect(particle.x).toBe(100);
            expect(particle.y).toBe(50);
        });

        it("should remain consistent across different frame rates", () => {
            const particle30FPS = new SnowParticle(
                100, 50, 2, 40
            );

            const particle60FPS = new SnowParticle(
                100, 50, 2, 40
            );

            for (let frame = 0; frame < 30; frame++) {
                particle30FPS.update(1 / 30);
            }

            for (let frame = 0; frame < 60; frame++) {
                particle60FPS.update(1 / 60);
            }

            expect(particle30FPS.y)
                .toBeCloseTo(particle60FPS.y, 5);
        });
    });

    describe("Wind influence", () => {
        it("should move right with positive wind", () => {
            particle.update(1, 20);

            expect(particle.x).toBe(120);
        });

        it("should move left with negative wind", () => {
            particle.update(1, -20);

            expect(particle.x).toBe(80);
        });

        it("should not drift without wind", () => {
            particle.update(1, 0);

            expect(particle.x).toBe(100);
        });
    });

    describe("Natural sway movement", () => {
        let swayingParticle;

        beforeEach(() => {
            // Create a particle with controlled sway properties
            swayingParticle = new SnowParticle(
                100, 50, 2, 40,
                8, 0.5, 0
            );
        });

        it("should disable sway by default", () => {
            expect(particle.swayAmplitude).toBe(0);
        });

        it("should initialize with custom sway properties", () => {
            expect(swayingParticle.swayAmplitude).toBe(8);
            expect(swayingParticle.swayFrequency).toBe(0.5);
            expect(swayingParticle.phase).toBe(0);
        });

        it("should start with zero elapsed time", () => {
            expect(swayingParticle.elapsedTime).toBe(0);
        });

        it("should update elapsed time", () => {
            swayingParticle.update(0.5);

            expect(swayingParticle.elapsedTime).toBe(0.5);
        });

        it("should move horizontally without wind when sway is enabled", () => {
            swayingParticle.update(0.5, 0);

            expect(swayingParticle.x).toBeCloseTo(108);
        });

        it("should change horizontal direction over time", () => {
            swayingParticle.update(0.5);

            const previousX = swayingParticle.x;

            swayingParticle.update(1);

            expect(swayingParticle.x).toBeLessThan(previousX);
            expect(swayingParticle.x).toBeCloseTo(92);
        });

        it("should return to its original horizontal position after a full period", () => {
            swayingParticle.update(2);

            expect(swayingParticle.x).toBeCloseTo(100);
        });

        it("should combine wind and sway movement", () => {
            swayingParticle.update(0.5, 20);

            expect(swayingParticle.x).toBeCloseTo(118);
        });

        it("should preserve vertical falling movement", () => {
            swayingParticle.update(0.5);

            expect(swayingParticle.y).toBe(70);
        });

        it("should support individual particle phases", () => {
            const firstParticle = new SnowParticle(
                100, 50, 2, 40,
                8, 0.5, 0
            );

            const secondParticle = new SnowParticle(
                100, 50, 2, 40,
                8, 0.5, Math.PI
            );

            firstParticle.update(0.5);
            secondParticle.update(0.5);

            expect(firstParticle.x).toBeCloseTo(108);
            expect(secondParticle.x).toBeCloseTo(92);
        });

        it("should remain consistent across different frame rates", () => {
            const particle30FPS = new SnowParticle(
                100, 50, 2, 40,
                8, 0.5, 0
            );

            const particle60FPS = new SnowParticle(
                100, 50, 2, 40,
                8, 0.5, 0
            );

            // Simulate half a second at 30 FPS
            for (let frame = 0; frame < 15; frame++) {
                particle30FPS.update(1 / 30, 10);
            }

            // Simulate half a second at 60 FPS
            for (let frame = 0; frame < 30; frame++) {
                particle60FPS.update(1 / 60, 10);
            }

            expect(particle30FPS.x)
                .toBeCloseTo(particle60FPS.x, 5);

            expect(particle30FPS.y)
                .toBeCloseTo(particle60FPS.y, 5);
        });

        it("should preserve sway properties after recycling", () => {
            swayingParticle.update(0.5);
            swayingParticle.reset(200, -10);

            expect(swayingParticle.x).toBe(200);
            expect(swayingParticle.y).toBe(-10);
            expect(swayingParticle.swayAmplitude).toBe(8);
            expect(swayingParticle.swayFrequency).toBe(0.5);
            expect(swayingParticle.phase).toBe(0);
            expect(swayingParticle.elapsedTime).toBe(0);
        });
    });

    describe("Particle boundaries", () => {
        it("should remain active inside the viewport", () => {
            expect(
                particle.isOutsideViewport(480, 384)
            ).toBe(false);
        });

        it("should detect particles below the viewport", () => {
            particle.y = 400;

            expect(
                particle.isOutsideViewport(480, 384)
            ).toBe(true);
        });

        it("should detect particles outside the right boundary", () => {
            particle.x = 500;

            expect(
                particle.isOutsideViewport(480, 384)
            ).toBe(true);
        });

        it("should detect particles outside the left boundary", () => {
            particle.x = -20;

            expect(
                particle.isOutsideViewport(480, 384)
            ).toBe(true);
        });

        it("should allow particles to spawn above the viewport", () => {
            particle.y = -10;

            expect(
                particle.isOutsideViewport(480, 384)
            ).toBe(false);
        });
    });

    describe("Particle recycling", () => {
        it("should reset the particle position", () => {
            particle.reset(200, -10);

            expect(particle.x).toBe(200);
            expect(particle.y).toBe(-10);
        });

        it("should preserve size and speed after resetting", () => {
            particle.reset(200, -10);

            expect(particle.size).toBe(2);
            expect(particle.speed).toBe(40);
        });
    });

    describe("Particle rendering", () => {
        it("should draw the particle on the canvas", () => {
            const ctx = {
                fillRect: vi.fn()
            };

            particle.draw(ctx);

            expect(ctx.fillRect).toHaveBeenCalledWith(
                100, 50, 2, 2
            );
        });

        it("should render using whole pixels", () => {
            particle.x = 100.4;
            particle.y = 50.7;

            const ctx = {
                fillRect: vi.fn()
            };

            particle.draw(ctx);

            expect(ctx.fillRect).toHaveBeenCalledWith(
                100, 51, 2, 2
            );
        });
    });
});
