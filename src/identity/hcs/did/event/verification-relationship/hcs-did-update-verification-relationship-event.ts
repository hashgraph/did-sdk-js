import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../..";
import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventName } from "../hcs-did-event-name";
import { VerificationRelationshipSupportedKeyType, VerificationRelationshipType } from "./types";

export class HcsDidUpdateVerificationRelationshipEvent extends HcsDidEvent {
    public readonly name = HcsDidEventName.VERIFICATION_RELATIONSHIP;

    protected id: string;
    protected type: VerificationRelationshipSupportedKeyType = "Ed25519VerificationKey2018";
    protected relationshipType: VerificationRelationshipType;
    protected controller: string;
    protected publicKey: PublicKey;

    constructor(
        id: string,
        relationshipType: VerificationRelationshipType,
        type: VerificationRelationshipSupportedKeyType,
        controller: string,
        publicKey: PublicKey
    ) {
        super();

        this.id = id;
        this.type = type;
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

    static fromJsonTree(tree: any): HcsDidUpdateVerificationRelationshipEvent {
        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree.publicKeyMultibase));
        return new HcsDidUpdateVerificationRelationshipEvent(
            tree.id,
            tree.relationshipType,
            tree.type,
            tree.controller,
            publicKey
        );
    }
}
