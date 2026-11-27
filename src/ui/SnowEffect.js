export class SnowEffect {
    constructor(amount = 40) {
        this.amount = amount;
        this.container = document.createElement("div");
        this.container.className = "snow-container";
        this.container.setAttribute("aria-hidden", "true");

        document.body.appendChild(this.container);
    }

    start() {
        // Generate snowflakes
        for (let i = 0; i < this.amount; i++) {
            const snowflake = document.createElement("span");

            snowflake.className = "snowflake";
            snowflake.textContent = i % 4 === 0 ? "❄" : "•";

            // Randomize appearance and movement
            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.fontSize = `${0.3 + Math.random() * 0.7}rem`;
            snowflake.style.opacity = 0.2 + Math.random() * 0.6;
            snowflake.style.animationDuration = `${8 + Math.random() * 12}s`;
            snowflake.style.animationDelay = `-${Math.random() * 20}s`;

            this.container.appendChild(snowflake);
        }
    }
}