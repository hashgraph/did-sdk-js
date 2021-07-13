# did-sdk-js
Support for the Hedera Hashgraph DID Method and Verifiable Credentials on the Hedera JavaScript/TypeScript SDK

# Usage
```
npm install --save did-sdk-js
```
Example
```
// DID generation
// From a given DID root key:
const didRootKey: PrivateKey  = ...;
const hcsDid: HcsDid = identityNetwork.generateDid(didRootKey.publicKey, false);

// Without having a DID root key - it will be generated automatically:
// Here we decided to add DID topic ID parameter `tid` to the DID.
const hcsDidWithDidRootKey: HcsDid = identityNetwork.generateDid(true);
const didRootKeyPrivateKey: PrivateKey = hcsDidWithDidRootKey.getPrivateDidRootKey().get();

// Without having a DID root key - it will be generated automatically with secure random generator:
const hcsDidSRWithDidRootKey: HcsDid = identityNetwork.generateDid(SecureRandom.getInstanceStrong(), false);
const srDidRootKeyPrivateKey: PrivateKey = hcsDidSRWithDidRootKey.getPrivateDidRootKey().get();
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
For run tests you need to create and fill ```test/variables.js``` file before. There is ```variables.js.sample``` file as example.

Run tests
```
npm run test
```
