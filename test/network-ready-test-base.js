const { OPERATOR_KEY, OPERATOR_ID, NETWORK } = require("./variables");
const { AccountId, PrivateKey, Client, Hbar } = require("@hashgraph/sdk");

const { HcsIdentityNetworkBuilder } = require("../dist");

const MIRROR_NODE_TIMEOUT = 30 * 1000;
const NO_MORE_MESSAGES_TIMEOUT = 15 * 1000;
const FEE = new Hbar(2);

const EXISTING_DID_TOPIC_ID = null;
const EXISTING_VC_TOPIC_ID = null;

const sleep = function (sleepTime) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, sleepTime);
  });
};

const until = function (maxTime, untilFunction) {
  return new Promise((resolve) => {
    let t, i;
    i = setInterval(() => {
      if (untilFunction()) {
        clearInterval(i);
        clearTimeout(t);
        resolve();
      }
    }, 100);
    t = setTimeout(() => {
      clearInterval(i);
      clearTimeout(t);
      resolve();
    }, maxTime);
  });
};

/**
 * Base class for test classes that need a hedera identity network set up before running.
 */
class NetworkReadyTestBase {
  operatorId;
  operatorKey;
  network;
  didNetwork;
  client;

  /**
   * Initialize hedera clients and accounts.
   */
  // BeforeAll
  async setup() {
    this.operatorId = AccountId.fromString(OPERATOR_ID);
    this.operatorKey = PrivateKey.fromString(OPERATOR_KEY);
    this.network = NETWORK;

    // Build Hedera testnet client
    switch (this.network.toUpperCase()) {
      case "MAINNET":
        this.client = Client.forMainnet();
        break;
      case "TESTNET":
        this.client = Client.forTestnet();
        break;
      case "PREVIEWNET":
        this.client = Client.forPreviewnet();
        break;
      default:
        throw "Illegal argument for network.";
    }

    // Set the operator account ID and operator private key
    this.client.setOperator(this.operatorId, this.operatorKey);

    await this.setupIdentityNetwork();
  }

  async setupIdentityNetwork() {
    const appnetName = "Test Identity SDK appnet";
    const didServerUrl = "http://localhost:3000/api/v1";
    const didTopicMemo = "Test Identity SDK appnet DID topic";
    const vcTopicMemo = "Test Identity SDK appnet VC topic";

    this.didNetwork = await new HcsIdentityNetworkBuilder()
      .setNetwork(this.network)
      .setPublicKey(this.operatorKey.publicKey)
      .setMaxTransactionFee(FEE)
      .setDidTopicMemo(didTopicMemo)
      .setVCTopicMemo(vcTopicMemo)
      .setDidTopicId(EXISTING_DID_TOPIC_ID)
      .setVCTopicId(EXISTING_VC_TOPIC_ID)
      .execute(this.client);
    console.info("New identity network created: " + appnetName);
    console.info(
      "Sleeping 10s to allow propagation of new topics to mirror node"
    );

    await sleep(10000);
  }

  //AfterAll
  cleanup() {
    try {
      if (this.client != null) {
        this.client.close();
      }

      if (this.client != null) {
        this.client.close();
      }
    } catch (e) {
      // ignore
    }
  }

  async sendDidTransaction(did, didDocumentJson, operation, onError) {
    const messageRef = [];

    // Build and execute transaction
    await this.didNetwork
      .createDidTransaction(operation)
      .setDidDocument(didDocumentJson)
      .signMessage((doc) => did.getPrivateDidRootKey().sign(doc))
      .buildAndSignTransaction((tx) => tx.setMaxTransactionFee(FEE))
      .onMessageConfirmed((msg) => messageRef.push(msg))
      .onError(onError)
      .execute(this.client);

    // Wait until consensus is reached and mirror node received the DID document, but with max. time limit.
    await until(MIRROR_NODE_TIMEOUT, () => !!messageRef.length);

    try {
      return messageRef[0];
    } catch (error) {
      return undefined;
    }
  }

  async resolveDid(didString, onError) {
    const mapRef = [];

    // Now resolve the DID.
    this.didNetwork
      .getDidResolver()
      .addDid(didString)
      .setTimeout(NO_MORE_MESSAGES_TIMEOUT)
      .onError(onError)
      .whenFinished((m) => mapRef.push(m))
      .execute(this.client);

    // Wait until mirror node resolves the DID.
    await until(MIRROR_NODE_TIMEOUT, () => !!mapRef.length);

    try {
      return mapRef[0].get(didString);
    } catch (error) {
      return undefined;
    }
  }

  async sendVcTransaction(operation, credentialHash, signingKey, onError) {
    const messageRef = [];

    // Build and execute transaction
    await this.didNetwork
      .createVcTransaction(operation, credentialHash, signingKey.publicKey)
      .signMessage((doc) => signingKey.sign(doc))
      .buildAndSignTransaction((tx) => tx.setMaxTransactionFee(FEE))
      .onMessageConfirmed((msg) => messageRef.push(msg))
      .onError(onError)
      .execute(this.client);

    // Wait until consensus is reached and mirror node received the DID document, but with max. time limit.
    await until(MIRROR_NODE_TIMEOUT, () => !!messageRef.length);

    try {
      return messageRef[0];
    } catch (error) {
      return undefined;
    }
  }

  async resolveVcStatus(credentialHash, provider, onError) {
    const mapRef = [];

    // Now resolve the DID.
    this.didNetwork
      .getVcStatusResolver(provider)
      .addCredentialHash(credentialHash)
      .setTimeout(NO_MORE_MESSAGES_TIMEOUT)
      .onError(onError)
      .whenFinished((m) => mapRef.push(m))
      .execute(this.client);

    // Wait until mirror node resolves the DID.
    await until(MIRROR_NODE_TIMEOUT, () => !!mapRef.length);

    try {
      return mapRef[0].get(credentialHash);
    } catch (error) {
      return undefined;
    }
  }
}

exports.NetworkReadyTestBase = NetworkReadyTestBase;
exports.until = until;
exports.sleep = sleep;
