// TODO Error codes


export class HTTPError extends Error {
    status = 500;

    constructor(status?: number, message?: string) {
        super(message);
        this.status = status;
    }

    toString() {
        return `Error (${this.status}): ${this.message}`;
    }
}