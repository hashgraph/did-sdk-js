import { HcsDidEvent } from "./hcs-did-event";
import { HcsDidEventName } from "./hcs-did-event-name";

export type ServiceTypes = "LinkedDomains" | "DIDCommMessaging";

export class HcsDidServiceEvent extends HcsDidEvent {
    public readonly name = HcsDidEventName.SERVICE;

    protected id: string;
    protected type: ServiceTypes;
    protected serviceEndpoint: string;

    /**
     * TODO: are there any restrictions on type?
     */
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
            [this.name]: {
                id: this.getId(),
                type: this.getType(),
                serviceEndpoint: this.getServiceEndpoint(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidServiceEvent {
        return new HcsDidServiceEvent(tree.id, tree.type, tree.serviceEndpoint);
    }
}
