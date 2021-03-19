import { toast } from 'react-toastify';

export function toastWarn(msg: string) {
    return toast.warning(`Pending tx ${msg.substr(0, 5).concat('...')}`, {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    });
}

export function toastSuccess(msg: string) {
    toast.warning(msg, {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    });
}

export function toastError(msg: string) {
    toast.error(`Pending tx ${msg.substr(0, 5).concat('...')}`, {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    });
}
