import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../..";
import { HcsDidCreateVerificationMethodEvent } from "./hcs-did-create-verification-method-event";

export class HcsDidUpdateVerificationMethodEvent extends HcsDidCreateVerificationMethodEvent {
    static fromJsonTree(tree: any): HcsDidCreateVerificationMethodEvent {
        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree?.publicKeyMultibase));
        return new HcsDidUpdateVerificationMethodEvent(tree?.id, tree?.type, tree?.controller, publicKey);
    }
}
