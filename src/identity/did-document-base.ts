import {DidSyntax} from "./did-syntax";
import {DidDocumentJsonProperties} from "./did-document-json-properties";
import {HcsDidRootKey} from "./hcs/did/hcs-did-root-key";

export class DidDocumentBase {
    private id: string;
    private context: string;
    private didRootKey: HcsDidRootKey;

    constructor(did: string) {
        this.id = did;
        this.context = DidSyntax.DID_DOCUMENT_CONTEXT;
    }

    public static fromJson(json: string): DidDocumentBase {
        let result: DidDocumentBase;

        try {
            const root = JSON.parse(json);
            result = new DidDocumentBase(root.id);
            if (root.hasOwnProperty(DidDocumentJsonProperties.PUBLIC_KEY)) {
                if (!Array.isArray(root[DidDocumentJsonProperties.PUBLIC_KEY])) {
                    throw new Error(`${root[DidDocumentJsonProperties.PUBLIC_KEY]} is not an array`);
                }
                for (let publicKeyObj of root[DidDocumentJsonProperties.PUBLIC_KEY]) {
                    if (publicKeyObj.hasOwnProperty(DidDocumentJsonProperties.ID) && (publicKeyObj[DidDocumentJsonProperties.ID] ===
                        (result.getId() + HcsDidRootKey.DID_ROOT_KEY_NAME))) {
                        const didRootKey = HcsDidRootKey.fromJsonTree(publicKeyObj);
                        result.setDidRootKey(didRootKey);
                        break;
                    }
                }
            }
        } catch (e) {
            throw new Error('Given JSON string is not a valid DID document ' + e.message);
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
        this.didRootKey = rootKey
    }

    public toJsonTree(): any {
        const rootObject = {};
        rootObject[DidDocumentJsonProperties.CONTEXT] = this.context;
        rootObject[DidDocumentJsonProperties.ID] = this.id;
        rootObject[DidDocumentJsonProperties.PUBLIC_KEY] = [
            this.didRootKey.toJsonTree()
        ];
        rootObject[DidDocumentJsonProperties.AUTHENTICATION] = [
            this.didRootKey.getId()
        ];
        return rootObject;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }
}
