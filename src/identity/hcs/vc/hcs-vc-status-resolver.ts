import {TopicId} from "@hashgraph/sdk";
import {TimestampUtils} from "../../../utils/timestamp-utils";
import {MessageEnvelope} from "../message-envelope";
import {MessageListener} from "../message-listener";
import {MessageResolver} from "../message-resolver";
import {HcsVcMessage} from "./hcs-vc-message";
import {HcsVcOperation} from "./hcs-vc-operation";
import {HcsVcTopicListener, PublicKeysProvider} from "./hcs-vc-topic-listener";

/**
 * Resolves the DID from Hedera network.
 */
export class HcsVcStatusResolver extends MessageResolver<HcsVcMessage> {
    /**
     * A function providing a collection of public keys accepted for a given credential hash.
     * If the function is not supplied, the listener will not validate signatures.
     */
    private publicKeysProvider: PublicKeysProvider;

    /**
     * Instantiates a new status resolver for the given VC topic.
     *
     * @param topicId The HCS VC topic ID.
     */
    constructor(topicId: TopicId);
    /**
     * Instantiates a new status resolver for the given VC topic with signature validation.
     *
     * @param topicId            The VC consensus topic ID.
     * @param publicKeysProvider Provider of a public keys acceptable for a given VC hash.
     */
    constructor(topicId: TopicId, publicKeysProvider: PublicKeysProvider);
    constructor(...args: any[]) {
        const topicId = args[0] as TopicId;
        super(topicId);
        if (args[1]) {
            this.publicKeysProvider = args[1];
        } else {
            this.publicKeysProvider = null;
        }
    }

    /**
     * Adds a credential hash to resolve its status.
     *
     * @param credentialHash The credential hash string.
     * @return This resolver instance.
     */
    public addCredentialHash(credentialHash: string): HcsVcStatusResolver {
        if (credentialHash != null) {
            this.results.set(credentialHash, null);
        }
        return this;
    }

    /**
     * Adds multiple VC hashes to resolve.
     *
     * @param hashes The set of VC hash strings.
     * @return This resolver instance.
     */
    public addCredentialHashes(hashes: string[]): HcsVcStatusResolver {
        if (hashes != null) {
            hashes.forEach(d => this.addCredentialHash(d));
        }

        return this;
    }

    protected override matchesSearchCriteria(message: HcsVcMessage): boolean {
        return this.results.has(message.getCredentialHash());
    }


    protected override supplyMessageListener(): MessageListener<HcsVcMessage> {
        return new HcsVcTopicListener(this.topicId, this.publicKeysProvider);
    }

    protected override processMessage(envelope: MessageEnvelope<HcsVcMessage>): void {
        const message: HcsVcMessage = envelope.open();

        // Skip messages that are older than the once collected or if we already have a REVOKED message
        const existing: MessageEnvelope<HcsVcMessage> = this.results.get(message.getCredentialHash());

        const chackOperation = (
            (existing != null) &&
            (
                (TimestampUtils.lessThan(envelope.getConsensusTimestamp(), existing.getConsensusTimestamp())) ||
                (
                    HcsVcOperation.REVOKE == (existing.open().getOperation()) &&
                    HcsVcOperation.REVOKE != (message.getOperation())
                )
            )
        )
        if (chackOperation) {
            return;
        }

        // Add valid message to the results
        this.results.set(message.getCredentialHash(), envelope);
    }
}
