const { HcsDid, DidDocumentBase, DidDocumentJsonProperties, DidSyntax, HcsDidRootKey, Hashing } = require("../dist");
const { TopicId } = require("@hashgraph/sdk");
const { expect, assert } = require("chai");

const network = "testnet";
const DID_TOPIC_ID = TopicId.fromString("0.0.2");

describe("DidDocumentBase", function () {
    it("Test Serialization", async function () {
        const privateKey = HcsDid.generateDidRootKey();
        const did = new HcsDid(network, privateKey.publicKey, DID_TOPIC_ID);
        const doc = did.generateDidDocument();

        const didJson = doc.toJSON();

        const root = JSON.parse(didJson);

        expect(root).to.have.keys([
            DidDocumentJsonProperties.CONTEXT,
            DidDocumentJsonProperties.ID,
            DidDocumentJsonProperties.VERIFICATION_METHOD,
            DidDocumentJsonProperties.AUTHENTICATION,
        ]);
        assert.equal(root[DidDocumentJsonProperties.CONTEXT], DidSyntax.DID_DOCUMENT_CONTEXT);
        assert.equal(root[DidDocumentJsonProperties.ID], did.toDid());

        const didRootKey = root[DidDocumentJsonProperties.VERIFICATION_METHOD][0];
        assert.equal(didRootKey["type"], HcsDidRootKey.DID_ROOT_KEY_TYPE);
        assert.equal(didRootKey[DidDocumentJsonProperties.ID], did.toDid() + HcsDidRootKey.DID_ROOT_KEY_NAME);
        assert.equal(didRootKey["controller"], did.toDid());
        assert.equal(didRootKey["publicKeyBase58"], Hashing.multibase.encode(privateKey.publicKey.toBytes()));
    });

    it("Test Deserialization", async function () {
        const privateKey = HcsDid.generateDidRootKey();
        const did = new HcsDid(network, privateKey.publicKey, DID_TOPIC_ID);
        const doc = did.generateDidDocument();

        const didJson = doc.toJSON();

        const parsedDoc = DidDocumentBase.fromJson(didJson);
        assert.equal(parsedDoc.getId(), doc.getId());

        const didRootKey = parsedDoc.getDidRootKey();
        assert.exists(didRootKey);
        assert.equal(didRootKey.getPublicKeyBase58(), doc.getDidRootKey().getPublicKeyBase58());
        assert.equal(didRootKey.getController(), doc.getDidRootKey().getController());
        assert.equal(didRootKey.getId(), doc.getDidRootKey().getId());
        assert.equal(didRootKey.getType(), doc.getDidRootKey().getType());
    });

    it("Test Invalid Deserialization", async function () {
        const didJson =
            "{" +
            '  "@context": "https://www.w3.org/ns/did/v1",' +
            '  "id": "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345",' +
            '  "authentication": [' +
            ' "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345#did-root-key"' +
            "  ]," +
            '  "verificationMethod":"invalidPublicKey",' +
            '  "service": [' +
            "    {" +
            '    "id":"did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345#vcs",' +
            '    "type": "VerifiableCredentialService",' +
            '    "serviceEndpoint": "https://example.com/vc/"' +
            "    }" +
            "  ]" +
            "}";

        assert.throw(() => {
            DidDocumentBase.fromJson(didJson);
        });
    });

    it("Test Incomplete Json Deserialization", async function () {
        const didJsonMissingPublicKeys =
            "{" +
            '  "@context": "https://www.w3.org/ns/did/v1",' +
            '  "id": "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345",' +
            '  "authentication": [' +
            ' "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345#did-root-key"' +
            "  ]" +
            "}";

        const didJsonMissingRootKey =
            "{" +
            '  "@context": "https://www.w3.org/ns/did/v1",' +
            '  "id": "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345",' +
            '  "authentication": [' +
            '  "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345#did-root-key"' +
            "  ]," +
            '  "publicKey": [' +
            "    {" +
            ' "id": "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345#key-1",' +
            ' "type": "Ed25519VerificationKey2018",' +
            '      "publicKeyBase58": "H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"' +
            "    }" +
            "  ]," +
            '  "service": [' +
            "    {" +
            ' "id": "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345#vcs",' +
            '      "type": "VerifiableCredentialService",' +
            '      "serviceEndpoint": "https://example.com/vc/"' +
            "    }" +
            "  ]" +
            "}";

        const didJsonMissingPublicKeyId =
            "{" +
            '  "@context": "https://www.w3.org/ns/did/v1",' +
            '  "id": "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345",' +
            '  "authentication": [' +
            '  "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345#did-root-key"' +
            "  ]," +
            '  "publicKey": [' +
            "    {" +
            ' "type": "Ed25519VerificationKey2018",' +
            '      "publicKeyBase58": "H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"' +
            "    }" +
            "  ]," +
            '  "service": [' +
            "    {" +
            ' "id": "did:hedera:mainnet:7Prd74ry1Uct87nZqL3ny7aR7Cg46JamVbJgk8azVgUm_1.5.23462345#vcs",' +
            '      "type": "VerifiableCredentialService",' +
            '      "serviceEndpoint": "https://example.com/vc/"' +
            "    }" +
            "  ]" +
            "}";

        let doc = DidDocumentBase.fromJson(didJsonMissingPublicKeys);
        assert.exists(doc);
        assert.notExists(doc.getDidRootKey());

        doc = DidDocumentBase.fromJson(didJsonMissingRootKey);
        assert.exists(doc);
        assert.notExists(doc.getDidRootKey());

        doc = DidDocumentBase.fromJson(didJsonMissingPublicKeyId);
        assert.exists(doc);
        assert.notExists(doc.getDidRootKey());
    });
});
