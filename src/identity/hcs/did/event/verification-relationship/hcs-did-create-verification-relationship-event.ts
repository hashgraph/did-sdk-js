import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../../utils/hashing";
import { DidError } from "../../../../did-error";
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

        if (!id || !relationshipType || !type || !controller || !publicKey) {
            throw new DidError("Validation failed. Verification Relationship args are missing");
        }

        if (!this.isKeyEventIdValid(id)) {
            throw new DidError("Event ID is invalid. Expected format: {did}#key-{integer}");
        }

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

    public getPublicKeyBase58() {
        return Hashing.base58.encode(this.getPublicKey().toBytes());
    }

    public getVerificationMethodDef() {
        return {
            id: this.getId(),
            type: this.getType(),
            controller: this.getController(),
            publicKeyBase58: this.getPublicKeyBase58(),
        };
    }

    public toJsonTree() {
        return {
            [this.targetName]: {
                id: this.getId(),
                relationshipType: this.getRelationshipType(),
                type: this.getType(),
                controller: this.getController(),
                publicKeyBase58: this.getPublicKeyBase58(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidCreateVerificationRelationshipEvent {
        const publicKey = PublicKey.fromBytes(Hashing.base58.decode(tree?.publicKeyBase58));
        return new HcsDidCreateVerificationRelationshipEvent(
            tree?.id,
            tree?.relationshipType,
            tree?.type,
            tree?.controller,
            publicKey
        );
    }
}
