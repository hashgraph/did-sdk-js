const {
    Hbar, Timestamp,
} = require('@hashgraph/sdk');

const {
    HcsVcDocumentBase,
    HcsVcOperation,
    HcsVcMessage,
    MessageEnvelope,
    ArraysUtils
} = require("../../dist");
const {
    DemoAccessCredential
} = require("./demo-access-credential");
const {
    DemoVerifiableCredentialDocument
} = require("./demo-verifiable-credential-document");
const {
    NetworkReadyTestBase, until, sleep
} = require("../network-ready-test-base");
const {
    encrypt, decrypt
} = require("../aes-encryption-util");

const { expect, assert } = require('chai');

/**
 * Tests operations on verifiable credentials and their status resolution.
 */
describe("HcsVcEncryptionTest", function () {
    const MIRROR_NODE_TIMEOUT = 30 * 1000;
    const NO_MORE_MESSAGES_TIMEOUT = 15 * 1000;
    const FEE = new Hbar(2);
    const SECRET = "Secret message used for encryption";
    const INVALID_SECRET = "Invalid secret message used for decryption";
    const network = new NetworkReadyTestBase();
    let issuer, owner, vc, credentialHash, issuersPrivateKey;

    const EXPECT_NO_ERROR = function (err) {
        assert.notExists(err);
    };

    before(async function () {
        this.timeout(120000);
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

        await sleep(1000);
    });

    after(async function () {
        network.cleanup();
    });

    it('Test IssueValidEncryptedMessage', async function () {
        this.timeout(60000);

        const messageRef = [];

        // Build and execute transaction with encrypted message
        await network.didNetwork.createVcTransaction(HcsVcOperation.ISSUE, credentialHash, issuersPrivateKey.publicKey)
            .signMessage(doc => issuersPrivateKey.sign(doc))
            .buildAndSignTransaction(tx => tx.setMaxTransactionFee(FEE))
            .onMessageConfirmed(msg => messageRef.push(msg))
            .onError(EXPECT_NO_ERROR)
            .onEncrypt(m => encrypt(m, SECRET))
            .onDecrypt((m, i) => decrypt(m, SECRET))
            .execute(network.client);

        // Wait until consensus is reached and mirror node received the DID document, but with max. time limit.
        await until(MIRROR_NODE_TIMEOUT, () => !!messageRef.length);

        const envelope = messageRef[0];

        assert.exists(envelope);

        const msg = envelope.open();

        // Check results
        assert.exists(msg);
        assert.isTrue(msg.isValid());
        assert.equal(credentialHash, msg.getCredentialHash());

        await sleep(1000);
    });

    it('Test ResolveWithValidDecrypter', async function () {
        this.timeout(60000);

        const mapRef = [];

        // Resolve encrypted message
        network.didNetwork.getVcStatusResolver(m => [issuersPrivateKey.publicKey])
            .addCredentialHash(credentialHash)
            .setTimeout(NO_MORE_MESSAGES_TIMEOUT)
            .onError(EXPECT_NO_ERROR)
            .onDecrypt((m, i) => decrypt(m, SECRET))
            .whenFinished(m => mapRef.push(m))
            .execute(network.client);

        // Wait until mirror node resolves the DID.
        await until(MIRROR_NODE_TIMEOUT, () => !!mapRef.length);

        const envelope = mapRef[0] ? mapRef[0].get(credentialHash) : null;

        assert.exists(envelope);

        const msg = envelope.open();

        // Check results
        assert.exists(msg);
        assert.isTrue(msg.isValid());
        assert.equal(credentialHash, msg.getCredentialHash());

        await sleep(1000);
    });

    it('Test ResolveWithInvalidDecrypter', async function () {
        this.timeout(60000);

        const mapRef = [];
        const errorRef = [];

        // Try to resolve encrypted message with a wrong secret
        network.didNetwork.getVcStatusResolver(m => [issuersPrivateKey.publicKey])
            .addCredentialHash(credentialHash)
            .setTimeout(NO_MORE_MESSAGES_TIMEOUT)
            .onError(e => errorRef.push(String(e)))
            .onDecrypt((m, i) => decrypt(m, INVALID_SECRET))
            .whenFinished(m => mapRef.push(m))
            .execute(network.client);

        // Wait until mirror node resolves the DID.
        await until(MIRROR_NODE_TIMEOUT, () => !!mapRef.length);

        const envelope = mapRef[0] ? mapRef[0].get(credentialHash) : null;
        const error = errorRef[0];

        assert.notExists(envelope);
        assert.exists(error);

        await sleep(1000);
    });

    it('Test MessageEncryptionDecryption', async function () {
        this.timeout(60000);

        const msg = HcsVcMessage.fromCredentialHash(credentialHash, HcsVcOperation.ISSUE);

        const encryptedMsg = msg
            .encrypt(HcsVcMessage.getEncrypter(m => encrypt(m, SECRET)));

        assert.exists(encryptedMsg);


        const msgJson = ArraysUtils.toString(encryptedMsg.sign(m => issuersPrivateKey.sign(m)));
        const encryptedSignedMsg = MessageEnvelope.fromJson(msgJson, HcsVcMessage);

        assert.exists(encryptedSignedMsg);
        // Throw error if decrypter is not provided
        try {
            encryptedSignedMsg.open();
            assert.fail("Throw error if decrypter is not provided");
        } catch (error) {
            assert.exists(error);
        }

        const decryptedMsg = encryptedSignedMsg
            .open(HcsVcMessage.getDecrypter((m, i) => decrypt(m, SECRET)));

        assert.exists(decryptedMsg);
        assert.equal(credentialHash, decryptedMsg.getCredentialHash());
        assert.equal(encryptedSignedMsg.open().getTimestamp(), decryptedMsg.getTimestamp());
    });
});