import { DidError } from "./did-error";
import { DidSyntax } from "./did-syntax";
import { HcsDid } from "./hcs/did/hcs-did";

/**
 * Parses the given DID string into it's corresponding Hedera DID object.
 *
 * @param didString DID string.
 * @return {@link HederaDid} instance.
 */
export class DidParser {
    public static parse(didString: string): HcsDid {
        const methodIndex = DidSyntax.DID_PREFIX.length + 1;
        if (!didString || didString.length <= methodIndex) {
            throw new DidError("DID string cannot be null");
        }

        if (didString.startsWith(HcsDid.DID_METHOD + DidSyntax.DID_METHOD_SEPARATOR, methodIndex)) {
            return new HcsDid({ identifier: didString });
        } else {
            throw new DidError("DID string is invalid.");
        }
    }
}
