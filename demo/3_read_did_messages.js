const { Client, Timestamp } = require("@hashgraph/sdk");
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
     * Read DID resolver setup
     */
    //const result = await did.readMessages(Timestamp.fromDate("2022-02-21T07:58:03.082Z"));
    const result = await did.readMessages();

    result.forEach((msg) => {
        console.log("\n");
        console.log("===================================================");
        console.log("\n");
        console.log("Message:");
        console.log(msg.toJsonTree());
        console.log("\n");
        console.log("Event:");
        console.log(msg.event.toJsonTree());
    });
}

main();
