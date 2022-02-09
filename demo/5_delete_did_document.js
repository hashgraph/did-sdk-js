const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { OPERATOR_ID, PRIVATE_KEY_STR, TEST_DID_STR } = require("./config");

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
    const did = new HcsDid({ identifier: TEST_DID_STR, privateKey: privateKey, client: client });

    /**
     * Delete DID
     */
    did.delete();
}

main();
