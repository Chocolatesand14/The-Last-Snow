import { Game } from "./core/Game.js";
import { SnowEffect } from "./ui/SnowEffect.js";

const canvas = document.getElementById("gameCanvas");

// Initialize the game
const game = new Game(canvas);
game.start();

// Initialize the snow effect
const snowEffect = new SnowEffect(40);
snowEffect.start();