import NodeClient from "@hashgraph/sdk/lib/client/NodeClient";
import {
    DIDDocumentMetadata,
    DIDResolutionOptions,
    DIDResolutionResult,
    DIDResolver,
    ParsedDID,
    Resolvable,
} from "did-resolver";
import { DidErrorCode } from "..";
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
        _parsed: ParsedDID,
        _unused: Resolvable,
        options: DIDResolutionOptions
    ): Promise<DIDResolutionResult> {
        //TODO: check network

        try {
            const registeredDid = new HcsDid({ identifier: did, client: this.client });
            const didDocument = await registeredDid.resolve();
            const status: Partial<DIDDocumentMetadata> = didDocument.getDeactivated() ? { deactivated: true } : {};

            let documentMeta: Partial<DIDDocumentMetadata> = {
                versionId: didDocument.getVersionId(),
            };

            if (!status.deactivated) {
                documentMeta = {
                    ...documentMeta,
                    created: didDocument.getCreated().toDate().toISOString(),
                    updated: didDocument.getUpdated().toDate().toISOString(),
                };
            }

            return {
                didDocumentMetadata: { ...status, ...documentMeta },
                didResolutionMetadata: { contentType: "application/did+ld+json" },
                didDocument: didDocument.toJsonTree(),
            };
        } catch (e: any) {
            return {
                didResolutionMetadata: {
                    error: this.getErrorCode(e),
                    message: e.toString(), // This is not in spec, but may be helpful
                },
                didDocumentMetadata: {},
                didDocument: null,
            };
        }
    }

    build(): Record<string, DIDResolver> {
        return { hedera: this.resolve.bind(this) };
    }

    private getErrorCode(error: any): Errors {
        switch (error?.code) {
            case DidErrorCode.INVALID_DID_STRING:
                return Errors.invalidDid;
            case DidErrorCode.INVALID_NETWORK:
                return Errors.unknownNetwork;
            case DidErrorCode.DID_NOT_FOUND:
                return Errors.notFound;
            default:
                return Errors.notFound;
        }
    }
}
