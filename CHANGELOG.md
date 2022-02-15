
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# v1.0.0

## Removed

* Generation of decentralized identifiers and creation of DID documents based on old [Hedera DID Method][did-method-spec]
* Creation of `identity networks` within `appnets`.
* Address book - a file on `Hedera File Service` that provides information about HCS topics and `appnet servers`.
* Creation and initialization of the `VC topic` - an HCS topic playing a role of verifiable credentials registry.
* Creation (publishing), update, deletion and resolution of DID documents in `appnet identity networks`.
* Issuance, revocation and status verification of `Verifiable Credentials`.

## Added

* Generation of decentralized identifiers and creation of DID documents based on new [Hedera DID Method][did-method-spec]
 Creation and initialization of the DID registration on `HCS Private Topic`
* Create, update, revoke, deletion, and resolution of DID documents based on [DID Document Core Properties][did-core-prop] `event/log messages` recorded on `HCS Topic`
* Transferring ownership of DID identifier and DID Document to another party.
* Publishing **DID Events Messages** to resolve and validate **DID Document**

[did-core-prop]: https://w3c.github.io/did-core/#core-properties
[did-method-spec]: https://github.com/hashgraph/did-method

### DID API's

* Generate & Register

    ```js
    ...
    const registeredDid = await did.register();
    ```

* Resolve

    ```js
    ...
    const didDoc = await registeredDid.resolve();
    ```

* Change Ownership

    ```js
    ...
    await registeredDid.changeOwner({
    controller: newOwnerIdentifier,
    newPrivateKey: newOwnerDidPrivateKey,
    });
    ```

* Create, Update and Revoke [DID Document Core Properties][did-core-prop]
  * Service

    ```js
    ...
    await registeredDid.addService({
        id: serviceIdentifier + "#service-1",
        type: "LinkedDomains",
        serviceEndpoint: "https://example.com/vcs",
    });
    ...
    await registeredDid.updateService({
        id: serviceIdentifier + "#service-1",
        type: "LinkedDomains",
        serviceEndpoint: "https://test.com/did",
    });
    ...
    await registeredDid.revokeService({
        id: serviceIdentifier + "#service-1",
    });
    ```

* Verification Method

    ```js
    ...
    await registeredDid.addVerificationMethod({
        id: verificationMethodIdentifier + "#key-1",
        type: "Ed25519VerificationKey2018",
        controller: registeredDid.getIdentifier(),
        publicKey: verificationMethodPublicKey,
    });
    ...
    await registeredDid.updateVerificationMethod({
        id: verificationMethodIdentifier + "#key-1",
        type: "Ed25519VerificationKey2018",
        controller: registeredDid.getIdentifier(),
        publicKey: updatedVerificationMethodPublicKey,
    });
    ...
    await registeredDid.revokeVerificationMethod({
        id: verificationMethodIdentifier + "#key-1",
    });
    ```

* Verification Relationship

    ```js
    ...
    await registeredDid.addVerificationRelationship({
        id: verificationRelationshipIdentifier + "#key-1",
        relationshipType: verificationRelationshipType,
        type: "Ed25519VerificationKey2018",
        controller: registeredDid.getIdentifier(),
        publicKey: verificationRelationshipPublicKey,
    });
    ...
    await registeredDid.updateVerificationRelationship({
        id: verificationRelationshipIdentifier + "#key-1",
        relationshipType: verificationRelationshipType,
        type: "Ed25519VerificationKey2018",
        controller: registeredDid.getIdentifier(),
        publicKey: updatedVerificationRelationshipPublicKey,
    });
    ...
    await registeredDid.revokeVerificationRelationship({
        id: verificationRelationshipIdentifier + "#key-1",
        relationshipType: verificationRelationshipType,
    });
    ```
