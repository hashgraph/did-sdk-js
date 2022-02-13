import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../../utils/hashing";
import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventTargetName } from "../hcs-did-event-target-name";

export class HcsDidCreateDidOwnerEvent extends HcsDidEvent {
    public static KEY_TYPE = "Ed25519VerificationKey2018";

    public readonly targetName = HcsDidEventTargetName.DID_OWNER;

    protected id: string;
    protected type = HcsDidCreateDidOwnerEvent.KEY_TYPE;
    protected controller: string;
    protected publicKey: PublicKey;

    constructor(id: string, controller: string, publicKey: PublicKey) {
        super();

        if (!id || !controller || !publicKey) {
            throw new Error("Validation failed. DID Owner args are missing");
        }

        if (!this.isOwnerEventIdValid(id)) {
            throw new Error("Event ID is invalid. Expected format: {did}#did-root-key");
        }

        this.id = id;
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

    public getOwnerDef() {
        return {
            id: this.getId(),
            type: this.getType(),
            controller: this.getController(),
            publicKeyMultibase: this.getPublicKeyMultibase(),
        };
    }

    public toJsonTree() {
        return {
            [this.targetName]: {
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

    static fromJsonTree(tree: any): HcsDidCreateDidOwnerEvent {
        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree?.publicKeyMultibase));
        return new HcsDidCreateDidOwnerEvent(tree?.id, tree?.controller, publicKey);
    }
}
