import { Client, Hbar, PrivateKey, PublicKey, Timestamp, TopicCreateTransaction, TopicId } from "@hashgraph/sdk";
import {
    DidDocumentBase,
    DidMethodOperation,
    Hashing,
    HcsDidDidOwnerEvent,
    HcsDidMessage,
    HcsDidServiceEvent,
    HcsDidTransaction,
    MessageEnvelope,
} from "../../..";
import { DidSyntax } from "../../did-syntax";
import { HcsDidEvent } from "./event/hcs-did-event";
import { ServiceTypes } from "./event/hcs-did-service-event";
import {
    HcsDidVerificationMethodEvent,
    VerificationMethodSupportedKeyType,
} from "./event/hcs-did-verification-method-event";
import {
    HcsDidVerificationRelationshipEvent,
    VerificationRelationshipSupportedKeyType,
    VerificationRelationshipType,
} from "./event/hcs-did-verification-relationship-event";
import { HcsDidResolver } from "./hcs-did-resolver";

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

    constructor(args: { identifier?: string; privateKey?: PrivateKey; client?: Client }) {
        this.identifier = args.identifier;
        this.privateKey = args.privateKey;
        this.client = args.client;

        if (!this.identifier && !this.privateKey) {
            throw new Error("identifier and privateKey cannot both be empty");
        }

        if (this.identifier) {
            const [networkName, topicId] = this.parseIdentifier(this.identifier);
            this.network = networkName;
            this.topicId = topicId;
        }
    }

    /**
     * Public API
     */

    public async register() {
        if (this.identifier) {
            throw new Error("DID is already registered");
        }

        if (!this.privateKey) {
            throw new Error("privateKey is missingi i");
        }

        if (!this.client) {
            throw new Error("Client configuration is missing");
        }

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

        /**
         * Set ownership
         */
        const event = new HcsDidDidOwnerEvent(this.identifier, this.identifier, this.privateKey.publicKey);
        await this.submitTransaciton(DidMethodOperation.CREATE, event, this.privateKey);

        return this;
    }

    public async resolve() {
        if (!this.identifier) {
            throw new Error("DID is not registered");
        }

        if (!this.client) {
            throw new Error("Client configuration is missing");
        }

        return await new Promise((resolve, reject) => {
            /**
             * This API will have to change...
             */
            const resolver = new HcsDidResolver(this.topicId)
                .setTimeout(3000)
                .whenFinished((result) => {
                    this.messages = result.get(this.identifier);

                    let document = new DidDocumentBase(this.identifier);

                    this.messages.forEach((msg) => {
                        document = msg.getEvent().process(document);
                    });

                    resolve(document);
                })
                .onError((err) => {
                    console.log(err);
                    reject(err);
                });

            resolver.addDid(this.identifier);
            resolver.execute(this.client);
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
        if (!this.privateKey) {
            throw new Error("privateKey is missing");
        }

        if (!this.client) {
            throw new Error("Client configuration is missing");
        }

        if (!args) {
            throw new Error("Service args are missing");
        }

        if (!args.id || !args.type || !args.serviceEndpoint) {
            throw new Error("Service args are missing");
        }

        /**
         * Build create Service message
         */
        const event = new HcsDidServiceEvent(args.id, args.type, args.serviceEndpoint);
        await this.submitTransaciton(DidMethodOperation.CREATE, event, this.privateKey);

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
        if (!this.privateKey) {
            throw new Error("privateKey is missing");
        }

        if (!this.client) {
            throw new Error("Client configuration is missing");
        }

        if (!args) {
            throw new Error("Verification Method args are missing");
        }

        if (!args.id || !args.type || !args.controller || !args.publicKey) {
            throw new Error("Verification Method args are missing");
        }

        /**
         * Build create Service message
         */
        const event = new HcsDidVerificationMethodEvent(args.id, args.type, args.controller, args.publicKey);
        await this.submitTransaciton(DidMethodOperation.CREATE, event, this.privateKey);

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
        if (!this.privateKey) {
            throw new Error("privateKey is missing");
        }

        if (!this.client) {
            throw new Error("Client configuration is missing");
        }

        if (!args) {
            throw new Error("Verification Relationship args are missing");
        }

        if (!args.id || !args.relationshipType || !args.type || !args.controller || !args.publicKey) {
            throw new Error("Verification Relationship args are missing");
        }

        /**
         * Build create Service message
         */
        const event = new HcsDidVerificationRelationshipEvent(
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

    /**
     * Static methods
     */

    public static publicKeyToIdString(publicKey: PublicKey): string {
        return Hashing.multibase.encode(publicKey.toBytes());
    }

    public static stringToPublicKey(idString: string): PublicKey {
        return PublicKey.fromBytes(Hashing.multibase.decode(idString));
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

    private parseIdentifier(identifier: string): [string, TopicId] {
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

            return [networkName, topicId];
        } catch (e) {
            throw new Error("DID string is invalid. " + e.message);
        }
    }

    /**
     * Submit Message Transaciton to Hashgraph
     */
    private async submitTransaciton(
        didMethodOperation: DidMethodOperation,
        event: HcsDidEvent,
        privateKey: PrivateKey
    ) {
        const message = new HcsDidMessage(didMethodOperation, this.getIdentifier(), event);
        const envelope = new MessageEnvelope(message);
        const transaction = new HcsDidTransaction(envelope, this.getTopicId());

        new Promise((resolve, reject) => {
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
