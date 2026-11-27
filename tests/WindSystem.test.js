
import { describe, it, expect, beforeEach } from "vitest";
import { WindSystem } from "../src/weather/WindSystem.js";

describe("WindSystem", () => {
    let wind;

    beforeEach(() => {
        wind = new WindSystem(10, 8, 0.3);
    });

    describe("Initialization", () => {
        it("should have the correct base wind", () => {
            expect(wind.baseWind).toBe(10);
        });

        it("should have the correct gust strength", () => {
            expect(wind.gustStrength).toBe(8);
        });

        it("should have the correct gust frequency", () => {
            expect(wind.gustFrequency).toBe(0.3);
        });

        it("should start with zero elapsed time", () => {
            expect(wind.elapsedTime).toBe(0);
        });

        it("should initially return the base wind", () => {
            expect(wind.currentWind).toBe(10);
        });
    });

    describe("Wind configuration", () => {
        it("should support positive base wind", () => {
            wind.setBaseWind(25);

            expect(wind.baseWind).toBe(25);
        });

        it("should support negative base wind", () => {
            wind.setBaseWind(-20);

            expect(wind.baseWind).toBe(-20);
        });

        it("should reject invalid base wind values", () => {
            wind.setBaseWind(NaN);
            wind.setBaseWind(Infinity);

            expect(wind.baseWind).toBe(10);
        });

        it("should support adjustable gust strength", () => {
            wind.setGustStrength(15);

            expect(wind.gustStrength).toBe(15);
        });

        it("should reject invalid gust strength", () => {
            wind.setGustStrength(-5);
            wind.setGustStrength(NaN);
            wind.setGustStrength(Infinity);

            expect(wind.gustStrength).toBe(8);
        });

        it("should support adjustable gust frequency", () => {
            wind.setGustFrequency(0.5);

            expect(wind.gustFrequency).toBe(0.5);
        });

        it("should reject invalid gust frequency", () => {
            wind.setGustFrequency(-1);
            wind.setGustFrequency(NaN);
            wind.setGustFrequency(Infinity);

            expect(wind.gustFrequency).toBe(0.3);
        });
    });

    describe("Dynamic wind movement", () => {
        it("should update elapsed time", () => {
            wind.update(1);

            expect(wind.elapsedTime).toBe(1);
        });

        it("should vary wind speed over time", () => {
            const previousWind = wind.currentWind;

            wind.update(0.5);

            expect(wind.currentWind).not.toBe(previousWind);
        });

        it("should remain within the configured wind range", () => {
            for (let frame = 0; frame < 600; frame++) {
                wind.update(1 / 60);

                expect(wind.currentWind)
                    .toBeGreaterThanOrEqual(2);

                expect(wind.currentWind)
                    .toBeLessThanOrEqual(18);
            }
        });

        it("should reach maximum wind at a quarter period", () => {
            wind.update(1 / (4 * wind.gustFrequency));

            expect(wind.currentWind).toBeCloseTo(18);
        });

        it("should reach minimum wind at three quarters of a period", () => {
            wind.update(3 / (4 * wind.gustFrequency));

            expect(wind.currentWind).toBeCloseTo(2);
        });

        it("should maintain constant wind when gusts are disabled", () => {
            wind.setGustStrength(0);
            wind.update(10);

            expect(wind.currentWind).toBe(10);
        });

        it("should support completely calm weather", () => {
            wind.setBaseWind(0);
            wind.setGustStrength(0);
            wind.update(10);

            expect(wind.currentWind).toBe(0);
        });

        it("should support changing wind direction", () => {
            wind.setBaseWind(0);
            wind.setGustFrequency(1);

            wind.update(0.25);

            expect(wind.currentWind).toBeGreaterThan(0);

            wind.update(0.5);

            expect(wind.currentWind).toBeLessThan(0);
        });
    });

    describe("Time handling", () => {
        it("should not update when delta time is zero", () => {
            wind.update(0);

            expect(wind.elapsedTime).toBe(0);
            expect(wind.currentWind).toBe(10);
        });

        it("should ignore negative delta time", () => {
            wind.update(-1);

            expect(wind.elapsedTime).toBe(0);
        });

        it("should ignore invalid delta time", () => {
            wind.update(NaN);
            wind.update(Infinity);

            expect(wind.elapsedTime).toBe(0);
            expect(wind.currentWind).toBe(10);
        });

        it("should remain consistent across different frame rates", () => {
            const wind30FPS = new WindSystem(10, 8, 0.3);
            const wind60FPS = new WindSystem(10, 8, 0.3);

            for (let frame = 0; frame < 30; frame++) {
                wind30FPS.update(1 / 30);
            }

            for (let frame = 0; frame < 60; frame++) {
                wind60FPS.update(1 / 60);
            }

            expect(wind30FPS.currentWind)
                .toBeCloseTo(wind60FPS.currentWind, 5);
        });
    });
});
