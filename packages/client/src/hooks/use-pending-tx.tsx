import {
    useState,
    createContext,
    useContext,
    Dispatch,
    SetStateAction,
} from 'react';

export type PendingTx = {
    approval: Array<string>;
    confirm: Array<string>;
};

type PendingTxContextType = {
    pendingTx: PendingTx;
    setPendingTx: Dispatch<SetStateAction<PendingTx>>;
};

const defaultPendingContext = {
    pendingTx: {
        approval: [],
        confirm: [],
    },
};

const PendingTxContext = createContext<Partial<PendingTxContextType>>(
    defaultPendingContext,
);

export const PendingTxProvider = ({
    children,
}: {
    children: JSX.Element;
}): JSX.Element => {
    const [pendingTx, setPendingTx] = useState<PendingTx>({
        approval: [],
        confirm: [],
    });

    return (
        <PendingTxContext.Provider value={{ pendingTx, setPendingTx }}>
            {children}
        </PendingTxContext.Provider>
    );
};

export const usePendingTx = (): PendingTxContextType => {
    return useContext(PendingTxContext) as PendingTxContextType;
};
