import { toast, ToastOptions } from 'react-toastify';

const options: ToastOptions = {
    position: 'top-center',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
};

export function toastWarn(msg: string): void {
    toast.warning(msg, options);
}

export function toastSuccess(msg: string): void{
    toast.success(msg, options);
}

export function toastError(msg: string): void{
    toast.error(msg, options);
}
