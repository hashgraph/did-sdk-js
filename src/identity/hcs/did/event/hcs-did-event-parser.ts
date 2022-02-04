import { Hashing } from "../../../..";
import { HcsDidDidOwnerEvent } from "./hcs-did-did-owner-event";
import { HcsDidEvent } from "./hcs-did-event";
import { HcsDidEventName } from "./hcs-did-event-name";
import { HcsDidServiceEvent } from "./hcs-did-service-event";
import { HcsDidVerificationMethodEvent } from "./hcs-did-verification-method-event";
import { HcsDidVerificationRelationshipEvent } from "./hcs-did-verification-relationship-event";

const EVENT_NAME_TO_CLASS = {
    [HcsDidEventName.DID_OWNER]: HcsDidDidOwnerEvent,
    [HcsDidEventName.SERVICE]: HcsDidServiceEvent,
    [HcsDidEventName.VERIFICATION_METHOD]: HcsDidVerificationMethodEvent,
    [HcsDidEventName.VERIFICATION_RELATIONSHIP]: HcsDidVerificationRelationshipEvent,
};

export class HcsDidEventParser {
    static fromBase64(eventBase64: any): HcsDidEvent {
        const tree = JSON.parse(Hashing.base64.decode(eventBase64));
        const eventName = Object.keys(EVENT_NAME_TO_CLASS).find((eventName) => !!tree[eventName]);

        if (!eventName) {
            throw new Error("Invalid DID event");
        }

        return EVENT_NAME_TO_CLASS[eventName].fromJsonTree(tree[eventName]);
    }
}
