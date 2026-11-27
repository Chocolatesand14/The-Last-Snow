
export class WindSystem {
    constructor(
        baseWind = 10,
        gustStrength = 8,
        gustFrequency = 0.3
    ) {
        this.baseWind = 0;
        this.gustStrength = 0;
        this.gustFrequency = 0;
        this.elapsedTime = 0;
        this.currentWind = 0;

        // Initialize wind configuration
        this.setBaseWind(baseWind);
        this.setGustStrength(gustStrength);
        this.setGustFrequency(gustFrequency);
    }

    setBaseWind(value) {
        // Reject invalid wind values
        if (!Number.isFinite(value)) {
            return;
        }

        this.baseWind = value;
        this.calculateWind();
    }

    setGustStrength(value) {
        // Reject invalid or negative gust strength
        if (!Number.isFinite(value) || value < 0) {
            return;
        }

        this.gustStrength = value;
        this.calculateWind();
    }

    setGustFrequency(value) {
        // Reject invalid or negative gust frequency
        if (!Number.isFinite(value) || value < 0) {
            return;
        }

        this.gustFrequency = value;
        this.calculateWind();
    }

    update(deltaTime) {
        // Reject invalid or negative delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Update elapsed simulation time
        this.elapsedTime += deltaTime;

        // Update the current wind speed
        this.calculateWind();
    }

    calculateWind() {
        // Calculate smooth periodic wind variations
        const phase =
            this.elapsedTime *
            this.gustFrequency *
            Math.PI * 2;

        const gust =
            Math.sin(phase) * this.gustStrength;

        // Combine the base wind with the current gust
        this.currentWind = this.baseWind + gust;
    }
}
