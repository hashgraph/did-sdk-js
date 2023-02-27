import { PrivateKey } from "@hashgraph/sdk";
import { DidError, Hashing, HcsDidEventTargetName, HcsDidUpdateVerificationMethodEvent } from "../../../../dist";

describe("HcsDidUpdateVerificationMethodEvent", () => {
    const privateKey = PrivateKey.fromString(
        "302e020100300506032b6570042204209044d8f201e4b0aa7ba8ed577b0334b8cb6e38aad6c596171b5b1246737f5079"
    );
    const identifier = `did:hedera:testnet:${Hashing.multibase.encode(privateKey.publicKey.toBytes())}_0.0.29613327`;
    const event = new HcsDidUpdateVerificationMethodEvent(
        identifier + "#key-1",
        "Ed25519VerificationKey2018",
        identifier,
        privateKey.publicKey
    );

    describe("#constructor", () => {
        it("targets verificationMethod", () => {
            expect(event.targetName).toEqual(HcsDidEventTargetName.VERIFICATION_METHOD);
        });

        it("throws error if id is null", () => {
            let error = null;
            try {
                new HcsDidUpdateVerificationMethodEvent(
                    null,
                    "Ed25519VerificationKey2018",
                    identifier,
                    privateKey.publicKey
                );
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Method args are missing");
        });

        it("throws error if type is null", () => {
            let error = null;
            try {
                new HcsDidUpdateVerificationMethodEvent(identifier + "#key-1", null, identifier, privateKey.publicKey);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Method args are missing");
        });

        it("throws error if controller is null", () => {
            let error = null;
            try {
                new HcsDidUpdateVerificationMethodEvent(
                    identifier + "#key-1",
                    "Ed25519VerificationKey2018",
                    null,
                    privateKey.publicKey
                );
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Method args are missing");
        });

        it("throws error publicKey id is null", () => {
            let error = null;
            try {
                new HcsDidUpdateVerificationMethodEvent(
                    identifier + "#key-1",
                    "Ed25519VerificationKey2018",
                    identifier,
                    null
                );
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Method args are missing");
        });

        it("throws error if id is not valid", () => {
            let error = null;
            try {
                new HcsDidUpdateVerificationMethodEvent(
                    identifier,
                    "Ed25519VerificationKey2018",
                    identifier,
                    privateKey.publicKey
                );
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
                "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1"
            );
        });
    });

    describe("#getType", () => {
        it("returns type passed via constructor", () => {
            expect(event.getType()).toEqual("Ed25519VerificationKey2018");
        });
    });

    describe("#getController", () => {
        it("returns type passed via constructor", () => {
            expect(event.getController()).toEqual(
                "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327"
            );
        });
    });

    describe("#getPublicKey", () => {
        it("returns public key passed via constructor", () => {
            expect(event.getPublicKey()).toEqual(privateKey.publicKey);
        });
    });

    describe("#getPublicKeyMultibase", () => {
        it("returns public key base58 encoded", () => {
            expect(event.getPublicKeyMultibase()).toEqual("zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC");
        });
    });

    describe("#getBase64", () => {
        it("returns event data encoded in base64", () => {
            expect(event.getBase64()).toEqual(
                "eyJWZXJpZmljYXRpb25NZXRob2QiOnsiaWQiOiJkaWQ6aGVkZXJhOnRlc3RuZXQ6ekFFRXhEMjN2OXdyRVVWSEt2Yjd0aUptQU1HQ3FIb3hXOHlxV055RnczU1hDXzAuMC4yOTYxMzMyNyNrZXktMSIsInR5cGUiOiJFZDI1NTE5VmVyaWZpY2F0aW9uS2V5MjAxOCIsImNvbnRyb2xsZXIiOiJkaWQ6aGVkZXJhOnRlc3RuZXQ6ekFFRXhEMjN2OXdyRVVWSEt2Yjd0aUptQU1HQ3FIb3hXOHlxV055RnczU1hDXzAuMC4yOTYxMzMyNyIsInB1YmxpY0tleU11bHRpYmFzZSI6InpBRUV4RDIzdjl3ckVVVkhLdmI3dGlKbUFNR0NxSG94Vzh5cVdOeUZ3M1NYQyJ9fQ=="
            );
        });
    });

    describe("#toJsonTree", () => {
        it("returns event JSON structure", () => {
            expect(event.toJsonTree()).toEqual({
                VerificationMethod: {
                    controller: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327",
                    id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1",
                    publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                    type: "Ed25519VerificationKey2018",
                },
            });
        });
    });

    describe("#toJSON", () => {
        it("returns stringified JSON structure version", () => {
            expect(event.toJSON()).toEqual(
                '{"VerificationMethod":{"id":"did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1","type":"Ed25519VerificationKey2018","controller":"did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327","publicKeyMultibase":"zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC"}}'
            );
        });
    });

    describe("#fromJsonTree", () => {
        it("rebuilds HcsDidUpdateVerificationMethodEvent object", () => {
            const eventFromJson = HcsDidUpdateVerificationMethodEvent.fromJsonTree({
                controller: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327",
                id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1",
                publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                type: "Ed25519VerificationKey2018",
            });

            expect(eventFromJson).toBeInstanceOf(HcsDidUpdateVerificationMethodEvent);
            expect(eventFromJson.toJsonTree()).toEqual({
                VerificationMethod: {
                    controller: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327",
                    id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1",
                    publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                    type: "Ed25519VerificationKey2018",
                },
            });
        });
    });
});
