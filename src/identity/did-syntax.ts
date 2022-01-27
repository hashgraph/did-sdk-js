export module DidSyntax {
  export const DID_PREFIX = "did";
  export const DID_DOCUMENT_CONTEXT = "https://www.w3.org/ns/did/v1";
  export const DID_METHOD_SEPARATOR = ":";
  export const DID_TOPIC_SEPARATOR = "_";

  export enum Method {
    HEDERA_HCS = "hedera",
  }
}
