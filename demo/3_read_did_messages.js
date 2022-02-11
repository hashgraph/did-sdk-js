const { Client } = require("@hashgraph/sdk");
const { HcsDid, HcsDidEventMessageResolver } = require("../dist");

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
    const did = new HcsDid({ identifier: existingDIDIdentifier });

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
