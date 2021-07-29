import { HcsVcDocumentJsonProperties } from "./hcs-vc-document-json-properties";

export class Issuer {
    protected id: string;
    protected name: string;

    constructor(id: string)
    constructor(id: string, name: string);
    constructor(...args: any[]) {
        this.id = args[0];
        this.name = args[1] || null;
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    // JsonClass

    public toJsonTree(): any {
        if (this.name) {
            const rootObject = {};
            rootObject[HcsVcDocumentJsonProperties.ID] = this.id;
            rootObject['name'] = this.name;
            return rootObject;
        }
        return this.id;
    }

    public static fromJsonTree(root: any, result?: Issuer): Issuer {
        let id: string, name: string;
        if (typeof root == "string") {
            id = root;
        } else {
            id = root[HcsVcDocumentJsonProperties.ID];
            name = root["name"];
        }
        if (result) {
            result.id = id;
            result.name = name
            return result;
        } else {
            return new Issuer(id, name);
        }
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    public static fromJson(json: string): Issuer {
        let result: Issuer;

        try {
            const root = JSON.parse(json);
            result = this.fromJsonTree(root);

        } catch (e) {
            throw new Error('Given JSON string is not a valid Issuer ' + e.message);
        }

        return result;
    }
}