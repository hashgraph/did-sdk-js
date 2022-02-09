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

    const newVerificaitonDid = "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
    const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");
    const updatePublicKey = HcsDid.stringToPublicKey("z6MkhHbhBBLdKGiGnHPvrrH9GL7rgw6egpZiLgvQ9n7pHt1P");

    /**
     * Add Verification Method
     */
    let did = new HcsDid({ identifier: TEST_DID_STR, privateKey: privateKey, client: client });
    did = await did.addVerificaitonMethod({
        id: newVerificaitonDid,
        type: "Ed25519VerificationKey2018",
        controller: did.getIdentifier(),
        publicKey,
    });

    console.log("\n");
    console.log("Added");
    let didDoc = await did.resolve();
    let didDocument = didDoc.toJsonTree();
    console.log(JSON.stringify(didDocument));

    /**
     * Update Verification Method
     * ID must be same as ADD Verification Method Event to update it
     */
    did = await did.updateVerificaitonMethod({
        id: newVerificaitonDid,
        type: "Ed25519VerificationKey2018",
        controller: did.getIdentifier(),
        publicKey: updatePublicKey,
    });

    console.log("\n");
    console.log("Updated");
    didDoc = await did.resolve();
    didDocument = didDoc.toJsonTree();
    console.log(JSON.stringify(didDocument));

    /**
     * Revoke Verification Method
     */
    did = await did.revokeVerificaitonMethod({
        id: newVerificaitonDid,
    });

    console.log("\n");
    console.log("Revoked");
    didDoc = await did.resolve();
    didDocument = didDoc.toJsonTree();
    console.log(JSON.stringify(didDocument));
}

main();
