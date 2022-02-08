import { HcsDidCreateServiceEvent } from "./hcs-did-create-service-event";

export class HcsDidUpdateServiceEvent extends HcsDidCreateServiceEvent {
    static fromJsonTree(tree: any): HcsDidCreateServiceEvent {
        if (!tree.id || !tree.type || !tree.serviceEndpoint) {
            throw new Error("Tree data is missing one of the attributes: id, type, serviceEndpoint");
        }
        return new HcsDidUpdateServiceEvent(tree.id, tree.type, tree.serviceEndpoint);
    }
}
