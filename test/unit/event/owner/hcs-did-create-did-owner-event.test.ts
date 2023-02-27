import { PrivateKey } from "@hashgraph/sdk";
import { DidError, Hashing, HcsDidCreateDidOwnerEvent, HcsDidEventTargetName } from "../../../../dist";

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

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. DID Owner args are missing");
        });

        it("throws error if controller is null", () => {
            let error = null;
            try {
                new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", null, privateKey.publicKey);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. DID Owner args are missing");
        });

        it("throws error if publicKey is null", () => {
            let error = null;
            try {
                new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", identifier, null);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. DID Owner args are missing");
        });

        it("throws error if id is not valid", () => {
            let error = null;
            try {
                new HcsDidCreateDidOwnerEvent(identifier, identifier, privateKey.publicKey);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
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
        it("returns identifier passed via constructor", () => {
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
            expect(event.getPublicKeyMultibase()).toEqual("zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC");
        });
    });

    describe("#getBase64", () => {
        it("returns event encoded in base64", () => {
            expect(event.getBase64()).toEqual(
                "eyJESURPd25lciI6eyJpZCI6ImRpZDpoZWRlcmE6dGVzdG5ldDp6QUVFeEQyM3Y5d3JFVVZIS3ZiN3RpSm1BTUdDcUhveFc4eXFXTnlGdzNTWENfMC4wLjI5NjEzMzI3I2RpZC1yb290LWtleSIsInR5cGUiOiJFZDI1NTE5VmVyaWZpY2F0aW9uS2V5MjAxOCIsImNvbnRyb2xsZXIiOiJkaWQ6aGVkZXJhOnRlc3RuZXQ6ekFFRXhEMjN2OXdyRVVWSEt2Yjd0aUptQU1HQ3FIb3hXOHlxV055RnczU1hDXzAuMC4yOTYxMzMyNyIsInB1YmxpY0tleU11bHRpYmFzZSI6InpBRUV4RDIzdjl3ckVVVkhLdmI3dGlKbUFNR0NxSG94Vzh5cVdOeUZ3M1NYQyJ9fQ=="
            );
        });
    });

    describe("#toJsonTree", () => {
        it("returns event JSON tree", () => {
            expect(event.toJsonTree()).toEqual({
                DIDOwner: {
                    controller: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327",
                    id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#did-root-key",
                    publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                    type: "Ed25519VerificationKey2018",
                },
            });
        });
    });

    describe("#toJSON", () => {
        it("returns stringified version of JSON tree", () => {
            expect(event.toJSON()).toEqual(
                '{"DIDOwner":{"id":"did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#did-root-key","type":"Ed25519VerificationKey2018","controller":"did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327","publicKeyMultibase":"zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC"}}'
            );
        });
    });

    describe("#fromJsonTree", () => {
        it("rebuilds HcsDidCreateDidOwnerEvent object", () => {
            const eventFromJson = HcsDidCreateDidOwnerEvent.fromJsonTree({
                controller: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327",
                id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#did-root-key",
                publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                type: "Ed25519VerificationKey2018",
            });

            expect(eventFromJson).toBeInstanceOf(HcsDidCreateDidOwnerEvent);
            expect(eventFromJson.toJsonTree()).toEqual({
                DIDOwner: {
                    controller: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327",
                    id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#did-root-key",
                    publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                    type: "Ed25519VerificationKey2018",
                },
            });
        });
    });
});
