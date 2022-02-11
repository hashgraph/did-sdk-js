const { Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");

async function main() {
    /**
     * Setup
     */
    const client = Client.forTestnet();

    /**
     * CHANGE IT. use values from step 1: registered DID console output
     */
    const existingDIDIdentifier = "did:hedera:testnet:z6MkvD6JAfMyP6pgQoYxfE9rubgwLD9Hmz8rQh1FAxvbW8XB_0.0.29656526";

    /**
     * Build DID instance
     */
    const did = new HcsDid({ identifier: existingDIDIdentifier, client: client });

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
