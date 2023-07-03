import { PrivateKey } from "@hashgraph/sdk";
import { DidError, Hashing, HcsDidEventTargetName, HcsDidRevokeVerificationRelationshipEvent } from "../../../../dist";

describe("HcsDidRevokeVerificationRelationshipEvent", () => {
    const privateKey = PrivateKey.fromString(
        "302e020100300506032b6570042204209044d8f201e4b0aa7ba8ed577b0334b8cb6e38aad6c596171b5b1246737f5079"
    );
    const identifier = `did:hedera:testnet:${Hashing.multibase.encode(privateKey.publicKey.toBytes())}_0.0.29613327`;
    const event = new HcsDidRevokeVerificationRelationshipEvent(identifier + "#key-1", "authentication");

    describe("#constructor", () => {
        it("targets verificationMethod", () => {
            expect(event.targetName).toEqual(HcsDidEventTargetName.VERIFICATION_RELATIONSHIP);
        });

        it("throws error if id is null", () => {
            let error = null;
            try {
                new HcsDidRevokeVerificationRelationshipEvent(null, "authentication");
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Relationship args are missing");
        });

        it("throws error if relationshipType is null", () => {
            let error = null;
            try {
                new HcsDidRevokeVerificationRelationshipEvent(identifier + "#key-1", null);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Relationship args are missing");
        });

        it("throws error if id is not valid", () => {
            let error = null;
            try {
                new HcsDidRevokeVerificationRelationshipEvent(identifier, "authentication");
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

    describe("#getRelationshipType", () => {
        it("returns relationshipType passed via constructor", () => {
            expect(event.getRelationshipType()).toEqual("authentication");
        });
    });

    describe("#getBase64", () => {
        it("returns event data encoded in base64", () => {
            expect(event.getBase64()).toEqual(
                "eyJWZXJpZmljYXRpb25SZWxhdGlvbnNoaXAiOnsiaWQiOiJkaWQ6aGVkZXJhOnRlc3RuZXQ6ekFFRXhEMjN2OXdyRVVWSEt2Yjd0aUptQU1HQ3FIb3hXOHlxV055RnczU1hDXzAuMC4yOTYxMzMyNyNrZXktMSIsInJlbGF0aW9uc2hpcFR5cGUiOiJhdXRoZW50aWNhdGlvbiJ9fQ=="
            );
        });
    });

    describe("#toJsonTree", () => {
        it("returns event JSON structure", () => {
            expect(event.toJsonTree()).toEqual({
                VerificationRelationship: {
                    id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1",
                    relationshipType: "authentication",
                },
            });
        });
    });

    describe("#toJSON", () => {
        it("returns stringified JSON structure version", () => {
            expect(event.toJSON()).toEqual(
                '{"VerificationRelationship":{"id":"did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1","relationshipType":"authentication"}}'
            );
        });
    });

    describe("#fromJsonTree", () => {
        it("rebuilds HcsDidRevokeVerificationRelationshipEvent object", () => {
            const eventFromJson = HcsDidRevokeVerificationRelationshipEvent.fromJsonTree({
                id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1",
                relationshipType: "authentication",
            });

            expect(eventFromJson).toBeInstanceOf(HcsDidRevokeVerificationRelationshipEvent);
            expect(eventFromJson.toJsonTree()).toEqual({
                VerificationRelationship: {
                    id: "did:hedera:testnet:zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC_0.0.29613327#key-1",
                    relationshipType: "authentication",
                },
            });
        });
    });
});
