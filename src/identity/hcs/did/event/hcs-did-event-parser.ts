import { Hashing } from "../../../..";
import { DidMethodOperation } from "../../../did-method-operation";
import { HcsDidDeleteEvent } from "./hcs-did-delete-event";
import { HcsDidEvent } from "./hcs-did-event";
import { HcsDidEventName } from "./hcs-did-event-name";
import { HcsDidCreateDidOwnerEvent } from "./owner/hcs-did-create-did-owner-event";
import { HcsDidCreateServiceEvent } from "./service/hcs-did-create-service-event";
import { HcsDidRevokeServiceEvent } from "./service/hcs-did-revoke-service-event";
import { HcsDidUpdateServiceEvent } from "./service/hcs-did-update-service-event";
import { HcsDidCreateVerificationMethodEvent } from "./verification-method/hcs-did-create-verification-method-event";
import { HcsDidRevokeVerificationMethodEvent } from "./verification-method/hcs-did-revoke-verification-method-event";
import { HcsDidUpdateVerificationMethodEvent } from "./verification-method/hcs-did-update-verification-method-event";
import { HcsDidCreateVerificationRelationshipEvent } from "./verification-relationship/hcs-did-create-verification-relationship-event";
import { HcsDidRevokeVerificationRelationshipEvent } from "./verification-relationship/hcs-did-revoke-verification-relationship-event";
import { HcsDidUpdateVerificationRelationshipEvent } from "./verification-relationship/hcs-did-update-verification-relationship-event";

const EVENT_NAME_TO_CLASS = {
    [DidMethodOperation.CREATE]: {
        [HcsDidEventName.DID_OWNER]: HcsDidCreateDidOwnerEvent,
        [HcsDidEventName.SERVICE]: HcsDidCreateServiceEvent,
        [HcsDidEventName.VERIFICATION_METHOD]: HcsDidCreateVerificationMethodEvent,
        [HcsDidEventName.VERIFICATION_RELATIONSHIP]: HcsDidCreateVerificationRelationshipEvent,
    },
    [DidMethodOperation.UPDATE]: {
        [HcsDidEventName.SERVICE]: HcsDidUpdateServiceEvent,
        [HcsDidEventName.VERIFICATION_METHOD]: HcsDidUpdateVerificationMethodEvent,
        [HcsDidEventName.VERIFICATION_RELATIONSHIP]: HcsDidUpdateVerificationRelationshipEvent,
    },
    [DidMethodOperation.REVOKE]: {
        [HcsDidEventName.SERVICE]: HcsDidRevokeServiceEvent,
        [HcsDidEventName.VERIFICATION_METHOD]: HcsDidRevokeVerificationMethodEvent,
        [HcsDidEventName.VERIFICATION_RELATIONSHIP]: HcsDidRevokeVerificationRelationshipEvent,
    },
    [DidMethodOperation.DELETE]: {
        [HcsDidEventName.DELETE]: HcsDidDeleteEvent,
    },
};

export class HcsDidEventParser {
    static fromBase64(operation: DidMethodOperation, eventBase64: any): HcsDidEvent {
        const tree = JSON.parse(Hashing.base64.decode(eventBase64));
        const eventsByOpration = EVENT_NAME_TO_CLASS[operation];
        const eventName = Object.keys(eventsByOpration).find((eventName) => !!tree[eventName]);

        if (!eventName) {
            // return null;
            throw new Error("Invalid DID event");
        }

        return eventsByOpration[eventName].fromJsonTree(tree[eventName]);
    }
}
