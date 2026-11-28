import { describe, it, expect } from "vitest";

import { EquipmentDialogue } from "../src/data/EquipmentDialogue.js";

describe("EquipmentDialogue", () => {
    it("should contain the button dialogue", () => {
        expect(EquipmentDialogue.button).toEqual([
            "A button...",
            "Is it mine?",
            "Somebody loved me."
        ]);
    });

    it("should contain the scarf dialogue", () => {
        expect(EquipmentDialogue.scarf).toEqual([
            "Warmth...",
            "Why is that familiar?"
        ]);
    });

    it("should contain the hat dialogue", () => {
        expect(EquipmentDialogue.hat).toEqual([
            "I was someone...?"
        ]);
    });

    it("should contain exactly three equipment dialogues", () => {
        expect(Object.keys(EquipmentDialogue))
            .toHaveLength(3);
    });

    it("should protect the dialogue configuration", () => {
        expect(Object.isFrozen(EquipmentDialogue))
            .toBe(true);
    });

    it.each(["button", "scarf", "hat"])(
        "should protect the %s dialogue from modification",
        item => {
            expect(Object.isFrozen(EquipmentDialogue[item]))
                .toBe(true);
        }
    );
});