const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY } = require("./config");

async function main() {
    /**
     * Setup
     */
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    /**
     * CHANGE IT. use values from step 1: registered DID console output
     */
    const didPrivateKey = PrivateKey.fromString(
        "302e020100300506032b657004220420a4b76d7089dfd33c83f586990c3a36ae92fb719fdf262e7749d1b0ddd1d055b0"
    );
    const existingDIDIdentifier = "did:hedera:testnet:z6MkvD6JAfMyP6pgQoYxfE9rubgwLD9Hmz8rQh1FAxvbW8XB_0.0.29656526";

    /**
     * Build DID instance
     */
    const registeredDid = new HcsDid({ identifier: existingDIDIdentifier, privateKey: didPrivateKey, client: client });

    /**
     * Add Service
     */
    const serviceIdentifier = "did:hedera:testnet:z6MkubW6fwkWSA97RbKs17MtLgWGHBtShQygUc5SeHueFCaG_0.0.29656231";

    await registeredDid.addService({
        id: serviceIdentifier + "#service-1",
        type: "LinkedDomains",
        serviceEndpoint: "https://example.com/vcs",
    });

    console.log("\n");
    console.log("Added");
    let didDoc = await registeredDid.resolve();
    console.log(didDoc.toJsonTree());

    /**
     * Update Service
     * ID must be same as ADD Service Event to update it
     */
    await registeredDid.updateService({
        id: serviceIdentifier + "#service-1",
        type: "LinkedDomains",
        serviceEndpoint: "https://test.com/did",
    });

    console.log("\n");
    console.log("Updated");
    didDoc = await registeredDid.resolve();
    console.log(didDoc.toJsonTree());

    /**
     * Revoke Service
     */
    await registeredDid.revokeService({
        id: serviceIdentifier + "#service-1",
    });

    console.log("\n");
    console.log("Revoked");
    didDoc = await registeredDid.resolve();
    console.log(didDoc.toJsonTree());

    console.log("\n");
    console.log("Registered DID Information");
    console.log(`DID PRIVATE KEY: ${didPrivateKey.toString()}`);
    console.log(`DID PUBLIC KEY: ${didPrivateKey.publicKey.toString()}`);
    console.log(registeredDid.getIdentifier());
}

main();
