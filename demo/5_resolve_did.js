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
    const did = HcsDid.fromString(TEST_DID_STR);

    /**
     * Read DID resolver setup
     */
    const resolver = new HcsDidResolver(did.didTopicId).setTimeout(3000).whenFinished((result) => {
        const didResult = result.get(did.did);

        console.log("generating did doc");
        console.log(didResult.generateDidDocument().toJsonTree());

        console.log("\n");
        console.log("===================================================");
        console.log("DragaonGlass Explorer:");
        console.log(`https://testnet.dragonglass.me/hedera/topics/${did.didTopicId}`);
        console.log("\n");
    });

    /**
     * Read DID information
     */
    resolver.addDid(did.did);
    resolver.execute(client);
}

main();
