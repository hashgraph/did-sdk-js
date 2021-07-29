const {
    HcsVcDocumentBase,
    Issuer
} = require("../../dist");
const {
    Timestamp
} = require('@hashgraph/sdk');
const {
    DemoAccessCredential
} = require("./demo-access-credential");
const {
    DemoVerifiableCredentialDocument
} = require("./demo-verifiable-credential-document");
const {
    NetworkReadyTestBase
} = require("../network-ready-test-base");

const { expect, assert } = require('chai');

describe("HcsVcDocumentBaseTest", function () {
    const network = new NetworkReadyTestBase();
    let issuer, owner;

    before(async function () {
        this.timeout(60000);
        await network.setup();

        issuer = network.didNetwork.generateDid(false);
        owner = network.didNetwork.generateDid(false);
    });

    after(async function () {
        network.cleanup();
    });

    it('Test VcDocumentConstruction', async function () {
        const vc = new HcsVcDocumentBase();

        // Should fail as no issuer is set.
        assert.isFalse(vc.isComplete());

        vc.setIssuer(issuer);

        // Should fail as no issuance date is set.
        assert.isFalse(vc.isComplete());

        vc.setIssuanceDate(Timestamp.fromDate(new Date()));

        // Should fail as no credential subject is set.
        assert.isFalse(vc.isComplete());

        // Default VC type should be set.
        assert.exists(vc.getType());
        assert.equal(1, vc.getType().length);

        // Add a custom type
        vc.addType("TestVC");
        assert.equal(2, vc.getType().length);

        // Default context should be set
        assert.exists(vc.getContext());
        assert.equal(1, vc.getContext().length);

        // Add a custom context
        vc.addContext("https://www.example.com/testContext");
        assert.equal(2, vc.getContext().length);

        // Add a credential subject.
        assert.notExists(vc.getCredentialSubject());
        const credential = new DemoAccessCredential(owner.toDid(), true, false, false);
        vc.addCredentialSubject(credential);

        // Make sure it's there
        assert.exists(vc.getCredentialSubject());
        assert.equal(1, vc.getCredentialSubject().length);

        // Now all mandatory fields should be set
        assert.isTrue(vc.isComplete());
    });


    it('Test VcJsonConversion', async function () {
        const vc = new HcsVcDocumentBase();
        vc.setId("example:test:vc:id");
        vc.setIssuer(new Issuer(issuer.toDid(), "My Company Ltd."));
        vc.setIssuanceDate(Timestamp.fromDate(new Date()));

        const subject = new DemoAccessCredential(owner.toDid(), true, false, false);
        vc.addCredentialSubject(subject);

        // Convert to JSON
        const json = vc.toJSON();
        assert.isFalse(!(json));

        // Convert back to VC document and compare
        const vcFromJson = HcsVcDocumentBase.fromJson(json, DemoAccessCredential);
        // Test simple properties
        assert.exists(vcFromJson);
        assert.deepEqual(vc.getType(), vcFromJson.getType());
        assert.deepEqual(vc.getContext(), vcFromJson.getContext());
        assert.deepEqual(vc.getIssuanceDate(), vcFromJson.getIssuanceDate());
        assert.equal(vc.getId(), vcFromJson.getId());

        // Test issuer object
        assert.exists(vcFromJson.getIssuer());
        assert.equal(vc.getIssuer().getId(), vcFromJson.getIssuer().getId());
        assert.equal(vc.getIssuer().getName(), vcFromJson.getIssuer().getName());

        // Test credential subject
        assert.exists(vcFromJson.getCredentialSubject());

        const subjectFromJson = vcFromJson.getCredentialSubject()[0];
        assert.equal(subject.getId(), subjectFromJson.getId());
        assert.equal(subject.getBlueLevel(), subjectFromJson.getBlueLevel());
        assert.equal(subject.getGreenLevel(), subjectFromJson.getGreenLevel());
        assert.equal(subject.getRedLevel(), subjectFromJson.getRedLevel());
    });

    it('Test CredentialHash', async function () {
        const vc = new DemoVerifiableCredentialDocument();
        vc.setId("example:test:vc:id");
        vc.setIssuer(issuer);
        vc.setIssuanceDate(Timestamp.fromDate(new Date()));
        vc.addCredentialSubject(new DemoAccessCredential(owner.toDid(), true, false, false));
        vc.setCustomProperty("Custom property value 1");

        const credentialHash = vc.toCredentialHash();
        assert.isFalse(!credentialHash);

        // Recalculation should give the same value
        assert.equal(credentialHash, vc.toCredentialHash());

        // Hash shall not change if we don't change anything in the document
        vc.setCustomProperty("Another value for custom property");
        vc.addCredentialSubject(new DemoAccessCredential(owner.toDid(), false, false, true));

        assert.equal(credentialHash, vc.toCredentialHash());
    });
});
