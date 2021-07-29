const {
    HcsVcDocumentBase
} = require("../../dist");

/**
 * Custom VC document for tests.
 */
class DemoVerifiableCredentialDocument extends HcsVcDocumentBase {
    customProperty;

    constructor() {
        super();
    }

    getCustomProperty() {
        return this.customProperty;
    }

    setCustomProperty(customProperty) {
        this.customProperty = customProperty;
    }
}

exports.DemoVerifiableCredentialDocument = DemoVerifiableCredentialDocument;