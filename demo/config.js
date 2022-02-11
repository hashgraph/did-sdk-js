const { Hbar } = require("@hashgraph/sdk");

module.exports = {
    /**
     * Account that is going to pay for the demo
     */
    OPERATOR_ID: "xxx",

    /**
     * Account private key
     */
    OPERATOR_KEY: "302e...",

    /**
     * Fix Transaction Fee
     */
    MAX_TRANSACTION_FEE: new Hbar(2),

    /**
     * ===============================================================================================================================
     * IMPORTANT: after running step 1, generated DID identifier and private key value please put below so later steps can be executed
     * ===============================================================================================================================
     */

    /**
     * DID document identifier
     */
    DID_IDENTIFIER: "did:hedera:testnet:...",

    /**
     * DID private key
     */
    DID_PRIVATE_KEY: "302e...",
};
