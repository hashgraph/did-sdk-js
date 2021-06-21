export class Validator {
    protected validationErrors: string[];

    public addValidationError(errorMessage: string): void {
        if (!this.validationErrors) {
            this.validationErrors = [];
        }
        this.validationErrors.push(errorMessage);
    }

    public checkValidationErrors(prologue: string, validationFunction: (input: Validator) => void): void {
        this.validationErrors = null;

        validationFunction(this);

        if (!this.validationErrors) {
            return;
        }

        const errors = this.validationErrors;
        this.validationErrors = null;

        throw new Error(prologue + ':\n' + errors.join('\n'));
    }

    public require(condition: boolean, errorMessage: string): void {
        if (!condition) {
            this.addValidationError(errorMessage);
        }
    }
}
