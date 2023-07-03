import { AccountId, Client, PrivateKey } from "@hashgraph/sdk";
import { Resolver } from "did-resolver";
import { Hashing, HcsDid, HederaDidResolver } from "../../dist";

const OPERATOR_ID = process.env.OPERATOR_ID;
const OPERATOR_KEY = process.env.OPERATOR_KEY;
// testnet, previewnet, mainnet
const NETWORK = "testnet";

// hedera
const MIRROR_PROVIDER = ["hcs." + NETWORK + ".mirrornode.hedera.com:5600"];

function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

describe("HederaDidResolver", () => {
    let client;

    beforeAll(async () => {
        const operatorId = AccountId.fromString(OPERATOR_ID);
        const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
        client = Client.forTestnet({ scheduleNetworkUpdate: false });
        client.setMirrorNetwork(MIRROR_PROVIDER);
        client.setOperator(operatorId, operatorKey);
    });

    describe("#resolve", () => {
        it("returns error response", async () => {
            const resolver = new Resolver({
                ...new HederaDidResolver(client).build(),
            });

            let result = await resolver.resolve("did:hedera:testnet:nNCTE5bZdRmjm2obqJwS892jVLak_0.0.1");
            expect(result).toEqual({
                didDocument: null,
                didDocumentMetadata: {},
                didResolutionMetadata: {
                    error: "invalidDid",
                    message: "Error: DID string is invalid. ID holds incorrect format.",
                },
            });

            /**
             * Does not return messages because Resolver wrapper handles that
             */
            result = await resolver.resolve(null);
            expect(result).toEqual({
                didDocument: null,
                didDocumentMetadata: {},
                didResolutionMetadata: {
                    error: "invalidDid",
                },
            });

            result = await resolver.resolve(
                "did:hedera:invalidNetwork:nNCTE5bZdRmjm2obqJwS892jVLakafasdfasdfasffwvdasdfasqqwe_0.0.1"
            );
            expect(result).toEqual({
                didDocument: null,
                didDocumentMetadata: {},
                didResolutionMetadata: {
                    error: "unknownNetwork",
                    message: "Error: DID string is invalid. Invalid Hedera network.",
                },
            });
        });

        it("returns success response", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();
            await did.addService({
                id: did.getIdentifier() + "#service-1",
                type: "LinkedDomains",
                serviceEndpoint: "https://example.com/vcs",
            });

            await delay(process.env.WAIT_BEFORE_RESOLVE_DID_FOR);

            const resolver = new Resolver({
                ...new HederaDidResolver(client).build(),
            });

            let result = await resolver.resolve(did.getIdentifier());
            expect(result).toEqual({
                didDocument: {
                    "@context": "https://www.w3.org/ns/did/v1",
                    assertionMethod: [`${did.getIdentifier()}#did-root-key`],
                    authentication: [`${did.getIdentifier()}#did-root-key`],
                    id: did.getIdentifier(),
                    service: [
                        {
                            id: `${did.getIdentifier()}#service-1`,
                            serviceEndpoint: "https://example.com/vcs",
                            type: "LinkedDomains",
                        },
                    ],
                    verificationMethod: [
                        {
                            controller: did.getIdentifier(),
                            id: `${did.getIdentifier()}#did-root-key`,
                            publicKeyMultibase: Hashing.multibase.encode(privateKey.publicKey.toBytes()),
                            type: "Ed25519VerificationKey2018",
                        },
                    ],
                },
                didDocumentMetadata: {
                    created: expect.anything(),
                    updated: expect.anything(),
                    versionId: expect.anything(),
                },
                didResolutionMetadata: {
                    contentType: "application/did+ld+json",
                },
            });
        });

        it("returns deactivated did document", async () => {
            const privateKey = PrivateKey.fromString(OPERATOR_KEY);
            const did = new HcsDid({ privateKey, client });

            await did.register();
            await did.delete();

            await delay(process.env.WAIT_BEFORE_RESOLVE_DID_FOR);

            const resolver = new Resolver({
                ...new HederaDidResolver().build(),
            });

            let result = await resolver.resolve(did.getIdentifier());
            expect(result).toEqual({
                didDocument: {
                    "@context": "https://www.w3.org/ns/did/v1",
                    assertionMethod: [],
                    authentication: [],
                    id: did.getIdentifier(),
                    verificationMethod: [],
                },
                didDocumentMetadata: {
                    versionId: null,
                    deactivated: true,
                },
                didResolutionMetadata: {
                    contentType: "application/did+ld+json",
                },
            });
        });
    });
});
