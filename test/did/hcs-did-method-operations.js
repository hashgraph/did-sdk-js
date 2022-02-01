const { DidMethodOperation, DidDocumentJsonProperties } = require("../../dist");
const { NetworkReadyTestBase } = require("../network-ready-test-base");

const { assert } = require("chai");

const testBase = new NetworkReadyTestBase();

let hcsDid, didDocument;

const EXPECT_NO_ERROR = function (err) {
    throw err;
};

describe("Hcs Did Method Operations", function () {
    before(async function () {
        this.timeout(60000);
        await testBase.setup();
        hcsDid = testBase.didNetwork.generateDid();
        didDocument = hcsDid.generateDidDocument().toJSON();
    });

    after(async function () {
        testBase.cleanup();
    });

    it("Test Create", async function () {
        this.timeout(60000);
        const op = DidMethodOperation.CREATE;

        const envelope = await testBase.sendDidTransaction(hcsDid, didDocument, op, EXPECT_NO_ERROR);
        assert.exists(envelope);

        const msg = envelope.open();
        assert.exists(msg);
        assert.exists(msg.getDidDocument());

        assert.equal(hcsDid.toDid(), msg.getDid());
        assert.isTrue(msg.isValid());
        assert.equal(DidMethodOperation.CREATE, msg.getOperation());
    });

    it("Test Resolve After Create", async function () {
        this.timeout(60000);
        const didString = hcsDid.toDid();

        const envelope = await testBase.resolveDid(didString, EXPECT_NO_ERROR);
        const msg = envelope.open();

        assert.exists(msg);
        assert.equal(didString, msg.getDid());
        assert.isTrue(msg.isValid());
        assert.equal(DidMethodOperation.CREATE, msg.getOperation());
    });

    it("Test Update", async function () {
        this.timeout(60000);
        const rootObject = JSON.parse(didDocument);

        const publicKeys = rootObject[DidDocumentJsonProperties.VERIFICATION_METHOD];
        publicKeys.push(
            JSON.parse(
                "{" +
                    '"id": "did:example:123456789abcdefghi#keys-2",' +
                    '"type": "Ed25519VerificationKey2018",' +
                    '"controller": "did:example:pqrstuvwxyz0987654321",' +
                    '"publicKeyMultibase": "z6MkH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"' +
                    "}"
            )
        );
        rootObject[DidDocumentJsonProperties.VERIFICATION_METHOD] = publicKeys;

        const newDoc = JSON.stringify(rootObject);

        const operation = DidMethodOperation.UPDATE;
        const envelope = await testBase.sendDidTransaction(hcsDid, newDoc, operation, EXPECT_NO_ERROR);
        assert.exists(envelope);

        const msg = envelope.open();

        assert.exists(msg);
        assert.equal(newDoc, msg.getDidDocument());
        assert.equal(operation, msg.getOperation());
    });

    it("Test Resolve After Update", async function () {
        this.timeout(60000);
        const didString = hcsDid.toDid();

        const envelope = await testBase.resolveDid(didString, EXPECT_NO_ERROR);
        assert.exists(envelope);

        const msg = envelope.open();

        assert.exists(msg);
        assert.equal(didString, msg.getDid());
        assert.isTrue(msg.isValid());
        assert.equal(DidMethodOperation.UPDATE, msg.getOperation());
        assert.notEqual(didDocument, msg.getDidDocument());
    });

    it("Test Delete", async function () {
        this.timeout(60000);
        const rootObject = JSON.parse(didDocument);

        if (rootObject.hasOwnProperty(DidDocumentJsonProperties.AUTHENTICATION)) {
            rootObject[DidDocumentJsonProperties.AUTHENTICATION] = [];
        }

        if (rootObject.hasOwnProperty(DidDocumentJsonProperties.ASSERTION_METHOD)) {
            rootObject[DidDocumentJsonProperties.ASSERTION_METHOD] = [];
        }

        const deletedDoc = JSON.stringify(rootObject);

        const operation = DidMethodOperation.DELETE;
        const envelope = await testBase.sendDidTransaction(hcsDid, deletedDoc, operation, EXPECT_NO_ERROR);
        assert.exists(envelope);

        const msg = envelope.open();

        assert.exists(msg);
        assert.equal(deletedDoc, msg.getDidDocument());
        assert.equal(operation, msg.getOperation());
    });

    it("Test Resolve After Delete", async function () {
        this.timeout(60000);
        const didString = hcsDid.toDid();

        const envelope = await testBase.resolveDid(didString, EXPECT_NO_ERROR);
        assert.exists(envelope);

        const msg = envelope.open();

        assert.exists(msg);
        assert.equal(didString, msg.getDid());
        assert.isTrue(msg.isValid());
        assert.equal(DidMethodOperation.DELETE, msg.getOperation());
        assert.notEqual(didDocument, msg.getDidDocument());
    });

    it("Test Resolve After Delete And Another Invalid Submit", async function () {
        this.timeout(60000);
        await testBase.sendDidTransaction(hcsDid, didDocument, DidMethodOperation.UPDATE, EXPECT_NO_ERROR);

        const didString = hcsDid.toDid();
        const envelope = await testBase.resolveDid(didString, EXPECT_NO_ERROR);
        assert.exists(envelope);

        const msg = envelope.open();

        assert.exists(msg);
        assert.equal(didString, msg.getDid());
        assert.isTrue(msg.isValid());
        assert.equal(DidMethodOperation.DELETE, msg.getOperation());
        assert.notEqual(didDocument, msg.getDidDocument());
    });
});
