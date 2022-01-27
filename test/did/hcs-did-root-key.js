const { TopicId } = require("@hashgraph/sdk");
const bs58 = require("bs58");
const { HcsDid, HcsDidRootKey } = require("../../dist");

const { assert } = require("chai");

const network = "network";

describe("HcsDidRootKey", function () {
  it("Test Generate", async function () {
    const didTopicId = TopicId.fromString("1.5.23462345");

    const privateKey = HcsDid.generateDidRootKey();

    const did = new HcsDid(network, privateKey.publicKey, didTopicId);

    assert.throw(() => {
      HcsDidRootKey.fromHcsIdentity(null, null);
    });
    assert.throw(() => {
      HcsDidRootKey.fromHcsIdentity(did, null);
    });
    assert.throw(() => {
      HcsDidRootKey.fromHcsIdentity(null, privateKey.publicKey);
    });

    const differentPublicKey = HcsDid.generateDidRootKey().publicKey;
    assert.throw(() => {
      HcsDidRootKey.fromHcsIdentity(did, differentPublicKey);
    });

    const didRootKey = HcsDidRootKey.fromHcsIdentity(did, privateKey.publicKey);
    assert.exists(didRootKey);

    assert.equal(didRootKey.getType(), "Ed25519VerificationKey2018");
    assert.equal(
      didRootKey.getId(),
      did.toDid() + HcsDidRootKey.DID_ROOT_KEY_NAME
    );
    assert.equal(didRootKey.getController(), did.toDid());
    assert.equal(
      didRootKey.getPublicKeyBase58(),
      bs58.encode(privateKey.publicKey.toBytes())
    );
  });
});
