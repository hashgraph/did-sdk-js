import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../../utils/hashing";
import { DidError } from "../../../../did-error";
import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventTargetName } from "../hcs-did-event-target-name";
import { VerificationMethodSupportedKeyType } from "./types";

export class HcsDidCreateVerificationMethodEvent extends HcsDidEvent {
    public readonly targetName = HcsDidEventTargetName.VERIFICATION_METHOD;

    protected id: string;
    protected type: VerificationMethodSupportedKeyType;
    protected controller: string;
    protected publicKey: PublicKey;

    constructor(id: string, type: VerificationMethodSupportedKeyType, controller: string, publicKey: PublicKey) {
        super();

        if (!id || !type || !controller || !publicKey) {
            throw new DidError("Validation failed. Verification Method args are missing");
        }

        if (!this.isKeyEventIdValid(id)) {
            throw new DidError("Event ID is invalid. Expected format: {did}#key-{integer}");
        }

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
                type: this.getType(),
                controller: this.getController(),
                publicKeyBase58: this.getPublicKeyBase58(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidCreateVerificationMethodEvent {
        const publicKey = PublicKey.fromBytes(Hashing.base58.decode(tree?.publicKeyBase58));
        return new HcsDidCreateVerificationMethodEvent(tree?.id, tree?.type, tree?.controller, publicKey);
    }
}
