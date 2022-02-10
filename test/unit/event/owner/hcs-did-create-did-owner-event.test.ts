import { PrivateKey } from "@hashgraph/sdk";
import { Hashing, HcsDidCreateDidOwnerEvent, HcsDidEventTargetName } from "../../../../dist";

describe("HcsDidCreateDidOwnerEvent", () => {
    const privateKey = PrivateKey.fromString(
        "302e020100300506032b6570042204209044d8f201e4b0aa7ba8ed577b0334b8cb6e38aad6c596171b5b1246737f5079"
    );
    const identifier = `did:hedera:testnet:${Hashing.multibase.encode(privateKey.publicKey.toBytes())}_0.0.29613327`;
    const event = new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", identifier, privateKey.publicKey);

    describe("#constructor", () => {
        it("targets DIDOwner", () => {
            expect(event.targetName).toEqual(HcsDidEventTargetName.DID_OWNER);
        });

        it("throws error if id is null", () => {
            let error = null;
            try {
                new HcsDidCreateDidOwnerEvent(null, identifier, privateKey.publicKey);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Validation failed. DID Owner args are missing");
        });

        it("throws error if controller is null", () => {
            let error = null;
            try {
                new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", null, privateKey.publicKey);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Validation failed. DID Owner args are missing");
        });

        it("throws error if publicKey is null", () => {
            let error = null;
            try {
                new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", identifier, null);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Validation failed. DID Owner args are missing");
        });

        it("throws error if id is not valid", () => {
            let error = null;
            try {
                new HcsDidCreateDidOwnerEvent(identifier, identifier, privateKey.publicKey);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Event ID is invalid. Expected format: {did}#did-root-key");
        });
    });

    describe("#getId", () => {
        it("returns id that was passed via constructor", () => {
            expect(event.getId()).toEqual(identifier + "#did-root-key");
        });
    });

    describe("#getType", () => {
        it("returns Ed25519VerificationKey2018", () => {
            expect(event.getType()).toEqual("Ed25519VerificationKey2018");
        });
    });

    describe("#getController", () => {
        it("returns identifier passed via contructor", () => {
            expect(event.getController()).toEqual(identifier);
        });
    });

    describe("#getPublicKey", () => {
        it("returns public key instance passed via constructor", () => {
            expect(event.getPublicKey()).toEqual(privateKey.publicKey);
        });
    });

    describe("#getPublicKeyMultibase", () => {
        it("returns base58 encoded publicKey", () => {
            expect(event.getPublicKeyMultibase()).toEqual("z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa");
        });
    });

    describe("#getBase64", () => {
        it("returns event encoded in base64", () => {
            expect(event.getBase64()).toEqual(
                "eyJESURPd25lciI6eyJpZCI6ImRpZDpoZWRlcmE6dGVzdG5ldDp6Nk1rb2dWem9HSk1WVkxoYXo4MmNBNWpaUUtBQXFVZ2hoQ3JwemtTREZEd3hmSmFfMC4wLjI5NjEzMzI3I2RpZC1yb290LWtleSIsInR5cGUiOiJFZDI1NTE5VmVyaWZpY2F0aW9uS2V5MjAxOCIsImNvbnRyb2xsZXIiOiJkaWQ6aGVkZXJhOnRlc3RuZXQ6ejZNa29nVnpvR0pNVlZMaGF6ODJjQTVqWlFLQUFxVWdoaENycHprU0RGRHd4ZkphXzAuMC4yOTYxMzMyNyIsInB1YmxpY0tleU11bHRpYmFzZSI6Ino2TWtvZ1Z6b0dKTVZWTGhhejgyY0E1alpRS0FBcVVnaGhDcnB6a1NERkR3eGZKYSJ9fQ=="
            );
        });
    });

    describe("#toJsonTree", () => {
        it("returns event JSON tree", () => {
            expect(event.toJsonTree()).toEqual({
                DIDOwner: {
                    controller: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327",
                    id: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#did-root-key",
                    publicKeyMultibase: "z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa",
                    type: "Ed25519VerificationKey2018",
                },
            });
        });
    });

    describe("#toJSON", () => {
        it("returns stringified version of JSON tree", () => {
            expect(event.toJSON()).toEqual(
                '{"DIDOwner":{"id":"did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#did-root-key","type":"Ed25519VerificationKey2018","controller":"did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327","publicKeyMultibase":"z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa"}}'
            );
        });
    });

    describe("#fromJsonTree", () => {
        it("rebuilds HcsDidCreateDidOwnerEvent object", () => {
            const eventFromJson = HcsDidCreateDidOwnerEvent.fromJsonTree({
                controller: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327",
                id: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#did-root-key",
                publicKeyMultibase: "z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa",
                type: "Ed25519VerificationKey2018",
            });

            expect(eventFromJson).toBeInstanceOf(HcsDidCreateDidOwnerEvent);
            expect(eventFromJson.toJsonTree()).toEqual({
                DIDOwner: {
                    controller: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327",
                    id: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#did-root-key",
                    publicKeyMultibase: "z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa",
                    type: "Ed25519VerificationKey2018",
                },
            });
        });
    });
});
