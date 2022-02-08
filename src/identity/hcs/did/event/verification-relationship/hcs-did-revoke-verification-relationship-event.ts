import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventTargetName } from "../hcs-did-event-target-name";
import { VerificationRelationshipType } from "./types";

export class HcsDidRevokeVerificationRelationshipEvent extends HcsDidEvent {
    public readonly targetName = HcsDidEventTargetName.VERIFICATION_RELATIONSHIP;

    protected id: string;
    protected relationshipType: VerificationRelationshipType;

    constructor(id: string, relationshipType: VerificationRelationshipType) {
        super();

        this.id = id;
        this.relationshipType = relationshipType;
    }

    public getId() {
        return this.id;
    }

    public getRelationshipType() {
        return this.relationshipType;
    }

    public toJsonTree() {
        return {
            [this.targetName]: {
                id: this.getId(),
                relationshipType: this.getRelationshipType(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidRevokeVerificationRelationshipEvent {
        if (!tree.id || !tree.relationshipType) {
            throw new Error("Tree data is missing one of the attributes: id, relationshipType");
        }
        return new HcsDidRevokeVerificationRelationshipEvent(tree.id, tree.relationshipType);
    }
}
