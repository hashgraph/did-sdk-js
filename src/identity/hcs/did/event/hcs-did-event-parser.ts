import { Hashing } from "../../../../utils/hashing";
import { DidMethodOperation } from "../../../did-method-operation";
import { HcsDidCreateDidDocumentEvent } from "./document/hcs-did-create-did-document-event";
import { HcsDidDeleteEvent } from "./document/hcs-did-delete-event";
import { HcsDidEvent } from "./hcs-did-event";
import { HcsDidEventTargetName } from "./hcs-did-event-target-name";
import { HcsDidCreateDidOwnerEvent } from "./owner/hcs-did-create-did-owner-event";
import { HcsDidUpdateDidOwnerEvent } from "./owner/hcs-did-update-did-owner-event";
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
        [HcsDidEventTargetName.DID_OWNER]: HcsDidCreateDidOwnerEvent,
        [HcsDidEventTargetName.DID_DOCUMENT]: HcsDidCreateDidDocumentEvent,
        [HcsDidEventTargetName.SERVICE]: HcsDidCreateServiceEvent,
        [HcsDidEventTargetName.VERIFICATION_METHOD]: HcsDidCreateVerificationMethodEvent,
        [HcsDidEventTargetName.VERIFICATION_RELATIONSHIP]: HcsDidCreateVerificationRelationshipEvent,
    },
    [DidMethodOperation.UPDATE]: {
        [HcsDidEventTargetName.DID_OWNER]: HcsDidUpdateDidOwnerEvent,
        [HcsDidEventTargetName.SERVICE]: HcsDidUpdateServiceEvent,
        [HcsDidEventTargetName.VERIFICATION_METHOD]: HcsDidUpdateVerificationMethodEvent,
        [HcsDidEventTargetName.VERIFICATION_RELATIONSHIP]: HcsDidUpdateVerificationRelationshipEvent,
    },
    [DidMethodOperation.REVOKE]: {
        [HcsDidEventTargetName.SERVICE]: HcsDidRevokeServiceEvent,
        [HcsDidEventTargetName.VERIFICATION_METHOD]: HcsDidRevokeVerificationMethodEvent,
        [HcsDidEventTargetName.VERIFICATION_RELATIONSHIP]: HcsDidRevokeVerificationRelationshipEvent,
    },
};

export class HcsDidEventParser {
    static fromBase64(operation: DidMethodOperation, eventBase64: any): HcsDidEvent {
        if (operation === DidMethodOperation.DELETE) {
            return HcsDidDeleteEvent.fromJsonTree(null);
        }

        try {
            const tree = JSON.parse(Hashing.base64.decode(eventBase64));
            const eventsByOperation = EVENT_NAME_TO_CLASS[operation];
            const eventTargetName = Object.keys(eventsByOperation).find((etn) => !!tree[etn]);

            return eventsByOperation[eventTargetName].fromJsonTree(tree[eventTargetName]);
        } catch {
            return null;
        }
    }
}
