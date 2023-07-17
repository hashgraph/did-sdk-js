import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../../utils/hashing";
import { HcsDidCreateDidOwnerEvent } from "./hcs-did-create-did-owner-event";

export class HcsDidUpdateDidOwnerEvent extends HcsDidCreateDidOwnerEvent {
    static fromJsonTree(tree: any): HcsDidUpdateDidOwnerEvent {
        const publicKey = PublicKey.fromBytes(Hashing.base58.decode(tree?.publicKeyBase58));
        return new HcsDidUpdateDidOwnerEvent(tree?.id, tree?.controller, publicKey);
    }
}
