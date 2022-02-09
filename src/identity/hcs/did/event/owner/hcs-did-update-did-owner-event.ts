import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../..";
import { HcsDidCreateDidOwnerEvent } from "./hcs-did-create-did-owner-event";

export class HcsDidUpdateDidOwnerEvent extends HcsDidCreateDidOwnerEvent {
    static fromJsonTree(tree: any): HcsDidUpdateDidOwnerEvent {
        if (!tree.id || !tree.controller || !tree.publicKeyMultibase) {
            throw new Error("Tree data is missing one of the attributes: id, controller, publicKeyMultibase");
        }

        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree.publicKeyMultibase));
        return new HcsDidUpdateDidOwnerEvent(tree.id, tree.controller, publicKey);
    }
}
