import { AccountId, Client, PrivateKey, Timestamp, TopicMessageQuery } from "@hashgraph/sdk";
import { Hashing, HcsDid } from "../../dist";

const TOPIC_REGEXP = /^0\.0\.[0-9]{8,}/;
const OPERATOR_ID = "";
const OPERATOR_KEY = "";
// testnet, previewnet, mainnet
const NETWORK = "testnet";

// hedera
const MIRROR_PROVIDER = ["hcs." + NETWORK + ".mirrornode.hedera.com:5600"];

describe("HcsDid", () => {
    describe("#constructor", () => {
        it("throws error because of missing identifier and privateKey", () => {
            expect(() => new HcsDid({})).toThrowError(new Error("identifier and privateKey cannot both be empty"));
        });

        it("successfuly builds HcsDid with private key only", () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            expect(did.getIdentifier()).toEqual(undefined);
            expect(did.getPrivateKey()).toEqual(privateKey);
            expect(did.getClient()).toEqual(undefined);
            expect(did.getTopicId()).toEqual(undefined);
            expect(did.getNetwork()).toEqual(undefined);
        });

        it("successfuly builds HcsDid with identifier only", () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            expect(did.getIdentifier()).toEqual(identifier);
            expect(did.getPrivateKey()).toEqual(undefined);
            expect(did.getClient()).toEqual(undefined);
            expect(did.getTopicId().toString()).toEqual("0.0.29613327");
            expect(did.getNetwork()).toEqual("testnet");
        });

        it("throws error if passed identifer is invalid", () => {
            [
                null,
                "invalidDid1",
                "did:invalid",
                "did:invalidMethod:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak_0.0.24352",
                "did:hedera:invalidNetwork:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak_0.0.24352",
                "did:hedera:testnet:invalidAddress_0.0.24352_1.5.23462345",
                "did:hedera:testnet_1.5.23462345",
                "did:hedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak:unknown:parameter=1_missing",
                "did:hedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak_0.0.1=1",
                "did:hedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak:hedera:testnet:fid",
                "did:hedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak:unknownPart_0.0.1",
                "did:notHedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak_0.0.1",
            ].forEach((identifier) => {
                expect(() => {
                    new HcsDid({ identifier });
                }).toThrowError();
            });
        });

        it("accepts client parameter", () => {
            const client = Client.forTestnet();
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier, client });

            expect(did.getIdentifier()).toEqual(identifier);
            expect(did.getPrivateKey()).toEqual(undefined);
            expect(did.getClient()).toEqual(client);
            expect(did.getTopicId().toString()).toEqual("0.0.29613327");
            expect(did.getNetwork()).toEqual("testnet");
        });
    });

    describe("#register", () => {
        let client;

        beforeAll(() => {
            const operatorId = AccountId.fromString(OPERATOR_ID);
            const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
            client = Client.forTestnet();
            client.setMirrorNetwork(MIRROR_PROVIDER);
            client.setOperator(operatorId, operatorKey);
        });

        it("throws error if DID is already registered", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            try {
                await did.register();
            } catch (err) {
                expect(err).toBeInstanceOf(Error);

                expect(err.message).toEqual("DID is already registered");
            }
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            try {
                await did.register();
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("Client configuration is missing");
            }
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

            const messages = await readtTopicMessages(did.getTopicId(), client);

            expect(messages.length).toEqual(1);
        });
    });

    describe("#resolve", () => {
        let client;

        beforeAll(() => {
            const operatorId = AccountId.fromString(OPERATOR_ID);
            const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
            client = Client.forTestnet();
            client.setMirrorNetwork(MIRROR_PROVIDER);
            client.setOperator(operatorId, operatorKey);
        });

        it("throws error about unregistered DID", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            try {
                await did.resolve();
            } catch (err) {
                expect(err).toBeInstanceOf(Error);

                expect(err.message).toEqual("DID is not registered");
            }
        });

        it("throws error about missing Client parameter", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            try {
                await did.resolve();
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("Client configuration is missing");
            }
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

    describe("Add Update and Revoke Service meta-information", () => {
        let client;

        beforeAll(async () => {
            const operatorId = AccountId.fromString(OPERATOR_ID);
            const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
            client = Client.forTestnet();
            client.setMirrorNetwork(MIRROR_PROVIDER);
            client.setOperator(operatorId, operatorKey);
        });

        it("throws error if privatekey is missing", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            try {
                await did.addService(undefined);
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("privateKey is missing");
            }
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            try {
                await did.addService(undefined);
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("Client configuration is missing");
            }
        });

        it("throws error if Service arguments are missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            try {
                await did.addService(undefined);
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("Validation failed. Services args are missing");
            }
        });

        it("thorws error if event id is not valid", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            try {
                await did.register();
                await did.addService({
                    id: did.getIdentifier() + "#invalid-1",
                    type: "LinkedDomains",
                    serviceEndpoint: "https://example.com/vcs",
                });
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("Event ID is invalid. Expected format: {did}#{key|service}-{integer}");
            }
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
    });

    describe("Add Update and Revoke VerificationMethod meta-information", () => {
        let client;

        beforeAll(async () => {
            const operatorId = AccountId.fromString(OPERATOR_ID);
            const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
            client = Client.forTestnet();
            client.setMirrorNetwork(MIRROR_PROVIDER);
            client.setOperator(operatorId, operatorKey);
        });

        it("throws error if privatekey is missing", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            try {
                await did.addVerificaitonMethod(undefined);
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("privateKey is missing");
            }
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            try {
                await did.addVerificaitonMethod(undefined);
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("Client configuration is missing");
            }
        });

        it("throws error if Verification Method arguments are missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            try {
                await did.addVerificaitonMethod(undefined);
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("Validation failed. Verification Method args are missing");
            }
        });

        it("publish a new VerificationMethod message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            //new verificaiton DID and publickey
            const newVerificaitonDid =
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");

            await did.register();
            await did.addVerificaitonMethod({
                id: newVerificaitonDid,
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
                        id: newVerificaitonDid,
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

            //new verificaiton DID and publickey
            const newVerificaitonDid =
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");
            const updatePublicKey = HcsDid.stringToPublicKey("z6MkhHbhBBLdKGiGnHPvrrH9GL7rgw6egpZiLgvQ9n7pHt1P");

            await did.register();
            await did.addVerificaitonMethod({
                id: newVerificaitonDid,
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });
            await did.updateVerificaitonMethod({
                id: newVerificaitonDid,
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
                        id: newVerificaitonDid,
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

            //new verificaiton DID and publickey
            const newVerificaitonDid =
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");

            await did.register();
            await did.addVerificaitonMethod({
                id: newVerificaitonDid,
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });
            await did.revokeVerificaitonMethod({
                id: newVerificaitonDid,
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
        let client;

        beforeAll(async () => {
            const operatorId = AccountId.fromString(OPERATOR_ID);
            const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
            client = Client.forTestnet();
            client.setMirrorNetwork(MIRROR_PROVIDER);
            client.setOperator(operatorId, operatorKey);
        });

        it("throws error if privatekey is missing", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            try {
                await did.addVerificaitonMethod(undefined);
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("privateKey is missing");
            }
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            try {
                await did.addVerificaitonMethod(undefined);
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("Client configuration is missing");
            }
        });

        it("throws error if Verification Relationship arguments are missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            try {
                await did.addVerificaitonRelationship(undefined);
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual("Verification Relationship args are missing");
            }
        });

        it("publish a new VerificationRelationship message and verify DID Document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            //new verificaiton DID and publickey
            const newVerificaitonDid =
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");

            await (
                await did.register()
            ).addVerificaitonRelationship({
                id: newVerificaitonDid,
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
                authentication: [`${did.getIdentifier()}#did-root-key`, `${newVerificaitonDid}`],
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
                        id: newVerificaitonDid,
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

            //new verificaiton DID and publickey
            const newVerificaitonDid =
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");
            const updatePublicKey = HcsDid.stringToPublicKey("z6MkhHbhBBLdKGiGnHPvrrH9GL7rgw6egpZiLgvQ9n7pHt1P");

            await did.register();
            await did.addVerificaitonRelationship({
                id: newVerificaitonDid,
                relationshipType: "authentication",
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });
            await did.updateVerificaitonRelationship({
                id: newVerificaitonDid,
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
                authentication: [`${did.getIdentifier()}#did-root-key`, `${newVerificaitonDid}`],
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
                        id: newVerificaitonDid,
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

            //new verificaiton DID and publickey
            const newVerificaitonDid =
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
            const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");

            await did.register();
            await did.addVerificaitonRelationship({
                id: newVerificaitonDid,
                relationshipType: "authentication",
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKey,
            });
            await did.revokeVerificaitonRelationship({
                id: newVerificaitonDid,
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

async function readtTopicMessages(topicId, client, timeout = null) {
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
