const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { OPERATOR_ID, PRIVATE_KEY_STR, TEST_DID_STR } = require("./config");

async function main() {
    /**
     * Setup
     */
    const privateKey = PrivateKey.fromString(PRIVATE_KEY_STR);
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, privateKey);

    /**
     * Add Service
     */
    let did = new HcsDid({ identifier: TEST_DID_STR, privateKey: privateKey, client: client });
    did = await did.addService({
        id: did.getIdentifier() + "#service-1",
        type: "LinkedDomains",
        serviceEndpoint: "https://example.com/vcs",
    });

    console.log("\n");
    console.log("Added");
    let didDoc = await did.resolve();
    let didDocument = didDoc.toJsonTree();
    console.log(JSON.stringify(didDocument));

    /**
     * Update Service
     * ID must be same as ADD Service Event to update it
     */
    did = await did.updateService({
        id: did.getIdentifier() + "#service-1",
        type: "LinkedDomains",
        serviceEndpoint: "https://test.com/did",
    });

    console.log("\n");
    console.log("Updated");
    didDoc = await did.resolve();
    didDocument = didDoc.toJsonTree();
    console.log(JSON.stringify(didDocument));

    /**
     * Revoke Service
     */
    did = await did.revokeService({
        id: did.getIdentifier() + "#service-1",
    });

    console.log("\n");
    console.log("Revoked");
    didDoc = await did.resolve();
    didDocument = didDoc.toJsonTree();
    console.log(JSON.stringify(didDocument));
}

main();
