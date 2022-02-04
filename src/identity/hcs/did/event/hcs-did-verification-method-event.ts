import { PublicKey } from "@hashgraph/sdk";
import { DidDocumentBase, Hashing } from "../../../..";
import { HcsDidEvent } from "./hcs-did-event";
import { HcsDidEventName } from "./hcs-did-event-name";

export type VerificationMethodSupportedKeyType = "Ed25519VerificationKey2018";
export class HcsDidVerificationMethodEvent extends HcsDidEvent {
    protected readonly name = HcsDidEventName.VERIFICATION_METHOD;

    protected id: string;
    protected type: VerificationMethodSupportedKeyType;
    protected controller: string;
    protected publicKey: PublicKey;

    /**
     * TODO: I guess controller param is not necessary and can be derived from the publicKey, right?
     */
    constructor(id: string, type: VerificationMethodSupportedKeyType, controller: string, publicKey: PublicKey) {
        super();

        this.id = id;
        this.type = type;
        this.controller = controller;
        this.publicKey = publicKey;
    }

    public getId() {
        return this.id;
    }

    public getType() {
        return this.type;
    }

    public getController() {
        return this.controller;
    }

    public getPublicKey() {
        return this.publicKey;
    }

    public getPublicKeyMultibase() {
        return Hashing.multibase.encode(this.getPublicKey().toBytes());
    }

    public toJsonTree() {
        return {
            [this.name]: {
                id: this.getId(),
                type: this.getType(),
                controller: this.getController(),
                publicKeyMultibase: this.getPublicKeyMultibase(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidVerificationMethodEvent {
        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree.publicKeyMultibase));
        return new HcsDidVerificationMethodEvent(tree.id, tree.type, tree.controller, publicKey);
    }

    // TODO: apply verification method event
    process(didDoc: DidDocumentBase): DidDocumentBase {
        throw new Error("Method not implemented.");
    }
}
