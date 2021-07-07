import {HederaDid} from "../../hedera-did";
import {DidSyntax} from "../../did-syntax";
import {FileId, PrivateKey, PublicKey, TopicId} from "@hashgraph/sdk";
import {Hashing} from "../../../utils/hashing";
import {DidDocumentBase} from "../../did-document-base";
import {HcsDidRootKey} from "./hcs-did-root-key";

/**
 * Hedera Decentralized Identifier for Hedera DID Method specification based on HCS.
 */
export class HcsDid implements HederaDid {
    public static DID_METHOD = DidSyntax.Method.HEDERA_HCS;
    private static DID_PARAMETER_VALUE_PARTS = 2;

    private didTopicId: TopicId;
    private addressBookFileId: FileId;
    private network: string;
    private idString: string;
    private did: string;
    private didRootKey: PublicKey;
    private privateDidRootKey: PrivateKey;

    /**
     * Creates a DID instance.
     *
     * @param network           The Hedera DID network.
     * @param didRootKey        The public key from which DID is derived.
     * @param addressBookFileId The appent's address book {@link FileId}
     * @param didTopicId        The appnet's DID topic ID.
     */
    constructor(network: string, didRootKey: PublicKey, addressBookFileId: FileId, didTopicId?: TopicId);
    /**
     * Creates a DID instance with private DID root key.
     *
     * @param network           The Hedera DID network.
     * @param privateDidRootKey The private DID root key.
     * @param addressBookFileId The appent's address book {@link FileId}
     * @param didTopicId        The appnet's DID topic ID.
     */
    constructor(network: string, privateDidRootKey: PrivateKey, addressBookFileId: FileId, didTopicId?: TopicId);
    /**
     * Creates a DID instance without topic ID specification.
     *
     * @param network           The Hedera DID network.
     * @param didRootKey        The public key from which DID is derived.
     * @param addressBookFileId The appent's address book {@link FileId}
     */
    constructor(network: string, didRootKey: PublicKey, addressBookFileId: FileId)
    /**
     * Creates a DID instance.
     *
     * @param network           The Hedera DID network.
     * @param idString          The id-string of a DID.
     * @param addressBookFileId The appent's address book {@link FileId}
     * @param didTopicId        The appnet's DID topic ID.
     */
    constructor(network: string, idString: string, addressBookFileId: FileId, didTopicId?: TopicId);
    constructor(...args: any[]) {
        if (
            (typeof args[0] === 'string') &&
            (args[1] instanceof PublicKey) &&
            (args[2] instanceof FileId) &&
            ((args[4] instanceof TopicId) || args[4] === undefined) &&
            (args.length === 4)
        ) {
            const [network, didRootKey, addressBookFileId, didTopicId] = args;
            this.didTopicId = didTopicId;
            this.addressBookFileId = addressBookFileId;
            this.network = network;
            this.didRootKey = didRootKey;
            this.idString = HcsDid.publicKeyToIdString(didRootKey);
            this.did = this.buildDid();

            return;
        }

        if (
            (typeof args[0] === 'string') &&
            (args[1] instanceof PrivateKey) &&
            (args[2] instanceof FileId) &&
            ((args[4] instanceof TopicId) || args[4] === undefined) &&
            (args.length === 4)
        ) {
            const [network, privateDidRootKey, addressBookFileId, didTopicId] = args

            this.didTopicId = didTopicId;
            this.addressBookFileId = addressBookFileId;
            this.network = network;
            this.didRootKey = privateDidRootKey.publicKey;
            this.idString = HcsDid.publicKeyToIdString(privateDidRootKey.publicKey);
            this.did = this.buildDid();
            this.privateDidRootKey = privateDidRootKey;

            return;
        }

        if (
            (typeof args[0] === 'string') &&
            (args[1] instanceof PublicKey) &&
            (args[2] instanceof FileId) &&
            (args.length === 3)
        ) {
            const [network, didRootKey, addressBookFileId] = args;

            this.didTopicId = null;
            this.addressBookFileId = addressBookFileId;
            this.network = network;
            this.didRootKey = didRootKey;
            this.idString = HcsDid.publicKeyToIdString(didRootKey);
            this.did = this.buildDid();

            return;
        }

        if (
            (typeof args[0] === 'string') &&
            (typeof args[1] === 'string') &&
            (args[2] instanceof FileId) &&
            ((args[4] instanceof TopicId) || args[4] === undefined) &&
            (args.length === 4)
        ) {
            const [network, idString, addressBookFileId, didTopicId] = args;

            this.didTopicId = didTopicId;
            this.addressBookFileId = addressBookFileId;
            this.network = network;

            this.idString = idString;
            this.did = this.buildDid();

            return;
        }

        throw new Error('Couldn\'t find constructor');
    }

    /**
     * Converts a Hedera DID string into {@link HcsDid} object.
     *
     * @param didString A Hedera DID string.
     * @return {@link HcsDid} object derived from the given Hedera DID string.
     */
    public static fromString(didString: string): HcsDid {
        if (!didString) {
            throw new Error("DID string cannot be null");
        }

        const mainParts = didString.split(DidSyntax.DID_PARAMETER_SEPARATOR);

        let
            topicId: TopicId,
            addressBookFileId: FileId;

        const didParts = mainParts.shift().split(DidSyntax.DID_METHOD_SEPARATOR);

        if (didParts.shift() !== DidSyntax.DID_PREFIX) {
            throw new Error('DID string is invalid: invalid prefix.');
        }

        const methodName = didParts.shift();
        if (DidSyntax.Method.HEDERA_HCS !== methodName) {
            throw new Error('DID string is invalid: invalid method name: ' + methodName);
        }

        try {
            const networkName = didParts.shift();

            const params = this.extractParameters(mainParts, methodName, networkName);
            addressBookFileId = FileId.fromString(params.get(DidSyntax.MethodSpecificParameter.ADDRESS_BOOK_FILE_ID));
            if (params.has(DidSyntax.MethodSpecificParameter.DID_TOPIC_ID)) {
                topicId = TopicId.fromString(params.get(DidSyntax.MethodSpecificParameter.DID_TOPIC_ID));
            }
            const didIdString = didParts.shift();
            if (didIdString.length < 32 || didParts.shift()) {
                throw new Error('DID string is invalid.')
            }

            return new HcsDid(networkName, didIdString, addressBookFileId, topicId);

        } catch (e) {
            throw new Error('DID string is invalid. ' + e.message);
        }
    }

    /**
     * Extracts method-specific URL parameters.
     *
     * @param mainParts   Iterator over main parts of the DID.
     * @param methodName  The method name.
     * @param networkName The network name.
     * @return A map of method-specific URL parameters and their values.
     */
    private static extractParameters(mainParts: string[], methodName: string, networkName: string): Map<string, string> {
        const result = new Map();

        const fidParamName = [methodName, networkName, DidSyntax.MethodSpecificParameter.ADDRESS_BOOK_FILE_ID].join(DidSyntax.DID_METHOD_SEPARATOR);
        const tidParamName = [methodName, networkName, DidSyntax.MethodSpecificParameter.DID_TOPIC_ID].join(DidSyntax.DID_METHOD_SEPARATOR);

        let mp;
        while(mp = mainParts.shift()) {
            const paramValue = mp.split(DidSyntax.DID_PARAMETER_VALUE_SEPARATOR);

            if (paramValue.length != this.DID_PARAMETER_VALUE_PARTS) {
                continue;
            } else if (fidParamName === paramValue[0]) {
                result.set(DidSyntax.MethodSpecificParameter.ADDRESS_BOOK_FILE_ID, paramValue[1]);
            } else if (tidParamName === paramValue[0]) {
                result.set(DidSyntax.MethodSpecificParameter.DID_TOPIC_ID, paramValue[1]);
            }
        }

        if (!result.has(DidSyntax.MethodSpecificParameter.ADDRESS_BOOK_FILE_ID)) {
            throw new Error('DID string is invalid. Required method-specific URL parameter not found: ' + DidSyntax.MethodSpecificParameter.ADDRESS_BOOK_FILE_ID);
        }

        return result;
    }

    /**
     * Generates a random DID root key.
     *
     * @return A private key of generated public DID root key.
     */
    public static generateDidRootKey(): PrivateKey {
        return PrivateKey.generate();
    }

    /**
     * Generates DID document base from the given DID and its root key.
     *
     * @param didRootKey Public key used to build this DID.
     * @return The DID document base.
     * @throws IllegalArgumentException In case given DID root key does not match this DID.
     */
    public generateDidDocument(): DidDocumentBase {
        const result = new DidDocumentBase(this.toDid());
        if (this.didRootKey) {
            const rootKey = HcsDidRootKey.fromHcsIdentity(this, this.didRootKey);
            result.setDidRootKey(rootKey);
        }

        return result;
    }


    public getNetwork(): string {
        return this.network;
    }

    public getMethod(): DidSyntax.Method {
        return DidSyntax.Method.HEDERA_HCS;
    }

    public toString(): string {
        return this.did;
    }

    public getDidTopicId(): TopicId {
        return this.didTopicId;
    }

    public getAddressBookFileId(): FileId {
        return this.addressBookFileId;
    }

    public getIdString(): string {
        return this.idString;
    }

    public toDid() {
        return this.did
    }

    /**
     * Constructs DID string from the instance of DID object.
     *
     * @return A DID string.
     */
    private buildDid(): string {
        const methodNetwork = [this.getMethod().toString(), this.network].join(DidSyntax.DID_METHOD_SEPARATOR);

        let ret: string;
        ret = DidSyntax.DID_PREFIX +
            DidSyntax.DID_METHOD_SEPARATOR +
            methodNetwork +
            DidSyntax.DID_METHOD_SEPARATOR +
            this.idString +
            DidSyntax.DID_PARAMETER_SEPARATOR +
            methodNetwork +
            DidSyntax.DID_METHOD_SEPARATOR +
            DidSyntax.MethodSpecificParameter.ADDRESS_BOOK_FILE_ID +
            DidSyntax.DID_PARAMETER_VALUE_SEPARATOR +
            this.addressBookFileId.toString();

        if(this.didTopicId) {
            ret = ret +
                DidSyntax.DID_PARAMETER_SEPARATOR +
                methodNetwork +
                DidSyntax.DID_METHOD_SEPARATOR +
                DidSyntax.MethodSpecificParameter.DID_TOPIC_ID +
                DidSyntax.DID_PARAMETER_VALUE_SEPARATOR +
                this.didTopicId.toString();
        }

        return ret;
    }

    /**
     * Constructs an id-string of a DID from a given public key.
     *
     * @param didRootKey Public Key from which the DID is created.
     * @return The id-string of a DID that is a Base58-encoded SHA-256 hash of a given public key.
     */
    public static publicKeyToIdString(didRootKey: PublicKey): string {
        return Hashing.base58.encode(Hashing.sha256.digest(didRootKey.toBytes()));
    }

    /**
     * Returns a private key of DID root key.
     * This is only available if it was provided during {@link HcsDid} construction.
     *
     * @return The private key of DID root key.
     */
    public getPrivateDidRootKey(): PrivateKey {
        return this.privateDidRootKey;
    }

    /**
     * Returns a public key of DID root key.
     * This is only available if it was provided during {@link HcsDid} construction.
     *
     * @return The private key of DID root key.
     */
    public getPublicDidRootKey(): PublicKey {
        return this.didRootKey;
    }
}
