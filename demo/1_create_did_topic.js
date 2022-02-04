const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { OPERATOR_ID, PRIVATE_KEY_STR } = require("./config");

async function main() {
    /**
     * Client setup
     */
    const privateKey = PrivateKey.fromString(PRIVATE_KEY_STR);
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, privateKey);

    /**
     * Build DID intance
     */
    const did = new HcsDid({ privateKey: privateKey, client: client });
    const registeredDid = await did.register();

    console.log(`PRIVATE KEY: ${privateKey.toString()}`);
    console.log(`PUBLIC KEY: ${privateKey.publicKey.toString()}`);
    console.log("\n");
    console.log(registeredDid.getIdentifier());
}

main();
