import {AddressBook} from "./address-book";
import {Client, FileContentsQuery, FileId, PrivateKey, PublicKey, TopicId} from "@hashgraph/sdk";
import {HcsDid} from "./did/hcs-did";
import {DidMethodOperation} from "../did-method-operation";
import {HcsDidTransaction} from "./did/hcs-did-transaction";
import {MessageEnvelope} from "./message-envelope";
import {HcsVcMessage} from "./vc/hcs-vc-message";
import {HcsDidMessage} from "./did/hcs-did-message";
import {HcsVcTransaction} from "./vc/hcs-vc-transaction";
import {HcsVcOperation} from "./vc/hcs-vc-operation";
import {HcsDidResolver} from "./did/hcs-did-resolver";
import {HcsDidTopicListener} from "./did/hcs-did-topic-listener";
import {HcsVcStatusResolver} from "./vc/hcs-vc-status-resolver";
import {HcsVcTopicListener} from "./vc/hcs-vc-topic-listener";

/**
 * Appnet's identity network based on Hedera HCS DID method specification.
 */
export class HcsIdentityNetwork {
    /**
     * The address book of appnet's identity network.
     */
    private addressBook: AddressBook;

    /**
     * The Hedera network on which this identity network is created.
     */
    private network: string;

    /**
     * Instantiates existing identity network from a provided address book.
     *
     * @param network     The Hedera network.
     * @param addressBook The {@link AddressBook} of the identity network.
     * @return The identity network instance.
     */
    public static fromAddressBook(network: string, addressBook: AddressBook): HcsIdentityNetwork {
        const result = new HcsIdentityNetwork();
        result.network = network;
        result.addressBook = addressBook;

        return result;
    }

    /**
     * Instantiates existing identity network using an address book file read from Hedera File Service.
     *
     * @param client            The Hedera network client.
     * @param network           The Hedera network.
     * @param addressBookFileId The FileID of {@link AddressBook} file stored on Hedera File Service.
     * @return The identity network instance.
     */
    public static async fromAddressBookFile(client: Client, network: string, addressBookFileId: FileId): Promise<HcsIdentityNetwork> {
        const fileContentsQueryCost = (new FileContentsQuery()).setFileId(addressBookFileId).getCost(client);
        const fileQuery = (new FileContentsQuery()).setFileId(addressBookFileId);

        const contents = await fileQuery.execute(client);

        const result = new HcsIdentityNetwork();
        result.network = network;
        result.addressBook = AddressBook.fromJson(contents.toString(), addressBookFileId);

        return result;
    }

    /**
     * Instantiates existing identity network using a DID generated for this network.
     *
     * @param client The Hedera network client.
     * @param hcsDid The Hedera HCS DID.
     * @return The identity network instance.
     */
    public static async fromHcsDid(client: Client, hcsDid: HcsDid): Promise<HcsIdentityNetwork> {
        const addressBookFileId = hcsDid.getAddressBookFileId();
        return await HcsIdentityNetwork.fromAddressBookFile(client, hcsDid.getNetwork(), addressBookFileId);
    }

    /**
     * Instantiates a {@link HcsDidTransaction} to perform the specified operation on the DID document.
     *
     * @param operation The operation to be performed on a DID document.
     * @return The {@link HcsDidTransaction} instance.
     */
    public createDidTransaction(operation: DidMethodOperation): HcsDidTransaction;

    /**
     * Instantiates a {@link HcsDidTransaction} to perform the specified operation on the DID document.
     *
     * @param message The DID topic message ready to for sending.
     * @return The {@link HcsDidTransaction} instance.
     */
    public createDidTransaction(message: MessageEnvelope<HcsDidMessage>): HcsDidTransaction;

    public createDidTransaction(...args): HcsDidTransaction {
        if (
            (args.length === 1) &&
            (args[0] instanceof MessageEnvelope)
        ) {
            const [message] = args;
            return new HcsDidTransaction(message, this.getDidTopicId());
        } else if (
            (args.length === 1)
            // (args[0] instanceof DidMethodOperation)
        ) {
            const [operation] = args;
            return new HcsDidTransaction(operation, this.getDidTopicId());
        } else {
            throw new Error('Invalid arguments');
        }
    }

    /**
     * Instantiates a {@link HcsVcTransaction} to perform the specified operation on the VC document.
     *
     * @param operation       The type of operation.
     * @param credentialHash  Credential hash.
     * @param signerPublicKey Public key of the signer (issuer).
     * @return The transaction instance.
     */
    public createVcTransaction(operation: HcsVcOperation, credentialHash: string, signerPublicKey: PublicKey): HcsVcTransaction;

    /**
     * Instantiates a {@link HcsVcTransaction} to perform the specified operation on the VC document status.
     *
     * @param message         The VC topic message ready to for sending.
     * @param signerPublicKey Public key of the signer (usually issuer).
     * @return The {@link HcsVcTransaction} instance.
     */
    public createVcTransaction(message: MessageEnvelope<HcsVcMessage>, signerPublicKey: PublicKey): HcsVcTransaction;

    public createVcTransaction(...args): HcsVcTransaction {
        if (
            (args.length === 3) &&
            // (args[0] instanceof HcsVcOperation) &&
            (typeof args[1] === 'string') &&
            (args[2] instanceof PublicKey)
        ) {
            const [operation, credentialHash, signerPublicKey] = args;
            return new HcsVcTransaction(this.getVcTopicId(), operation, credentialHash, signerPublicKey);
        } else if (
            (args.length === 2) &&
            (args[0] instanceof MessageEnvelope) &&
            (args[1] instanceof PublicKey)
        ) {
            const [message, signerPublicKey] = args;
            return new HcsVcTransaction(this.getVcTopicId(), message, signerPublicKey);
        } else {
            throw new Error('Invalid arguments');
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
     * Generates a new DID and it's root key.
     *
     * @param withTid Indicates if DID topic ID should be added to the DID as <i>tid</i> parameter.
     * @return Generated {@link HcsDid} with it's private DID root key.
     */
    public generateDid(withTid: boolean): HcsDid;

    public generateDid(privateKey: PrivateKey, withTid: boolean): HcsDid;

    /**
     * Generates a new DID from the given public DID root key.
     *
     * @param publicKey A DID root key.
     * @param withTid   Indicates if DID topic ID should be added to the DID as <i>tid</i> parameter.
     * @return A newly generated DID.
     */
    public generateDid(publicKey: PublicKey, withTid: boolean): HcsDid;
    public generateDid(...args): HcsDid {
        if (
            (args.length === 1) &&
            (typeof args[0] === 'boolean')
        ) {
            const [withTid] = args;
            const privateKey = HcsDid.generateDidRootKey();
            const tid = withTid ? this.getDidTopicId() : null;

            return new HcsDid(this.getNetwork(), privateKey, this.addressBook.getFileId(), tid);
        } else if (
            (args.length === 2) &&
            (args[0] instanceof PublicKey) &&
            (typeof args[1] === 'boolean')
        ) {
            const [publicKey, withTid] = args;
            const tid = withTid ? this.getDidTopicId() : null;

            return new HcsDid(this.getNetwork(), publicKey, this.addressBook.getFileId(), tid);
        } else if (
            (args.length === 2) &&
            (args[0] instanceof PrivateKey) &&
            (typeof args[1] === 'boolean')
        ) {
            const [privateKey, withTid] = args;
            const tid = withTid ? this.getDidTopicId() : null;

            return new HcsDid(this.getNetwork(), privateKey, this.addressBook.getFileId(), tid);
        }
    }

    /**
     * Returns a DID resolver for this network.
     *
     * @return The DID resolver for this network.
     */
    public getDidResolver(): HcsDidResolver {
        return new HcsDidResolver(this.getDidTopicId());
    }

    /**
     * Returns DID topic ID for this network.
     *
     * @return The DID topic ID.
     */
    public getDidTopicId(): TopicId {
        return TopicId.fromString(this.addressBook.getDidTopicId());
    }

    /**
     * Returns a DID topic listener for this network.
     *
     * @return The DID topic listener.
     */
    public getDidTopicListener(): HcsDidTopicListener {
        return new HcsDidTopicListener(this.getDidTopicId());
    }

    /**
     * Returns Verifiable Credentials topic ID for this network.
     *
     * @return The VC topic ID.
     */
    public getVcTopicId(): TopicId {
        return TopicId.fromString(this.addressBook.getVcTopicId());
    }

    /**
     * Returns the address book of this identity network.
     *
     * @return The address book of this identity network.
     */
    public getAddressBook(): AddressBook {
        return this.addressBook;
    }

    /**
     * Returns a VC status resolver for this network.
     *
     * @return The VC status resolver for this network.
     */
    public getVcStatusResolver(): HcsVcStatusResolver;

    /**
     * Returns a VC status resolver for this network.
     * Resolver will validate signatures of topic messages against public keys supplied
     * by the given provider.
     *
     * @param publicKeysProvider Provider of a public keys acceptable for a given VC hash.
     * @return The VC status resolver for this network.
     */
    public getVcStatusResolver(publicKeysProvider: (t: string) => PublicKey[]): HcsVcStatusResolver;

    public getVcStatusResolver(...args): HcsVcStatusResolver {
        if (args.length === 0) {
            return new HcsVcStatusResolver(this.getVcTopicId());
        } else if (args.length === 1) {
            const [publicKeysProvider] = args;
            return new HcsVcStatusResolver(this.getVcTopicId(), publicKeysProvider);
        } else {
            throw Error('Invalid arguments');
        }
    }

    /**
     * Returns a VC topic listener for this network.
     *
     * @return The VC topic listener.
     */
    public getVcTopicListener(): HcsVcTopicListener;

    /**
     * Returns a VC topic listener for this network.
     * This listener will validate signatures of topic messages against public keys supplied
     * by the given provider.
     *
     * @param publicKeysProvider Provider of a public keys acceptable for a given VC hash.
     * @return The VC topic listener.
     */
    public getVcTopicListener(publicKeysProvider: (t: string) => PublicKey[]): HcsVcTopicListener;

    public getVcTopicListener(...args): HcsVcTopicListener {
        if (args.length === 0) {
            return new HcsVcTopicListener(this.getVcTopicId());
        } else if (args.length === 1) {
            const [publicKeysProvider] = args;
            return new HcsVcTopicListener(this.getVcTopicId(), publicKeysProvider);
        } else {
            throw new Error('Invalid arguments');
        }
    }

}
