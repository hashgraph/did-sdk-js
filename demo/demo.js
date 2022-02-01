const { TopicId } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");

const didTopicId = "0.0.12345";
const privateKey = HcsDid.generateDidRootKey();
const network = "testnet";

const topicId = TopicId.fromString(didTopicId);
const did = new HcsDid(network, privateKey.publicKey, topicId);

const didString = did.toString();

console.log(`did: ${didString}`);

// console.log(did);
console.log(`did-document: ${did.generateDidDocument().toJSON()}`);

const didFromString = HcsDid.fromStringWithDidRootKey(didString, privateKey.publicKey);

// console.log(did);
console.log(`did-document: ${didFromString.generateDidDocument().toJSON()}`);

console.log("\n");
console.log("\n");
