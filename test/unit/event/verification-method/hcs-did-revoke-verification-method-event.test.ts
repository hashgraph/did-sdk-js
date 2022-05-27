import { PrivateKey } from "@hashgraph/sdk";
import { DidError, Hashing, HcsDidEventTargetName, HcsDidRevokeVerificationMethodEvent } from "../../../../dist";

describe("HcsDidRevokeVerificationMethodEvent", () => {
    const privateKey = PrivateKey.fromString(
        "302e020100300506032b6570042204209044d8f201e4b0aa7ba8ed577b0334b8cb6e38aad6c596171b5b1246737f5079"
    );
    const identifier = `did:hedera:testnet:${Hashing.multibase.encode(privateKey.publicKey.toBytes())}_0.0.29613327`;
    const event = new HcsDidRevokeVerificationMethodEvent(identifier + "#key-1");

    describe("#constructor", () => {
        it("targets verificationMethod", () => {
            expect(event.targetName).toEqual(HcsDidEventTargetName.VERIFICATION_METHOD);
        });

        it("throws error if id is null", () => {
            let error = null;
            try {
                new HcsDidRevokeVerificationMethodEvent(null);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Method args are missing");
        });

        it("throws error if id is not valid", () => {
            let error = null;
            try {
                new HcsDidRevokeVerificationMethodEvent(identifier);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Event ID is invalid. Expected format: {did}#key-{integer}");
        });
    });

    describe("#getId", () => {
        it("returns id passed via constructor", () => {
            expect(event.getId()).toEqual(
                "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#key-1"
            );
        });
    });

    describe("#getBase64", () => {
        it("returns event data encoded in base64", () => {
            expect(event.getBase64()).toEqual(
                "eyJWZXJpZmljYXRpb25NZXRob2QiOnsiaWQiOiJkaWQ6aGVkZXJhOnRlc3RuZXQ6ejZNa29nVnpvR0pNVlZMaGF6ODJjQTVqWlFLQUFxVWdoaENycHprU0RGRHd4ZkphXzAuMC4yOTYxMzMyNyNrZXktMSJ9fQ=="
            );
        });
    });

    describe("#toJsonTree", () => {
        it("returns event JSON structure", () => {
            expect(event.toJsonTree()).toEqual({
                VerificationMethod: {
                    id: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#key-1",
                },
            });
        });
    });

    describe("#toJSON", () => {
        it("returns stringified JSON structure version", () => {
            expect(event.toJSON()).toEqual(
                '{"VerificationMethod":{"id":"did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#key-1"}}'
            );
        });
    });

    describe("#fromJsonTree", () => {
        it("rebuilds HcsDidRevokeVerificationMethodEvent object", () => {
            const eventFromJson = HcsDidRevokeVerificationMethodEvent.fromJsonTree({
                id: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#key-1",
            });

            expect(eventFromJson).toBeInstanceOf(HcsDidRevokeVerificationMethodEvent);
            expect(eventFromJson.toJsonTree()).toEqual({
                VerificationMethod: {
                    id: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#key-1",
                },
            });
        });
    });
});
