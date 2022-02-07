import { AccountId, PrivateKey, Client, Timestamp, TopicMessageQuery } from "@hashgraph/sdk";

import { HcsDid, Hashing } from "../../../dist";

const TOPIC_REGEXP = /^0\.0\.[0-9]{8,}/;
const OPERATOR_ID = "0.0.12710106";
const OPERATOR_KEY = "302e020100300506032b657004220420bc45334a1313725653d3513fcc67edb15f76985f537ca567e2177b0be9906d49";
// testnet, previewnet, mainnet
const NETWORK = "testnet";

// hedera, kabuto (note kabuto not available on previewnet)
const MIRROR_PROVIDER = "hedera";

describe("HcsDid", function () {
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
            client.setMirrorNetwork(["hcs." + NETWORK + ".mirrornode.hedera.com:5600"]);
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

            /**
             * TODO: FIX ME
             */
            // const messages = await readtTopicMessages(did.getTopicId(), client);

            //  expect(messages.length).toEqual(1);
        });
    });

    describe("#resolve", () => {
        let client;

        beforeAll(() => {
            const operatorId = AccountId.fromString(OPERATOR_ID);
            const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
            client = Client.forTestnet();
            client.setMirrorNetwork(["hcs." + NETWORK + ".mirrornode.hedera.com:5600"]);
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

            const newLocal: any = await did.resolve();
            const didDocument = newLocal.toJsonTree();

            expect(didDocument["@context"]).toEqual("https://www.w3.org/ns/did/v1");
            expect(didDocument["id"]).toEqual(did.getIdentifier());
            expect(didDocument["assertionMethod"].length).toEqual(1);
            expect(didDocument["assertionMethod"][0]).toEqual(`${did.getIdentifier()}#did-root-key`);
            expect(didDocument["authentication"].length).toEqual(1);
            expect(didDocument["authentication"][0]).toEqual(`${did.getIdentifier()}#did-root-key`);
            expect(didDocument["verificationMethod"].length).toEqual(1);
            expect(didDocument["verificationMethod"][0]).toStrictEqual({
                id: `${did.getIdentifier()}#did-root-key`,
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
            });
        });
    });

    describe("Add Service meta-information", () => {
        let client;

        beforeAll(async () => {
            const operatorId = AccountId.fromString(OPERATOR_ID);
            const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
            client = Client.forTestnet();
            client.setMirrorNetwork(["hcs." + NETWORK + ".mirrornode.hedera.com:5600"]);
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

                expect(err.message).toEqual("Service args are missing");
            }
        });

        it("publish a new Service message", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });
            await (
                await did.register()
            ).addService({
                id: did.getIdentifier(),
                type: "LinkedDomains",
                serviceEndpoint: "https://test.meeco.me/vcs",
            });

            /**
             *  wait for 9s so didowner and service event to be propogated to mirror node
             */
            await new Promise((resolve) => setTimeout(resolve, 9000));

            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

            const messages = await readtTopicMessages(did.getTopicId(), client);

            // DIDOwner and Service event
            expect(messages.length).toEqual(2);
        });
    });

    // describe("Add VerificationMethod meta-information", async () => {
    //     let client;

    //     before(async () => {
    //         const operatorId = AccountId.fromString(OPERATOR_ID);
    //         const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
    //         client = Client.forTestnet();
    //         client.setMirrorNetwork(["hcs." + NETWORK + ".mirrornode.hedera.com:5600"]);
    //         client.setOperator(operatorId, operatorKey);
    //     });

    //     it("throws error if privatekey is missing", async () => {
    //         const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
    //         const did = new HcsDid({ identifier });

    //         try {
    //             await did.addVerificaitonMethod({});
    //         } catch (err) {
    //             assert.instanceOf(err, Error);
    //             assert.equal(err.message, "privateKey is missing");
    //         }
    //     });

    //     it("throws error if client configuration is missing", async () => {
    //         const privateKey = PrivateKey.generate();
    //         const did = new HcsDid({ privateKey });

    //         try {
    //             await did.addVerificaitonMethod({});
    //         } catch (err) {
    //             assert.instanceOf(err, Error);
    //             assert.equal(err.message, "Client configuration is missing");
    //         }
    //     });

    //     it("throws error if Verification Method arguments are missing", async () => {
    //         const privateKey = PrivateKey.generate();
    //         const did = new HcsDid({ privateKey, client });

    //         try {
    //             await did.addVerificaitonMethod();
    //         } catch (err) {
    //             assert.instanceOf(err, Error);
    //             assert.equal(err.message, "Verification Method args are missing");
    //         }
    //     });

    //     it("publish a new VerificationMethod message", async () => {
    //         const privateKey = PrivateKey.fromString(OPERATOR_KEY);
    //         const did = new HcsDid({ privateKey, client });

    //         //new verificaiton DID and publickey
    //         const newVerificaitonDid =
    //             "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#public-key-0";
    //         const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");

    //         await (
    //             await did.register()
    //         ).addVerificaitonMethod({
    //             id: newVerificaitonDid,
    //             type: "Ed25519VerificationKey2018",
    //             controller: did.getIdentifier(),
    //             publicKey,
    //         });

    //         /**
    //          *  wait for 9s so DIDOwner and VerificationMethod event to be propogated to mirror node
    //          */
    //         await new Promise((resolve) => setTimeout(resolve, 9000));

    //         console.log(`${did.getIdentifier()}`);
    //         console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

    //         const messages = await readtTopicMessages(did.getTopicId(), client);

    //         // DIDOwner and VerificationMethod event
    //         assert.equal(messages.length, 2);
    //     }).timeout(MINUTE_TIMEOUT_LIMIT);
    // });

    // describe("Add VerificationMethod Relationship meta-information", async () => {
    //     let client;

    //     before(async () => {
    //         const operatorId = AccountId.fromString(OPERATOR_ID);
    //         const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
    //         client = Client.forTestnet();
    //         client.setMirrorNetwork(["hcs." + NETWORK + ".mirrornode.hedera.com:5600"]);
    //         client.setOperator(operatorId, operatorKey);
    //     });

    //     it("throws error if privatekey is missing", async () => {
    //         const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
    //         const did = new HcsDid({ identifier });

    //         try {
    //             await did.addVerificaitonMethod({});
    //         } catch (err) {
    //             assert.instanceOf(err, Error);
    //             assert.equal(err.message, "privateKey is missing");
    //         }
    //     });

    //     it("throws error if client configuration is missing", async () => {
    //         const privateKey = PrivateKey.generate();
    //         const did = new HcsDid({ privateKey });

    //         try {
    //             await did.addVerificaitonMethod({});
    //         } catch (err) {
    //             assert.instanceOf(err, Error);
    //             assert.equal(err.message, "Client configuration is missing");
    //         }
    //     });

    //     it("throws error if Verification Relationship arguments are missing", async () => {
    //         const privateKey = PrivateKey.generate();
    //         const did = new HcsDid({ privateKey, client });

    //         try {
    //             await did.addVerificaitonRelationship();
    //         } catch (err) {
    //             assert.instanceOf(err, Error);
    //             assert.equal(err.message, "Verification Relationship args are missing");
    //         }
    //     });

    //     it("publish a new VerificationRelationship message", async () => {
    //         const privateKey = PrivateKey.fromString(OPERATOR_KEY);
    //         const did = new HcsDid({ privateKey, client });

    //         //new verificaiton DID and publickey
    //         const newVerificaitonDid =
    //             "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#delegate-key1";
    //         const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");

    //         await (
    //             await did.register()
    //         ).addVerificaitonRelationship({
    //             id: newVerificaitonDid,
    //             relationshipType: "authentication",
    //             type: "Ed25519VerificationKey2018",
    //             controller: did.getIdentifier(),
    //             publicKey,
    //         });

    //         /**
    //          *  wait for 9s so DIDOwner and VerificationMethod event to be propogated to mirror node
    //          */
    //         await new Promise((resolve) => setTimeout(resolve, 9000));

    //         console.log(`${did.getIdentifier()}`);
    //         console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);

    //         const messages = await readtTopicMessages(did.getTopicId(), client);

    //         // DIDOwner and VerificationMethod event
    //         assert.equal(messages.length, 2);
    //     }).timeout(MINUTE_TIMEOUT_LIMIT);
    // });
});

/**
 * Test Helpers
 */

async function readtTopicMessages(topicId, client) {
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
    await new Promise((resolve) => setTimeout(resolve, 60000));

    return messages;
}
