const {
    FileId,
    TopicId
} = require('@hashgraph/sdk');
const bs58 = require('bs58');
const {
    DidSyntax,
    HcsDid
} = require("../../dist");

const {assert} = require('chai');

const network = 'network';

describe('HcsDid', function() {
    it('Test Generate And Parse Did Without Tid', async function() {
        const addressBook = '0.0.24352';

        const privKey = HcsDid.generateDidRootKey();
        const pubKey = privKey.publicKey;

        const did = new HcsDid(network, pubKey, FileId.fromString(addressBook));

        const didString = did.toString();

        assert.exists(didString);

        const parsedDid = HcsDid.fromString(didString);

        assert.exists(parsedDid);
        assert.exists(parsedDid.getAddressBookFileId());

        assert.notExists(parsedDid.getDidTopicId());

        assert.equal(parsedDid.toString(), didString);
        assert.equal(parsedDid.getMethod(), DidSyntax.Method.HEDERA_HCS);
        assert.equal(parsedDid.getNetwork(), network);
        assert.equal(parsedDid.getAddressBookFileId().toString(), addressBook);
        assert.equal(parsedDid.getIdString(), did.getIdString());
    });

    it('Test Generate And Parse Did With Tid', async function() {
        const addressBook = '0.0.24352';
        const didTopicId = '1.5.23462345';

        const privateKey = HcsDid.generateDidRootKey();

        const fileId = FileId.fromString(addressBook);
        const topicId = TopicId.fromString(didTopicId);
        const did = new HcsDid(network, privateKey.publicKey, fileId, topicId);

        const didString = did.toString();

        assert.exists(didString);

        const parsedDid = HcsDid.fromString(didString);

        assert.exists(parsedDid);
        assert.exists(parsedDid.getAddressBookFileId());
        assert.exists(parsedDid.getDidTopicId());

        assert.equal(parsedDid.toDid(), didString);
        assert.equal(parsedDid.getMethod(), DidSyntax.Method.HEDERA_HCS);
        assert.equal(parsedDid.getNetwork(), network);
        assert.equal(parsedDid.getAddressBookFileId().toString(), addressBook);
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
        assert.equal(document.getDidRootKey().getPublicKeyBase58(), bs58.encode(privateKey.publicKey.toBytes()));
    });

    it('Test Parse Predefined Dids', async function() {
        const addressBook = '0.0.24352';
        const didTopicId = '1.5.23462345';

        const validDidWithSwitchedParamsOrder = "did:hedera:testnet:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak"
            + ";hedera:testnet:tid=" + didTopicId
            + ";hedera:testnet:fid=" + addressBook;

        const invalidDids = [
            null,
            "invalidDid1",
            "did:invalid",
            "did:invalidMethod:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak;hedera:testnet:fid=0.0.24352",
            "did:hedera:invalidNetwork:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak;hedera:testnet:fid=0.0.24352",
            "did:hedera:testnet:invalidAddress;hedera:testnet:fid=0.0.24352;hedera:testnet:tid=1.5.23462345",
            "did:hedera:testnet;hedera:testnet:fid=0.0.24352;hedera:testnet:tid=1.5.23462345",
            "did:hedera:testnet:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak;missing:fid=0.0.24352;"
            + "hedera:testnet:tid=1.5.2",
            "did:hedera:testnet:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak;missing:fid=0.0.1;"
            + "hedera:testnet:tid=1.5.2;unknown:parameter=1",
            "did:hedera:testnet:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak;hedera:testnet:fid=0.0.1=1",
            "did:hedera:testnet:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak;hedera:testnet:fid",
            "did:hedera:testnet:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak:unknownPart;hedera:testnet:fid=0.0.1",
            "did:notHedera:testnet:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak;hedera:testnet:fid=0.0.1"
        ];

        for (let did of invalidDids) {
            assert.throw(() => {
                HcsDid.fromString(did);
            });
        }

        const validDid = HcsDid.fromString(validDidWithSwitchedParamsOrder);

        assert.exists(validDid);
        assert.exists(validDid.getAddressBookFileId());
        assert.exists(validDid.getDidTopicId());

        assert.equal(validDid.getAddressBookFileId().toString(), addressBook);
        assert.equal(validDid.getDidTopicId().toString(), didTopicId);
    });
});
