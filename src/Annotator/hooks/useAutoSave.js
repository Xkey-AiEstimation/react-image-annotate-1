import { useEffect, useRef } from 'react';

const AUTOSAVE_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds    

const useAutoSave = ({
    state,
    onSave,
    setAutoSaveIndicator,
    dispatchToReducer,
    without,
    setLastAutoSave,
}) => {
    const isSaving = useRef(false);
    const lastSavedAt = useRef(Date.now());
    const latestStateRef = useRef(state);
    const intervalRef = useRef(null);
    const pendingSave = useRef(false);

    useEffect(() => {
        latestStateRef.current = state;
    }, [state]);

    const autoSave = async () => {
        if (isSaving.current) {
            // skip if a save is in progress
            pendingSave.current = true;
            return;
        }

        isSaving.current = true;
        setAutoSaveIndicator({ show: true, message: 'Auto-saving...' });

        try {
            await onSave(without(latestStateRef.current, 'history'));
            lastSavedAt.current = Date.now();
            setLastAutoSave(Date.now());
            setAutoSaveIndicator({ show: true, message: 'Auto-save successful' });

            dispatchToReducer({ type: 'CLEAR_NEW_DEVICES_TO_SAVE' });

            setTimeout(() => {
                setAutoSaveIndicator({ show: false, message: '' });
            }, 3000);
        } catch (error) {
            console.error('Auto-save failed:', error);
            setAutoSaveIndicator({ show: true, message: 'Auto-save failed' });

            setTimeout(() => {
                setAutoSaveIndicator({ show: false, message: '' });
            }, 5000);
        } finally {
            isSaving.current = false;

            if (pendingSave.current) {
                pendingSave.current = false;
                autoSave(); // retry if something queued during save
            }
        }
    };

    const startInterval = () => {
        if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
                const now = Date.now();
                if (now - lastSavedAt.current >= AUTOSAVE_INTERVAL) {
                    autoSave();
                }
            }, AUTOSAVE_INTERVAL);
        }
    };

    const stopInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            const now = Date.now();
            if (now - lastSavedAt.current >= AUTOSAVE_INTERVAL) {
                autoSave(); // immediate catch-up save
            }
            startInterval();
        } else {
            stopInterval();
        }
    };

    useEffect(() => {
        startInterval();
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            stopInterval();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [onSave]); // keep `onSave` as only external dependency
};


export default useAutoSave;