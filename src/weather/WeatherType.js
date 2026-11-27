
export const WeatherType = Object.freeze({
    CLEAR: "clear",
    LIGHT_SNOW: "light_snow",
    SNOWFALL: "snowfall",
    HEAVY_SNOW: "heavy_snow",
    BLIZZARD: "blizzard"
});

// Define immutable weather presets
export const WeatherPresets = Object.freeze({
    [WeatherType.CLEAR]: Object.freeze({
        intensity: 0,
        wind: 0,
        visibility: 1
    }),

    [WeatherType.LIGHT_SNOW]: Object.freeze({
        intensity: 50,
        wind: 5,
        visibility: 0.95
    }),

    [WeatherType.SNOWFALL]: Object.freeze({
        intensity: 100,
        wind: 10,
        visibility: 0.85
    }),

    [WeatherType.HEAVY_SNOW]: Object.freeze({
        intensity: 200,
        wind: 25,
        visibility: 0.65
    }),

    [WeatherType.BLIZZARD]: Object.freeze({
        intensity: 350,
        wind: 60,
        visibility: 0.35
    })
});
