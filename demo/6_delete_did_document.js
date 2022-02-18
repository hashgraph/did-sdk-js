const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
require('dotenv').config();

async function main() {
    /**
     * Client setup
     */
    const privateKey = PrivateKey.fromString(process.env.OPERATOR_KEY);
    const client = Client.forTestnet();
    client.setOperator(process.env.OPERATOR_ID, privateKey);

    const didPrivateKey = PrivateKey.fromString(process.env.DID_PRIVATE_KEY);

    /**
     * Build DID instance
     */
    const did = new HcsDid({ identifier: process.env.DID_IDENTIFIER, privateKey: didPrivateKey, client: client });

    /**
     * Delete DID
     */
    did.delete();
}

main();
