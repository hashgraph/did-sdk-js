import { Timestamp } from "@hashgraph/sdk";
import { Hashing } from "../../../utils/hashing";
import { TimestampUtils } from "../../../utils/timestamp-utils";
import { HcsDid } from "../did/hcs-did";
import { JsonClass } from "../json-class";
import { CredentialSubject } from "./credential-subject";
import { HcsVcDocumentHashBase } from "./hcs-vc-document-hash-base";
import { HcsVcDocumentJsonProperties } from "./hcs-vc-document-json-properties";
import { Issuer } from "./issuer";

/**
 * The base for a VC document generation in JSON-LD format.
 * VC documents according to W3C draft specification must be compatible with JSON-LD version 1.1 Up until now there is
 * no Java implementation library of JSON-LD version 1.1. For that reason this object represents only the most basic and
 * mandatory attributes from the VC specification and Hedera HCS DID method specification point of view. Applications
 * shall extend it with any VC document properties or custom properties they require.
 */
export class HcsVcDocumentBase<T extends CredentialSubject> extends HcsVcDocumentHashBase {
    protected context: string[];
    protected credentialSubject: T[];

    /**
     * Creates a new VC Document instance.
     */
    constructor() {
        super();
        this.context = [HcsVcDocumentJsonProperties.FIRST_CONTEXT_ENTRY];
    }

    /**
     * Constructs a credential hash that uniquely identifies this verifiable credential.
     * This is not a credential ID, but a hash composed of the properties included in HcsVcDocumentHashBase class
     * (excluding issuer name).
     * Credential hash is used to find the credential on Hedera VC registry.
     * Due to the nature of the VC document the hash taken from the base mandatory fields in this class
     * and shall produce a unique constant.
     * W3C specification defines ID field of a verifiable credential as not mandatory, however Hedera requires issuers to
     * define this property for each VC.
     *
     * @return The credential hash uniquely identifying this verifiable credential.
     */
    public toCredentialHash(): string {
        const map = {};
        map[HcsVcDocumentJsonProperties.ID] = this.id;
        map[HcsVcDocumentJsonProperties.TYPE] = this.type;
        map[HcsVcDocumentJsonProperties.ISSUER] = this.issuer.getId();
        map[HcsVcDocumentJsonProperties.ISSUANCE_DATE] = TimestampUtils.toJSON(this.issuanceDate, TimestampUtils.ISO8601);
        const json: string = JSON.stringify(map);
        const hash: Uint8Array = Hashing.sha256.digest(json);
        return Hashing.base58.encode(hash);
    }

    public getContext(): string[] {
        return this.context;
    }

    public getId(): string {
        return this.id;
    }

    public getType(): string[] {
        return this.type;
    }

    public getIssuer(): Issuer {
        return this.issuer;
    }

    public getIssuanceDate(): Timestamp {
        return this.issuanceDate;
    }

    public getCredentialSubject(): T[] {
        return this.credentialSubject;
    }

    public setId(id: string): void {
        this.id = id;
    }

    public setIssuer(issuerDid: string): void;
    public setIssuer(issuer: Issuer): void;
    public setIssuer(issuerDid: HcsDid): void;
    public setIssuer(...args: any[]): void {
        if (typeof args[0] === 'string') {
            this.issuer = new Issuer(args[0]);
            return;
        }
        if (args[0] instanceof Issuer) {
            this.issuer = args[0];
            return;
        }
        if (args[0] instanceof HcsDid) {
            this.issuer = new Issuer(args[0].toDid());
            return;
        }
    }

    public setIssuanceDate(issuanceDate: Timestamp): void {
        this.issuanceDate = issuanceDate;
    }


    /**
     * Adds an additional context to @context field of the VC document.
     *
     * @param context The context to add.
     */
    public addContext(context: string): void {
        this.context.push(context);
    }

    /**
     * Adds an additional type to `type` field of the VC document.
     *
     * @param type The type to add.
     */
    public addType(type: string): void {
        this.type.push(type);
    }

    /**
     * Adds a credential subject.
     *
     * @param credentialSubject The credential subject to add.
     */
    public addCredentialSubject(credentialSubject: T): void {
        if (this.credentialSubject == null) {
            this.credentialSubject = [];
        }

        this.credentialSubject.push(credentialSubject);
    }

    /**
     * Checks if all mandatory fields of a VC document are filled in.
     *
     * @return True if the document is complete and false otherwise.
     */
    public isComplete(): boolean {
        return (
            (this.context != null) &&
            (!!this.context.length) &&
            (HcsVcDocumentJsonProperties.FIRST_CONTEXT_ENTRY == this.context[0]) &&
            (this.type != null) &&
            (!!this.type.length) &&
            (this.type.indexOf(HcsVcDocumentJsonProperties.VERIFIABLE_CREDENTIAL_TYPE) > -1) &&
            (this.issuanceDate != null) &&
            (this.issuer != null) &&
            (!!this.issuer.getId()) &&
            (this.credentialSubject != null) &&
            (!!this.credentialSubject.length)
        );
    }
    
    // JsonClass

    public toJsonTree(): any {
        const rootObject = super.toJsonTree();

        const context = [];
        if (this.context) {
            for (let index = 0; index < this.context.length; index++) {
                const element = this.context[index];
                context.push(element);
            }
        }
        rootObject[HcsVcDocumentJsonProperties.CONTEXT] = context;

        const credentialSubject = [];
        if (this.credentialSubject) {
            for (let index = 0; index < this.credentialSubject.length; index++) {
                const element = this.credentialSubject[index];
                credentialSubject.push(element.toJsonTree());
            }
        }
        rootObject[HcsVcDocumentJsonProperties.CREDENTIAL_SUBJECT] = credentialSubject;

        return rootObject;
    }

    public static fromJsonTree<U extends CredentialSubject>(root: any, result?: HcsVcDocumentBase<U>, credentialSubjectClass?: JsonClass<U>): HcsVcDocumentBase<U> {
        if (!result)
            result = new HcsVcDocumentBase<U>();
        result = HcsVcDocumentHashBase.fromJsonTree(root, result) as HcsVcDocumentBase<U>;
        const jsonCredentialSubject = root[HcsVcDocumentJsonProperties.CREDENTIAL_SUBJECT] as any[];
        const credentialSubject: U[] = [];
        for (let i = 0; i < jsonCredentialSubject.length; i++) {
            const item = jsonCredentialSubject[i];
            const subject: U = credentialSubjectClass.fromJsonTree(item);
            credentialSubject.push(subject)
        }
        result.credentialSubject = credentialSubject;
        return result;
    }

    /**
     * Converts this document into a JSON string.
     *
     * @return The JSON representation of this document.
     */
    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    /**
     * Converts a VC document in JSON format into a {@link HcsVcDocumentBase} object.
     * Please note this conversion respects only the fields of the base VC document. All other fields are ignored.
     *
     * @param <U>                    The type of the credential subject.
     * @param json                   The VC document as JSON string.
     * @param credentialSubjectClass The type of the credential subject inside.
     * @return The {@link HcsVcDocumentBase} object.
     */
    public static fromJson<U extends CredentialSubject>(json: string, credentialSubjectClass?: JsonClass<U>): HcsVcDocumentBase<U> {
        let result: HcsVcDocumentBase<U>;
        try {
            const root = JSON.parse(json);
            result = this.fromJsonTree(root, null, credentialSubjectClass);

        } catch (e) {
            throw new Error('Given JSON string is not a valid HcsVcDocumentBase ' + e.message);
        }
        return result;
    }
}
