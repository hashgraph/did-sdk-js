import { PrivateKey, PublicKey, TopicId } from "@hashgraph/sdk";
import { HcsDid } from "./did/hcs-did";
import { HcsDidMessage } from "./did/hcs-did-message";
import { HcsDidResolver } from "./did/hcs-did-resolver";
import { HcsDidTopicListener } from "./did/hcs-did-topic-listener";
import { HcsDidTransaction } from "./did/hcs-did-transaction";
import { MessageEnvelope } from "./message-envelope";

/**
 * Identity network based on Hedera HCS DID method specification.
 */
export class HcsIdentityNetwork {
    /**
     * The Hedera network on which this identity network is created.
     */
    private network: string;

    private didTopicId: TopicId;

    /**
     * Instantiates existing identity network using a DID generated for this network.
     *
     * @param network The Hedera network.
     * @return The identity network instance.
     */
    public static async fromHcsDidTopic(network: string, didTopicId: TopicId): Promise<HcsIdentityNetwork> {
        const result = new HcsIdentityNetwork();
        result.network = network;
        result.didTopicId = didTopicId;
        return result;
    }

    /**
     * Instantiates existing identity network using a DID generated for this network.
     *
     * @param network The Hedera network.
     * @return The identity network instance.
     */
    public static async fromHcsDidAndVCTopic(network: string, didTopicId: TopicId): Promise<HcsIdentityNetwork> {
        const result = new HcsIdentityNetwork();
        result.network = network;
        result.didTopicId = didTopicId;
        return result;
    }

    /**
     * Instantiates a {@link HcsDidTransaction} to perform the specified operation on the DID document.
     *
     * @param operation The operation to be performed on a DID document.
     * @return The {@link HcsDidTransaction} instance.
     */
    // public createDidTransaction(operation: DidMethodOperation): HcsDidTransaction;

    /**
     * Instantiates a {@link HcsDidTransaction} to perform the specified operation on the DID document.
     *
     * @param message The DID topic message ready to for sending.
     * @return The {@link HcsDidTransaction} instance.
     */
    public createDidTransaction(message: MessageEnvelope<HcsDidMessage>): HcsDidTransaction;

    public createDidTransaction(...args): HcsDidTransaction {
        if (args.length === 1 && args[0] instanceof MessageEnvelope) {
            const [message] = args;
            return new HcsDidTransaction(message, this.didTopicId);
        } // else if (
        //     args.length === 1
        //     // (args[0] instanceof DidMethodOperation)
        // ) {
        //     const [operation] = args;
        //     return new HcsDidTransaction(operation, this.didTopicId);
        // }
        else {
            throw new Error("Invalid arguments");
        }
    }

    /**
     * Returns the Hedera network on which this identity network runs.
     *
     * @return The Hedera network.
     */
    public getNetwork(): string {
        return this.network;
    }

    /**
     * Returns the Did Topic on which this identity network sends messages to.
     *
     * @return The TopicId.
     */
    public getDidTopicId(): TopicId {
        return this.didTopicId;
    }

    /**
     * Generates a new DID and it's root key.
     *
     * @return Generated {@link HcsDid} with it's private DID root key.
     */
    public generateDid(): HcsDid;

    public generateDid(privateKey: PrivateKey): HcsDid;

    /**
     * Generates a new DID from the given public DID root key.
     *
     * @param publicKey A DID root key.
     * @return A newly generated DID.
     */
    public generateDid(publicKey: PublicKey): HcsDid;
    public generateDid(...args): HcsDid {
        if (args.length === 0) {
            const privateKey = HcsDid.generateDidRootKey();
            return new HcsDid(this.getNetwork(), privateKey, this.didTopicId);
        } else if (args.length === 1 && args[0] instanceof PublicKey) {
            const [publicKey] = args;
            return new HcsDid(this.getNetwork(), publicKey, this.didTopicId);
        } else if (args.length === 1 && args[0] instanceof PrivateKey) {
            const [privateKey] = args;
            return new HcsDid(this.getNetwork(), privateKey, this.didTopicId);
        }
    }

    /**
     * Returns a DID resolver for this network.
     *
     * @return The DID resolver for this network.
     */
    public getDidResolver(): HcsDidResolver {
        return new HcsDidResolver(this.didTopicId);
    }

    /**
     * Returns a DID topic listener for this network.
     *
     * @return The DID topic listener.
     */
    public getDidTopicListener(): HcsDidTopicListener {
        return new HcsDidTopicListener(this.didTopicId);
    }
}
