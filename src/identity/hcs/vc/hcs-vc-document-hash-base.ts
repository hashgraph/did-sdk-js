import { Timestamp } from "@hashgraph/sdk";
import { TimestampUtils } from "../../../utils/timestamp-utils";
import { HcsVcDocumentJsonProperties } from "./hcs-vc-document-json-properties";
import { Issuer } from "./issuer";

/**
 * The part of the VC document that is used for hash calculation.
 */
export class HcsVcDocumentHashBase {
    protected id: string;
    protected type: string[];
    protected issuer: Issuer;
    protected issuanceDate: Timestamp;

    /**
     * Creates a new VC document instance.
     */
    constructor() {
        this.type = [HcsVcDocumentJsonProperties.VERIFIABLE_CREDENTIAL_TYPE];
    }
    
    // JsonClass

    public toJsonTree(): any {
        const rootObject = {};
        if (this.id)
            rootObject[HcsVcDocumentJsonProperties.ID] = this.id;
        if (this.type)
            rootObject[HcsVcDocumentJsonProperties.TYPE] = this.type;
        if (this.issuer)
            rootObject[HcsVcDocumentJsonProperties.ISSUER] = this.issuer.toJsonTree();
        if (this.issuanceDate)
            rootObject[HcsVcDocumentJsonProperties.ISSUANCE_DATE] = TimestampUtils.toJSON(this.issuanceDate);
        return rootObject;
    }

    public static fromJsonTree(root: any, result?: HcsVcDocumentHashBase): HcsVcDocumentHashBase {
        if (!result)
            result = new HcsVcDocumentHashBase();
        if (root[HcsVcDocumentJsonProperties.ID])
            result.id = root[HcsVcDocumentJsonProperties.ID];
        if (root[HcsVcDocumentJsonProperties.TYPE])
            result.type = root[HcsVcDocumentJsonProperties.TYPE];
        if (root[HcsVcDocumentJsonProperties.ISSUER])
            result.issuer = Issuer.fromJsonTree(root[HcsVcDocumentJsonProperties.ISSUER]);
        if (root[HcsVcDocumentJsonProperties.ISSUANCE_DATE])
            result.issuanceDate = TimestampUtils.fromJson(root[HcsVcDocumentJsonProperties.ISSUANCE_DATE]);
        return result;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    public static fromJson(json: string): HcsVcDocumentHashBase {
        let result: HcsVcDocumentHashBase;
        try {
            const root = JSON.parse(json);
            result = this.fromJsonTree(root);

        } catch (e) {
            throw new Error('Given JSON string is not a valid HcsVcDocumentHashBase ' + e.message);
        }
        return result;
    }
}