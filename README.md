# did-sdk-js
Support for the Hedera Hashgraph DID Method and Verifiable Credentials on the Hedera JavaScript/TypeScript SDK.

This repository contains the Javascript SDK for managing [DID Documents][did-core] & [Verifiable Credentials][vc-data-model] registry using the Hedera Consensus Service.

did-sdk-js based on [did-sdk-java](https://github.com/hashgraph/did-sdk-java), so both of them contain similar methods and classes.

## Overview

Identity networks are set of artifacts on Hedera Consensus Service that allow applications to share common channels to publish and resolve DID documents, issue verifiable credentials and control their validity status. These artifacts include:

- address book - a file on Hedera File Service that provides information about HCS topics and appnet servers,
- DID topic - an HCS topic intended for publishing DID documents,
- and VC topic - an HCS topic playing a role of verifiable credentials registry.

This SDK is designed to simplify :

- creation of identity networks within appnets, that is: creation and initialization of the artifacts mentioned above,
- generation of decentralized identifiers for [Hedera DID Method][did-method-spec] and creation of their basic DID documents,
- creation (publishing), update, deletion and resolution of DID documents in appnet identity networks,
- issuance, revocation and status verification of [Verifiable Credentials][vc-data-model].

The SDK does not impose any particular way of how the DID or verifiable credential documents are constructed. Each appnet creators can choose their best way of creating those documents and as long as these are valid JSON-LD files adhering to W3C standards, they will be handled by the SDK.

## Usage
```
npm install --save @hashgraph/did-sdk-js
```

## Example:

### Identity Network
```
const client = ... // Client

const identityNetwork = new HcsIdentityNetworkBuilder()
  .setNetwork("testnet")
  .setAppnetName("MyIdentityAppnet")
  .addAppnetDidServer("https://appnet-did-server-url:port/path-to-did-api")
  .setPublicKey(publicKey)
  .setMaxTransactionFee(new Hbar(2))
  .setDidTopicMemo("MyIdentityAppnet DID topic")
  .setVCTopicMemo("MyIdentityAppnet VC topic")
  .execute(client);
```

### DID Generation
From already instantiated network:
```
const identityNetwork = ...; //HcsIdentityNetwork
// From a given DID root key:
const didRootKey = ...; //PrivateKey
const hcsDid = identityNetwork.generateDid(didRootKey.publicKey, false);
```
or:
```
// Without having a DID root key - it will be generated automatically:
// Here we decided to add DID topic ID parameter `tid` to the DID.
const hcsDidWithDidRootKey = identityNetwork.generateDid(true);
const didRootKeyPrivateKey = hcsDidWithDidRootKey.getPrivateDidRootKey().get();
```
or by directly constructing HcsDid object:
```
const didRootKey = HcsDid.generateDidRootKey();
const addressBookFileId = FileId.fromString("<hedera.address-book-file.id>");

const hcsDid = new HcsDid(HederaNetwork.TESTNET, didRootKey.publicKey, addressBookFileId);
```
Existing Hedera DID strings can be parsed into HcsDid object by calling fromString method:
```
const didString = "did:hedera:testnet:7c38oC4ytrYDGCqsaZ1AXt7ZPQ8etzfwaxoKjfJNzfoc;hedera:testnet:fid=0.0.1";
const did = HcsDid.fromString(didString);
```

### Transaction
```
const client = ...; //Client
const identityNetwork = ...; //HcsIdentityNetwork

const didRootKey = ...; //PrivateKey
const hcsDid = ...; //HcsDid

const didDocument = hcsDid.generateDidDocument().toJson();

// Build and execute transaction
await identityNetwork.createDidTransaction(DidMethodOperation.CREATE)
  // Provide DID document as JSON string
  .setDidDocument(didDocument)
  // Sign it with DID root key
  .signMessage(doc => didRootKey.sign(doc))
  // Configure ConsensusMessageSubmitTransaction, build it and sign if required by DID topic
  .buildAndSignTransaction(tx => tx.setMaxTransactionFee(new Hbar(2)))
  // Define callback function when consensus was reached and DID document came back from mirror node
  .onMessageConfirmed(msg => {
    //DID document published!
  })
  // Execute transaction
  .execute(client);
```

[did-method-spec]: https://github.com/hashgraph/did-method
[did-core]: https://www.w3.org/TR/did-core/
[vc-data-model]: https://www.w3.org/TR/vc-data-model/

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
For run tests you need to create and fill ```test/variables.js``` file before. There is ```test/variables.js.sample``` file as example.

Update the following environment variables with your `testnet` account details

* OPERATOR_ID=0.0.xxxx
* OPERATOR_KEY=302...

You may also edit the following to use a different network (ensure your OPERATOR_ID and OPERATOR_KEY are valid)

* NETWORK=testnet (can be `testnet`, `previewnet` or `mainnet`)
* MIRROR_PROVIDER=hedera (can be `hedera` or `kabuto` (note `kabuto` not available on `previewnet`))

Run tests
```
npm run test
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
