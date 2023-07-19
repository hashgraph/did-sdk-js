import { AccountId, Client, PrivateKey } from "@hashgraph/sdk";
import { Resolver } from "did-resolver";
import { Hashing, HcsDid, HederaDidResolver } from "../../dist";
import { delayUntil } from "../utils";

const OPERATOR_ID = <string>process.env.OPERATOR_ID;
const OPERATOR_KEY = <string>process.env.OPERATOR_KEY;

const WAIT_BEFORE_RESOLVE_DID_FOR = parseInt(<string>process.env.WAIT_BEFORE_RESOLVE_DID_FOR);

describe("HederaDidResolver", () => {
    let client;

    beforeEach(async () => {
        const operatorId = AccountId.fromString(OPERATOR_ID);
        const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
        client = Client.forTestnet({ scheduleNetworkUpdate: false });
        client.setOperator(operatorId, operatorKey);
    });

    afterEach(() => {
        client.close();
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
            result = await resolver.resolve("");
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

            const resolver = new Resolver({
                ...new HederaDidResolver().build(),
            });

            let result: any;

            await delayUntil(async () => {
                result = await resolver.resolve(did.getIdentifier());
                return result?.didDocument?.service?.length === 1;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

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
                            publicKeyBase58: Hashing.base58.encode(privateKey.publicKey.toBytes()),
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

            const resolver = new Resolver({
                ...new HederaDidResolver().build(),
            });

            let result: any;

            await delayUntil(async () => {
                result = await resolver.resolve(did.getIdentifier());
                return result?.didDocument?.verificationMethod?.length === 0;
            }, WAIT_BEFORE_RESOLVE_DID_FOR);

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
