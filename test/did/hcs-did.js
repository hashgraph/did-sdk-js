const { TopicId } = require("@hashgraph/sdk");
const { DidSyntax, HcsDid, Hashing } = require("../../dist");

const { assert } = require("chai");

const network = "testnet";

describe("HcsDid", function () {
    it("Test Generate And Parse Did With Tid", async function () {
        const didTopicId = "1.5.23462345";

        const privateKey = HcsDid.generateDidRootKey();

        const topicId = TopicId.fromString(didTopicId);
        const did = new HcsDid(network, privateKey.publicKey, topicId);

        const didString = did.toString();

        assert.exists(didString);

        const parsedDid = HcsDid.fromString(didString);

        assert.exists(parsedDid);
        assert.exists(parsedDid.getDidTopicId());

        assert.equal(parsedDid.toDid(), didString);
        assert.equal(parsedDid.getMethod(), DidSyntax.Method.HEDERA_HCS);
        assert.equal(parsedDid.getNetwork(), network);
        assert.equal(parsedDid.getDidTopicId().toString(), didTopicId);
        assert.equal(parsedDid.getIdString(), did.getIdString());

        const parsedDocument = parsedDid.generateDidDocument();

        assert.exists(parsedDocument);
        assert.equal(parsedDocument.getId(), parsedDid.toString());
        assert.equal(parsedDocument.getContext(), DidSyntax.DID_DOCUMENT_CONTEXT);
        assert.notExists(parsedDocument.getDidRootKey());

        const document = did.generateDidDocument();

        assert.exists(document);
        assert.equal(document.getId(), parsedDid.toString());
        assert.equal(document.getContext(), DidSyntax.DID_DOCUMENT_CONTEXT);
        assert.exists(document.getDidRootKey());
        assert.equal(
            document.getDidRootKey().getPublicKeyMultibase(),
            Hashing.multibase.encode(privateKey.publicKey.toBytes())
        );
    });

    it("Test Parse Predefined Dids", async function () {
        const didTopicId = "1.5.23462345";

        const validDidWithSwitchedParamsOrder =
            "did:hedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak" + "_" + didTopicId;

        const invalidDids = [
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
        ];

        for (let did of invalidDids) {
            assert.throw(() => {
                HcsDid.fromString(did);
            });
        }

        const validDid = HcsDid.fromString(validDidWithSwitchedParamsOrder);

        assert.exists(validDid);
        assert.exists(validDid.getDidTopicId());
        assert.equal(validDid.getDidTopicId().toString(), didTopicId);
    });
});
