import * as Base58 from "base58-js";
import * as crypto from "crypto";
import { Base64 } from "js-base64";
import { base58btc } from "multiformats/bases/base58";
import { MultibaseDecoder, MultibaseEncoder } from "multiformats/bases/interface";

export class Hashing {
    public static readonly sha256 = {
        digest: function (data: Uint8Array | string): Uint8Array {
            const sha256 = crypto
                .createHash("sha256") // may need to change in the future.
                .update(data)
                .digest();
            return sha256;
        },
    };

    public static readonly base64 = {
        decode: function (encodedString: string): string {
            return Base64.fromBase64(encodedString);
        },
        encode: function (decodedBytes: string): string {
            return Base64.toBase64(decodedBytes);
        },
    };

    public static readonly base58 = {
        decode: function (encodedString: string): Uint8Array {
            return Base58.base58_to_binary(encodedString);
        },
        encode: function (decodedBytes: Uint8Array): string {
            return Base58.binary_to_base58(decodedBytes);
        },
    };

    /**
     * @returns Multibase [MULTIBASE] base58-btc encoded value that is a concatenation of the
     * MULTIBASE(base58-btc, raw-public-key-bytes)
     * https://github.com/multiformats/multibase
     * https://www.w3.org/TR/did-core/#dfn-publickeymultibase
     */
    public static readonly multibase = {
        encode: function (data: Uint8Array, base: MultibaseEncoder<string> = base58btc): string {
            return base.encode(data);
        },
        decode: function (data: string, base: MultibaseDecoder<string> = base58btc): Uint8Array {
            return base.decode(data);
        },
    };
}
