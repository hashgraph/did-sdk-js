import { HcsDidCreateServiceEvent } from "./hcs-did-create-service-event";

export class HcsDidUpdateServiceEvent extends HcsDidCreateServiceEvent {
    static fromJsonTree(tree: any): HcsDidCreateServiceEvent {
        return new HcsDidUpdateServiceEvent(tree?.id, tree?.type, tree?.serviceEndpoint);
    }
}
