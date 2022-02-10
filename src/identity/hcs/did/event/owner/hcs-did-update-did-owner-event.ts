import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../..";
import { HcsDidCreateDidOwnerEvent } from "./hcs-did-create-did-owner-event";

export class HcsDidUpdateDidOwnerEvent extends HcsDidCreateDidOwnerEvent {
    static fromJsonTree(tree: any): HcsDidUpdateDidOwnerEvent {
        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree?.publicKeyMultibase));
        return new HcsDidUpdateDidOwnerEvent(tree?.id, tree?.controller, publicKey);
    }
}
