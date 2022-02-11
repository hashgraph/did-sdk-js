const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY } = require("./config");

async function main() {
    /**
     *
     * Change DID Ownership, works under the following assumption.
     *
     * Current DID Owner transfers registered DID PrivateKey to New Owner using secure channel.
     * New Owner performs change did owner operation with existing registered DID PrivateKey and new owners PrivateKey.
     *
     */

    /**
     *
     * Change DID Ownership performs following tasks
     *
     * It transfers the ownership of DIDDocument and HCS Topic
     * It updates Topic AdminKey and SubmitKey by signing updateTopicTransaction with both existing owner PrivateKey and new owner PrivateKey
     * It also submits Update DIDOwner Event to HCS topic with new owner PublicKey. - of course singed by new owner PrivateKey
     * Eventually, when DID Document get resolved, Update DIDOwner Event translates to DID Document controller/#did-root-key
     */

    /**
     * Setup
     */
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    /**
     * CHANGE IT. use values from step 1: registered DID console output
     */
    const existingOwnerDIDPrivateKey = PrivateKey.fromString(
        "302e020100300506032b657004220420a4b76d7089dfd33c83f586990c3a36ae92fb719fdf262e7749d1b0ddd1d055b0"
    );
    const existingDIDIdentifier = "did:hedera:testnet:z6MkvD6JAfMyP6pgQoYxfE9rubgwLD9Hmz8rQh1FAxvbW8XB_0.0.29656526";

    /**
     * Build DID instance
     */
    const registeredDid = new HcsDid({
        identifier: existingDIDIdentifier,
        privateKey: existingOwnerDIDPrivateKey,
        client: client,
    });

    /**
     * New Owner PrivateKey
     */
    const newOwnerDidPrivateKey = PrivateKey.generate();
    const newOwnerIdentifier = "did:hedera:testnet:z6MkgUv5CvjRP6AsvEYqSRN7djB6p4zK9bcMQ93g5yK6Td7N_0.0.29613327";

    /**
     * Change ownership
     */
    await registeredDid.changeOwner({
        id: registeredDid.getIdentifier(),
        controller: newOwnerIdentifier,
        newPrivateKey: newOwnerDidPrivateKey,
    });

    console.log("generating did doc");
    const didDoc = await registeredDid.resolve();
    console.log(didDoc.toJsonTree());

    console.log("\n");
    console.log("New Owner Information");
    console.log(`DID PRIVATE KEY: ${newOwnerDidPrivateKey.toString()}`);
    console.log(`DID PUBLIC KEY: ${newOwnerDidPrivateKey.publicKey.toString()}`);

    console.log("\n");
    console.log("===================================================");
    console.log("DragaonGlass Explorer:");
    console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);
    console.log("\n");
}
main();
