const { AccountId, PrivateKey, Client, Timestamp, TopicMessageQuery } = require("@hashgraph/sdk");
const { OPERATOR_KEY, OPERATOR_ID, NETWORK } = require("../variables");
const { HcsDid, Hashing } = require("../../dist");

const { assert } = require("chai");

const TOPIC_REGEXP = /^0\.0\.[0-9]{8,}/;

describe("HcsDid", function () {
    describe("#constructor", () => {
        it("throws error because of missing identifier and privateKey", () => {
            assert.throw(() => {
                new HcsDid({});
            });
        });

        it("successfuly builds HcsDid with private key only", () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            assert.equal(did.getIdentifier(), null);
            assert.equal(did.getPrivateKey(), privateKey);
            assert.equal(did.getClient(), null);
            assert.equal(did.getTopicId(), null);
            assert.equal(did.getNetwork(), null);
        });

        it("successfuly builds HcsDid with identifier only", () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            assert.equal(did.getIdentifier(), identifier);
            assert.equal(did.getPrivateKey(), null);
            assert.equal(did.getClient(), null);
            assert.equal(did.getTopicId(), "0.0.29613327");
            assert.equal(did.getNetwork(), "testnet");
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
                assert.throw(() => {
                    new HcsDid({ identifier });
                });
            });
        });

        it("accepts client parameter", () => {
            const client = Client.forTestnet();
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier, client });

            assert.equal(did.getIdentifier(), identifier);
            assert.equal(did.getPrivateKey(), null);
            assert.equal(did.getClient(), client);
            assert.equal(did.getTopicId(), "0.0.29613327");
            assert.equal(did.getNetwork(), "testnet");
        });
    });

    describe("#register", async () => {
        let client;

        before(async () => {
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
                assert.instanceOf(err, Error);
                assert.equal(err.message, "DID is already registered");
            }
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            try {
                await did.register();
            } catch (err) {
                assert.instanceOf(err, Error);
                assert.equal(err.message, "Client configuration is missing");
            }
        });

        it("creates new DID by registering a topic and submitting first message", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });
            const result = await did.register();

            assert.equal(result, did);
            assert.match(did.getTopicId().toString(), TOPIC_REGEXP);
            assert.equal(
                did.getIdentifier(),
                `did:hedera:testnet:${Hashing.multibase.encode(privateKey.publicKey.toBytes())}_${did
                    .getTopicId()
                    .toString()}`
            );
            assert.equal(did.getPrivateKey(), privateKey);
            assert.equal(did.getClient(), client);
            assert.equal(did.getNetwork(), "testnet");

            const messages = [];

            new TopicMessageQuery()
                .setTopicId(did.getTopicId())
                .setStartTime(new Timestamp(0, 0))
                .setEndTime(Timestamp.fromDate(new Date()))
                .subscribe(client, (msg) => {
                    messages.push(msg);
                });

            /**
             * Will have to change, let's just wait for 3s and assume all messages were read
             */
            await new Promise((resolve) => setTimeout(resolve, 3000));

            assert.equal(messages.length, 1);
        }).timeout(60000);
    });

    describe("#resolve", () => {
        let client;

        before(async () => {
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
                assert.instanceOf(err, Error);
                assert.equal(err.message, "DID is not registered");
            }
        });

        it("throws error about missing Client parameter", async () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            try {
                await did.resolve();
            } catch (err) {
                assert.instanceOf(err, Error);
                assert.equal(err.message, "Client configuration is missing");
            }
        });

        it("successfuly resolves just registered DID", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();

            const didDocument = (await did.resolve()).toJsonTree();

            assert.equal(didDocument["@context"], "https://www.w3.org/ns/did/v1");
            assert.equal(didDocument["id"], did.getIdentifier());
            assert.equal(didDocument["assertionMethod"].length, 1);
            assert.equal(didDocument["assertionMethod"][0], `${did.getIdentifier()}#did-root-key`);
            assert.equal(didDocument["authentication"].length, 1);
            assert.equal(didDocument["authentication"][0], `${did.getIdentifier()}#did-root-key`);
            assert.equal(didDocument["verificationMethod"].length, 1);
            assert.deepEqual(didDocument["verificationMethod"][0], {
                id: `${did.getIdentifier()}#did-root-key`,
                type: "Ed25519VerificationKey2018",
                controller: did.getIdentifier(),
                publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
            });
        }).timeout(60000);
    });

    describe("#add-meta-information", async () => {
        let client;

        before(async () => {
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
                await did.addService({});
            } catch (err) {
                assert.instanceOf(err, Error);
                assert.equal(err.message, "privateKey is missing");
            }
        });

        it("throws error if client configuration is missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            try {
                await did.addService({});
            } catch (err) {
                assert.instanceOf(err, Error);
                assert.equal(err.message, "Client configuration is missing");
            }
        });

        it("throws error if Service arguments are missing", async () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey, client });

            try {
                await did.addService();
            } catch (err) {
                assert.instanceOf(err, Error);
                assert.equal(err.message, "Service args are missing");
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

            const messages = [];

            new TopicMessageQuery()
                .setTopicId(did.getTopicId())
                .setStartTime(new Timestamp(0, 0))
                .setEndTime(Timestamp.fromDate(new Date()))
                .subscribe(client, (msg) => {
                    messages.push(msg);
                });

            /**
             * wait for 3s and assume all messages were read
             */
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // DIDOwner and Service event
            assert.equal(messages.length, 2);
        }).timeout(60000);
    });
});
