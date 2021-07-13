# did-sdk-js
Support for the Hedera Hashgraph DID Method and Verifiable Credentials on the Hedera JavaScript/TypeScript SDK

# Usage
```
npm install --save did-sdk-js
```
Example:
```
// DID Generation

// from already instantiated network:

	const identityNetwork = ...; //HcsIdentityNetwork
	// From a given DID root key:
	const didRootKey = ...; //PrivateKey
	const hcsDid = identityNetwork.generateDid(didRootKey.publicKey, false);

// Or:

	// Without having a DID root key - it will be generated automatically:
	// Here we decided to add DID topic ID parameter `tid` to the DID.
	const hcsDidWithDidRootKey = identityNetwork.generateDid(true);
	const didRootKeyPrivateKey = hcsDidWithDidRootKey.getPrivateDidRootKey().get();

// or by directly constructing HcsDid object:

	const didRootKey = HcsDid.generateDidRootKey();
	const addressBookFileId = FileId.fromString("<hedera.address-book-file.id>");

	const hcsDid = new HcsDid(HederaNetwork.TESTNET, didRootKey.publicKey, addressBookFileId);

// Existing Hedera DID strings can be parsed into HcsDid object by calling fromString method:

	const didString = "did:hedera:testnet:7c38oC4ytrYDGCqsaZ1AXt7ZPQ8etzfwaxoKjfJNzfoc;hedera:testnet:fid=0.0.1";
	const did = HcsDid.fromString(didString);

// Transaction

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

# Development
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

# Tests
For run tests you need to create and fill ```test/variables.js``` file before. There is ```test/variables.js.sample``` file as example.

Run tests
```
npm run test
```
