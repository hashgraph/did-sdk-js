import { HcsDidServiceEvent } from "..";
import { DidDocumentJsonProperties } from "./did-document-json-properties";
import { DidSyntax } from "./did-syntax";
import { HcsDidRootKey } from "./hcs/did/hcs-did-root-key";

export class DidDocumentBase {
    private id: string;
    private context: string;
    private didRootKey: HcsDidRootKey;
    private services: HcsDidServiceEvent[];

    constructor(did: string) {
        this.id = did;
        this.context = DidSyntax.DID_DOCUMENT_CONTEXT;
        this.services = [];
    }

    /**
     * TODO: inverstigate, how fexible this method should be? Should it still support old format?
     */
    public static fromJson(json: string): DidDocumentBase {
        let result: DidDocumentBase;

        try {
            const root = JSON.parse(json);
            result = new DidDocumentBase(root.id);
            if (root.hasOwnProperty(DidDocumentJsonProperties.VERIFICATION_METHOD)) {
                if (!Array.isArray(root[DidDocumentJsonProperties.VERIFICATION_METHOD])) {
                    throw new Error(`${root[DidDocumentJsonProperties.VERIFICATION_METHOD]} is not an array`);
                }
                for (let publicKeyObj of root[DidDocumentJsonProperties.VERIFICATION_METHOD]) {
                    if (
                        publicKeyObj.hasOwnProperty(DidDocumentJsonProperties.ID) &&
                        publicKeyObj[DidDocumentJsonProperties.ID] === result.getId() + HcsDidRootKey.DID_ROOT_KEY_NAME
                    ) {
                        const didRootKey = HcsDidRootKey.fromJsonTree(publicKeyObj);
                        result.setDidRootKey(didRootKey);
                        break;
                    }
                }
            }
        } catch (e) {
            throw new Error("Given JSON string is not a valid DID document " + e.message);
        }

        return result;
    }

    public getContext(): string {
        return this.context;
    }

    public getId(): string {
        return this.id;
    }

    public getServices(): HcsDidServiceEvent[] {
        return this.services;
    }

    public addService(service: HcsDidServiceEvent): void {
        this.services.push(service);
    }

    public getDidRootKey(): HcsDidRootKey {
        return this.didRootKey;
    }

    public setDidRootKey(rootKey: HcsDidRootKey): void {
        this.didRootKey = rootKey;
    }

    public toJsonTree(): any {
        let rootObject = {};
        rootObject[DidDocumentJsonProperties.CONTEXT] = this.context;
        rootObject[DidDocumentJsonProperties.ID] = this.id;

        rootObject[DidDocumentJsonProperties.ASSERTION_METHOD] = [this.didRootKey.getId()];
        rootObject[DidDocumentJsonProperties.AUTHENTICATION] = [this.didRootKey.getId()];
        rootObject[DidDocumentJsonProperties.VERIFICATION_METHOD] = [this.didRootKey.toJsonTree()];

        if (this.getServices().length > 0) {
            rootObject[DidDocumentJsonProperties.SERVICE] = [];
            this.getServices().forEach((service) => {
                rootObject[DidDocumentJsonProperties.SERVICE].push(service.toJsonTree().Service);
            });
        }

        return rootObject;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }
}
