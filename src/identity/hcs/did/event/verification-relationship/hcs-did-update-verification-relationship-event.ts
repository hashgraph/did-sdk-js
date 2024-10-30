import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../../utils/hashing";
import { HcsDidCreateVerificationRelationshipEvent } from "./hcs-did-create-verification-relationship-event";

export class HcsDidUpdateVerificationRelationshipEvent extends HcsDidCreateVerificationRelationshipEvent {
    static fromJsonTree(tree: any): HcsDidUpdateVerificationRelationshipEvent {
        const publicKey = PublicKey.fromBytes(Hashing.base58.decode(tree?.publicKeyBase58));
        return new HcsDidUpdateVerificationRelationshipEvent(
            tree?.id,
            tree?.relationshipType,
            tree?.type,
            tree?.controller,
            publicKey
        );
    }
}
