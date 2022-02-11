import { AccountId, Client, PrivateKey, Timestamp, TopicMessageQuery } from "@hashgraph/sdk";
import { Hashing, HcsDid } from "../../dist";

const TOPIC_REGEXP = /^0\.0\.[0-9]{8,}/;

const OPERATOR_ID = process.env.OPERATOR_ID;
const OPERATOR_KEY = process.env.OPERATOR_KEY;
// testnet, previewnet, mainnet
const NETWORK = "testnet";

// hedera
const MIRROR_PROVIDER = ["hcs." + NETWORK + ".mirrornode.hedera.com:5600"];

describe("HcsDid", () => {
    let client;

    beforeAll(async () => {
        const operatorId = AccountId.fromString(OPERATOR_ID);
        const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
        client = Client.forTestnet();
        client.setMirrorNetwork(MIRROR_PROVIDER);
        client.setOperator(operatorId, operatorKey);
    });

    describe("#register", () => {
        it("throws error if DID is already registered", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();

            let error = null;
            try {
                await did.register();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("DID is already registered");
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            let error = null;
            try {
                await did.register();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
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

            const messages = await readTopicMessages(did.getTopicId(), client);

            expect(messages.length).toEqual(1);
        });

        it("deletes DID document and registers it again without creating a new topic", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();
            const topicId = did.getTopicId();

            let messages = await readTopicMessages(did.getTopicId(), client);
            expect(messages.length).toEqual(1);

            await did.delete();
            expect(did.getTopicId()).toEqual(topicId);

            messages = await readTopicMessages(did.getTopicId(), client);
            expect(messages.length).toEqual(2);

            await did.register();
            expect(did.getTopicId()).toEqual(topicId);

            messages = await readTopicMessages(did.getTopicId(), client);
            expect(messages.length).toEqual(3);
        });
    });

    describe("#resolve", () => {
        it("throws error about unregistered DID", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            let error = null;
            try {
                await did.resolve();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("DID is not registered");
        });

        it("throws error about missing Client parameter", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            let error = null;
            try {
                await did.resolve();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("successfuly resolves just registered DID", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });
        });
    });

    describe("#delete", () => {
        it("throws error if DID is not registered", async () => {
            const did = new HcsDid({ privateKey: PrivateKey.fromString(OPERATOR_KEY), client });
            let error = null;
            try {
                await did.delete();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("DID is not registered");
        });

        it("throws error if instance has no privateKey assigned", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier, client });
            let error = null;
            try {
                await did.delete();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("privateKey is missing");
        });

        it("throws error if instance has no client assigned", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier, privateKey: PrivateKey.fromString(OPERATOR_KEY) });
            let error = null;
            try {
                await did.delete();
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("deletes the DID document", async () => {
            const didPrivateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey: didPrivateKey, client });

            await did.register();

            let didJSON = (await did.resolve()).toJsonTree();
            expect(didJSON).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(didPrivateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            await did.delete();

            didJSON = (await did.resolve()).toJsonTree();
            expect(didJSON).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [],
                authentication: [],
                id: did.getIdentifier(),
                verificationMethod: [],
            });

            let messages = await readTopicMessages(did.getTopicId(), client);
            expect(messages.length).toEqual(2);
        });
    });

    describe("#changeOwner", () => {
        const docIdentifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.99999999";
        const newOwnerIdentifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";

        it("throws error that DID is not registered", async () => {
            const didPrivateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey: didPrivateKey, client: client });

            let error = null;
            try {
                await did.changeOwner({
                    id: docIdentifier,
                    controller: newOwnerIdentifier,
                    newPrivateKey: PrivateKey.generate(),
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("DID is not registered");
        });

        it("throws error that privateKey is missing", async () => {
            const did = new HcsDid({
                identifier: docIdentifier,
                client: client,
            });

            let error = null;
            try {
                await did.changeOwner({
                    id: docIdentifier,
                    controller: newOwnerIdentifier,
                    newPrivateKey: PrivateKey.generate(),
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("privateKey is missing");
        });

        it("throws error that Client configuration is missing", async () => {
            const didPrivateKey = PrivateKey.generate();
            const did = new HcsDid({
                identifier: docIdentifier,
                privateKey: didPrivateKey,
            });

            let error = null;
            try {
                await did.changeOwner({
                    id: docIdentifier,
                    controller: newOwnerIdentifier,
                    newPrivateKey: PrivateKey.generate(),
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("throws error that newPrivateKey is missing", async () => {
            const didPrivateKey = PrivateKey.generate();
            const did = new HcsDid({
                identifier: docIdentifier,
                privateKey: didPrivateKey,
                client: client,
            });

            let error = null;
            try {
                await did.changeOwner({
                    id: docIdentifier,
                    controller: newOwnerIdentifier,
                    newPrivateKey: null,
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
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
                id: did.getIdentifier(),
                controller: newOwnerIdentifier,
                newPrivateKey: newDidPrivateKey,
            });

            const doc = (await did.resolve()).toJsonTree();

            expect(doc).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                controller: newOwnerIdentifier,
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: newOwnerIdentifier,
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(newDidPrivateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                ],
            });

            let messages = await readTopicMessages(did.getTopicId(), client);
            expect(messages.length).toEqual(2);
        });
    });

    describe("Add Update and Revoke Service meta-information", () => {
        it("throws error if privatekey is missing", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            let error = null;
            try {
                await did.addService({ id: null, type: null, serviceEndpoint: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("privateKey is missing");
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            let error = null;
            try {
                await did.addService({ id: null, type: null, serviceEndpoint: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("throws error if Service arguments are missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            let error = null;
            try {
                await did.addService({ id: null, type: null, serviceEndpoint: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Validation failed. Services args are missing");
        });

        it("throws error if event id is not valid", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            let error = null;
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
            expect(error).toBeInstanceOf(Error);
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

            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
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

            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
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

            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
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

            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
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

            let error = null;
            try {
                await did.addVerificationMethod({ id: null, type: null, controller: null, publicKey: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("privateKey is missing");
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            let error = null;
            try {
                await did.addVerificationMethod({ id: null, type: null, controller: null, publicKey: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("throws error if Verification Method arguments are missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            let error = null;
            try {
                await did.addVerificationMethod({ id: null, type: null, controller: null, publicKey: null });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Validation failed. Verification Method args are missing");
        });

        it("publish a new VerificationMethod message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            //new verification DID and publickey
            const newVerificationDid =
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");

            await did.register();
            await did.addVerificationMethod({
                id: newVerificationDid,
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });

            /**
             *  wait for 9s so DIDOwner and VerificationMethod event to be propogated to mirror node
             */
            await new Promise((resolve) => setTimeout(resolve, 9000));

            console.log(`${did.getIdentifier()}`);
            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: did.getIdentifier(),
                        id: newVerificationDid,
                        publicKeyMultibase: Hashing.multibase.encode(publicKey.toBytes()),
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
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");
            const updatePublicKey = HcsDid.stringToPublicKey("z6MkhHbhBBLdKGiGnHPvrrH9GL7rgw6egpZiLgvQ9n7pHt1P");

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

            /**
             *  wait for 9s so DIDOwner and VerificationMethod event to be propogated to mirror node
             */
            await new Promise((resolve) => setTimeout(resolve, 9000));

            console.log(`${did.getIdentifier()}`);
            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: did.getIdentifier(),
                        id: newVerificationDid,
                        publicKeyMultibase: Hashing.multibase.encode(updatePublicKey.toBytes()),
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
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");

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

            /**
             *  wait for 9s so DIDOwner and VerificationMethod event to be propogated to mirror node
             */
            await new Promise((resolve) => setTimeout(resolve, 9000));

            console.log(`${did.getIdentifier()}`);
            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
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

            let error = null;
            try {
                await did.addVerificationRelationship({
                    id: null,
                    relationshipType: null,
                    type: null,
                    controller: null,
                    publicKey: null,
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("privateKey is missing");
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            let error = null;
            try {
                await did.addVerificationRelationship({
                    id: null,
                    relationshipType: null,
                    type: null,
                    controller: null,
                    publicKey: null,
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Client configuration is missing");
        });

        it("throws error if Verification Relationship arguments are missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            let error = null;
            try {
                await did.addVerificationRelationship({
                    id: null,
                    relationshipType: null,
                    type: null,
                    controller: null,
                    publicKey: null,
                });
            } catch (err) {
                error = err;
            }
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Validation failed. Verification Relationship args are missing");
        });

        it("publish a new VerificationRelationship message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            //new verification DID and publickey
            const newVerificationDid =
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");

            await (
                await did.register()
            ).addVerificationRelationship({
                id: newVerificationDid,
                relationshipType: "authentication",
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`, `${newVerificationDid}`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: did.getIdentifier(),
                        id: newVerificationDid,
                        publicKeyMultibase: Hashing.multibase.encode(publicKey.toBytes()),
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

            //new verification DID and publickey
            const newVerificationDid =
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");
            const updatePublicKey = HcsDid.stringToPublicKey("z6MkhHbhBBLdKGiGnHPvrrH9GL7rgw6egpZiLgvQ9n7pHt1P");

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

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`, `${newVerificationDid}`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
                        type: "Ed25519VerificationKey2018",
                    },
                    {
                        controller: did.getIdentifier(),
                        id: newVerificationDid,
                        publicKeyMultibase: Hashing.multibase.encode(updatePublicKey.toBytes()),
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
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");

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

            const didDoc = await did.resolve();
            const didDocument = didDoc.toJsonTree();

            expect(didDocument).toEqual({
                "@context": "https://www.w3.org/ns/did/v1",
                assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                authentication: [`${did.getIdentifier()}#did-root-key`],
                id: did.getIdentifier(),
                verificationMethod: [
                    {
                        controller: did.getIdentifier(),
                        id: `${did.getIdentifier()}#did-root-key`,
                        publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
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

async function readTopicMessages(topicId, client, timeout = null) {
    const messages = [];

    new TopicMessageQuery()
        .setTopicId(topicId)
        .setStartTime(new Timestamp(0, 0))
        .setEndTime(Timestamp.fromDate(new Date()))
        .subscribe(client, null, (msg) => {
            messages.push(msg);
        });

    /**
     * wait for READ_MESSAGES_TIMEOUT seconds and assume all messages were read
     */
    await new Promise((resolve) => setTimeout(resolve, timeout || 6000));

    return messages;
}
