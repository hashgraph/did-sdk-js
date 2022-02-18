const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
require('dotenv').config();

async function main() {
    /**
     * Setup
     */
    const client = Client.forTestnet();
    client.setOperator(process.env.OPERATOR_ID, process.env.OPERATOR_KEY);

    const didPrivateKey = PrivateKey.fromString(process.env.DID_PRIVATE_KEY);

    /**
     * Build DID instance
     */
    const registeredDid = new HcsDid({ identifier: process.env.DID_IDENTIFIER, privateKey: didPrivateKey, client: client });

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
