import { HcsDidDeleteEvent, HcsDidEventTargetName } from "../../../../dist";

describe("HcsDidDeleteEvent", () => {
    const event = new HcsDidDeleteEvent();

    describe("#constructor", () => {
        it("targets DID document", () => {
            expect(event.targetName).toEqual(HcsDidEventTargetName.Document);
        });
    });

    describe("#getId", () => {
        it("returns undefined", () => {
            expect(event.getId()).toBeUndefined();
        });
    });

    describe("#toJsonTree", () => {
        it("returns null", () => {
            expect(event.toJsonTree()).toEqual(null);
        });
    });

    describe("#toJSON", () => {
        it("returns stringified null", () => {
            expect(event.toJSON()).toEqual("null");
        });
    });

    describe("#getBase64", () => {
        it("returns null", () => {
            expect(event.getBase64()).toEqual(null);
        });
    });

    describe("#fromJsonTree", () => {
        it("returns event object", () => {
            const eventFromJson = HcsDidDeleteEvent.fromJsonTree(null);
            expect(eventFromJson).toBeInstanceOf(HcsDidDeleteEvent);
        });
    });
});
