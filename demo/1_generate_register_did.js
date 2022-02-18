const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
require('dotenv').config();

async function main() {
    /**
     * Client setup
     */
    const client = Client.forTestnet();
    client.setOperator(process.env.OPERATOR_ID, process.env.OPERATOR_KEY);

    /**
     * Build DID instance
     */
    const didPrivateKey = PrivateKey.generate();
    const did = new HcsDid({ privateKey: didPrivateKey, client: client });
    const registeredDid = await did.register();

    console.log("\n");
    console.log(`DID PRIVATE KEY: ${didPrivateKey.toString()}`);
    console.log(`DID PUBLIC KEY: ${didPrivateKey.publicKey.toString()}`);
    console.log(registeredDid.getIdentifier());
}

main();
