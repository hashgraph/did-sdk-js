import { PrivateKey } from "@hashgraph/sdk";
import { DidError, Hashing, HcsDidCreateDidDocumentEvent } from "../../../../dist";

describe("HcsDidCreateDidDocumentEvent", () => {
    const privateKey = PrivateKey.fromString(
        "302e020100300506032b6570042204209044d8f201e4b0aa7ba8ed577b0334b8cb6e38aad6c596171b5b1246737f5079"
    );
    const identifier = `did:hedera:testnet:${Hashing.multibase.encode(privateKey.publicKey.toBytes())}_0.0.29613327`;
    const cid = "QmaBcDeFgHiJkLmNoP";
    const url = `https://ipfs.io/ifs/${cid}`;
    const event = new HcsDidCreateDidDocumentEvent(identifier, cid, url);

    describe("#constructor", () => {
        it("throws error if id is null", () => {
            expect(() => new HcsDidCreateDidDocumentEvent(null as any, cid)).toThrow(
                new DidError("Validation failed. DID Document args are missing")
            );
        });

        it("throws error if cid is null", () => {
            expect(() => new HcsDidCreateDidDocumentEvent(identifier, null as any)).toThrow(
                new DidError("Validation failed. DID Document args are missing")
            );
        });

        it("throws error if id is not valid", () => {
            expect(() => new HcsDidCreateDidDocumentEvent("example", cid)).toThrow(
                new DidError("DID string is invalid: topic ID is missing")
            );
        });
    });

    describe("#getId", () => {
        it("returns the id that was passed via constructor", () => {
            expect(event.getId()).toEqual(identifier);
        });
    });

    describe("#getType", () => {
        it("returns DIDDocument", () => {
            expect(event.getType()).toEqual("DIDDocument");
        });
    });

    describe("#getCid", () => {
        it("returns the cid that was passed via constructor", () => {
            expect(event.getCid()).toEqual(cid);
        });
    });

    describe("#getUrl", () => {
        it("returns the url that was passed via constructor", () => {
            expect(event.getUrl()).toEqual(url);
        });
    });

    describe("#toJsonTree", () => {
        it("returns event JSON tree", () => {
            expect(event.toJsonTree()).toEqual({
                DIDDocument: {
                    id: identifier,
                    type: "DIDDocument",
                    cid,
                    url,
                },
            });
        });
    });

    describe("#toJSON", () => {
        it("returns stringified version of JSON tree", () => {
            expect(event.toJSON()).toEqual(
                '{"DIDDocument":{"id":"did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327","type":"DIDDocument","cid":"QmaBcDeFgHiJkLmNoP","url":"https://ipfs.io/ifs/QmaBcDeFgHiJkLmNoP"}}'
            );
        });
    });

    describe("#fromJsonTree", () => {
        it("rebuilds the HcsDidCreateDidDocumentEvent", () => {
            const eventFromJson = HcsDidCreateDidDocumentEvent.fromJSONTree({
                id: identifier,
                type: "DIDDocument",
                cid,
                url,
            });

            expect(eventFromJson).toBeInstanceOf(HcsDidCreateDidDocumentEvent);
            expect(event.toJsonTree()).toEqual({
                DIDDocument: {
                    id: identifier,
                    type: "DIDDocument",
                    cid,
                    url,
                },
            });
        });
    });
});
