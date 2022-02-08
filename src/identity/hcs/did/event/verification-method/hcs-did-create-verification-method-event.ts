import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../..";
import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventName } from "../hcs-did-event-name";
import { VerificationMethodSupportedKeyType } from "./types";

export class HcsDidCreateVerificationMethodEvent extends HcsDidEvent {
    public readonly name = HcsDidEventName.VERIFICATION_METHOD;

    protected id: string;
    protected type: VerificationMethodSupportedKeyType;
    protected controller: string;
    protected publicKey: PublicKey;

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

    static fromJsonTree(tree: any): HcsDidCreateVerificationMethodEvent {
        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree.publicKeyMultibase));
        return new HcsDidCreateVerificationMethodEvent(tree.id, tree.type, tree.controller, publicKey);
    }
}
