import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../..";
import { HcsDidEvent } from "./hcs-did-event";
import { HcsDidEventName } from "./hcs-did-event-name";

export type VerificationRelationshipType =
    | "authentication"
    | "assertionMethod"
    | "keyAgreement"
    | "capabilityInvocation"
    | "capabilityDelegation";

export class HcsDidVerificationRelationshipEvent extends HcsDidEvent {
    public static KEY_TYPE = "Ed25519VerificationKey2018";

    protected readonly name = HcsDidEventName.VERIFICATION_RELATIONSHIP;

    protected id: string;
    protected type = HcsDidVerificationRelationshipEvent.KEY_TYPE;
    protected relationshipType: VerificationRelationshipType;
    protected controller: string;
    protected publicKey: PublicKey;

    /**
     * TODO: I guess controller param is not necessary and can be derived from the publicKey, right?
     */
    constructor(id: string, relationshipType: VerificationRelationshipType, controller: string, publicKey: PublicKey) {
        super();

        this.id = id;
        this.relationshipType = relationshipType;
        this.controller = controller;
        this.publicKey = publicKey;
    }

    public getId() {
        return this.id;
    }

    public getType() {
        return this.type;
    }

    public getRelationshipType() {
        return this.relationshipType;
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
                relationshipType: this.getRelationshipType(),
                type: this.getType(),
                controller: this.getController(),
                publicKeyMultibase: this.getPublicKeyMultibase(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidVerificationRelationshipEvent {
        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree.publicKeyMultibase));
        return new HcsDidVerificationRelationshipEvent(tree.id, tree.relationshipType, tree.controller, publicKey);
    }
}
