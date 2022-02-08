import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../..";
import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventTargetName } from "../hcs-did-event-target-name";
import { VerificationRelationshipSupportedKeyType, VerificationRelationshipType } from "./types";

export class HcsDidCreateVerificationRelationshipEvent extends HcsDidEvent {
    public readonly targetName = HcsDidEventTargetName.VERIFICATION_RELATIONSHIP;

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
            [this.targetName]: {
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

    static fromJsonTree(tree: any): HcsDidCreateVerificationRelationshipEvent {
        if (!tree.id || !tree.relationshipType || !tree.type || !tree.controller || !tree.publicKeyMultibase) {
            throw new Error(
                "Tree data is missing one of the attributes: id, relationshipType, type, controller, publicKeyMultibase"
            );
        }

        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree.publicKeyMultibase));
        return new HcsDidCreateVerificationRelationshipEvent(
            tree.id,
            tree.relationshipType,
            tree.type,
            tree.controller,
            publicKey
        );
    }
}
