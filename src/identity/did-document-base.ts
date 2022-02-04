import { DidMethodOperation, HcsDidMessage } from "..";
import { DidDocumentJsonProperties } from "./did-document-json-properties";
import { DidSyntax } from "./did-syntax";
import { HcsDidEventName } from "./hcs/did/event/hcs-did-event-name";

export class DidDocumentBase {
    private id: string;
    private context: string;

    private keyId = 0;
    private serviceId = 0;

    private owners: Map<string, any> = new Map();
    private services: Map<string, any> = new Map();
    private verificationMethods: Map<string, any> = new Map();

    private relationships = {
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
            ...this.relationships[DidDocumentJsonProperties.ASSERTION_METHOD],
        ];

        rootObject[DidDocumentJsonProperties.AUTHENTICATION] = [
            ...Array.from(this.owners.keys()),
            ...this.relationships[DidDocumentJsonProperties.AUTHENTICATION],
        ];

        if (this.relationships[DidDocumentJsonProperties.KEY_AGREEMENT].length > 0) {
            rootObject[DidDocumentJsonProperties.KEY_AGREEMENT] = [
                ...this.relationships[DidDocumentJsonProperties.KEY_AGREEMENT],
            ];
        }
        if (this.relationships[DidDocumentJsonProperties.CAPABILITY_INVOCATION].length > 0) {
            rootObject[DidDocumentJsonProperties.CAPABILITY_INVOCATION] = [
                ...this.relationships[DidDocumentJsonProperties.CAPABILITY_INVOCATION],
            ];
        }
        if (this.relationships[DidDocumentJsonProperties.CAPABILITY_DELEGATION].length > 0) {
            rootObject[DidDocumentJsonProperties.CAPABILITY_DELEGATION] = [
                ...this.relationships[DidDocumentJsonProperties.CAPABILITY_DELEGATION],
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
                this.owners.set(event.getId() + "#did-root-key", {
                    id: event.getId() + "#did-root-key",
                    type: (event as any).getType(),
                    controller: (event as any).getController(),
                    publicKeyMultibase: (event as any).getPublicKeyMultibase(),
                });
                return;
            case HcsDidEventName.SERVICE:
                const serviceIdPostfix = `#service-${++this.serviceId}`;

                this.services.set(event.getId() + serviceIdPostfix, {
                    id: event.getId() + serviceIdPostfix,
                    type: (event as any).getType(),
                    serviceEndpoint: (event as any).getServiceEndpoint(),
                });
                return;
            case HcsDidEventName.VERIFICATION_METHOD:
                const methodPostfix = `#key-${++this.keyId}`;

                this.verificationMethods.set(event.getId() + methodPostfix, {
                    id: event.getId() + methodPostfix,
                    type: (event as any).getType(),
                    controller: (event as any).getController(),
                    publicKeyMultibase: (event as any).getPublicKeyMultibase(),
                });
                return;
            case HcsDidEventName.VERIFICATION_RELATIONSHIP:
                const type = (event as any).getRelationshipType();

                if (this.relationships[type]) {
                    const relationshipPostfix = `#key-${++this.keyId}`;

                    this.relationships[type].push(event.getId() + relationshipPostfix);
                    this.verificationMethods.set(event.getId() + relationshipPostfix, {
                        id: event.getId() + relationshipPostfix,
                        type: (event as any).getType(),
                        controller: (event as any).getController(),
                        publicKeyMultibase: (event as any).getPublicKeyMultibase(),
                    });
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
