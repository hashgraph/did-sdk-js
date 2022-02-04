const { Client } = require("@hashgraph/sdk");
const { HcsDid, HcsDidResolver } = require("../dist");
const { TEST_DID_STR } = require("./config");

async function main() {
    /**
     * Client setup
     */
    const client = Client.forTestnet();

    /**
     * Build DID instance
     */
    const did = new HcsDid({ identifier: TEST_DID_STR, client: client });

    /**
     * Resolve DID
     */

    console.log("generating did doc");
    const didDoc = await did.resolve();
    console.log(didDoc.toJsonTree());

    console.log("\n");
    console.log("===================================================");
    console.log("DragaonGlass Explorer:");
    console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);
    console.log("\n");
}

main();
