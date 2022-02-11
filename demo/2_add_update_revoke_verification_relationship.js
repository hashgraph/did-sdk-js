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

    const verificationRelationshipIdentifier =
        "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801";
    const verificationRelationshipPublicKey = HcsDid.stringToPublicKey(
        "z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk"
    );
    const updatedVerificationRelationshipPublicKey = HcsDid.stringToPublicKey(
        "z6MkhHbhBBLdKGiGnHPvrrH9GL7rgw6egpZiLgvQ9n7pHt1P"
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
