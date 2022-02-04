const { PrivateKey, Client } = require("@hashgraph/sdk");
const {
    HcsDid,
    DidMethodOperation,
    MessageEnvelope,
    HcsDidMessage,
    HcsDidTransaction,
    HcsDidServiceEvent,
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
    const did = new HcsDid({ identifier: TEST_DID_STR, privateKey: privateKey });

    /**
     * Build create Service message
     */
    const event = new HcsDidServiceEvent(
        did.getIdentifier(),
        "VerifiableCredentialService",
        "https://test.meeco.me/vcs"
    );
    const message = new HcsDidMessage(DidMethodOperation.CREATE, did.getIdentifier(), event);
    const envelope = new MessageEnvelope(message);

    /**
     * Send DIDOwner message to Hashgraph
     */
    const transaction = new HcsDidTransaction(envelope, did.getTopicId());

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
