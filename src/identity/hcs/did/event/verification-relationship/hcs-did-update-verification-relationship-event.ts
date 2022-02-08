import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../../../..";
import { HcsDidCreateVerificationRelationshipEvent } from "./hcs-did-create-verification-relationship-event";

export class HcsDidUpdateVerificationRelationshipEvent extends HcsDidCreateVerificationRelationshipEvent {
    static fromJsonTree(tree: any): HcsDidUpdateVerificationRelationshipEvent {
        if (!tree.id || !tree.relationshipType || !tree.type || !tree.controller || !tree.publicKeyMultibase) {
            throw new Error(
                "Tree data is missing one of the attributes: id, relationshipType, type, controller, publicKeyMultibase"
            );
        }

        const publicKey = PublicKey.fromBytes(Hashing.multibase.decode(tree.publicKeyMultibase));
        return new HcsDidUpdateVerificationRelationshipEvent(
            tree.id,
            tree.relationshipType,
            tree.type,
            tree.controller,
            publicKey
        );
    }
}
