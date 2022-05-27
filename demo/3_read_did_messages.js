const { Client, Timestamp } = require("@hashgraph/sdk");
const { HcsDid, HcsDidEventMessageResolver } = require("../dist");
const { DID_IDENTIFIER } = require("./.env.json");

async function main() {
    /**
     * Setup
     */
    const client = Client.forTestnet();

    /**
     * Build DID instance
     */
    const did = new HcsDid({ identifier: DID_IDENTIFIER });

    /**
     * Read DID resolver setup
     */
    new HcsDidEventMessageResolver(did.getTopicId())
        .setTimeout(HcsDid.READ_TOPIC_MESSAGES_TIMEOUT)
        .whenFinished((envelopes) => {
            envelopes.forEach((envelope) => {
                const msg = envelope.open();

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
            console.log("DragonGlass Explorer:");
            console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);
            console.log("\n");
        })
        .execute(client);
}

main();
