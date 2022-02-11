# did-sdk-js

Support for the Hedera Hashgraph DID Method on the Hedera JavaScript/TypeScript SDK.

This repository contains the Javascript SDK for managing [DID Documents][did-core] using the Hedera Consensus Service.

## Overview

Hedera Consensus Service (HCS) allows applications to share common channels to publish and resolve immutable and verifiable messages. These messages are submitted to Topic. SDK creates and uses **Private DID Topic** on HCS for publishing **DID Events Messages** to resolve and validate **DID Document**.

This SDK is designed to simplify :

- Creation and initialization of the DID registration on **HCS Private Topic**,
- Generation of decentralized identifiers for [Hedera DID Method][did-method-spec] and creation of DID documents,
- Create, update, revoke, deletion, and resolution of DID documents based on [DID Document Core Properties][did-core-prop] event/log messages recorded on **HCS Topic**
- Transferring ownership of DID identifier and DID Document to another party.

The SDK adheres to W3C standards to produce valid hedera:did and resolve it to DID Document. SDK also provides API to create, update, revoke and delete different DID Events Messages that represent different properties of DID documents.

## Usage

```sh
npm install --save @hashgraph/did-sdk-js
```

## Setup Hedera Portal Account

- Register hedera portal Testnet account <https://portal.hedera.com/register>
- Login to portal <https://portal.hedera.com/?network=testnet>
- Obtain accountId & privateKey string value.

```json
"operator": {
  "accountId": "0.0.xxxx",
  "publicKey": "...",
  "privateKey": "302.."
}
```

- Following examples use accountId as `OPERATOR_ID` and privateKey string value as `OPERATOR_KEY` to submit DID Event Messages to HCS.

## Examples

Sample demo step by step javascript example are available at [Demo Folder][demo-location]. Make sure to add appropriate `testnet` account details in <b>`config.js`</b>

- OPERATOR_ID=0.0.xxxx
- OPERATOR_KEY=302...

## DID Generation & Registration

```javascript
const OPERATOR_ID=0.0.xxxx;
const OPERATOR_KEY=302...;

/**
* Client setup
*/
const client = Client.forTestnet();
client.setOperator(OPERATOR_ID, OPERATOR_KEY);

/**
* Build DID instance
*/
const didPrivateKey = PrivateKey.generate();
const did = new HcsDid({ privateKey: didPrivateKey, client: client });
const registeredDid = await did.register();

console.log("\n");
console.log(`DID PRIVATE KEY: ${didPrivateKey.toString()}`);
console.log(`DID PUBLIC KEY: ${didPrivateKey.publicKey.toString()}`);
console.log(registeredDid.getIdentifier());
```

## DID Resolve

```javascript
/**
* Setup
*/
const client = Client.forTestnet();

/**
* CHANGE IT. use values from step 1: registered DID console output
*/
const existingDIDIdentifier = "did:hedera:testnet:z6MkvD6JAfMyP6pgQoYxfE9rubgwLD9Hmz8rQh1FAxvbW8XB_0.0.29656526";

/**
* Build DID instance
*/
const did = new HcsDid({ identifier: existingDIDIdentifier, client: client });

/**
* Resolve DID
*/
console.log("generating did doc");
const didDoc = await did.resolve();
console.log(didDoc.toJsonTree());

console.log("\n");
console.log("===================================================");
console.log("DragonGlass Explorer:");
console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);
console.log("\n");
```

## Change Ownership

### Change DID Ownership, works under the following **assumption**

- Current DID owner **transfers** registered DID PrivateKey to new owner using **secure channel**.
- New owner **performs change did owner operation** with existing owner registered DID PrivateKey and new owners PrivateKey.

### Change DID Ownership performs following tasks

- It **transfers** the ownership of **DIDDocument** and **HCS Topic**.
- It **updates** Topic **AdminKey** and **SubmitKey** by signing updateTopicTransaction with **both** existing owner PrivateKey and new owner PrivateKey
- It also **submits** Update DIDOwner **Event** to **HCS Topic** with new owner PublicKey. - of course singed by new owner PrivateKey
- Eventually, when **DID Document** get **resolved**, Update DIDOwner **Event** new owner PublicKey translates to DID Document **controller/#did-root-key**

```javascript
const OPERATOR_ID=0.0.xxxx;
const PRIVATE_KEY_STR=302...;

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
console.log("DragonGlass Explorer:");
console.log(`https://testnet.dragonglass.me/hedera/topics/${did.getTopicId().toString()}`);
console.log("\n");
```

## Create, Update and Revoke [DID Document Core Properties][did-core-prop]

## Service

```javascript
const OPERATOR_ID=0.0.xxxx;
const PRIVATE_KEY_STR=302...;

/**
* Setup
*/
const client = Client.forTestnet();
client.setOperator(OPERATOR_ID, OPERATOR_KEY);

/**
* CHANGE IT. use values from did registration step
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

```

## Verification Method

```javascript
const OPERATOR_ID=0.0.xxxx;
const PRIVATE_KEY_STR=302...;

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
```

[did-method-spec]: https://github.com/hashgraph/did-method
[did-core]: https://www.w3.org/TR/did-core/
[demo-location]: https://github.com/Meeco/did-sdk-js/tree/develop/demo
[did-core-prop]: https://w3c.github.io/did-core/#core-properties

## Verification RelationShip - Authentication

```javascript
const OPERATOR_ID=0.0.xxxx;
const PRIVATE_KEY_STR=302...;
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
```

## Delete DID Document

```javascript
const OPERATOR_ID=0.0.xxxx;
const PRIVATE_KEY_STR=302...;

/**
* Client setup
*/
const privateKey = PrivateKey.fromString(OPERATOR_KEY);
const client = Client.forTestnet();
client.setOperator(OPERATOR_ID, privateKey);

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
const did = new HcsDid({ identifier: existingDIDIdentifier, privateKey: didPrivateKey, client: client });

/**
* Delete DID
*/
did.delete();
```

## Development

```sh
git clone git@github.com:hashgraph/did-sdk-js.git
```

First, you need to install dependencies and build the project

```sh
npm install
```

Run build in dev mode (with sourcemap generation and following changes)

```sh
npm run build:dev
```

## Tests

Run Unit Tests

```sh
npm run test:unit
```

Run Integration Test

Open jest.setup.js file and update the following environment variables with your `testnet` account details

```js
process.env.OPERATOR_ID = "0.0.xxxxxx";
process.env.OPERATOR_KEY = "302e02...";
```

```sh
npm run test:integration
```

## References

- <https://github.com/hashgraph/did-method>
- <https://github.com/hashgraph/hedera-sdk-js>
- <https://docs.hedera.com/hedera-api/>
- <https://www.hedera.com/>
- <https://www.w3.org/TR/did-core/>
- <https://www.w3.org/TR/vc-data-model/>

## License Information

Licensed under _license placeholder_.
