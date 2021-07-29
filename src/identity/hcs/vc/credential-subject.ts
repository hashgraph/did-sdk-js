import { HcsVcDocumentJsonProperties } from "./hcs-vc-document-json-properties";

export class CredentialSubject {
    protected id: string;

    public getId(): string {
        return this.id;
    }

    public setId(id: string): void {
        this.id = id;
    }


    // JsonClass

    public toJsonTree(): any {
        const rootObject = {};
        rootObject[HcsVcDocumentJsonProperties.ID] = this.id;
        return rootObject;
    }

    public static fromJsonTree(root: any, result?: CredentialSubject): CredentialSubject {
        if (!result)
            result = new CredentialSubject();
        result.id = root[HcsVcDocumentJsonProperties.ID];
        return result;

    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    public static fromJson(json: string): CredentialSubject {
        let result: CredentialSubject;

        try {
            const root = JSON.parse(json);
            result = this.fromJsonTree(root);

        } catch (e) {
            throw new Error('Given JSON string is not a valid CredentialSubject ' + e.message);
        }

        return result;
    }
}

