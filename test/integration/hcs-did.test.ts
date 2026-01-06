import { AccountId, Client, PrivateKey } from "@hashgraph/sdk";
import { DidError, Hashing, HcsDid } from "../../dist";
import { delayUntil, readTopicMessages } from "../utils";

const TOPIC_REGEXP = /^0\.0\.[0-9]{3,}/;

const OPERATOR_ID = <string>process.env.OPERATOR_ID;
const OPERATOR_KEY = <string>process.env.OPERATOR_KEY;

const WAIT_BEFORE_RESOLVE_DID_FOR = parseInt(<string>process.env.WAIT_BEFORE_RESOLVE_DID_FOR);

describe("HcsDid", () => {
    let client;

    beforeEach(async () => {
        const operatorId = AccountId.fromString(OPERATOR_ID);
        const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
        client = Client.forTestnet({ scheduleNetworkUpdate: false });
        client.setOperator(operatorId, operatorKey);
    });

    afterEach(() => {
        client.close();
    });

    describe("#register", () => {
        it("throws error if DID is already registered", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                const didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod?.length === 1;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            let error;
            try {
                await did.register();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("DID is already registered");
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            let error;
            try {
                await did.register();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("creates new DID by registering a topic and submitting first message", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            const result = await did.register();

            expect(result).toEqual(did);

            expect(did.getTopicId().toString()).toMatch(TOPIC_REGEXP);
            expect(did.getIdentifier()).toEqual(
                `did:hedera:testnet:${Hashing.multibase.encode(privateKey.publicKey.toBytes())}_${did
                    .getTopicId()
                    .toString()}`
            );
            expect(did.getPrivateKey()).toEqual(privateKey);
            expect(did.getClient()).toEqual(client);
            expect(did.getNetwork()).toEqual("testnet");

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                const didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod?.length === 1;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            const messages = await readTopicMessages(did.getTopicId(), client);

            expect(messages.length).toEqual(1);
        });

        it("deletes DID document and registers it again without creating a new topic", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();
            const topicId = did.getTopicId();

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                const didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod?.length === 1;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            let messages = await readTopicMessages(did.getTopicId(), client);
            expect(messages.length).toEqual(1);

            await did.delete();
            expect(did.getTopicId()).toEqual(topicId);

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                const didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod?.length === 0;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            messages = await readTopicMessages(did.getTopicId(), client);
            expect(messages.length).toEqual(2);

            await did.register();
            expect(did.getTopicId()).toEqual(topicId);

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                const didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod?.length === 1;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            messages = await readTopicMessages(did.getTopicId(), client);
            expect(messages.length).toEqual(3);
        });
    });

    describe("#resolve", () => {
        it("throws error about unregistered DID", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            let error;
            try {
                await did.resolve();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("DID is not registered");
        });

        it("throws error about missing Client parameter", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            let error;
            try {
                await did.resolve();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("successfully resolves just registered DID", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod?.length > 0;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });
        });
    });

    describe("#delete", () => {
        it("throws error if DID is not registered", async () => {
            const did = new HcsDid({ privateKey: PrivateKey.fromString(OPERATOR_KEY), client });
            let error;
            try {
                await did.delete();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("DID is not registered");
        });

        it("throws error if instance has no privateKey assigned", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier, client });
            let error;
            try {
                await did.delete();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("privateKey is missing");
        });

        it("throws error if instance has no client assigned", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier, privateKey: PrivateKey.fromString(OPERATOR_KEY) });
            let error;
            try {
                await did.delete();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("deletes the DID document", async () => {
            const didPrivateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey: didPrivateKey, client });

            await did.register();

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod?.length === 1;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(didPrivateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            await did.delete();

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod?.length === 0;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [],
                authentication: [],
                id: did.getIdentifier(),
                verificationMethod: [],
            });

            const messages = await readTopicMessages(did.getTopicId(), client);
            expect(messages.length).toEqual(2);
        });
    });

    describe("#changeOwner", () => {
        const docIdentifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.99999999";
        const newOwnerIdentifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";

        it("throws error that DID is not registered", async () => {
            const didPrivateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey: didPrivateKey, client: client });

            let error;
            try {
                await did.changeOwner({
                    controller: newOwnerIdentifier,
                    newPrivateKey: PrivateKey.generate(),
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("DID is not registered");
        });

        it("throws error that privateKey is missing", async () => {
            const did = new HcsDid({
                identifier: docIdentifier,
                client: client,
            });

            let error;
            try {
                await did.changeOwner({
                    controller: newOwnerIdentifier,
                    newPrivateKey: PrivateKey.generate(),
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("privateKey is missing");
        });

        it("throws error that Client configuration is missing", async () => {
            const didPrivateKey = PrivateKey.generate();
            const did = new HcsDid({
                identifier: docIdentifier,
                privateKey: didPrivateKey,
            });

            let error;
            try {
                await did.changeOwner({
                    controller: newOwnerIdentifier,
                    newPrivateKey: PrivateKey.generate(),
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("throws error that newPrivateKey is missing", async () => {
            const didPrivateKey = PrivateKey.generate();
            const did = new HcsDid({
                identifier: docIdentifier,
                privateKey: didPrivateKey,
                client: client,
            });

            let error;
            try {
                await did.changeOwner({
                    controller: newOwnerIdentifier,
                    newPrivateKey: <any>null,
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("newPrivateKey is missing");
        });

        it("changes the owner of the document", async () => {
            const didPrivateKey = PrivateKey.generate();
            const newDidPrivateKey = PrivateKey.generate();
            const did = new HcsDid({
                privateKey: didPrivateKey,
                client: client,
            });

            await did.register();

            await did.changeOwner({
                controller: newOwnerIdentifier,
                newPrivateKey: newDidPrivateKey,
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.controller === newOwnerIdentifier;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                controller: newOwnerIdentifier,
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: newOwnerIdentifier,
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(newDidPrivateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            const messages = await readTopicMessages(did.getTopicId(), client);
            expect(messages.length).toEqual(2);
        });
    });

    describe("Add Update and Revoke Service meta-information", () => {
        it("throws error if privatekey is missing", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            let error;
            try {
                await did.addService(<any>{ id: null, type: null, serviceEndpoint: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("privateKey is missing");
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            let error;
            try {
                await did.addService(<any>{ id: null, type: null, serviceEndpoint: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("throws error if Service arguments are missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            let error;
            try {
                await did.addService(<any>{ id: null, type: null, serviceEndpoint: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Services args are missing");
        });

        it("throws error if event id is not valid", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            let error;
            try {
                await did.register();
                await did.addService({
                    id: did.getIdentifier() + "#invalid-1",
                    type: "LinkedDomains",
                    serviceEndpoint: "https://example.com/vcs",
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Event ID is invalid. Expected format: {did}#service-{integer}");
        });

        it("publish a new Service message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();
            await did.addService({
                id: did.getIdentifier() + "#service-1",
                type: "LinkedDomains",
                serviceEndpoint: "https://example.com/vcs",
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.service?.length === 1;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
                service: [
                    {
                        id: `${did.getIdentifier()}#service-1`,
                        serviceEndpoint: "https://example.com/vcs",
                        type: "LinkedDomains",
                    },
                ],
            });

            // DIDOwner and Service event
            expect(did.getMessages().length).toEqual(2);
        });

        it("publish an update Service message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();
            await did.addService({
                id: did.getIdentifier() + "#service-1",
                type: "LinkedDomains",
                serviceEndpoint: "https://example.com/vcs",
            });
            await did.updateService({
                id: did.getIdentifier() + "#service-1",
                type: "LinkedDomains",
                serviceEndpoint: "https://example.com/did",
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.service[0]?.serviceEndpoint === "https://example.com/did";
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
                service: [
                    {
                        id: `${did.getIdentifier()}#service-1`,
                        serviceEndpoint: "https://example.com/did",
                        type: "LinkedDomains",
                    },
                ],
            });

            expect(did.getMessages().length).toEqual(3);
        });

        it("publish a revoke Service message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();
            await did.addService({
                id: did.getIdentifier() + "#service-1",
                type: "LinkedDomains",
                serviceEndpoint: "https://example.com/vcs",
            });
            await did.revokeService({
                id: did.getIdentifier() + "#service-1",
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod === 1 && !didDocument?.service;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            expect(did.getMessages().length).toEqual(3);
        });

        it("revoke and re-add Service with same service-ID and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();
            await did.addService({
                id: did.getIdentifier() + "#service-1",
                type: "LinkedDomains",
                serviceEndpoint: "https://example.com/vcs",
            });
            await did.revokeService({
                id: did.getIdentifier() + "#service-1",
            });

            await did.addService({
                id: did.getIdentifier() + "#service-1",
                type: "LinkedDomains",
                serviceEndpoint: "https://meeco.me/vijay",
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.service?.length === 1;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
                service: [
                    {
                        id: `${did.getIdentifier()}#service-1`,
                        serviceEndpoint: "https://meeco.me/vijay",
                        type: "LinkedDomains",
                    },
                ],
            });

            expect(did.getMessages().length).toEqual(4);
        });
    });

    describe("Add Update and Revoke VerificationMethod meta-information", () => {
        it("throws error if privatekey is missing", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            let error;
            try {
                await did.addVerificationMethod(<any>{ id: null, type: null, controller: null, publicKey: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("privateKey is missing");
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            let error;
            try {
                await did.addVerificationMethod(<any>{ id: null, type: null, controller: null, publicKey: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("throws error if Verification Method arguments are missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            let error;
            try {
                await did.addVerificationMethod(<any>{ id: null, type: null, controller: null, publicKey: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Method args are missing");
        });

        it("publish a new VerificationMethod message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            //new verification DID and publickey
            const newVerificationDid =
                "did:hedera:testnet:z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb");

            await did.register();
            await did.addVerificationMethod({
                id: newVerificationDid,
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod?.length === 2;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            console.log(`${did.getIdentifier()}`);
            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: did.getIdentifier(),
                        id: newVerificationDid,
                        publicKeyBase58: Hashing.base58.encode(publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            // DIDOwner and VerificationMethod event
            expect(did.getMessages().length).toEqual(2);
        });

        it("publish an update VerificationMethod message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            //new verification DID and publickey
            const newVerificationDid =
                "did:hedera:testnet:z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb");
            const updatePublicKey = HcsDid.stringToPublicKey("zAvU2AEh8ybRqNwHAM3CjbkjYaYHpt9oA1uugW9EVTg6P");

            await did.register();
            await did.addVerificationMethod({
                id: newVerificationDid,
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });
            await did.updateVerificationMethod({
                id: newVerificationDid,
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey: updatePublicKey,
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return (
                    didDocument?.verificationMethod[1]?.publicKeyBase58 ===
                    Hashing.base58.encode(updatePublicKey.toBytes())
                );
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            console.log(`${did.getIdentifier()}`);
            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: did.getIdentifier(),
                        id: newVerificationDid,
                        publicKeyBase58: Hashing.base58.encode(updatePublicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            // DIDOwner and VerificationMethod event
            expect(did.getMessages().length).toEqual(3);
        });
        it("publish a revoke VerificationMethod message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            //new verification DID and publickey
            const newVerificationDid =
                "did:hedera:testnet:z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb");

            await did.register();
            await did.addVerificationMethod({
                id: newVerificationDid,
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });
            await did.revokeVerificationMethod({
                id: newVerificationDid,
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.verificationMethod?.length === 1;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            console.log(`${did.getIdentifier()}`);
            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            // DIDOwner and VerificationMethod event
            expect(did.getMessages().length).toEqual(3);
        });
    });

    describe("Add Update and Revoke VerificationMethod Relationship meta-information", () => {
        it("throws error if privatekey is missing", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            let error;
            try {
                await did.addVerificationRelationship(<any>{
                    id: null,
                    relationshipType: null,
                    type: null,
                    controller: null,
                    publicKey: null,
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("privateKey is missing");
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            let error;
            try {
                await did.addVerificationRelationship(<any>{
                    id: null,
                    relationshipType: null,
                    type: null,
                    controller: null,
                    publicKey: null,
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("throws error if Verification Relationship arguments are missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            let error;
            try {
                await did.addVerificationRelationship(<any>{
                    id: null,
                    relationshipType: null,
                    type: null,
                    controller: null,
                    publicKey: null,
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(DidError);
            expect(error.message).toEqual("Validation failed. Verification Relationship args are missing");
        });

        it("publish a new VerificationRelationship message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            //new verification DID and publickey
            const newVerificationDid =
                "did:hedera:testnet:z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb");

            await (
                await did.register()
            ).addVerificationRelationship({
                id: newVerificationDid,
                relationshipType: "authentication",
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.authentication?.length === 2;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`, `${newVerificationDid}`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: did.getIdentifier(),
                        id: newVerificationDid,
                        publicKeyBase58: Hashing.base58.encode(publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            // DIDOwner and VerificationMethod event
            expect(did.getMessages().length).toEqual(2);
        });

        it("publish an update VerificationRelationship message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            const pk = PrivateKey.generate();
            console.log(Hashing.multibase.encode(pk.publicKey.toBytes()));

            // new verification DID and publickey
            const newVerificationDid =
                "did:hedera:testnet:z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb_0.0.29617801#key-1";

            const publicKey = HcsDid.stringToPublicKey("z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb");
            const updatePublicKey = HcsDid.stringToPublicKey("zAvU2AEh8ybRqNwHAM3CjbkjYaYHpt9oA1uugW9EVTg6P");

            await did.register();
            await did.addVerificationRelationship({
                id: newVerificationDid,
                relationshipType: "authentication",
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });
            await did.updateVerificationRelationship({
                id: newVerificationDid,
                relationshipType: "authentication",
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey: updatePublicKey,
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return (
                    didDocument?.verificationMethod[1]?.publicKeyBase58 ===
                    Hashing.base58.encode(updatePublicKey.toBytes())
                );
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`, `${newVerificationDid}`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: did.getIdentifier(),
                        id: newVerificationDid,
                        publicKeyBase58: Hashing.base58.encode(updatePublicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            // DIDOwner and VerificationMethod event
            expect(did.getMessages().length).toEqual(3);
        });

        it("publish a revoke VerificationRelationship message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            //new verification DID and publickey
            const newVerificationDid =
                "did:hedera:testnet:z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb");

            await did.register();
            await did.addVerificationRelationship({
                id: newVerificationDid,
                relationshipType: "authentication",
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });
            await did.revokeVerificationRelationship({
                id: newVerificationDid,
                relationshipType: "authentication",
            });

            let didDocument: any;

            await delayUntil(async () => {
                const didDoc = await did.resolve();
                didDocument = didDoc.toJsonTree();
                return didDocument?.authentication?.length === 1;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            // DIDOwner and VerificationMethod event
            expect(did.getMessages().length).toEqual(3);
        });
    });
});

/**
 * Test Helpers
 */
