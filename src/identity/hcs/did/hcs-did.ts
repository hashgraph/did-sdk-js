import {
    Client,
    Hbar,
    PrivateKey,
    PublicKey,
    Timestamp,
    TopicCreateTransaction,
    TopicId,
    TopicUpdateTransaction,
} from "@hashgraph/sdk";
import { Hashing } from "../../../utils/hashing";
import { DidDocument } from "../../did-document";
import { DidMethodOperation } from "../../did-method-operation";
import { DidSyntax } from "../../did-syntax";
import { MessageEnvelope } from "../message-envelope";
import { HcsDidDeleteEvent } from "./event/document/hcs-did-delete-event";
import { HcsDidEvent } from "./event/hcs-did-event";
import { HcsDidCreateDidOwnerEvent } from "./event/owner/hcs-did-create-did-owner-event";
import { HcsDidUpdateDidOwnerEvent } from "./event/owner/hcs-did-update-did-owner-event";
import { HcsDidCreateServiceEvent } from "./event/service/hcs-did-create-service-event";
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
import { HcsDidMessage } from "./hcs-did-message";
import { HcsDidTransaction } from "./hcs-did-transaction";

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
        this.validateClientConfig();

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
                .setAdminKey(this.privateKey.publicKey)
                .setSubmitKey(this.privateKey.publicKey)
                .freezeWith(this.client);

            const sigTx = await topicCreateTransaction.sign(this.privateKey);
            const txId = await sigTx.execute(this.client);
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
        await this.submitTransaction(DidMethodOperation.CREATE, event, this.privateKey);

        return this;
    }

    public async changeOwner(args: { id: string; controller: string; newPrivateKey: PrivateKey }) {
        if (!this.identifier) {
            throw new Error("DID is not registered");
        }

        this.validateClientConfig();

        if (!args.newPrivateKey) {
            throw new Error("newPrivateKey is missing");
        }

        await this.resolve();

        if (!this.document.hasOwner()) {
            throw new Error("DID is not registered or was recently deleted. DID has to be registered first.");
        }

        /**
         * Change owner of the topic
         */
        const transaction = await new TopicUpdateTransaction()
            .setTopicId(this.topicId)
            .setAdminKey(args.newPrivateKey.publicKey)
            .setSubmitKey(args.newPrivateKey.publicKey)
            .freezeWith(this.client);

        const signTx = await (await transaction.sign(this.privateKey)).sign(args.newPrivateKey);
        const txResponse = await signTx.execute(this.client);
        await txResponse.getReceipt(this.client);

        this.privateKey = args.newPrivateKey;

        /**
         * Send ownership change message to the topic
         */
        await this.submitTransaction(
            DidMethodOperation.UPDATE,
            new HcsDidUpdateDidOwnerEvent(args.id + "#did-root-key", args.controller, args.newPrivateKey.publicKey),
            this.privateKey
        );
        return this;
    }

    public async delete() {
        if (!this.identifier) {
            throw new Error("DID is not registered");
        }

        this.validateClientConfig();

        await this.submitTransaction(DidMethodOperation.DELETE, new HcsDidDeleteEvent(), this.privateKey);
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
                    // console.error(err);
                    reject(err);
                })
                .execute(this.client);
        });
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

        const event = new HcsDidCreateServiceEvent(args.id, args.type, args.serviceEndpoint);
        await this.submitTransaction(DidMethodOperation.CREATE, event, this.privateKey);

        return this;
    }

    /**
     * Update a Service meta-information to DID
     * @param args
     * @returns this
     */
    public async updateService(args: { id: string; type: ServiceTypes; serviceEndpoint: string }) {
        this.validateClientConfig();

        const event = new HcsDidUpdateServiceEvent(args.id, args.type, args.serviceEndpoint);
        await this.submitTransaction(DidMethodOperation.UPDATE, event, this.privateKey);

        return this;
    }

    /**
     * Revoke a Service meta-information to DID
     * @param args
     * @returns this
     */
    public async revokeService(args: { id: string }) {
        this.validateClientConfig();

        const event = new HcsDidRevokeServiceEvent(args.id);
        await this.submitTransaction(DidMethodOperation.REVOKE, event, this.privateKey);

        return this;
    }

    /**
     * Add a Verification Method meta-information to DID
     * @param args
     * @returns this
     */
    public async addVerificationMethod(args: {
        id: string;
        type: VerificationMethodSupportedKeyType;
        controller: string;
        publicKey: PublicKey;
    }) {
        this.validateClientConfig();

        const event = new HcsDidCreateVerificationMethodEvent(args.id, args.type, args.controller, args.publicKey);
        await this.submitTransaction(DidMethodOperation.CREATE, event, this.privateKey);

        return this;
    }

    /**
     * Update a Verification Method meta-information to DID
     * @param args
     * @returns this
     */
    public async updateVerificationMethod(args: {
        id: string;
        type: VerificationMethodSupportedKeyType;
        controller: string;
        publicKey: PublicKey;
    }) {
        this.validateClientConfig();

        const event = new HcsDidUpdateVerificationMethodEvent(args.id, args.type, args.controller, args.publicKey);
        await this.submitTransaction(DidMethodOperation.UPDATE, event, this.privateKey);

        return this;
    }

    /**
     * Revoke a Verification Method meta-information to DID
     * @param args
     * @returns this
     */
    public async revokeVerificationMethod(args: { id: string }) {
        this.validateClientConfig();

        const event = new HcsDidRevokeVerificationMethodEvent(args.id);
        await this.submitTransaction(DidMethodOperation.REVOKE, event, this.privateKey);

        return this;
    }

    /**
     * Add a Verification Relationship to DID
     * @param args
     * @returns this
     */
    public async addVerificationRelationship(args: {
        id: string;
        relationshipType: VerificationRelationshipType;
        type: VerificationRelationshipSupportedKeyType;
        controller: string;
        publicKey: PublicKey;
    }) {
        this.validateClientConfig();

        const event = new HcsDidCreateVerificationRelationshipEvent(
            args.id,
            args.relationshipType,
            args.type,
            args.controller,
            args.publicKey
        );
        await this.submitTransaction(DidMethodOperation.CREATE, event, this.privateKey);

        return this;
    }

    /**
     * Update a Verification Relationship to DID
     * @param args
     * @returns this
     */
    public async updateVerificationRelationship(args: {
        id: string;
        relationshipType: VerificationRelationshipType;
        type: VerificationRelationshipSupportedKeyType;
        controller: string;
        publicKey: PublicKey;
    }) {
        this.validateClientConfig();

        const event = new HcsDidUpdateVerificationRelationshipEvent(
            args.id,
            args.relationshipType,
            args.type,
            args.controller,
            args.publicKey
        );
        await this.submitTransaction(DidMethodOperation.UPDATE, event, this.privateKey);

        return this;
    }

    /**
     * Revoke a Verification Relationship to DID
     * @param args
     * @returns this
     */
    public async revokeVerificationRelationship(args: { id: string; relationshipType: VerificationRelationshipType }) {
        this.validateClientConfig();

        const event = new HcsDidRevokeVerificationRelationshipEvent(args.id, args.relationshipType);
        await this.submitTransaction(DidMethodOperation.REVOKE, event, this.privateKey);

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

    public static parseIdentifier(identifier: string): [string, TopicId, string] {
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

            if (didIdString.length < 48 || didParts.shift()) {
                throw new Error("DID string is invalid.");
            }

            return [networkName, topicId, didIdString];
        } catch (e) {
            throw new Error("DID string is invalid. " + e.message);
        }
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
     * Submit Message Transaction to Hashgraph
     * @param didMethodOperation
     * @param event
     * @param privateKey
     * @returns this
     */
    private async submitTransaction(
        didMethodOperation: DidMethodOperation,
        event: HcsDidEvent,
        privateKey: PrivateKey
    ): Promise<MessageEnvelope<HcsDidMessage>> {
        const message = new HcsDidMessage(didMethodOperation, this.getIdentifier(), event);
        const envelope = new MessageEnvelope(message);
        const transaction = new HcsDidTransaction(envelope, this.getTopicId());

        return new Promise((resolve, reject) => {
            transaction
                .signMessage((msg) => {
                    return privateKey.sign(msg);
                })
                .buildAndSignTransaction((tx) => {
                    return tx
                        .setMaxTransactionFee(HcsDid.TRANSACTION_FEE)
                        .freezeWith(this.client)
                        .sign(this.privateKey);
                })
                .onError((err) => {
                    // console.error(err);
                    reject(err);
                })
                .onMessageConfirmed((msg) => {
                    console.log("Message Published");
                    console.log(
                        `Explore on DragonGlass: https://testnet.dragonglass.me/hedera/topics/${this.getTopicId()}`
                    );
                    resolve(msg);
                })
                .execute(this.client);
        });
    }
}
