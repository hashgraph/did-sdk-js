
const {
    HcsVcDocumentBase,
    HcsVcOperation
} = require("../../dist");
const {
    Timestamp
} = require('@hashgraph/sdk');
const {
    DemoAccessCredential
} = require("./demo-access-credential");
const {
    NetworkReadyTestBase
} = require("../network-ready-test-base");

const { expect, assert } = require('chai');


/**
 * Tests operations on verifiable credentials and their status resolution.
 */
describe("HcsVcDocumentOperationsTest", function () {
    const network = new NetworkReadyTestBase();
    let issuer, owner, vc, credentialHash, issuersPrivateKey;

    before(async function () {
        this.timeout(60000);
        await network.setup();

        issuer = network.didNetwork.generateDid();
        issuersPrivateKey = issuer.getPrivateDidRootKey();

        owner = network.didNetwork.generateDid();

        // For tests only we do not need to submit DID documents, as we will not validate them.
        // final DidMethodOperation op = DidMethodOperation.CREATE;
        // sendDidTransaction(issuer, issuer.generateDidDocument().toJson(), op, EXPECT_NO_ERROR);
        // sendDidTransaction(owner, owner.generateDidDocument().toJson(), op, EXPECT_NO_ERROR);

        // Create an example Verifiable Credential.
        vc = new HcsVcDocumentBase();
        vc.setIssuer(issuer);
        vc.setIssuanceDate(Timestamp.fromDate(new Date()));
        vc.addCredentialSubject(new DemoAccessCredential(owner.toDid(), true, false, false));

        credentialHash = vc.toCredentialHash();
    });

    after(async function () {
        network.cleanup();
    });

    const EXPECT_NO_ERROR = function (err) {
        assert.notExists(err);
    };

    const testVcOperation = async function (op) {
        const envelope = await network.sendVcTransaction(op, credentialHash, issuersPrivateKey, EXPECT_NO_ERROR);

        assert.exists(envelope);

        const msg = envelope.open();

        // Check results
        assert.exists(msg);
        assert.isTrue(msg.isValid());
        assert.equal(op, msg.getOperation());
        assert.equal(credentialHash, msg.getCredentialHash());
    }

    const testVcStatusResolution = async function (expectedOperation) {
        const envelope = await network.resolveVcStatus(
            credentialHash,
            (m) => [issuersPrivateKey.publicKey],
            EXPECT_NO_ERROR
        );

        assert.exists(envelope);

        const msg = envelope.open();

        assert.exists(msg);
        assert.isTrue(msg.isValid());
        assert.equal(credentialHash, msg.getCredentialHash());
        assert.equal(expectedOperation, msg.getOperation());
    }

    it('Test Issue', async function () {
        this.timeout(60000);
        await testVcOperation(HcsVcOperation.ISSUE);
        await testVcStatusResolution(HcsVcOperation.ISSUE);
    });

    it('Test Suspend', async function () {
        this.timeout(60000);
        await testVcOperation(HcsVcOperation.SUSPEND);
        await testVcStatusResolution(HcsVcOperation.SUSPEND);
    });

    it('Test Resume', async function () {
        this.timeout(60000);
        await testVcOperation(HcsVcOperation.RESUME);
        await testVcStatusResolution(HcsVcOperation.RESUME);
    });

    it('Test Revoke', async function () {
        this.timeout(60000);
        await testVcOperation(HcsVcOperation.REVOKE);
        await testVcStatusResolution(HcsVcOperation.REVOKE);
    });

    it('Test InvalidResumeAfterRevoke', async function () {
        this.timeout(120000);
        await testVcOperation(HcsVcOperation.RESUME);
        // Status should still be revoked
        await testVcStatusResolution(HcsVcOperation.REVOKE);

        await testVcOperation(HcsVcOperation.SUSPEND);
        // Status should still be revoked
        await testVcStatusResolution(HcsVcOperation.REVOKE);
    });
});