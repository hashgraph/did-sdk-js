const { Hbar } = require("@hashgraph/sdk");

module.exports = {
    /**
     * Account that is going to pay for the demo
     */
    OPERATOR_ID: "xxx",
    /**
     * Account private key
     */
    PRIVATE_KEY_STR: "xxx",
    MAX_TRANSACTION_FEE: new Hbar(2),
    /**
     * Demo flows 2,3 and 4 use already created DID that should be set as TEST_DID_STR
     */
    TEST_DID_STR: "xxx",
};
