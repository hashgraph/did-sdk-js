import { DidMethodOperation, HcsDidCreateDidOwnerEvent, HcsDidCreateServiceEvent, HcsDidMessage } from "..";
import { DidDocumentJsonProperties } from "./did-document-json-properties";
import { DidSyntax } from "./did-syntax";
import { HcsDidEventName } from "./hcs/did/event/hcs-did-event-name";
import { HcsDidUpdateServiceEvent } from "./hcs/did/event/service/hcs-did-update-service-event";
import { HcsDidCreateVerificationMethodEvent } from "./hcs/did/event/verification-method/hcs-did-create-verification-method-event";
import { HcsDidUpdateVerificationMethodEvent } from "./hcs/did/event/verification-method/hcs-did-update-verification-method-event";
import { HcsDidCreateVerificationRelationshipEvent } from "./hcs/did/event/verification-relationship/hcs-did-create-verification-relationship-event";
import { HcsDidUpdateVerificationRelationshipEvent } from "./hcs/did/event/verification-relationship/hcs-did-update-verification-relationship-event";

export class DidDocument {
    private id: string;
    private context: string;

    private owners: Map<string, any> = new Map();
    private services: Map<string, any> = new Map();
    private verificationMethods: Map<string, any> = new Map();

    private verificationRelationships: { [key: string]: string[] } = {
        authentication: [],
        assertionMethod: [],
        keyAgreement: [],
        capabilityInvocation: [],
        capabilityDelegation: [],
    };

    constructor(did: string, messages: HcsDidMessage[]) {
        this.id = did;
        this.context = DidSyntax.DID_DOCUMENT_CONTEXT;

        this.processMessages(messages);
    }

    public getContext(): string {
        return this.context;
    }

    public getId(): string {
        return this.id;
    }

    public toJsonTree(): any {
        let rootObject = {};

        rootObject[DidDocumentJsonProperties.CONTEXT] = this.context;
        rootObject[DidDocumentJsonProperties.ID] = this.id;

        rootObject[DidDocumentJsonProperties.VERIFICATION_METHOD] = [
            ...Array.from(this.owners.values()),
            ...Array.from(this.verificationMethods.values()),
        ];

        rootObject[DidDocumentJsonProperties.ASSERTION_METHOD] = [
            ...Array.from(this.owners.keys()),
            ...this.verificationRelationships[DidDocumentJsonProperties.ASSERTION_METHOD],
        ];

        rootObject[DidDocumentJsonProperties.AUTHENTICATION] = [
            ...Array.from(this.owners.keys()),
            ...this.verificationRelationships[DidDocumentJsonProperties.AUTHENTICATION],
        ];

        if (this.verificationRelationships[DidDocumentJsonProperties.KEY_AGREEMENT].length > 0) {
            rootObject[DidDocumentJsonProperties.KEY_AGREEMENT] = [
                ...this.verificationRelationships[DidDocumentJsonProperties.KEY_AGREEMENT],
            ];
        }
        if (this.verificationRelationships[DidDocumentJsonProperties.CAPABILITY_INVOCATION].length > 0) {
            rootObject[DidDocumentJsonProperties.CAPABILITY_INVOCATION] = [
                ...this.verificationRelationships[DidDocumentJsonProperties.CAPABILITY_INVOCATION],
            ];
        }
        if (this.verificationRelationships[DidDocumentJsonProperties.CAPABILITY_DELEGATION].length > 0) {
            rootObject[DidDocumentJsonProperties.CAPABILITY_DELEGATION] = [
                ...this.verificationRelationships[DidDocumentJsonProperties.CAPABILITY_DELEGATION],
            ];
        }

        if (this.services.size > 0) {
            rootObject[DidDocumentJsonProperties.SERVICE] = [...Array.from(this.services.values())];
        }

        return rootObject;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    private processMessages(messages: HcsDidMessage[]): void {
        messages.forEach((msg) => {
            switch (msg.getOperation()) {
                case DidMethodOperation.CREATE:
                    this.processCreateMessage(msg);
                    return;
                case DidMethodOperation.UPDATE:
                    this.processUpdateMessage(msg);
                    return;
                case DidMethodOperation.REVOKE:
                    this.processRevokeMessage(msg);
                    return;
                default:
                    /**
                     * TODO: for debugging - later we should probably try to ignore such messages
                     */
                    throw new Error("Not supported operation detected!");
            }
        });
    }

    private processCreateMessage(message: HcsDidMessage): void {
        const event = message.getEvent();

        switch (event.name) {
            case HcsDidEventName.DID_OWNER:
                if (this.owners.has(event.getId())) {
                    console.warn(`Duplicate create DIDOwner event ID: ${event.getId()}. Event will be ignored...`);
                    return;
                }

                this.owners.set(event.getId(), {
                    id: event.getId(),
                    type: (event as HcsDidCreateDidOwnerEvent).getType(),
                    controller: (event as HcsDidCreateDidOwnerEvent).getController(),
                    publicKeyMultibase: (event as HcsDidCreateDidOwnerEvent).getPublicKeyMultibase(),
                });
                return;
            case HcsDidEventName.SERVICE:
                if (this.services.has(event.getId())) {
                    console.warn(`Duplicate create Service event ID: ${event.getId()}. Event will be ignored...`);
                    return;
                }

                this.services.set(event.getId(), {
                    id: event.getId(),
                    type: (event as HcsDidCreateServiceEvent).getType(),
                    serviceEndpoint: (event as HcsDidCreateServiceEvent).getServiceEndpoint(),
                });
                return;
            case HcsDidEventName.VERIFICATION_METHOD:
                if (this.verificationMethods.has(event.getId())) {
                    console.warn(
                        `Duplicate create VerificationMethod event ID: ${event.getId()}. Event will be ignored...`
                    );
                    return;
                }

                this.verificationMethods.set(event.getId(), {
                    id: event.getId(),
                    type: (event as HcsDidCreateVerificationMethodEvent).getType(),
                    controller: (event as HcsDidCreateVerificationMethodEvent).getController(),
                    publicKeyMultibase: (event as HcsDidCreateVerificationMethodEvent).getPublicKeyMultibase(),
                });
                return;
            case HcsDidEventName.VERIFICATION_RELATIONSHIP:
                const type = (event as HcsDidCreateVerificationRelationshipEvent).getRelationshipType();

                if (this.verificationRelationships[type]) {
                    if (this.verificationRelationships[type].includes(event.getId())) {
                        console.warn(
                            `Duplicate create VerificationRelationship event ID: ${event.getId()}. Event will be ignored...`
                        );
                        return;
                    }

                    this.verificationRelationships[type].push(event.getId());

                    if (!this.verificationMethods.has(event.getId())) {
                        this.verificationMethods.set(event.getId(), {
                            id: event.getId(),
                            type: (event as HcsDidCreateVerificationRelationshipEvent).getType(),
                            controller: (event as HcsDidCreateVerificationRelationshipEvent).getController(),
                            publicKeyMultibase: (
                                event as HcsDidCreateVerificationRelationshipEvent
                            ).getPublicKeyMultibase(),
                        });
                    }
                } else {
                    console.warn(
                        `Create verificationRelationship event with type ${type} is not supported. Event will be ignored...`
                    );
                }
                return;
            default:
                /**
                 * TODO: for debugging - later we should probably try to ignore such messages
                 */
                throw new Error("Not supported event detected!");
        }
    }

    private processUpdateMessage(message: HcsDidMessage): void {
        const event = message.getEvent();

        switch (event.name) {
            case HcsDidEventName.DID_OWNER:
                /**
                 * TODO: we need to decide what DIDOwner operations are possible and how do they reflect on the resolved document.
                 */
                console.warn(`Update DidOwner event is not supported. Event will be ignored...`);
                return;
            case HcsDidEventName.SERVICE:
                if (!this.services.has(event.getId())) {
                    console.warn(
                        `Update Service event: service with ID ${event.getId()} was not found in the document. Event will be ignored...`
                    );
                    return;
                }
                this.services.set(event.getId(), {
                    id: event.getId(),
                    type: (event as HcsDidUpdateServiceEvent).getType(),
                    serviceEndpoint: (event as HcsDidUpdateServiceEvent).getServiceEndpoint(),
                });
                return;
            case HcsDidEventName.VERIFICATION_METHOD:
                if (!this.verificationMethods.has(event.getId())) {
                    console.warn(
                        `Update VerificationMethod event: verificationMethod with ID: ${event.getId()} was not found in the document. Event will be ignored...`
                    );
                    return;
                }

                this.verificationMethods.set(event.getId(), {
                    id: event.getId(),
                    type: (event as HcsDidUpdateVerificationMethodEvent).getType(),
                    controller: (event as HcsDidUpdateVerificationMethodEvent).getController(),
                    publicKeyMultibase: (event as HcsDidUpdateVerificationMethodEvent).getPublicKeyMultibase(),
                });
                return;
            case HcsDidEventName.VERIFICATION_RELATIONSHIP:
                const type = (event as HcsDidUpdateVerificationRelationshipEvent).getRelationshipType();

                if (this.verificationRelationships[type]) {
                    if (!this.verificationRelationships[type].includes(event.getId())) {
                        console.warn(
                            `Update VerificationRelationship event: veritificationRelationship with ID: ${event.getId()} was not found in the document.  Event will be ignored...`
                        );
                        return;
                    }

                    this.verificationMethods.set(event.getId(), {
                        id: event.getId(),
                        type: (event as HcsDidUpdateVerificationRelationshipEvent).getType(),
                        controller: (event as HcsDidUpdateVerificationRelationshipEvent).getController(),
                        publicKeyMultibase: (
                            event as HcsDidUpdateVerificationRelationshipEvent
                        ).getPublicKeyMultibase(),
                    });
                } else {
                    console.warn(
                        `Update verificationRelationship event with type ${type} is not supported. Event will be ignored...`
                    );
                }
                return;
            default:
                /**
                 * TODO: for debugging - later we should probably try to ignore such messages
                 */
                throw new Error("Not supported event detected!");
        }
    }

    private processRevokeMessage(message: HcsDidMessage): void {
        const event = message.getEvent();

        switch (event.name) {
            case HcsDidEventName.DID_OWNER:
                /**
                 * TODO: we need to decide what DIDOwner operations are possible and how do they reflect on the resolved document.
                 */
                console.warn(`Revoke DidOwner event is not supported. Event will be ignored...`);
                return;
            case HcsDidEventName.SERVICE:
                if (!this.services.has(event.getId())) {
                    console.warn(`Revoke Service event: service event ID: ${event.getId()}. Event will be ignored...`);
                    return;
                }

                this.services.delete(event.getId());
                return;
            case HcsDidEventName.VERIFICATION_METHOD:
                if (!this.verificationMethods.has(event.getId())) {
                    console.warn(
                        `Revoke VerificationMethod event: verificationMethod with ID: ${event.getId()}. Event will be ignored...`
                    );
                    return;
                }

                this.verificationMethods.delete(event.getId());

                Object.keys(this.verificationRelationships).forEach((relName) => {
                    this.verificationRelationships[relName] = this.verificationRelationships[relName].filter(
                        (id) => id !== event.getId()
                    );
                });

                return;
            case HcsDidEventName.VERIFICATION_RELATIONSHIP:
                const type = (event as HcsDidUpdateVerificationRelationshipEvent).getRelationshipType();

                if (this.verificationRelationships[type]) {
                    if (!this.verificationRelationships[type].includes(event.getId())) {
                        console.warn(
                            `Revoke VerificationRelationship event: verificationRelationship with ID: ${event.getId()}. Event will be ignored...`
                        );
                        return;
                    }

                    this.verificationRelationships[type] = this.verificationRelationships[type].filter(
                        (id) => id !== event.getId()
                    );

                    const canRemoveVerificationMethod = Object.values(this.verificationRelationships).every(
                        (rel) => !rel.includes(event.getId())
                    );

                    if (canRemoveVerificationMethod) {
                        this.verificationMethods.delete(event.getId());
                    }
                } else {
                    console.warn(
                        `Revoke verificationRelationship event with type ${type} is not supported. Event will be ignored...`
                    );
                }
                return;
            default:
                /**
                 * TODO: for debugging - later we should probably try to ignore such messages
                 */
                throw new Error("Not supported event detected!");
        }
    }
}
