import { ICodedError, errors } from '@sommelier/shared-types';

interface ErrorShape {
    code: number;
    message: string;
    details: string;
}

export class CodedHTTPError extends Error {
    public status: number;
    public code: number;
    public message: string;
    public details: string;

    constructor(
        status: number,
        error: ICodedError | ErrorShape,
        details?: string,
    ) {
        super(error.message);

        this.status = status;
        this.code = error.code;
        this.message = error.message;
        this.details = details ?? '';
    }

    toString(): string {
        return `Error ${this.code} - ${this.status}: ${this.message}`;
    }

    toObject(): ErrorShape {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
        };
    }

    setDetails(details: string): void {
        this.details = details;
    }

    clone(): CodedHTTPError {
        return new CodedHTTPError(this.status, {
            code: this.code,
            message: this.message,
            details: this.details,
        });
    }
}

// 500 because users cannot change their request to make this work.
export const UpstreamError = new CodedHTTPError(500, errors.UpstreamError);
export const UpstreamMissingPoolDataError = new CodedHTTPError(
    500,
    errors.UpstreamMissingPoolDataError,
);

export const ValidationError = new CodedHTTPError(400, errors.ValidationError);
