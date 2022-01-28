import { Decrypter, Encrypter, Message, Signer } from "./message";
import { Client, Timestamp, TopicId, TopicMessageSubmitTransaction, Transaction, TransactionId } from "@hashgraph/sdk";
import { MessageEnvelope } from "./message-envelope";
import { MessageListener } from "./message-listener";
import { Validator } from "../../utils/validator";
import moment from "moment";
import { ArraysUtils } from "../../utils/arrays-utils";

export abstract class MessageTransaction<T extends Message> {
    private static SUBTRACT_TIME = 1; // seconds

    protected topicId: TopicId;
    protected message: MessageEnvelope<T>;

    private encrypter: Encrypter<string>;
    private decrypter: Decrypter<string>;
    private buildTransactionFunction: (input: TopicMessageSubmitTransaction) => Transaction;
    private receiver: (input: MessageEnvelope<T>) => void;
    private errorHandler: (input: Error) => void;
    private executed: boolean;
    private signer: Signer<Uint8Array>;
    private listener: MessageListener<T>;

    /**
     * Creates a new instance of a message transaction.
     *
     * @param topicId Consensus topic ID to which message will be submitted.
     */
    constructor(topicId: TopicId);
    /**
     * Creates a new instance of a message transaction with already prepared message.
     *
     * @param topicId Consensus topic ID to which message will be submitted.
     * @param message The message signed and ready to be sent.
     */
    constructor(topicId: TopicId, message: MessageEnvelope<T>);
    constructor(...args) {
        if (args.length === 1) {
            const [topicId] = args;
            this.topicId = topicId;
            this.executed = false;
        } else if (args.length === 2) {
            const [topicId, message] = args;
            this.topicId = topicId;
            this.message = message;
            this.executed = false;
        } else {
            throw new Error("Invalid arguments");
        }
    }

    /**
     * Method that constructs a message envelope with a message of type T.
     *
     * @return The message envelope with a message inside ready to sign.
     */
    protected abstract buildMessage(): MessageEnvelope<T>;

    /**
     * Provides an instance of a message encrypter.
     *
     * @param encryptionFunction Encryption function used to encrypt single message property.
     * @return The message encrypter instance.
     */
    protected abstract provideMessageEncrypter(encryptionFunction: Encrypter<string>): (input: T) => T;

    /**
     * Provides a {@link MessageListener} instance specific to the submitted message type.
     *
     * @param topicIdToListen ID of the HCS topic.
     * @return The topic listener for this message on a mirror node.
     */
    protected abstract provideTopicListener(topicIdToListen: TopicId): MessageListener<T>;

    /**
     * Handles the error.
     * If external error handler is defined, passes the error there, otherwise raises RuntimeException.
     *
     * @param err The error.
     * @throws RuntimeException Runtime exception with the given error in case external error handler is not defined.
     */
    protected handleError(err: Error): void {
        if (this.errorHandler) {
            this.errorHandler(err);
        } else {
            throw new Error(err.message);
        }
    }

    /**
     * Defines encryption function that encrypts the message attributes before submission.
     *
     * @param encrypter The encrypter to use.
     * @return This transaction instance.
     */
    public onEncrypt(encrypter: Encrypter<string>): MessageTransaction<T> {
        this.encrypter = encrypter;
        return this;
    }

    /**
     * Handles event from a mirror node when a message was consensus was reached and message received.
     *
     * @param receiver The receiver handling incoming message.
     * @return This transaction instance.
     */
    public onMessageConfirmed(receiver: (input: MessageEnvelope<T>) => void): MessageTransaction<T> {
        this.receiver = receiver;
        return this;
    }

    /**
     * Defines a handler for errors when they happen during execution.
     *
     * @param handler The error handler.
     * @return This transaction instance.
     */
    public onError(handler: (input: Error) => void): MessageTransaction<T> {
        this.errorHandler = handler;
        return this;
    }

    /**
     * Defines decryption function that decrypts message attributes after consensus is reached.
     * Decryption function must accept a byte array of encrypted message and an Timestamp that is its consensus timestamp,
     *
     * @param decrypter The decrypter to use.
     * @return This transaction instance.
     */
    public onDecrypt(decrypter: Decrypter<string>): MessageTransaction<T> {
        this.decrypter = decrypter;
        return this;
    }

    /**
     * Defines a function that signs the message.
     *
     * @param signer The signing function to set.
     * @return This transaction instance.
     */
    public signMessage(signer: Signer<Uint8Array>): MessageTransaction<T> {
        this.signer = signer;
        return this;
    }

    /**
     * Sets {@link TopicMessageSubmitTransaction} parameters, builds and signs it without executing it.
     * Topic ID and transaction message content are already set in the incoming transaction.
     *
     * @param builderFunction The transaction builder function.
     * @return This transaction instance.
     */
    public buildAndSignTransaction(
        builderFunction: (input: TopicMessageSubmitTransaction) => Transaction
    ): MessageTransaction<T> {
        this.buildTransactionFunction = builderFunction;
        return this;
    }

    /**
     * Builds the message and submits it to appnet's topic.
     *
     * @param client The hedera network client.
     * @return Transaction ID.
     */
    public async execute(client: Client): Promise<TransactionId> {
        new Validator().checkValidationErrors("MessageTransaction execution failed: ", (v) => {
            return this.validate(v);
        });

        const envelope = !this.message ? this.buildMessage() : this.message;

        if (this.encrypter) {
            envelope.encrypt(this.provideMessageEncrypter(this.encrypter));
        }

        const messageContent = !envelope.getSignature()
            ? envelope.sign(this.signer)
            : ArraysUtils.fromString(envelope.toJSON());

        if (this.receiver) {
            this.listener = this.provideTopicListener(this.topicId);
            this.listener
                .setStartTime(
                    Timestamp.fromDate(moment().subtract(MessageTransaction.SUBTRACT_TIME, "seconds").toDate())
                )
                .setIgnoreErrors(false)
                .addFilter((response) => {
                    return ArraysUtils.equals(messageContent, response.contents);
                })
                .onError((err) => {
                    return this.handleError(err);
                })
                .onInvalidMessageReceived((response, reason) => {
                    if (!ArraysUtils.equals(messageContent, response.contents)) {
                        return;
                    }

                    this.handleError(new Error(reason + ": " + ArraysUtils.toString(response.contents)));
                    this.listener.unsubscribe();
                })
                .onDecrypt(this.decrypter)
                .subscribe(client, (msg) => {
                    this.listener.unsubscribe();
                    this.receiver(msg);
                });
        }

        const tx = new TopicMessageSubmitTransaction().setTopicId(this.topicId).setMessage(messageContent);

        let transactionId;

        try {
            const response = await this.buildTransactionFunction(tx).execute(client);
            transactionId = response.transactionId;
            this.executed = true;
        } catch (e) {
            this.handleError(e);
            if (this.listener) {
                this.listener.unsubscribe();
            }
        }

        return transactionId;
    }

    /**
     * Runs validation logic.
     *
     * @param validator The errors validator.
     */
    protected validate(validator: Validator): void {
        validator.require(!this.executed, "This transaction has already been executed.");
        validator.require(
            !!this.signer || (!!this.message && !!this.message.getSignature()),
            "Signing function is missing."
        );
        validator.require(!!this.buildTransactionFunction, "Transaction builder is missing.");
        validator.require(
            (!!this.encrypter && !!this.decrypter) || (!this.decrypter && !this.encrypter),
            "Either both encrypter and decrypter must be specified or none."
        );
    }
}
