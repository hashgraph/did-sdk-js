const { HcsDid, DidDocumentBuilder, DidDocumentJsonProperties, DidSyntax, Hashing } = require("../dist");
const { TopicId } = require("@hashgraph/sdk");
const { expect, assert } = require("chai");

const network = "testnet";
const DID_TOPIC_ID = TopicId.fromString("0.0.2");

describe("DidDocumentBuilder", function () {});
