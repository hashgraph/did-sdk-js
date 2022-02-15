import NodeClient from "@hashgraph/sdk/lib/client/NodeClient";
import { DIDResolutionOptions, DIDResolutionResult, DIDResolver, ParsedDID, Resolvable } from "did-resolver";
import { HcsDid } from "./hcs/did/hcs-did";

export enum Errors {
    /**
     * The resolver has failed to construct the DID document.
     * This can be caused by a network issue, a wrong registry address or malformed logs while parsing the registry history.
     * Please inspect the `DIDResolutionMetadata.message` to debug further.
     */
    notFound = "notFound",

    /**
     * The resolver does not know how to resolve the given DID. Most likely it is not a `did:hedera`.
     */
    invalidDid = "invalidDid",

    /**
     * The resolver is misconfigured or is being asked to resolve a DID anchored on an unknown network
     */
    unknownNetwork = "unknownNetwork",
}

export function getResolver(client: NodeClient): Record<string, DIDResolver> {
    return new HederaDidResolver(client).build();
}

export class HederaDidResolver {
    private client: NodeClient;

    constructor(client: NodeClient) {
        this.client = client;
    }

    async resolve(
        did: string,
        parsed: ParsedDID,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _unused: Resolvable,
        options: DIDResolutionOptions
    ): Promise<DIDResolutionResult> {
        let networkName, topicId, didIdString;
        try {
            [networkName, topicId, didIdString] = HcsDid.parseIdentifier(parsed.did);
        } catch (e: any) {
            return {
                didResolutionMetadata: {
                    error: Errors.invalidDid,
                    message: `Not a valid did:hedera: ${parsed.id} \n ${e.toString()}`,
                },
                didDocumentMetadata: {},
                didDocument: null,
            };
        }

        //TODO: check network

        try {
            const registeredDid = new HcsDid({ identifier: did, client: this.client });
            const { didDocument, deactivated, versionId, nextVersionId } = (await registeredDid.resolve()).toJsonTree();
            const status = deactivated ? { deactivated: true } : {};
            let versionMeta = {
                versionId: versionId,
            };
            let versionMetaNext = {
                nextVersionId: nextVersionId,
            };

            return {
                didDocumentMetadata: { ...status, ...versionMeta, ...versionMetaNext },
                didResolutionMetadata: { contentType: "application/did+ld+json" },
                didDocument,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            return {
                didResolutionMetadata: {
                    error: Errors.notFound,
                    message: e.toString(), // This is not in spec, nut may be helpful
                },
                didDocumentMetadata: {},
                didDocument: null,
            };
        }
    }

    build(): Record<string, DIDResolver> {
        return { hedera: this.resolve.bind(this) };
    }
}
