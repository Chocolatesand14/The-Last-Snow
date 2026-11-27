
import { SnowParticle } from "./SnowParticle.js";

export class SnowParticleSystem {
    constructor(width, height, particleCount = 100) {
        this.width = width;
        this.height = height;

        this.wind = 0;
        this.particles = [];

        // Create the initial snow particles
        this.setIntensity(particleCount);
    }

    createParticle() {
        // Generate a random position inside the viewport
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;

        // Generate a particle size between 1 and 3 pixels
        const size = 1 + Math.floor(Math.random() * 3);

        // Generate a falling speed between 15 and 60 pixels per second
        const speed = 15 + Math.random() * 45;

        return new SnowParticle(x, y, size, speed);
    }

    update(deltaTime) {
        // Reject invalid or negative delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Update all active particles
        for (const particle of this.particles) {
            particle.update(deltaTime, this.wind);

            // Recycle particles outside the viewport
            if (
                particle.isOutsideViewport(
                    this.width,
                    this.height
                )
            ) {
                this.recycleParticle(particle);
            }
        }
    }

    recycleParticle(particle) {
        // Generate a new horizontal position
        const x = Math.random() * this.width;

        // Spawn the particle above the viewport
        const y = -(particle.size + Math.random() * 20);

        // Reuse the existing particle
        particle.reset(x, y);
    }

    setWind(wind) {
        // Reject invalid wind values
        if (!Number.isFinite(wind)) {
            return;
        }

        this.wind = wind;
    }

    setIntensity(particleCount) {
        // Validate the requested particle count
        if (
            !Number.isInteger(particleCount) ||
            particleCount < 0
        ) {
            return;
        }

        // Remove excess particles
        if (particleCount < this.particles.length) {
            this.particles.length = particleCount;
        }

        // Create additional particles when needed
        while (this.particles.length < particleCount) {
            this.particles.push(
                this.createParticle()
            );
        }
    }

    draw(ctx) {
        // Render all active snow particles
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
    }
}
