import { DidSyntax } from "./did-syntax";
import { DidDocumentJsonProperties } from "./did-document-json-properties";
import { HcsDidRootKey } from "./hcs/did/hcs-did-root-key";

export class DidDocumentBase {
    private id: string;
    private context: string;
    private didRootKey: HcsDidRootKey;

    constructor(did: string) {
        this.id = did;
        this.context = DidSyntax.DID_DOCUMENT_CONTEXT;
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

    public getDidRootKey(): HcsDidRootKey {
        return this.didRootKey;
    }

    public setDidRootKey(rootKey: HcsDidRootKey): void {
        this.didRootKey = rootKey;
    }

    public toJsonTree(): any {
        const rootObject = {};
        rootObject[DidDocumentJsonProperties.CONTEXT] = this.context;
        rootObject[DidDocumentJsonProperties.ID] = this.id;

        /**
         * TODO: investigate, should we just leave such cases crash?
         */
        if (this.didRootKey) {
            rootObject[DidDocumentJsonProperties.ASSERTION_METHOD] = [this.didRootKey.getId()];
            rootObject[DidDocumentJsonProperties.AUTHENTICATION] = [this.didRootKey.getId()];
            rootObject[DidDocumentJsonProperties.VERIFICATION_METHOD] = [this.didRootKey.toJsonTree()];
        } else {
            console.warn("WARNING: didRootKey is not set for the document");
        }

        return rootObject;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }
}
