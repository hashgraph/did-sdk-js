const { Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { DID_IDENTIFIER } = require("./.env.json");

async function main() {
    /**
     * Setup
     */
    const client = Client.forTestnet();

    /**
     * Build DID instance
     */
    const did = new HcsDid({ identifier: DID_IDENTIFIER, client: client });

    /**
     * Resolve DID
     */

    console.log("generating did doc");
    const didDoc = await did.resolve();
    console.log(didDoc.toJsonTree());

    console.log("\n");
    console.log("===================================================");
    console.log("DragonGlass Explorer:");
    console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);
    console.log("\n");
}

main();
