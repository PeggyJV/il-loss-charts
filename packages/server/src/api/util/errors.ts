// TODO Error codes
export class HTTPError extends Error {
    status: number = 500;

    constructor(status?: number, message?: string) {
        super(message);
        if (status) this.status = status;
    }

    toString() {
        return `Error (${this.status}): ${this.message}`;
    }
}