import { DidMethodOperation, Hashing, HcsDidDeleteEvent } from "../../../src";
import { HcsDidEventParser } from "../../../src/identity/hcs/did/event/hcs-did-event-parser";

describe("HcsDidEventParser", () => {
    describe("#fromBase64", () => {
        it("HcsDidDeleteEvent if operation is DELETE", () => {
            const result = HcsDidEventParser.fromBase64(DidMethodOperation.DELETE, null);
            expect(result).toBeInstanceOf(HcsDidDeleteEvent);
        });

        it("HcsDidDeleteEvent if operation is DELETE - ignores base64 data", () => {
            const eventBase64 = Hashing.base64.encode('{"data":"data"}');
            const result = HcsDidEventParser.fromBase64(DidMethodOperation.DELETE, eventBase64);
            expect(result).toBeInstanceOf(HcsDidDeleteEvent);
        });

        it("returns null if operation was not found in the map", () => {
            const eventBase64 = Hashing.base64.encode('{"data":"data"}');
            const result = HcsDidEventParser.fromBase64("invalid" as any, eventBase64);
            expect(result).toBeNull();
        });

        it("returns null if event target name was not found in the map", () => {
            const eventBase64 = Hashing.base64.encode('{"data":"data"}');
            const result = HcsDidEventParser.fromBase64(DidMethodOperation.CREATE, eventBase64);
            expect(result).toBeNull();
        });

        it("returns null if data is not an object", () => {
            const eventBase64 = Hashing.base64.encode("invalid");
            const result = HcsDidEventParser.fromBase64(DidMethodOperation.CREATE, eventBase64);
            expect(result).toBeNull();
        });

        it("returns null if event target data is null", () => {
            const eventBase64 = Hashing.base64.encode('{"Service":null}');
            const result = HcsDidEventParser.fromBase64(DidMethodOperation.CREATE, eventBase64);
            expect(result).toBeNull();
        });

        it("returns null if event target data is empty", () => {
            const eventBase64 = Hashing.base64.encode('{"Service":{}}');
            const result = HcsDidEventParser.fromBase64(DidMethodOperation.UPDATE, eventBase64);
            expect(result).toBeNull();
        });
    });
});
