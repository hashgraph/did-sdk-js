import { Client, Hbar, PrivateKey, PublicKey, Timestamp, TopicCreateTransaction, TopicId } from "@hashgraph/sdk";
import {
    DidDocumentBase,
    DidMethodOperation,
    Hashing,
    HcsDidDidOwnerEvent,
    HcsDidMessage,
    HcsDidTransaction,
    MessageEnvelope,
} from "../../..";
import { DidSyntax } from "../../did-syntax";
import { HcsDidResolver } from "./hcs-did-resolver";

export class HcsDidV2 {
    public static DID_METHOD = DidSyntax.Method.HEDERA_HCS;

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
            throw new Error("identifier and privateKey cannot be empty");
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

    async register() {
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
            .setMaxTransactionFee(new Hbar(2))
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
        const message = new HcsDidMessage(DidMethodOperation.CREATE, this.identifier, event);
        const envelope = new MessageEnvelope(message);

        const transaction = new HcsDidTransaction(envelope, this.topicId);

        // Expect some subscribtion errors because it takes time for Topic to be accessible

        await new Promise((resolve, reject) => {
            transaction
                .signMessage((msg) => this.privateKey.sign(msg))
                .buildAndSignTransaction((tx) => tx.setMaxTransactionFee(new Hbar(2)))
                .onMessageConfirmed((msg) => {
                    console.log("Submitted");
                    resolve(msg);
                })
                .onError((err) => {
                    console.log(err);
                    reject(err);
                })
                .execute(this.client);
        });

        return this;
    }

    async resolve() {
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
        return HcsDidV2.DID_METHOD;
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
            this.publicKeyToIdString(publicKey) +
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

    private publicKeyToIdString(publicKey: PublicKey): string {
        return Hashing.multibase.encode(publicKey.toBytes());
    }
}
