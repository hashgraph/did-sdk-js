import { PrivateKey } from "@hashgraph/sdk";
import {
    DidDocument,
    DidMethodOperation,
    Hashing,
    HcsDidCreateDidOwnerEvent,
    HcsDidCreateServiceEvent,
    HcsDidCreateVerificationMethodEvent,
    HcsDidCreateVerificationRelationshipEvent,
    HcsDidDeleteEvent,
    HcsDidMessage,
    HcsDidUpdateDidOwnerEvent,
} from "../../dist";

describe("DidDocument", () => {
    describe("#toJsonTree", () => {
        const privateKey = PrivateKey.fromString(
            "302e020100300506032b6570042204209044d8f201e4b0aa7ba8ed577b0334b8cb6e38aad6c596171b5b1246737f5079"
        );
        const identifier = `did:hedera:testnet:${Hashing.multibase.encode(
            privateKey.publicKey.toBytes()
        )}_0.0.29613327`;

        it("returns empty document if not events were passed", () => {
            const doc = new DidDocument(identifier, []);

            expect(doc.toJsonTree()).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [],
                authentication: [],
                id: identifier,
                verificationMethod: [],
            });
            expect(doc.getCreated()).toBeNull();
            expect(doc.getUpdated()).toBeNull();
            expect(doc.getDeactivated()).toEqual(false);
            expect(doc.getVersionId()).toBeNull();
        });

        it("ignores events til first create DIDOwner event", () => {
            const doc = new DidDocument(identifier, [
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateServiceEvent(
                        identifier + "#service-1",
                        "LinkedDomains",
                        "https://test.identity.com"
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", identifier, privateKey.publicKey)
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateServiceEvent(
                        identifier + "#service-2",
                        "LinkedDomains",
                        "https://test2.identity.com"
                    )
                ),
            ]);

            expect(doc.toJsonTree()).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                id: identifier,
                assertionMethod: [`${identifier}#did-root-key`],
                authentication: [`${identifier}#did-root-key`],
                service: [
                    {
                        id: `${identifier}#service-2`,
                        serviceEndpoint: "https://test2.identity.com",
                        type: "LinkedDomains",
                    },
                ],
                verificationMethod: [
                    {
                        controller: identifier,
                        id: `${identifier}#did-root-key`,
                        publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });
            expect(doc.getCreated()).toBeTruthy();
            expect(doc.getUpdated()).toBeTruthy();
            expect(doc.getDeactivated()).toEqual(false);
            expect(doc.getVersionId()).toBeTruthy();
        });

        it("handles create DIDOwner event", () => {
            const messages = [
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", identifier, privateKey.publicKey)
                ),
            ];
            const doc = new DidDocument(identifier, messages);

            expect(doc.toJsonTree()).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${identifier}#did-root-key`],
                authentication: [`${identifier}#did-root-key`],
                id: identifier,
                verificationMethod: [
                    {
                        controller: identifier,
                        id: `${identifier}#did-root-key`,
                        publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });
            expect(doc.getCreated()).toBeTruthy();
            expect(doc.getUpdated()).toBeTruthy();
            expect(doc.getDeactivated()).toEqual(false);
            expect(doc.getVersionId()).toBeTruthy();
        });

        it("handles DID delete event", () => {
            const messages = [
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", identifier, privateKey.publicKey)
                ),
                new HcsDidMessage(DidMethodOperation.DELETE, identifier, new HcsDidDeleteEvent()),
            ];
            const doc = new DidDocument(identifier, messages);

            expect(doc.toJsonTree()).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [],
                authentication: [],
                id: identifier,
                verificationMethod: [],
            });
            expect(doc.getCreated()).toBeNull();
            expect(doc.getUpdated()).toBeNull();
            expect(doc.getDeactivated()).toEqual(true);
            expect(doc.getVersionId()).toBeNull();
        });

        it("handles change DID owner event", () => {
            const otherOwnerKey = PrivateKey.generate();
            const otherOwnerIdentifier =
                "did:hedera:testnet:" + Hashing.multibase.encode(otherOwnerKey.publicKey.toBytes()) + "_0.0.29999999";
            const key2 = PrivateKey.generate();

            const messages = [
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", identifier, privateKey.publicKey)
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateVerificationRelationshipEvent(
                        identifier + "#key-2",
                        "capabilityDelegation",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key2.publicKey
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.UPDATE,
                    identifier,
                    new HcsDidUpdateDidOwnerEvent(
                        otherOwnerIdentifier + "#did-root-key",
                        otherOwnerIdentifier,
                        otherOwnerKey.publicKey
                    )
                ),
            ];
            const doc = new DidDocument(identifier, messages);

            expect(doc.toJsonTree()).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${otherOwnerIdentifier}#did-root-key`],
                authentication: [`${otherOwnerIdentifier}#did-root-key`],
                capabilityDelegation: [`${identifier}#key-2`],
                controller: otherOwnerIdentifier,
                id: identifier,
                verificationMethod: [
                    {
                        controller: otherOwnerIdentifier,
                        id: `${otherOwnerIdentifier}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(otherOwnerKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: identifier,
                        id: `${identifier}#key-2`,
                        publicKeyMultibase: Hashing.multibase.encode(key2.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });
            expect(doc.getCreated()).toBeTruthy();
            expect(doc.getUpdated()).toBeTruthy();
            expect(doc.getDeactivated()).toEqual(false);
            expect(doc.getVersionId()).toBeTruthy();
        });

        it("successfully handles add service, verificationMethod and verificationRelationship events", () => {
            const key1 = PrivateKey.generate();
            const key2 = PrivateKey.generate();

            const messages = [
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", identifier, privateKey.publicKey)
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateServiceEvent(
                        identifier + "#service-1",
                        "LinkedDomains",
                        "https://test.identity.com"
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateVerificationMethodEvent(
                        identifier + "#key-1",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key1.publicKey
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateVerificationRelationshipEvent(
                        identifier + "#key-2",
                        "capabilityDelegation",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key2.publicKey
                    )
                ),
            ];
            const doc = new DidDocument(identifier, messages);

            expect(doc.toJsonTree()).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${identifier}#did-root-key`],
                authentication: [`${identifier}#did-root-key`],
                capabilityDelegation: [`${identifier}#key-2`],
                id: identifier,
                service: [
                    {
                        id: `${identifier}#service-1`,
                        serviceEndpoint: "https://test.identity.com",
                        type: "LinkedDomains",
                    },
                ],
                verificationMethod: [
                    {
                        controller: identifier,
                        id: `${identifier}#did-root-key`,
                        publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: identifier,
                        id: `${identifier}#key-1`,
                        publicKeyMultibase: Hashing.multibase.encode(key1.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: identifier,
                        id: `${identifier}#key-2`,
                        publicKeyMultibase: Hashing.multibase.encode(key2.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });
            expect(doc.getCreated()).toBeTruthy();
            expect(doc.getUpdated()).toBeTruthy();
            expect(doc.getDeactivated()).toEqual(false);
            expect(doc.getVersionId()).toBeTruthy();
        });

        it("successfully handles update service, verificationMethod and verificationRelationship events", () => {
            const key1 = PrivateKey.generate();
            const key2 = PrivateKey.generate();
            const key3 = PrivateKey.generate();

            const key4 = PrivateKey.generate();
            const key5 = PrivateKey.generate();

            const messages = [
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", identifier, privateKey.publicKey)
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateServiceEvent(
                        identifier + "#service-1",
                        "LinkedDomains",
                        "https://test.identity.com"
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateServiceEvent(
                        identifier + "#service-2",
                        "LinkedDomains",
                        "https://test2.identity.com"
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateVerificationMethodEvent(
                        identifier + "#key-1",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key1.publicKey
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateVerificationRelationshipEvent(
                        identifier + "#key-2",
                        "capabilityDelegation",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key2.publicKey
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateVerificationRelationshipEvent(
                        identifier + "#key-3",
                        "authentication",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key3.publicKey
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.UPDATE,
                    identifier,
                    new HcsDidCreateServiceEvent(
                        identifier + "#service-1",
                        "LinkedDomains",
                        "https://new.test.identity.com"
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.UPDATE,
                    identifier,
                    new HcsDidCreateVerificationMethodEvent(
                        identifier + "#key-1",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key4.publicKey
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.UPDATE,
                    identifier,
                    new HcsDidCreateVerificationRelationshipEvent(
                        identifier + "#key-2",
                        "capabilityDelegation",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key5.publicKey
                    )
                ),
            ];
            const doc = new DidDocument(identifier, messages);

            expect(doc.toJsonTree()).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${identifier}#did-root-key`],
                authentication: [`${identifier}#did-root-key`, `${identifier}#key-3`],
                capabilityDelegation: [`${identifier}#key-2`],
                id: identifier,
                service: [
                    {
                        id: `${identifier}#service-1`,
                        serviceEndpoint: "https://new.test.identity.com",
                        type: "LinkedDomains",
                    },
                    {
                        id: `${identifier}#service-2`,
                        serviceEndpoint: "https://test2.identity.com",
                        type: "LinkedDomains",
                    },
                ],
                verificationMethod: [
                    {
                        controller: identifier,
                        id: `${identifier}#did-root-key`,
                        publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: identifier,
                        id: `${identifier}#key-1`,
                        publicKeyMultibase: Hashing.multibase.encode(key4.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: identifier,
                        id: `${identifier}#key-2`,
                        publicKeyMultibase: Hashing.multibase.encode(key5.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: identifier,
                        id: `${identifier}#key-3`,
                        publicKeyMultibase: Hashing.multibase.encode(key3.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });
            expect(doc.getCreated()).toBeTruthy();
            expect(doc.getUpdated()).toBeTruthy();
            expect(doc.getDeactivated()).toEqual(false);
            expect(doc.getVersionId()).toBeTruthy();
        });

        it("successfully handles revoke service, verificationMethod and verificationRelationship events", () => {
            const key1 = PrivateKey.generate();
            const key2 = PrivateKey.generate();
            const key3 = PrivateKey.generate();

            const messages = [
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateDidOwnerEvent(identifier + "#did-root-key", identifier, privateKey.publicKey)
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateServiceEvent(
                        identifier + "#service-1",
                        "LinkedDomains",
                        "https://test.identity.com"
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateServiceEvent(
                        identifier + "#service-2",
                        "LinkedDomains",
                        "https://test2.identity.com"
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateVerificationMethodEvent(
                        identifier + "#key-1",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key1.publicKey
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateVerificationRelationshipEvent(
                        identifier + "#key-2",
                        "capabilityDelegation",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key2.publicKey
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.CREATE,
                    identifier,
                    new HcsDidCreateVerificationRelationshipEvent(
                        identifier + "#key-3",
                        "authentication",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key3.publicKey
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.REVOKE,
                    identifier,
                    new HcsDidCreateServiceEvent(
                        identifier + "#service-1",
                        "LinkedDomains",
                        "https://test.identity.com"
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.REVOKE,
                    identifier,
                    new HcsDidCreateVerificationMethodEvent(
                        identifier + "#key-1",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key1.publicKey
                    )
                ),
                new HcsDidMessage(
                    DidMethodOperation.REVOKE,
                    identifier,
                    new HcsDidCreateVerificationRelationshipEvent(
                        identifier + "#key-2",
                        "capabilityDelegation",
                        "Ed25519VerificationKey2018",
                        identifier,
                        key2.publicKey
                    )
                ),
            ];
            const doc = new DidDocument(identifier, messages);

            expect(doc.toJsonTree()).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${identifier}#did-root-key`],
                authentication: [`${identifier}#did-root-key`, `${identifier}#key-3`],
                id: identifier,
                service: [
                    {
                        id: `${identifier}#service-2`,
                        serviceEndpoint: "https://test2.identity.com",
                        type: "LinkedDomains",
                    },
                ],
                verificationMethod: [
                    {
                        controller: identifier,
                        id: `${identifier}#did-root-key`,
                        publicKeyMultibase: "zAEExD23v9wrEUVHKvb7tiJmAMGCqHoxW8yqWNyFw3SXC",
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: identifier,
                        id: `${identifier}#key-3`,
                        publicKeyMultibase: Hashing.multibase.encode(key3.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });
            expect(doc.getCreated()).toBeTruthy();
            expect(doc.getUpdated()).toBeTruthy();
            expect(doc.getDeactivated()).toEqual(false);
            expect(doc.getVersionId()).toBeTruthy();
        });
    });
});
