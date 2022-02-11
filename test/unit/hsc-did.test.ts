import { Client, PrivateKey } from "@hashgraph/sdk";
import { HcsDid } from "../../dist";

describe("HcsDid", () => {
    let client;

    beforeAll(async () => {
        client = Client.forTestnet();
    });
    describe("#constructor", () => {
        it("throws error because of missing identifier and privateKey", () => {
            expect(() => new HcsDid({})).toThrowError(new Error("identifier and privateKey cannot both be empty"));
        });

        it("successfully builds HcsDid with private key only", () => {
            const privateKey = PrivateKey.generate();
            const did = new HcsDid({ privateKey });

            expect(did.getIdentifier()).toEqual(undefined);
            expect(did.getPrivateKey()).toEqual(privateKey);
            expect(did.getClient()).toEqual(undefined);
            expect(did.getTopicId()).toEqual(undefined);
            expect(did.getNetwork()).toEqual(undefined);
        });

        it("successfully builds HcsDid with identifier only", () => {
            const identifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";
            const did = new HcsDid({ identifier });

            expect(did.getIdentifier()).toEqual(identifier);
            expect(did.getPrivateKey()).toEqual(undefined);
            expect(did.getClient()).toEqual(undefined);
            expect(did.getTopicId().toString()).toEqual("0.0.29613327");
            expect(did.getNetwork()).toEqual("testnet");
        });

        it("throws error if passed identifier is invalid", () => {
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
    describe("#parseIdentifier", () => {
        it("throws error if topicId missing", () => {
            let error = null;
            try {
                HcsDid.parseIdentifier("did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("DID string is invalid: topic ID is missing");
        });

        it("throws error if invalid prefix", () => {
            let error = null;
            try {
                HcsDid.parseIdentifier("abcd:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.1");
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("DID string is invalid: invalid prefix.");
        });

        it("throws error if invalid method name", () => {
            let error = null;
            try {
                HcsDid.parseIdentifier("did:hashgraph:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.1");
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("DID string is invalid: invalid method name: hashgraph");
        });

        it("throws error if Invalid Hedera network", () => {
            let error = null;
            try {
                HcsDid.parseIdentifier("did:hedera:nonetwork:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.1");
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("DID string is invalid. Invalid Hedera network.");
        });

        it("throws error if Invalid id string", () => {
            let error = null;
            try {
                HcsDid.parseIdentifier("did:hedera:testnet:z6Mkabcd_0.0.1");
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("DID string is invalid. DID string is invalid.");
        });

        it("should get array with NetworkName, topicId and didIdString", () => {
            const [networkName, topicId, didIdString] = HcsDid.parseIdentifier(
                "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.1"
            );

            expect(networkName).toEqual("testnet");
            expect(topicId.toString()).toEqual("0.0.1");
            expect(didIdString).toEqual("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");
        });
    });

    describe("#publicKeyToIdString", () => {
        it("should get DID Id String from publicKey", () => {
            const privateKey = PrivateKey.fromString(
                "302e020100300506032b657004220420a4b76d7089dfd33c83f586990c3a36ae92fb719fdf262e7749d1b0ddd1d055b0"
            );
            const result = HcsDid.publicKeyToIdString(privateKey.publicKey);
            expect(result).toEqual("z6MkvD6JAfMyP6pgQoYxfE9rubgwLD9Hmz8rQh1FAxvbW8XB");
        });
    });

    describe("#stringToPublicKey", () => {
        it("should get publicKey from DID Id String", () => {
            const privateKey = PrivateKey.fromString(
                "302e020100300506032b657004220420a4b76d7089dfd33c83f586990c3a36ae92fb719fdf262e7749d1b0ddd1d055b0"
            );
            const result = HcsDid.stringToPublicKey("z6MkvD6JAfMyP6pgQoYxfE9rubgwLD9Hmz8rQh1FAxvbW8XB");
            expect(result).toEqual(privateKey.publicKey);
        });
    });
});
