const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsDid } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY, DID_IDENTIFIER, DID_PRIVATE_KEY } = require("./.env.json");

async function main() {
    /**
     * Setup
     */
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    const didPrivateKey = PrivateKey.fromString(DID_PRIVATE_KEY);

    /**
     * Build DID instance
     */
    const registeredDid = new HcsDid({ identifier: DID_IDENTIFIER, privateKey: didPrivateKey, client: client });

    const verificationMethodIdentifier =
        "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801";
    const verificationMethodPublicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");
    const updatedVerificationMethodPublicKey = HcsDid.stringToPublicKey(
        "z6MkhHbhBBLdKGiGnHPvrrH9GL7rgw6egpZiLgvQ9n7pHt1P"
    );

    /**
     * Add Verification Method
     */
    await registeredDid.addVerificationMethod({
        id: verificationMethodIdentifier + "#key-1",
        type: "Ed25519VerificationKey2018",
        controller: registeredDid.getIdentifier(),
        publicKey: verificationMethodPublicKey,
    });

    console.log("\n");
    console.log("Added");
    let didDoc = await registeredDid.resolve();
    console.log(didDoc.toJsonTree());

    /**
     * Update Verification Method
     * ID must be same as ADD Verification Method Event to update it
     */
    await registeredDid.updateVerificationMethod({
        id: verificationMethodIdentifier + "#key-1",
        type: "Ed25519VerificationKey2018",
        controller: registeredDid.getIdentifier(),
        publicKey: updatedVerificationMethodPublicKey,
    });
    console.log("\n");
    console.log("Updated");
    didDoc = await registeredDid.resolve();

    console.log(didDoc.toJsonTree());

    /**
     * Revoke Verification Method
     */
    await registeredDid.revokeVerificationMethod({
        id: verificationMethodIdentifier + "#key-1",
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
