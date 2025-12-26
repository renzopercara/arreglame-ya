
import { useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_WORKER_LOCATION } from '../graphql/queries';
import { useGeoLocation } from './useGeoLocation';
import { UserRole, WorkerStatus } from '../types';

export const useWorkerLocationSync = (
    userRole: UserRole, 
    workerStatus: WorkerStatus,
    isActive: boolean // Si la app estÃƒÂ¡ en foreground
) => {
    const { position } = useGeoLocation(true); // Auto-fetch activo
    const [updateLocation] = useMutation(UPDATE_WORKER_LOCATION);
    const lastSync = useRef<number>(0);

    useEffect(() => {
        // Solo sincronizamos si es Worker, estÃƒÂ¡ ONLINE (u ON_JOB) y tenemos posiciÃƒÂ³n vÃƒÂ¡lida
        if (userRole !== UserRole.WORKER || !position) return;
        if (workerStatus === WorkerStatus.OFFLINE) return;

        const now = Date.now();
        // Throttling: Enviar mÃƒÂ¡ximo cada 30 segundos para ahorrar baterÃƒÂ­a y datos
        if (now - lastSync.current > 30000) {
            updateLocation({
                variables: {
                    lat: position.lat,
                    lng: position.lng
                }
            }).then(() => {
                console.log(`[WorkerSync] Location updated: ${position.lat}, ${position.lng}`);
                lastSync.current = now;
            }).catch(e => console.error("[WorkerSync] Error:", e));
        }
    }, [position, userRole, workerStatus, updateLocation]);
};
