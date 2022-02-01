const { PrivateKey, Client } = require("@hashgraph/sdk");
const {
    HcsDid,
    DidMethodOperation,
    MessageEnvelope,
    HcsDidMessage,
    HcsDidDidOwnerEvent,
    HcsDidTransaction,
} = require("../dist");
const { OPERATOR_ID, PRIVATE_KEY_STR, TEST_DID_STR, MAX_TRANSACTION_FEE } = require("./config");

async function main() {
    /**
     * Client setup
     */
    const privateKey = PrivateKey.fromString(PRIVATE_KEY_STR);
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, privateKey);

    /**
     * Build DID instance
     */
    const did = HcsDid.fromString(TEST_DID_STR);

    /**
     * Build create DIDOwner message
     */
    const event = new HcsDidDidOwnerEvent(did.did, did.did, privateKey.publicKey);
    const message = new HcsDidMessage(DidMethodOperation.CREATE, did.did, event);
    const envelope = new MessageEnvelope(message);

    /**
     * Send DIDOwner message to Hashgraph
     */
    const transaction = new HcsDidTransaction(envelope, did.didTopicId);

    transaction
        .signMessage((msg) => privateKey.sign(msg))
        .buildAndSignTransaction((tx) => tx.setMaxTransactionFee(MAX_TRANSACTION_FEE))
        .onMessageConfirmed((msg) => {
            // console.log(msg);
            console.log("Message published");
        })
        .execute(client);
}

main();
