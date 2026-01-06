export enum DidErrorCode {
    GENERIC = "generic",
    INVALID_DID_STRING = "invalid_did_string",
    INVALID_NETWORK = "invalid_network",
    /**
     * DID_NOT_FOUND is not thrown anywhere at the moment
     */
    DID_NOT_FOUND = "did_not_found",
}

export class DidError extends Error {
    public code: DidErrorCode;

    constructor(message: string, code: DidErrorCode = DidErrorCode.GENERIC) {
        super(message);
        this.code = code;
    }
}
