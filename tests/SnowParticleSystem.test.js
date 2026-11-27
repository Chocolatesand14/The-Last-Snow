
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnowParticle } from "../src/effects/SnowParticle.js";
import { SnowParticleSystem } from "../src/effects/SnowParticleSystem.js";

describe("SnowParticleSystem", () => {
    let system;

    beforeEach(() => {
        system = new SnowParticleSystem(480, 384, 100);
    });

    describe("Initialization", () => {
        it("should have the correct viewport dimensions", () => {
            expect(system.width).toBe(480);
            expect(system.height).toBe(384);
        });

        it("should create the requested number of particles", () => {
            expect(system.particles).toHaveLength(100);
        });

        it("should create SnowParticle instances", () => {
            for (const particle of system.particles) {
                expect(particle).toBeInstanceOf(SnowParticle);
            }
        });

        it("should initialize particles inside the viewport", () => {
            for (const particle of system.particles) {
                expect(particle.x).toBeGreaterThanOrEqual(0);
                expect(particle.x).toBeLessThan(480);

                expect(particle.y).toBeGreaterThanOrEqual(0);
                expect(particle.y).toBeLessThan(384);
            }
        });

        it("should generate valid particle sizes", () => {
            for (const particle of system.particles) {
                expect(particle.size).toBeGreaterThanOrEqual(1);
                expect(particle.size).toBeLessThanOrEqual(3);
                expect(Number.isInteger(particle.size)).toBe(true);
            }
        });

        it("should generate valid falling speeds", () => {
            for (const particle of system.particles) {
                expect(particle.speed).toBeGreaterThanOrEqual(15);
                expect(particle.speed).toBeLessThanOrEqual(60);
            }
        });

        it("should initialize without wind", () => {
            expect(system.wind).toBe(0);
        });

        it("should support a system without particles", () => {
            const emptySystem = new SnowParticleSystem(
                480, 384, 0
            );

            expect(emptySystem.particles).toHaveLength(0);
        });
    });

    describe("Particle updates", () => {
        it("should update every particle", () => {
            const spies = system.particles.map(particle =>
                vi.spyOn(particle, "update")
            );

            system.update(0.1);

            for (const spy of spies) {
                expect(spy).toHaveBeenCalledWith(0.1, 0);
            }
        });

        it("should move particles downward", () => {
            const particle = system.particles[0];

            particle.x = 100;
            particle.y = 50;
            particle.speed = 40;

            system.update(0.5);

            expect(particle.y).toBe(70);
        });

        it("should not move particles when delta time is zero", () => {
            const previousPositions = system.particles.map(
                particle => ({
                    x: particle.x,
                    y: particle.y
                })
            );

            system.update(0);

            const currentPositions = system.particles.map(
                particle => ({
                    x: particle.x,
                    y: particle.y
                })
            );

            expect(currentPositions).toEqual(previousPositions);
        });

        it("should ignore invalid delta time", () => {
            const particle = system.particles[0];
            const spy = vi.spyOn(particle, "update");

            system.update(NaN);
            system.update(-1);
            system.update(Infinity);

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe("Wind influence", () => {
        it("should support positive wind", () => {
            system.setWind(20);

            expect(system.wind).toBe(20);
        });

        it("should support negative wind", () => {
            system.setWind(-20);

            expect(system.wind).toBe(-20);
        });

        it("should apply wind to particle movement", () => {
            const particle = system.particles[0];

            particle.x = 100;
            particle.y = 50;

            // Disable sway to isolate wind movement
            particle.swayAmplitude = 0;

            system.setWind(20);
            system.update(0.5);

            expect(particle.x).toBe(110);
        });

        it("should reject invalid wind values", () => {
            system.setWind(20);

            system.setWind(NaN);
            system.setWind(Infinity);

            expect(system.wind).toBe(20);
        });
    });

    describe("Natural particle movement", () => {
        it("should generate valid sway amplitudes", () => {
            for (const particle of system.particles) {
                expect(particle.swayAmplitude)
                    .toBeGreaterThanOrEqual(2);

                expect(particle.swayAmplitude)
                    .toBeLessThanOrEqual(8);
            }
        });

        it("should generate valid sway frequencies", () => {
            for (const particle of system.particles) {
                expect(particle.swayFrequency)
                    .toBeGreaterThanOrEqual(0.2);

                expect(particle.swayFrequency)
                    .toBeLessThanOrEqual(0.8);
            }
        });

        it("should generate valid individual phases", () => {
            for (const particle of system.particles) {
                expect(particle.phase)
                    .toBeGreaterThanOrEqual(0);

                expect(particle.phase)
                    .toBeLessThan(Math.PI * 2);
            }
        });

        it("should preserve sway properties after recycling", () => {
            const particle = system.particles[0];

            const amplitude = particle.swayAmplitude;
            const frequency = particle.swayFrequency;
            const phase = particle.phase;

            particle.x = 100;
            particle.y = 50;

            // Advance the movement timer before recycling
            system.update(0.5);

            particle.y = 400;

            system.update(0.1);

            expect(particle.swayAmplitude).toBe(amplitude);
            expect(particle.swayFrequency).toBe(frequency);
            expect(particle.phase).toBe(phase);
            expect(particle.elapsedTime).toBe(0);
        });

        it("should generate sway properties for new particles", () => {
            system.setIntensity(150);

            const newParticles = system.particles.slice(100);

            expect(newParticles).toHaveLength(50);

            for (const particle of newParticles) {
                expect(particle.swayAmplitude)
                    .toBeGreaterThanOrEqual(2);

                expect(particle.swayAmplitude)
                    .toBeLessThanOrEqual(8);

                expect(particle.swayFrequency)
                    .toBeGreaterThanOrEqual(0.2);

                expect(particle.swayFrequency)
                    .toBeLessThanOrEqual(0.8);

                expect(particle.phase)
                    .toBeGreaterThanOrEqual(0);

                expect(particle.phase)
                    .toBeLessThan(Math.PI * 2);
            }
        });

        it("should update individual particle movement timers", () => {
            const particle = system.particles[0];

            particle.x = 100;
            particle.y = 50;

            system.update(0.5);

            expect(particle.elapsedTime).toBeCloseTo(0.5);
        });
    });

    describe("Particle recycling", () => {
        it("should recycle particles below the viewport", () => {
            const particle = system.particles[0];

            particle.x = 100;
            particle.y = 400;

            system.update(0.1);

            expect(particle.y).toBeLessThan(0);
            expect(particle.x).toBeGreaterThanOrEqual(0);
            expect(particle.x).toBeLessThan(system.width);
        });

        it("should recycle particles outside the right boundary", () => {
            const particle = system.particles[0];

            particle.x = 500;

            system.update(0.1);

            expect(particle.x).toBeGreaterThanOrEqual(0);
            expect(particle.x).toBeLessThan(system.width);
        });

        it("should recycle particles outside the left boundary", () => {
            const particle = system.particles[0];

            particle.x = -20;

            system.update(0.1);

            expect(particle.x).toBeGreaterThanOrEqual(0);
            expect(particle.x).toBeLessThan(system.width);
        });

        it("should reuse existing particle instances", () => {
            const particle = system.particles[0];

            particle.y = 400;

            system.update(0.1);

            expect(system.particles[0]).toBe(particle);
        });

        it("should preserve the particle count after recycling", () => {
            for (const particle of system.particles) {
                particle.y = 400;
            }

            system.update(0.1);

            expect(system.particles).toHaveLength(100);
        });
    });

    describe("Snow intensity", () => {
        it("should increase the number of particles", () => {
            system.setIntensity(150);

            expect(system.particles).toHaveLength(150);
        });

        it("should decrease the number of particles", () => {
            system.setIntensity(50);

            expect(system.particles).toHaveLength(50);
        });

        it("should allow snowfall to be disabled", () => {
            system.setIntensity(0);

            expect(system.particles).toHaveLength(0);
        });

        it("should preserve existing particles when increasing intensity", () => {
            const particle = system.particles[0];

            system.setIntensity(150);

            expect(system.particles[0]).toBe(particle);
        });

        it("should reject invalid intensity values", () => {
            system.setIntensity(-10);
            system.setIntensity(NaN);
            system.setIntensity(Infinity);
            system.setIntensity(10.5);

            expect(system.particles).toHaveLength(100);
        });
    });

    describe("Particle rendering", () => {
        it("should render every particle", () => {
            const ctx = {
                fillRect: vi.fn()
            };

            system.draw(ctx);

            expect(ctx.fillRect)
                .toHaveBeenCalledTimes(100);
        });

        it("should not render particles when snowfall is disabled", () => {
            const ctx = {
                fillRect: vi.fn()
            };

            system.setIntensity(0);
            system.draw(ctx);

            expect(ctx.fillRect).not.toHaveBeenCalled();
        });
    });
});
