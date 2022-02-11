const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY } = require("./config");

async function main() {
    /**
     * Client setup
     */
    const privateKey = PrivateKey.fromString(OPERATOR_KEY);
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, privateKey);

    /**
     * CHANGE IT. use values from step 1: registered DID console output
     */
    const didPrivateKey = PrivateKey.fromString(
        "302e020100300506032b657004220420a4b76d7089dfd33c83f586990c3a36ae92fb719fdf262e7749d1b0ddd1d055b0"
    );
    const existingDIDIdentifier = "did:hedera:testnet:z6MkvD6JAfMyP6pgQoYxfE9rubgwLD9Hmz8rQh1FAxvbW8XB_0.0.29656526";

    /**
     * Build DID instance
     */
    const did = new HcsDid({ identifier: existingDIDIdentifier, privateKey: didPrivateKey, client: client });

    /**
     * Delete DID
     */
    did.delete();
}

main();
