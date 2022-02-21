const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY } = require("./.env.json");

async function main() {
    /**
     * Client setup
     */
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

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
