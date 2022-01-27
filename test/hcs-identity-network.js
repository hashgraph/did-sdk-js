const { OPERATOR_KEY, OPERATOR_ID, NETWORK } = require("./variables");
const {
  AccountId,
  PrivateKey,
  Client,
  Hbar,
  TopicInfoQuery,
  TopicId,
} = require("@hashgraph/sdk");

const {
  HcsDid,
  HcsIdentityNetworkBuilder,
  HcsIdentityNetwork,
} = require("../dist");

const { assert } = require("chai");

const FEE = new Hbar(2);
const DID_TOPIC_ID = TopicId.fromString("0.0.214920");

let client, operatorId, operatorKey, network;

describe("HcsIdentityNetwork", function () {
  before(async function () {
    this.timeout(60000);

    operatorId = AccountId.fromString(OPERATOR_ID);
    operatorKey = PrivateKey.fromString(OPERATOR_KEY);
    network = NETWORK;
    client = Client.forTestnet();
    client.setMirrorNetwork(["hcs." + network + ".mirrornode.hedera.com:5600"]);
    client.setOperator(operatorId, operatorKey);
  });

  it("Test Create Identity Network", async function () {
    this.timeout(60000);
    const didTopicMemo = "Test Identity SDK appnet DID topic";
    const vcTopicMemo = "Test Identity SDK appnet VC topic";

    const didNetwork = await new HcsIdentityNetworkBuilder()
      .setNetwork(network)
      .setPublicKey(operatorKey.publicKey)
      .setMaxTransactionFee(FEE)
      .setDidTopicMemo(didTopicMemo)
      .setVCTopicMemo(vcTopicMemo)
      .execute(client);

    assert.exists(didNetwork);

    const didTopicInfo = await new TopicInfoQuery()
      .setTopicId(didNetwork.getDidTopicId())
      .execute(client);

    assert.exists(didTopicInfo);
    assert.equal(didTopicInfo.topicMemo, didTopicMemo);

    const vcTopicInfo = await new TopicInfoQuery()
      .setTopicId(didNetwork.getVcTopicId())
      .execute(client);

    assert.exists(vcTopicInfo);
    assert.equal(vcTopicInfo.topicMemo, vcTopicMemo);
  });

  it("Test Init Network From Did topic", async function () {
    this.timeout(60000);
    const did = new HcsDid(
      network,
      HcsDid.generateDidRootKey().publicKey,
      DID_TOPIC_ID
    );

    const didNetwork = await HcsIdentityNetwork.fromHcsDidTopic(
      network,
      did.getDidTopicId()
    );

    assert.exists(didNetwork);
    assert.equal(didNetwork.getDidTopicId(), DID_TOPIC_ID);
    assert.equal(didNetwork.getNetwork(), network);
  });

  it("Test Generate Did For Network", async function () {
    this.timeout(60000);

    function checkTestGenerateDidForNetwork(did, publicKey, didTopicId) {
      assert.exists(did);
      assert.equal(HcsDid.publicKeyToIdString(publicKey), did.getIdString());
      assert.equal(did.getNetwork(), network);
      assert.equal(did.getDidTopicId().toString(), didTopicId);
      assert.equal(did.getMethod(), HcsDid.DID_METHOD);
    }

    const didNetwork = await HcsIdentityNetwork.fromHcsDidTopic(
      network,
      DID_TOPIC_ID
    );

    let did = didNetwork.generateDid();
    assert.exists(did.getPrivateDidRootKey());

    let publicKey = did.getPrivateDidRootKey().publicKey;
    checkTestGenerateDidForNetwork(did, publicKey, didNetwork.getDidTopicId());

    did = didNetwork.generateDid();
    assert.exists(did.getPrivateDidRootKey());

    publicKey = did.getPrivateDidRootKey().publicKey;
    checkTestGenerateDidForNetwork(did, publicKey, didNetwork.getDidTopicId());

    did = didNetwork.generateDid();
    assert.exists(did.getPrivateDidRootKey());
    publicKey = did.getPrivateDidRootKey().publicKey;
    checkTestGenerateDidForNetwork(did, publicKey, didNetwork.getDidTopicId());

    did = didNetwork.generateDid();
    assert.exists(did.getPrivateDidRootKey());
    publicKey = did.getPrivateDidRootKey().publicKey;
    checkTestGenerateDidForNetwork(did, publicKey, didNetwork.getDidTopicId());

    publicKey = HcsDid.generateDidRootKey().publicKey;
    did = didNetwork.generateDid(publicKey);
    checkTestGenerateDidForNetwork(did, publicKey, didNetwork.getDidTopicId());

    publicKey = HcsDid.generateDidRootKey().publicKey;
    did = didNetwork.generateDid(publicKey);
    checkTestGenerateDidForNetwork(did, publicKey, didNetwork.getDidTopicId());
  });
});
