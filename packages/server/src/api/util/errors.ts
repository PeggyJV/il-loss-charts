// TODO Error codes
export class HTTPError extends Error {
    status = 500;

    constructor(status?: number, message?: string) {
        super(message);
        if (status) this.status = status;

        // Preset messages for status
        if (!message) {
            switch (status) {
                case 400:
                    this.message = 'Bad Request';
                    break;
                case 401:
                    this.message = 'Unauthorized';
                    break;
                case 404:
                    this.message = 'Not Found';
                    break;
                case 429:
                    this.message = 'Too Many Requests';
                    break;
                case 500:
                    this.message = 'Internal Server Error';
                    break;
                default:
                    this.message = 'Unknown Error';
                    break;
            }
        }
    }

    toString(): string {
        return `Error (${this.status}): ${this.message}`;
    }
}
