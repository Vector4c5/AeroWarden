import { toast } from "react-toastify";

const baseOptions = {
    position: "top-right",
    autoClose: 4200,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

export function notifySuccess(message) {
    toast.success(message, {
        ...baseOptions,
        className: "aerowarden-toast aerowarden-toast-success",
    });
}

export function notifyError(message) {
    const errorMessage =
        message ||
        "Ocurrió un error inesperado. Si el problema persiste, contacta al administrador.";

    const includesAdminHint = /administrador/i.test(errorMessage);

    toast.error(
        includesAdminHint
            ? errorMessage
            : `${errorMessage} Si el problema persiste, contacta al administrador.`,
        {
            ...baseOptions,
            autoClose: 5500,
            className: "aerowarden-toast aerowarden-toast-error",
        }
    );
}
