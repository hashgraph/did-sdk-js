const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY, DID_PRIVATE_KEY, DID_IDENTIFIER } = require("./.env.json");

async function main() {
    /**
     * Setup
     */
    const client = Client.forTestnet({ scheduleNetworkUpdate: false });
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    const didPrivateKey = PrivateKey.fromString(DID_PRIVATE_KEY);

    /**
     * Build DID instance
     */
    const registeredDid = new HcsDid({ identifier: DID_IDENTIFIER, privateKey: didPrivateKey, client: client });

    const verificationRelationshipIdentifier =
        "did:hedera:testnet:z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb_0.0.29617801";
    const verificationRelationshipPublicKey = HcsDid.stringToPublicKey("z87meAWt7t2zrDxo7qw3PVTjexKWReYWS75LH29THy8kb");
    const updatedVerificationRelationshipPublicKey = HcsDid.stringToPublicKey(
        "zAvU2AEh8ybRqNwHAM3CjbkjYaYHpt9oA1uugW9EVTg6P"
    );
    const verificationRelationshipType = "authentication";

    /**
     * Add VerificationRelationship - authentication
     */
    await registeredDid.addVerificationRelationship({
        id: verificationRelationshipIdentifier + "#key-1",
        relationshipType: verificationRelationshipType,
        type: "Ed25519VerificationKey2018",
        controller: registeredDid.getIdentifier(),
        publicKey: verificationRelationshipPublicKey,
    });

    console.log("\n");
    console.log("Added");
    let didDoc = await registeredDid.resolve();
    console.log(didDoc.toJsonTree());

    /**
     * Update VerificationRelationship - authentication
     * ID & relationshipType must be same as ADD Service Event to update it
     */
    await registeredDid.updateVerificationRelationship({
        id: verificationRelationshipIdentifier + "#key-1",
        relationshipType: verificationRelationshipType,
        type: "Ed25519VerificationKey2018",
        controller: registeredDid.getIdentifier(),
        publicKey: updatedVerificationRelationshipPublicKey,
    });

    console.log("\n");
    console.log("Updated");
    didDoc = await registeredDid.resolve();
    console.log(didDoc.toJsonTree());

    /**
     * Revoke Service
     * ID & relationshipType must be same as ADD Service Event to update it
     */
    await registeredDid.revokeVerificationRelationship({
        id: verificationRelationshipIdentifier + "#key-1",
        relationshipType: verificationRelationshipType,
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
