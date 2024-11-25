import fetch from "node-fetch";
import { HcsDidCreateDidDocumentEvent } from "../identity/hcs/did/event/document/hcs-did-create-did-document-event";

const IPFS_IO_HTTP_PROXY = "https://ipfs.io/ipfs/";

export class IpfsDidDocumentDownloader {
    constructor(private readonly ipfsHttpProxy: string = IPFS_IO_HTTP_PROXY) {}

    async downloadDocument(docEvent: HcsDidCreateDidDocumentEvent) {
        const url = docEvent.getUrl() ?? `${this.ipfsHttpProxy}/${docEvent.getCid}`;

        const result = await fetch(url);
        if (!result.ok) {
            throw new Error(`DID document could not be fetched from URL: ${url}`);
        }
        try {
            return await result.json();
        } catch (err) {
            throw new Error(`DID document from URL could not be parsed as JSON: ${url}`);
        }
    }
}
