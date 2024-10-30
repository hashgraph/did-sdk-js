import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../../utils/hashing";
import { HcsDidCreateVerificationMethodEvent } from "./hcs-did-create-verification-method-event";

export class HcsDidUpdateVerificationMethodEvent extends HcsDidCreateVerificationMethodEvent {
    static fromJsonTree(tree: any): HcsDidCreateVerificationMethodEvent {
        const publicKey = PublicKey.fromBytes(Hashing.base58.decode(tree?.publicKeyBase58));
        return new HcsDidUpdateVerificationMethodEvent(tree?.id, tree?.type, tree?.controller, publicKey);
    }
}
