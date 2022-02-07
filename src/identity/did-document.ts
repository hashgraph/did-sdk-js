import { DidMethodOperation, HcsDidMessage } from "..";
import { DidDocumentJsonProperties } from "./did-document-json-properties";
import { DidSyntax } from "./did-syntax";
import { HcsDidEventName } from "./hcs/did/event/hcs-did-event-name";

export class DidDocument {
    private id: string;
    private context: string;

    private owners: Map<string, any> = new Map();
    private services: Map<string, any> = new Map();
    private verificationMethods: Map<string, any> = new Map();

    private verificationRelationships = {
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

    private processMessages(messages: HcsDidMessage[]) {
        messages.forEach((msg) => {
            switch (msg.getOperation()) {
                case DidMethodOperation.CREATE:
                    this.processCreateMessage(msg);
                    return;
                default:
                    /**
                     * TODO: for debugging - later we should probably try to ignore such messages
                     */
                    throw new Error("Not supported operation detected!");
            }
        });
    }

    private processCreateMessage(message: HcsDidMessage) {
        const event = message.getEvent();

        switch (event.name) {
            case HcsDidEventName.DID_OWNER:
                if (this.owners.has(event.getId())) {
                    console.warn(`Duplicate create DIDOwner event ID: ${event.getId()}. Event will be ignored...`);
                    return;
                }

                this.owners.set(event.getId(), {
                    id: event.getId(),
                    type: (event as any).getType(),
                    controller: (event as any).getController(),
                    publicKeyMultibase: (event as any).getPublicKeyMultibase(),
                });
                return;
            case HcsDidEventName.SERVICE:
                if (this.services.has(event.getId())) {
                    console.warn(`Duplicate create Service event ID: ${event.getId()}. Event will be ignored...`);
                    return;
                }

                this.services.set(event.getId(), {
                    id: event.getId(),
                    type: (event as any).getType(),
                    serviceEndpoint: (event as any).getServiceEndpoint(),
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
                    type: (event as any).getType(),
                    controller: (event as any).getController(),
                    publicKeyMultibase: (event as any).getPublicKeyMultibase(),
                });
                return;
            case HcsDidEventName.VERIFICATION_RELATIONSHIP:
                const type = (event as any).getRelationshipType();

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
                            type: (event as any).getType(),
                            controller: (event as any).getController(),
                            publicKeyMultibase: (event as any).getPublicKeyMultibase(),
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
}
