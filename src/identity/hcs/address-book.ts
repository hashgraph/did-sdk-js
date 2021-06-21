import {FileId} from "@hashgraph/sdk";

/**
 * Appent's address book for HCS identity network.
 */
export class AddressBook {
    private fileId: FileId;
    private appnetName: string;
    private didTopicId: string;
    private vcTopicId: string;
    private appnetDidServers: string[];

    /**
     * Converts an address book JSON string into address book object.
     *
     * @param json              Address book JSON file.
     * @param addressBookFileId FileId of this address book in Hedera File Service.
     * @return The {@link AddressBook}.
     */
    public static fromJson(json: string, addressBookFileId: FileId | string): AddressBook {
        const result = new AddressBook();
        const item = JSON.parse(json);
        result.appnetName = item.appnetName;
        result.didTopicId = item.didTopicId;
        result.vcTopicId = item.vcTopicId;
        result.appnetDidServers = item.appnetDidServers;

        if (typeof addressBookFileId === 'string') {
            result.setFileId(FileId.fromString(addressBookFileId));
        } else if (addressBookFileId instanceof FileId) {
            result.setFileId(addressBookFileId);
        }

        return result;
    }

    /**
     * Creates a new {@link AddressBook} instance. Does not create the file on Hedera File Service!.
     *
     * @param appnetName       Name of the appnet.
     * @param didTopicId       TopicID of the DID topic.
     * @param vcTopicId        Topic ID of the Verifiable Credentials topic.
     * @param appnetDidServers List of appnet API servers.
     * @return The {@link AddressBook}.
     */
    public static create(appnetName: string, didTopicId: string, vcTopicId: string, appnetDidServers: string[]) {
        const result = new AddressBook();
        result.appnetDidServers = appnetDidServers;
        result.didTopicId = didTopicId;
        result.vcTopicId = vcTopicId;
        result.appnetName = appnetName;

        return result;
    }

    /**
     * Converts this address book file into JSON string.
     *
     * @return The JSON representation of this address book.
     */
    public toJSON(): string {
        return JSON.stringify({
            appnetName: this.appnetName,
            didTopicId: this.didTopicId,
            vcTopicId: this.vcTopicId,
            appnetDidServers: this.appnetDidServers
        });
    }

    public getAppnetName(): string {
        return this.appnetName;
    }

    public setAppnetName(appnetName: string): void {
        this.appnetName = appnetName;
    }

    public getDidTopicId(): string {
        return this.didTopicId;
    }

    public setDidTopicId(didTopicId: string): void {
        this.didTopicId = didTopicId;
    }

    public getVcTopicId(): string {
        return this.vcTopicId;
    }

    public setVcTopicId(vcTopicId: string): void {
        this.vcTopicId = vcTopicId;
    }

    public getAppnetDidServers(): string[] {
        return this.appnetDidServers;
    }

    public setAppnetDidServers(appnetDidServers: string[]): void {
        this.appnetDidServers = appnetDidServers;
    }

    public getFileId(): FileId {
        return this.fileId;
    }

    public setFileId(fileId: FileId): void {
        this.fileId = fileId;
    }
}
