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
};
