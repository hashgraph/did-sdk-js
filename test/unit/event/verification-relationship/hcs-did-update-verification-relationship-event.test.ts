import { PrivateKey } from "@hashgraph/sdk";
import { DidError, Hashing, HcsDidEventTargetName, HcsDidUpdateVerificationRelationshipEvent } from "../../../../dist";

describe("HcsDidUpdateVerificationRelationshipEvent", () => {
    const privateKey = PrivateKey.fromString(
        "302e020100300506032b6570042204209044d8f201e4b0aa7ba8ed577b0334b8cb6e38aad6c596171b5b1246737f5079"
    );
    const identifier = `did:hedera:testnet:${Hashing.multibase.encode(privateKey.publicKey.toBytes())}_0.0.29613327`;
    const event = new HcsDidUpdateVerificationRelationshipEvent(
        identifier + "#key-1",
        "authentication",
        "Ed25519VerificationKey2018",
        identifier,
        privateKey.publicKey
    );

    describe("#constructor", () => {
        it("targets verificationMethod", () => {
            expect(event.targetName).toEqual(HcsDidEventTargetName.VERIFICATION_RELATIONSHIP);
        });

        it("throws error if id is null", () => {
            let error;
            try {
                new HcsDidUpdateVerificationRelationshipEvent(
                    "",
                    "authentication",
                    "Ed25519VerificationKey2018",
                    identifier,
                    privateKey.publicKey
                );
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Relationship args are missing");
        });

        it("throws error if relationshipType is null", () => {
            let error;
            try {
                new HcsDidUpdateVerificationRelationshipEvent(
                    identifier + "#key-1",
                    <any>null,
                    "Ed25519VerificationKey2018",
                    identifier,
                    privateKey.publicKey
                );
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Relationship args are missing");
        });

        it("throws error if type is null", () => {
            let error;
            try {
                new HcsDidUpdateVerificationRelationshipEvent(
                    identifier + "#key-1",
                    "authentication",
                    <any>null,
                    identifier,
                    privateKey.publicKey
                );
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Relationship args are missing");
        });

        it("throws error if controller is null", () => {
            let error;
            try {
                new HcsDidUpdateVerificationRelationshipEvent(
                    identifier + "#key-1",
                    "authentication",
                    "Ed25519VerificationKey2018",
                    "",
                    privateKey.publicKey
                );
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Relationship args are missing");
        });

        it("throws error if publicKey is null", () => {
            let error;
            try {
                new HcsDidUpdateVerificationRelationshipEvent(
                    identifier + "#key-1",
                    "authentication",
                    "Ed25519VerificationKey2018",
                    identifier,
                    <any>null
                );
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Relationship args are missing");
        });

        it("throws error if id is not valid", () => {
            let error;
            try {
                new HcsDidUpdateVerificationRelationshipEvent(
                    identifier,
                    "authentication",
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

    describe("#getRelationshipType", () => {
        it("returns relationshipType passed via constructor", () => {
            expect(event.getRelationshipType()).toEqual("authentication");
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

    describe("#getPublicKeyBase58", () => {
        it("returns public key base58 encoded", () => {
            expect(event.getPublicKeyBase58()).toEqual("AEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC");
        });
    });

    describe("#getBase64", () => {
        it("returns event data encoded in base64", () => {
            expect(event.getBase64()).toEqual(
                "eyJWZXJpZmljYXRpb25SZWxhdGlvbnNoaXAiOnsiaWQiOiJkaWQ6aGVkZXJhOnRlc3RuZXQ6ekFFRXhEMjN2OXdyRVVWSEt2Yjd0aUptQU1HQ3FIb3hXOHlxV055RnczU1hDXzAuMC4yOTYxMzMyNyNrZXktMSIsInJlbGF0aW9uc2hpcFR5cGUiOiJhdXRoZW50aWNhdGlvbiIsInR5cGUiOiJFZDI1NTE5VmVyaWZpY2F0aW9uS2V5MjAxOCIsImNvbnRyb2xsZXIiOiJkaWQ6aGVkZXJhOnRlc3RuZXQ6ekFFRXhEMjN2OXdyRVVWSEt2Yjd0aUptQU1HQ3FIb3hXOHlxV055RnczU1hDXzAuMC4yOTYxMzMyNyIsInB1YmxpY0tleUJhc2U1OCI6IkFFRXhEMjN2OXdyRVVWSEt2Yjd0aUptQU1HQ3FIb3hXOHlxV055RnczU1hDIn19"
            );
        });
    });

    describe("#toJsonTree", () => {
        it("returns event JSON structure", () => {
            expect(event.toJsonTree()).toEqual({
                VerificationRelationship: {
                    controller: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327",
                    id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1",
                    publicKeyBase58: "AEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                    relationshipType: "authentication",
                    type: "Ed25519VerificationKey2018",
                },
            });
        });
    });

    describe("#toJSON", () => {
        it("returns stringified JSON structure version", () => {
            expect(event.toJSON()).toEqual(
                '{"VerificationRelationship":{"id":"did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1","relationshipType":"authentication","type":"Ed25519VerificationKey2018","controller":"did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327","publicKeyBase58":"AEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC"}}'
            );
        });
    });

    describe("#fromJsonTree", () => {
        it("rebuilds HcsDidUpdateVerificationRelationshipEvent object", () => {
            const eventFromJson = HcsDidUpdateVerificationRelationshipEvent.fromJsonTree({
                controller: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327",
                id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1",
                publicKeyBase58: "AEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                relationshipType: "authentication",
                type: "Ed25519VerificationKey2018",
            });

            expect(eventFromJson).toBeInstanceOf(HcsDidUpdateVerificationRelationshipEvent);
            expect(eventFromJson.toJsonTree()).toEqual({
                VerificationRelationship: {
                    controller: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327",
                    id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1",
                    publicKeyBase58: "AEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                    relationshipType: "authentication",
                    type: "Ed25519VerificationKey2018",
                },
            });
        });
    });
});
