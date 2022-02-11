import {
    DidMethodOperation,
    HcsDidCreateDidOwnerEvent,
    HcsDidCreateServiceEvent,
    HcsDidMessage,
    HcsDidUpdateDidOwnerEvent,
} from "..";
import { DidDocumentJsonProperties } from "./did-document-json-properties";
import { DidSyntax } from "./did-syntax";
import { HcsDidEventTargetName } from "./hcs/did/event/hcs-did-event-target-name";
import { HcsDidUpdateServiceEvent } from "./hcs/did/event/service/hcs-did-update-service-event";
import { HcsDidCreateVerificationMethodEvent } from "./hcs/did/event/verification-method/hcs-did-create-verification-method-event";
import { HcsDidUpdateVerificationMethodEvent } from "./hcs/did/event/verification-method/hcs-did-update-verification-method-event";
import { HcsDidCreateVerificationRelationshipEvent } from "./hcs/did/event/verification-relationship/hcs-did-create-verification-relationship-event";
import { HcsDidRevokeVerificationRelationshipEvent } from "./hcs/did/event/verification-relationship/hcs-did-revoke-verification-relationship-event";
import { HcsDidUpdateVerificationRelationshipEvent } from "./hcs/did/event/verification-relationship/hcs-did-update-verification-relationship-event";

export class DidDocument {
    private readonly id: string;
    private readonly context: string;

    private controller: any;
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

    public hasOwner() {
        return !!this.controller;
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

        if (this.controller && this.id !== this.controller.controller) {
            rootObject[DidDocumentJsonProperties.CONTROLLER] = this.controller.controller;
        }

        rootObject[DidDocumentJsonProperties.VERIFICATION_METHOD] = Array.from(this.verificationMethods.values());

        rootObject[DidDocumentJsonProperties.ASSERTION_METHOD] = [
            ...this.verificationRelationships[DidDocumentJsonProperties.ASSERTION_METHOD],
        ];

        rootObject[DidDocumentJsonProperties.AUTHENTICATION] = [
            ...this.verificationRelationships[DidDocumentJsonProperties.AUTHENTICATION],
        ];

        if (this.controller) {
            rootObject[DidDocumentJsonProperties.VERIFICATION_METHOD].unshift(this.controller);
            rootObject[DidDocumentJsonProperties.ASSERTION_METHOD].unshift(this.controller.id);
            rootObject[DidDocumentJsonProperties.AUTHENTICATION].unshift(this.controller.id);
        }

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
            if (
                !this.controller &&
                msg.getOperation() === DidMethodOperation.CREATE &&
                msg.getEvent().targetName !== HcsDidEventTargetName.DID_OWNER
            ) {
                console.warn("DID document owner is not registered. Event will be ignored...");
                return;
            }

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
                case DidMethodOperation.DELETE:
                    this.processDeleteMessage(msg);
                    return;
                default:
                    console.warn(`Operation ${msg.getOperation()} is not supported. Event will be ignored...`);
            }
        });
    }

    private processCreateMessage(message: HcsDidMessage): void {
        const event = message.getEvent();

        switch (event.targetName) {
            case HcsDidEventTargetName.DID_OWNER:
                if (this.controller) {
                    console.warn(`DID owner is already registered: ${this.controller}. Event will be ignored...`);
                    return;
                }
                this.controller = (event as HcsDidCreateDidOwnerEvent).getOwnerDef();
                return;
            case HcsDidEventTargetName.SERVICE:
                if (this.services.has(event.getId())) {
                    console.warn(`Duplicate create Service event ID: ${event.getId()}. Event will be ignored...`);
                    return;
                }
                this.services.set(event.getId(), (event as HcsDidCreateServiceEvent).getServiceDef());
                return;
            case HcsDidEventTargetName.VERIFICATION_METHOD:
                if (this.verificationMethods.has(event.getId())) {
                    console.warn(
                        `Duplicate create VerificationMethod event ID: ${event.getId()}. Event will be ignored...`
                    );
                    return;
                }

                this.verificationMethods.set(
                    event.getId(),
                    (event as HcsDidCreateVerificationMethodEvent).getVerificationMethodDef()
                );
                return;
            case HcsDidEventTargetName.VERIFICATION_RELATIONSHIP:
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
                        this.verificationMethods.set(
                            event.getId(),
                            (event as HcsDidCreateVerificationRelationshipEvent).getVerificationMethodDef()
                        );
                    }
                } else {
                    console.warn(
                        `Create verificationRelationship event with type ${type} is not supported. Event will be ignored...`
                    );
                }
                return;
            default:
                console.warn(`Create ${event.targetName} operation is not supported. Event will be ignored...`);
        }
    }

    private processUpdateMessage(message: HcsDidMessage): void {
        const event = message.getEvent();

        switch (event.targetName) {
            case HcsDidEventTargetName.DID_OWNER:
                this.controller = (event as HcsDidUpdateDidOwnerEvent).getOwnerDef();
                return;
            case HcsDidEventTargetName.SERVICE:
                if (!this.services.has(event.getId())) {
                    console.warn(
                        `Update Service event: service with ID ${event.getId()} was not found in the document. Event will be ignored...`
                    );
                    return;
                }
                this.services.set(event.getId(), (event as HcsDidUpdateServiceEvent).getServiceDef());
                return;
            case HcsDidEventTargetName.VERIFICATION_METHOD:
                if (!this.verificationMethods.has(event.getId())) {
                    console.warn(
                        `Update VerificationMethod event: verificationMethod with ID: ${event.getId()} was not found in the document. Event will be ignored...`
                    );
                    return;
                }

                this.verificationMethods.set(
                    event.getId(),
                    (event as HcsDidUpdateVerificationMethodEvent).getVerificationMethodDef()
                );
                return;
            case HcsDidEventTargetName.VERIFICATION_RELATIONSHIP:
                const type = (event as HcsDidUpdateVerificationRelationshipEvent).getRelationshipType();

                if (this.verificationRelationships[type]) {
                    if (!this.verificationRelationships[type].includes(event.getId())) {
                        console.warn(
                            `Update VerificationRelationship event: verificationRelationship with ID: ${event.getId()} was not found in the document.  Event will be ignored...`
                        );
                        return;
                    }

                    this.verificationMethods.set(
                        event.getId(),
                        (event as HcsDidUpdateVerificationRelationshipEvent).getVerificationMethodDef()
                    );
                } else {
                    console.warn(
                        `Update verificationRelationship event with type ${type} is not supported. Event will be ignored...`
                    );
                }
                return;
            default:
                console.warn(`Update ${event.targetName} operation is not supported. Event will be ignored...`);
        }
    }

    private processRevokeMessage(message: HcsDidMessage): void {
        const event = message.getEvent();

        switch (event.targetName) {
            case HcsDidEventTargetName.SERVICE:
                if (!this.services.has(event.getId())) {
                    console.warn(`Revoke Service event: service event ID: ${event.getId()}. Event will be ignored...`);
                    return;
                }

                this.services.delete(event.getId());
                return;
            case HcsDidEventTargetName.VERIFICATION_METHOD:
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
            case HcsDidEventTargetName.VERIFICATION_RELATIONSHIP:
                const type = (event as HcsDidRevokeVerificationRelationshipEvent).getRelationshipType();

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
                console.warn(`Revoke ${event.targetName} operation is not supported. Event will be ignored...`);
        }
    }

    private processDeleteMessage(message: HcsDidMessage): void {
        const event = message.getEvent();

        switch (event.targetName) {
            case HcsDidEventTargetName.Document:
                this.controller = null;
                this.services.clear();
                this.verificationMethods.clear();
                Object.keys(this.verificationRelationships).forEach(
                    (relName) => (this.verificationRelationships[relName] = [])
                );
                return;
            default:
                console.warn(`Delete ${event.targetName} operation is not supported. Event will be ignored...`);
        }
    }
}
