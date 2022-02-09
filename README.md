# did-sdk-js

Support for the Hedera Hashgraph DID Method on the Hedera JavaScript/TypeScript SDK.

This repository contains the Javascript SDK for managing [DID Documents][did-core] using the Hedera Consensus Service.

## Overview

Hedera Consensus Service (HCS) allows applications to share common channels to publish and resolve an immutable and verifiable messages. These messages are submitted to Topic. SDK creates and uses DID topic on HCS for publishing DID Events Messages to resolve and validate DID Document.

This SDK is designed to simplify :

-   Creation and initialization of the DID topic on HCS,
-   Generation of decentralized identifiers for [Hedera DID Method][did-method-spec] and creation of DID documents,
-   Creation (publishing), update, revoke, deletion and resolution of DID documents based on DID documents event/log messages recorded on HCS Topic

The SDK adhers to W3C standards to produce valid hedera:did and resolve it to DID Document. SDK also provide API to create, update, revoke and delete different DID Events Messages that represent different properties of a DID documents.

## Usage

```
npm install --save @hashgraph/did-sdk-js
```

## Setup Hedera Portal Account

-   Register hedera portal Testnet account https://portal.hedera.com/register
-   Login to portal https://portal.hedera.com/?network=testnet
-   Obtain accountId & privateKey string value.

```
"operator": {
  "accountId": "0.0.xxxx",
  "publicKey": "...",
  "privateKey": "302.."
}
```

-   Following examples uses accountId as `OPERATOR_ID` and privateKey string value as `OPERATOR_KEY` to submit DID Event Messages to HCS.

## Examples:

Sample demo setp by step javascript example are avalible at [Demo Folder][demo-location]. Make sure to add appropriate `testnet` account details in <b>`config.js`</b>

-   OPERATOR_ID=0.0.xxxx
-   OPERATOR_KEY=302...

### DID Generation & Registration

```
/**
 * Client setup
 */
const OPERATOR_ID=0.0.xxxx;
const OPERATOR_KEY=302...;
const privateKey = PrivateKey.fromString(PRIVATE_KEY_STR);
const client = Client.forTestnet();
client.setOperator(OPERATOR_ID, privateKey);

/**
 * Register & Generate DID
 */
const did = new HcsDid({ privateKey: privateKey, client: client });
const registeredDid = await did.register();
console.log("\n");
console.log(registeredDid.getIdentifier());
```

### DID Resolve

```
/**
 * Client setup
 */
const client = Client.forTestnet();

/**
 * Build DID instance
 */
const TEST_DID_STR = "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29637350";
const did = new HcsDid({ identifier: TEST_DID_STR, client: client });

/**
 * Resolve DID
 */
console.log("generating did doc");
const didDoc = await did.resolve();
console.log(didDoc.toJsonTree());

console.log("\n");
console.log("===================================================");
console.log("DID Event Messages Explorer:");
console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);
console.log("\n");
```

### Create, Update and Revoke [DID Document Core Properties][did-core-prop]

#### Service

```

/**
* Setup
*/
const OPERATOR_ID=0.0.xxxx;
const PRIVATE_KEY_STR=302...;
const TEST_DID_STR = "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29637350";

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

```

#### Verification Method

```

/**
* Setup
*/
const OPERATOR_ID=0.0.xxxx;
const PRIVATE_KEY_STR=302...;
const TEST_DID_STR = "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29637350";

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
```

[did-method-spec]: https://github.com/hashgraph/did-method
[did-core]: https://www.w3.org/TR/did-core/
[demo-location]: https://github.com/Meeco/did-sdk-js/tree/develop/demo
[did-core-prop]: https://w3c.github.io/did-core/#core-properties

#### Verification RelationShip - Authentication

```
/**
* Setup
*/
const OPERATOR_ID=0.0.xxxx;
const PRIVATE_KEY_STR=302...;
const TEST_DID_STR = "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29637350";

const privateKey = PrivateKey.fromString(PRIVATE_KEY_STR);
const client = Client.forTestnet();
client.setOperator(OPERATOR_ID, privateKey);

const newVerificaitonDid = "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29617801#key-1";
const publicKey = HcsDid.stringToPublicKey("z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk");
const updatePublicKey = HcsDid.stringToPublicKey("z6MkhHbhBBLdKGiGnHPvrrH9GL7rgw6egpZiLgvQ9n7pHt1P");

/**
* Add VerificationRelationship - authentication
*/
let did = new HcsDid({ identifier: TEST_DID_STR, privateKey: privateKey, client: client });
did = await did.addVerificaitonRelationship({
    id: newVerificaitonDid,
    relationshipType: "authentication",
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
* Update VerificationRelationship - authentication
* ID & relationshipType must be same as ADD Service Event to update it
*/
did = await did.updateVerificaitonRelationship({
    id: newVerificaitonDid,
    relationshipType: "authentication",
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
* Revoke Service
* ID & relationshipType must be same as ADD Service Event to update it
*/
did = await did.revokeVerificaitonRelationship({
    id: newVerificaitonDid,
    relationshipType: "authentication",
});

console.log("\n");
console.log("Revoked");
didDoc = await did.resolve();
didDocument = didDoc.toJsonTree();
console.log(JSON.stringify(didDocument));
```

### Delete DID Document

```
/**
*  Setup
*/
const OPERATOR_ID=0.0.xxxx;
const PRIVATE_KEY_STR=302...;
const TEST_DID_STR = "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29637350";

const privateKey = PrivateKey.fromString(PRIVATE_KEY_STR);
const client = Client.forTestnet();
client.setOperator(OPERATOR_ID, privateKey);

/**
* Build DID instance
*/
const did = new HcsDid({ identifier: TEST_DID_STR, privateKey: privateKey, client: client });

/**
* Delete DID
*/
did.delete();
```

## Development

```
git clone git@github.com:hashgraph/did-sdk-js.git
```

First you need install dependencies and build project

```
npm install
```

Run build in dev mode (with sourcemap generation and following changes)

```
npm run build:dev
```

## Tests

Run Unit Tests

```
npm run test:unit
```

Run Integration Test

Update the following environment variables with your `testnet` account details

-   OPERATOR_ID=0.0.xxxx
-   OPERATOR_KEY=302...

```
npm run test:integration
```

## References

-   <https://github.com/hashgraph/did-method>
-   <https://github.com/hashgraph/hedera-sdk-js>
-   <https://docs.hedera.com/hedera-api/>
-   <https://www.hedera.com/>
-   <https://www.w3.org/TR/did-core/>
-   <https://www.w3.org/TR/vc-data-model/>

## License Information

Licensed under _license placeholder_.
