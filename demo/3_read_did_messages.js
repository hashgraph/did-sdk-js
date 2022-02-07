const { Client } = require("@hashgraph/sdk");
const { HcsDid, HcsDidEventMessageResolver } = require("../dist");
const { TEST_DID_STR } = require("./config");

async function main() {
    /**
     * Client setup
     */
    const client = Client.forTestnet();

    /**
     * Build DID instance
     */
    const did = new HcsDid({ identifier: TEST_DID_STR });

    /**
     * Read DID resolver setup
     */
    new HcsDidEventMessageResolver(did.getTopicId())
        .setTimeout(3000)
        .whenFinished((messages) => {
            messages.forEach((msg) => {
                console.log("\n");
                console.log("===================================================");
                console.log("\n");
                console.log("Message:");
                console.log(msg.toJsonTree());
                console.log("\n");
                console.log("Event:");
                console.log(msg.event.toJsonTree());
            });
            console.log("\n");
            console.log("===================================================");
            console.log("DragaonGlass Explorer:");
            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);
            console.log("\n");
        })
        .execute(client);
}

main();
