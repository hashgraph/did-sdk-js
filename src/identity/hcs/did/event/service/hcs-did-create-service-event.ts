import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventTargetName } from "../hcs-did-event-target-name";
import { ServiceTypes } from "./types";

export class HcsDidCreateServiceEvent extends HcsDidEvent {
    public readonly targetName = HcsDidEventTargetName.SERVICE;

    protected id: string;
    protected type: ServiceTypes;
    protected serviceEndpoint: string;

    constructor(id: string, type: ServiceTypes, serviceEndpoint: string) {
        super();

        this.id = id;
        this.type = type;
        this.serviceEndpoint = serviceEndpoint;
    }

    public getId() {
        return this.id;
    }

    public getType() {
        return this.type;
    }

    public getServiceEndpoint() {
        return this.serviceEndpoint;
    }

    public toJsonTree() {
        return {
            [this.targetName]: {
                id: this.getId(),
                type: this.getType(),
                serviceEndpoint: this.getServiceEndpoint(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidCreateServiceEvent {
        if (!tree.id || !tree.type || !tree.serviceEndpoint) {
            throw new Error("Tree data is missing one of the attributes: id, type, serviceEndpoint");
        }
        return new HcsDidCreateServiceEvent(tree.id, tree.type, tree.serviceEndpoint);
    }
}
