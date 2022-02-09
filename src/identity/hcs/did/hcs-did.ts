import { Client, Hbar, PrivateKey, PublicKey, Timestamp, TopicCreateTransaction, TopicId } from "@hashgraph/sdk";
import {
    DidDocument,
    DidMethodOperation,
    Hashing,
    HcsDidCreateDidOwnerEvent,
    HcsDidCreateServiceEvent,
    HcsDidMessage,
    HcsDidTransaction,
    MessageEnvelope,
} from "../../..";
import { DidSyntax } from "../../did-syntax";
import { HcsDidDeleteEvent } from "./event/document/hcs-did-delete-event";
import { HcsDidEvent } from "./event/hcs-did-event";
import { HcsDidRevokeServiceEvent } from "./event/service/hcs-did-revoke-service-event";
import { HcsDidUpdateServiceEvent } from "./event/service/hcs-did-update-service-event";
import { ServiceTypes } from "./event/service/types";
import { HcsDidCreateVerificationMethodEvent } from "./event/verification-method/hcs-did-create-verification-method-event";
import { HcsDidRevokeVerificationMethodEvent } from "./event/verification-method/hcs-did-revoke-verification-method-event";
import { HcsDidUpdateVerificationMethodEvent } from "./event/verification-method/hcs-did-update-verification-method-event";
import { VerificationMethodSupportedKeyType } from "./event/verification-method/types";
import { HcsDidCreateVerificationRelationshipEvent } from "./event/verification-relationship/hcs-did-create-verification-relationship-event";
import { HcsDidRevokeVerificationRelationshipEvent } from "./event/verification-relationship/hcs-did-revoke-verification-relationship-event";
import { HcsDidUpdateVerificationRelationshipEvent } from "./event/verification-relationship/hcs-did-update-verification-relationship-event";
import {
    VerificationRelationshipSupportedKeyType,
    VerificationRelationshipType,
} from "./event/verification-relationship/types";
import { HcsDidEventMessageResolver } from "./hcs-did-event-message-resolver";

export class HcsDid {
    public static DID_METHOD = DidSyntax.Method.HEDERA_HCS;
    public static TRANSACTION_FEE = new Hbar(2);

    protected client: Client;
    protected privateKey: PrivateKey;
    protected identifier: string;
    protected network: string;
    protected topicId: TopicId;

    protected messages: HcsDidMessage[];
    protected resolvedAt: Timestamp;
    protected document: DidDocument;

    constructor(args: { identifier?: string; privateKey?: PrivateKey; client?: Client }) {
        this.identifier = args.identifier;
        this.privateKey = args.privateKey;
        this.client = args.client;

        if (!this.identifier && !this.privateKey) {
            throw new Error("identifier and privateKey cannot both be empty");
        }

        if (this.identifier) {
            const [networkName, topicId] = HcsDid.parseIdentifier(this.identifier);
            this.network = networkName;
            this.topicId = topicId;
        }
    }

    /**
     * Public API
     */

    public async register() {
        if (!this.privateKey) {
            throw new Error("privateKey is missing");
        }

        if (!this.client) {
            throw new Error("Client configuration is missing");
        }

        if (this.identifier) {
            await this.resolve();

            if (this.document.hasOwner()) {
                throw new Error("DID is already registered");
            }
        } else {
            /**
             * Create topic
             */
            const topicCreateTransaction = new TopicCreateTransaction()
                .setMaxTransactionFee(HcsDid.TRANSACTION_FEE)
                .setAdminKey(this.privateKey.publicKey);

            const txId = await topicCreateTransaction.execute(this.client);
            const topicId = (await txId.getReceipt(this.client)).topicId;

            this.topicId = topicId;
            this.network = this.client.networkName;
            this.identifier = this.buildIdentifier(this.privateKey.publicKey);
        }

        /**
         * Set ownership
         */
        const event = new HcsDidCreateDidOwnerEvent(
            this.identifier + "#did-root-key",
            this.identifier,
            this.privateKey.publicKey
        );
        await this.submitTransaciton(DidMethodOperation.CREATE, event, this.privateKey);

        return this;
    }

    public async resolve(): Promise<DidDocument> {
        if (!this.identifier) {
            throw new Error("DID is not registered");
        }

        if (!this.client) {
            throw new Error("Client configuration is missing");
        }

        return new Promise((resolve, reject) => {
            new HcsDidEventMessageResolver(this.topicId)
                .setTimeout(3000)
                .whenFinished((messages) => {
                    this.messages = messages;
                    this.document = new DidDocument(this.identifier, this.messages);
                    resolve(this.document);
                })
                .onError((err) => {
                    console.log(err);
                    reject(err);
                })
                .execute(this.client);
        });
    }

    public async delete() {
        if (!this.privateKey) {
            throw new Error("privateKey is missing");
        }

        if (!this.client) {
            throw new Error("Client configuration is missing");
        }

        /**
         * TODO: how to send empty message? we have only one listner that is event listner. you can not listen to different type of messages.
         * I suggest we send DELETE event
         */
        await this.submitTransaciton(DidMethodOperation.DELETE, new HcsDidDeleteEvent(), this.privateKey);
        return this;
    }

    /**
     *  Meta-information about DID
     */

    /**
     * Add a Service meta-information to DID
     * @param args
     * @returns this
     */
    public async addService(args: { id: string; type: ServiceTypes; serviceEndpoint: string }) {
        this.validateClientConfig();

        if (!args || !args.id || !args.type || !args.serviceEndpoint) {
            throw new Error("Validation failed. Services args are missing");
        }
        if (!this.isEventIdValid(args.id)) {
            throw new Error("Event ID is invalid. Expected format: {did}#{key|service}-{integer}");
        }
        const event = new HcsDidCreateServiceEvent(args.id, args.type, args.serviceEndpoint);
        await this.submitTransaciton(DidMethodOperation.CREATE, event, this.privateKey);

        return this;
    }

    /**
     * Update a Service meta-information to DID
     * @param args
     * @returns this
     */
    public async updateService(args: { id: string; type: ServiceTypes; serviceEndpoint: string }) {
        this.validateClientConfig();

        if (!args || !args.id || !args.type || !args.serviceEndpoint) {
            throw new Error("Validation failed. Services args are missing");
        }
        if (!this.isEventIdValid(args.id)) {
            throw new Error("Event ID is invalid. Expected format: {did}#{key|service}-{integer}");
        }
        const event = new HcsDidUpdateServiceEvent(args.id, args.type, args.serviceEndpoint);
        await this.submitTransaciton(DidMethodOperation.UPDATE, event, this.privateKey);
        return this;
    }

    /**
     * Revoke a Service meta-information to DID
     * @param args
     * @returns this
     */
    public async revokeService(args: { id: string }) {
        this.validateClientConfig();
        if (!args || !args.id) {
            throw new Error("Validation failed. Services args are missing");
        }
        if (!this.isEventIdValid(args.id)) {
            throw new Error("Event ID is invalid. Expected format: {did}#{key|service}-{integer}");
        }
        const event = new HcsDidRevokeServiceEvent(args.id);
        await this.submitTransaciton(DidMethodOperation.REVOKE, event, this.privateKey);
        return this;
    }

    /**
     * Add a Verification Method meta-information to DID
     * @param args
     * @returns this
     */
    public async addVerificaitonMethod(args: {
        id: string;
        type: VerificationMethodSupportedKeyType;
        controller: string;
        publicKey: PublicKey;
    }) {
        this.validateClientConfig();
        if (!args || !args.id || !args.type || !args.controller || !args.publicKey) {
            throw new Error("Validation failed. Verification Method args are missing");
        }

        if (!this.isEventIdValid(args.id)) {
            throw new Error("Event ID is invalid. Expected format: {did}#{key|service}-{integer}");
        }

        const event = new HcsDidCreateVerificationMethodEvent(args.id, args.type, args.controller, args.publicKey);
        await this.submitTransaciton(DidMethodOperation.CREATE, event, this.privateKey);

        return this;
    }

    /**
     * Update a Verification Method meta-information to DID
     * @param args
     * @returns this
     */
    public async updateVerificaitonMethod(args: {
        id: string;
        type: VerificationMethodSupportedKeyType;
        controller: string;
        publicKey: PublicKey;
    }) {
        this.validateClientConfig();
        if (!args || !args.id || !args.type || !args.controller || !args.publicKey) {
            throw new Error("Validation failed. Verification Method args are missing");
        }

        if (!this.isEventIdValid(args.id)) {
            throw new Error("Event ID is invalid. Expected format: {did}#{key|service}-{integer}");
        }

        const event = new HcsDidUpdateVerificationMethodEvent(args.id, args.type, args.controller, args.publicKey);
        await this.submitTransaciton(DidMethodOperation.UPDATE, event, this.privateKey);

        return this;
    }

    /**
     * Revoke a Verification Method meta-information to DID
     * @param args
     * @returns this
     */
    public async revokeVerificaitonMethod(args: { id: string }) {
        this.validateClientConfig();
        if (!args || !args.id) {
            throw new Error("Validation failed. Verification Method args are missing");
        }

        if (!this.isEventIdValid(args.id)) {
            throw new Error("Event ID is invalid. Expected format: {did}#{key|service}-{integer}");
        }

        const event = new HcsDidRevokeVerificationMethodEvent(args.id);
        await this.submitTransaciton(DidMethodOperation.REVOKE, event, this.privateKey);

        return this;
    }

    /**
     * Add a Verification Relationship to DID
     * @param args
     * @returns this
     */
    public async addVerificaitonRelationship(args: {
        id: string;
        relationshipType: VerificationRelationshipType;
        type: VerificationRelationshipSupportedKeyType;
        controller: string;
        publicKey: PublicKey;
    }) {
        this.validateClientConfig();
        if (!args || !args.id || !args.relationshipType || !args.type || !args.controller || !args.publicKey) {
            throw new Error("Verification Relationship args are missing");
        }

        if (!this.isEventIdValid(args.id)) {
            throw new Error("Event ID is invalid. Expected format: {did}#{key|service}-{integer}");
        }

        const event = new HcsDidCreateVerificationRelationshipEvent(
            args.id,
            args.relationshipType,
            args.type,
            args.controller,
            args.publicKey
        );
        await this.submitTransaciton(DidMethodOperation.CREATE, event, this.privateKey);

        return this;
    }

    /**
     * Update a Verification Relationship to DID
     * @param args
     * @returns this
     */
    public async updateVerificaitonRelationship(args: {
        id: string;
        relationshipType: VerificationRelationshipType;
        type: VerificationRelationshipSupportedKeyType;
        controller: string;
        publicKey: PublicKey;
    }) {
        this.validateClientConfig();
        if (!args || !args.id || !args.relationshipType || !args.type || !args.controller || !args.publicKey) {
            throw new Error("Verification Relationship args are missing");
        }

        if (!this.isEventIdValid(args.id)) {
            throw new Error("Event ID is invalid. Expected format: {did}#{key|service}-{integer}");
        }
        const event = new HcsDidUpdateVerificationRelationshipEvent(
            args.id,
            args.relationshipType,
            args.type,
            args.controller,
            args.publicKey
        );
        await this.submitTransaciton(DidMethodOperation.UPDATE, event, this.privateKey);
        return this;
    }

    /**
     * Revoke a Verification Relationship to DID
     * @param args
     * @returns this
     */
    public async revokeVerificaitonRelationship(args: { id: string; relationshipType: VerificationRelationshipType }) {
        this.validateClientConfig();
        if (!args || !args.id) {
            throw new Error("Verification Relationship args are missing");
        }

        if (!this.isEventIdValid(args.id)) {
            throw new Error("Event ID is invalid. Expected format: {did}#{key|service}-{integer}");
        }
        const event = new HcsDidRevokeVerificationRelationshipEvent(args.id, args.relationshipType);
        await this.submitTransaciton(DidMethodOperation.REVOKE, event, this.privateKey);
        return this;
    }

    /**
     * Attribute getters
     */

    public getIdentifier() {
        return this.identifier;
    }

    public getClient() {
        return this.client;
    }

    public getPrivateKey() {
        return this.privateKey;
    }

    public getTopicId() {
        return this.topicId;
    }

    public getNetwork() {
        return this.network;
    }

    public getMethod() {
        return HcsDid.DID_METHOD;
    }

    public getMessages() {
        return this.messages;
    }

    /**
     * Static methods
     */

    public static publicKeyToIdString(publicKey: PublicKey): string {
        return Hashing.multibase.encode(publicKey.toBytes());
    }

    public static stringToPublicKey(idString: string): PublicKey {
        return PublicKey.fromBytes(Hashing.multibase.decode(idString));
    }

    public static parsePublicKeyFromIdentifier(identifier: string): PublicKey {
        const [_networkName, _topicId, didIdString] = HcsDid.parseIdentifier(identifier);
        return HcsDid.stringToPublicKey(didIdString);
    }

    /**
     * Private
     */

    private buildIdentifier(publicKey: PublicKey): string {
        const methodNetwork = [this.getMethod().toString(), this.network].join(DidSyntax.DID_METHOD_SEPARATOR);

        let ret: string;
        ret =
            DidSyntax.DID_PREFIX +
            DidSyntax.DID_METHOD_SEPARATOR +
            methodNetwork +
            DidSyntax.DID_METHOD_SEPARATOR +
            HcsDid.publicKeyToIdString(publicKey) +
            DidSyntax.DID_TOPIC_SEPARATOR +
            this.topicId.toString();

        return ret;
    }

    private static parseIdentifier(identifier: string): [string, TopicId, string] {
        const [didPart, topicIdPart] = identifier.split(DidSyntax.DID_TOPIC_SEPARATOR);

        if (!topicIdPart) {
            throw new Error("DID string is invalid: topic ID is missing");
        }

        const topicId = TopicId.fromString(topicIdPart);

        const didParts = didPart.split(DidSyntax.DID_METHOD_SEPARATOR);

        if (didParts.shift() !== DidSyntax.DID_PREFIX) {
            throw new Error("DID string is invalid: invalid prefix.");
        }

        const methodName = didParts.shift();
        if (DidSyntax.Method.HEDERA_HCS !== methodName) {
            throw new Error("DID string is invalid: invalid method name: " + methodName);
        }

        try {
            const networkName = didParts.shift();

            if (networkName != DidSyntax.HEDERA_NETWORK_MAINNET && networkName != DidSyntax.HEDERA_NETWORK_TESTNET) {
                throw new Error("Invalid Hedera network.");
            }

            const didIdString = didParts.shift();

            if (didIdString.length < 32 || didParts.shift()) {
                throw new Error("DID string is invalid.");
            }

            return [networkName, topicId, didIdString];
        } catch (e) {
            throw new Error("DID string is invalid. " + e.message);
        }
    }

    private isEventIdValid(eventId: string) {
        const [identifer, id] = eventId.split("#");

        if (!identifer || !id) {
            return false;
        }

        HcsDid.parseIdentifier(identifer);

        if (!/^(key|service)\-[0-9]{1,}$/.test(id)) {
            return false;
        }

        return true;
    }

    private validateClientConfig() {
        if (!this.privateKey) {
            throw new Error("privateKey is missing");
        }

        if (!this.client) {
            throw new Error("Client configuration is missing");
        }
    }

    /**
     * Submit Message Transaciton to Hashgraph
     * @param didMethodOperation
     * @param event
     * @param privateKey
     * @returns this
     */
    private async submitTransaciton(
        didMethodOperation: DidMethodOperation,
        event: HcsDidEvent,
        privateKey: PrivateKey
    ): Promise<MessageEnvelope<HcsDidMessage>> {
        const message = new HcsDidMessage(didMethodOperation, this.getIdentifier(), event);
        const envelope = new MessageEnvelope(message);
        const transaction = new HcsDidTransaction(envelope, this.getTopicId());

        return new Promise((resolve, reject) => {
            transaction
                .signMessage((msg) => privateKey.sign(msg))
                .buildAndSignTransaction((tx) => tx.setMaxTransactionFee(HcsDid.TRANSACTION_FEE))
                .onError((err) => {
                    console.error(err);
                    reject(err);
                })
                .onMessageConfirmed((msg) => {
                    console.log("Message Published");
                    console.log(
                        `Explor on dragonglass: https://testnet.dragonglass.me/hedera/topics/${this.getTopicId()}`
                    );
                    resolve(msg);
                })
                .execute(this.client);
        });
    }
}
