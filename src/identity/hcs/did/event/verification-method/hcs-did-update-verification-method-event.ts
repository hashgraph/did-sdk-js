import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../..";
import { HcsDidCreateVerificationMethodEvent } from "./hcs-did-create-verification-method-event";

export class HcsDidUpdateVerificationMethodEvent extends HcsDidCreateVerificationMethodEvent {
    static fromJsonTree(tree: any): HcsDidCreateVerificationMethodEvent {
        if (!tree.id || !tree.type || !tree.controller || !tree.publicKeyMultibase) {
            throw new Error("Tree data is missing one of the attributes: id, type, controller, publicKeyMultibase");
        }

        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree.publicKeyMultibase));
        return new HcsDidUpdateVerificationMethodEvent(tree.id, tree.type, tree.controller, publicKey);
    }
}
