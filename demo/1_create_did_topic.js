const { TopicCreateTransaction, PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { OPERATOR_ID, PRIVATE_KEY_STR, MAX_TRANSACTION_FEE } = require("./config");

async function main() {
    /**
     * Client setup
     */
    const privateKey = PrivateKey.fromString(PRIVATE_KEY_STR);
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, privateKey);

    /**
     * Create topic and generate DID
     */
    const didTopicCreateTransaction = new TopicCreateTransaction()
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setAdminKey(privateKey.publicKey);

    const didTxId = await didTopicCreateTransaction.execute(client);
    const didTopicId = (await didTxId.getReceipt(client)).topicId;

    /**
     * Build DID intance
     */
    const did = new HcsDid(client.networkName, privateKey.publicKey, didTopicId);

    console.log(`PRIVATE KEY: ${privateKey.toString()}`);
    console.log(`PUBLIC KEY: ${privateKey.publicKey.toString()}`);
    console.log("\n");
    console.log(did.generateDidDocument().toJsonTree());
}

main();
