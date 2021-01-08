// TODO Error codes
export class HTTPError extends Error {
    status = 500;

    constructor(status?: number, message?: string) {
        super(message);
        if (status) this.status = status;
    }

    toString(): string {
        return `Error (${this.status}): ${this.message}`;
    }
}
