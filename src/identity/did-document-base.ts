import { HcsDidServiceEvent } from "..";
import { DidDocumentJsonProperties } from "./did-document-json-properties";
import { DidSyntax } from "./did-syntax";

export class DidDocumentBase {
    private id: string;
    private context: string;
    private services: HcsDidServiceEvent[];
    private owners: any[];

    constructor(did: string) {
        this.id = did;
        this.context = DidSyntax.DID_DOCUMENT_CONTEXT;
        this.services = [];
        this.owners = [];
    }

    public getContext(): string {
        return this.context;
    }

    public getId(): string {
        return this.id;
    }

    public getServices(): HcsDidServiceEvent[] {
        return this.services;
    }

    public addService(service: HcsDidServiceEvent): void {
        this.services.push(service);
    }

    public addOwner(owner): void {
        if (this.owners.includes((o) => o.id === owner.id)) {
            return;
        }

        this.owners.push(owner);
    }

    public getOwners(): any[] {
        return this.owners;
    }

    public toJsonTree(): any {
        let rootObject = {};

        rootObject[DidDocumentJsonProperties.CONTEXT] = this.context;
        rootObject[DidDocumentJsonProperties.ID] = this.id;

        rootObject[DidDocumentJsonProperties.ASSERTION_METHOD] = this.owners.map((owner) => owner.id);
        rootObject[DidDocumentJsonProperties.AUTHENTICATION] = this.owners.map((owner) => owner.id);
        rootObject[DidDocumentJsonProperties.VERIFICATION_METHOD] = this.owners;

        if (this.getServices().length > 0) {
            rootObject[DidDocumentJsonProperties.SERVICE] = [];
            this.getServices().forEach((service) => {
                rootObject[DidDocumentJsonProperties.SERVICE].push(service.toJsonTree().Service);
            });
        }

        return rootObject;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }
}
