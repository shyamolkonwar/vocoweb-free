'use client';

import { useState, useEffect, useCallback } from 'react';

interface TaskStatus {
    task_id: string;
    status: 'PENDING' | 'STARTED' | 'PROGRESS' | 'SUCCESS' | 'FAILED' | 'FAILURE' | 'RETRY';
    progress?: number;
    step?: string;
    message?: string;
    result?: {
        status: string;
        website_id?: string;
        business_name?: string;
        error?: string;
        [key: string]: unknown;
    };
    error?: string;
}

interface UseTaskPollingOptions {
    pollInterval?: number;  // milliseconds
    onSuccess?: (result: TaskStatus['result']) => void;
    onError?: (error: string) => void;
}

interface UseTaskPollingReturn {
    status: TaskStatus | null;
    isPolling: boolean;
    isComplete: boolean;
    isError: boolean;
    startPolling: (taskId: string) => void;
    stopPolling: () => void;
    cancelTask: () => Promise<void>;
}

export function useTaskPolling(options: UseTaskPollingOptions = {}): UseTaskPollingReturn {
    const {
        pollInterval = 2000,
        onSuccess,
        onError
    } = options;

    const [taskId, setTaskId] = useState<string | null>(null);
    const [status, setStatus] = useState<TaskStatus | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchStatus = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/tasks/${id}`);
            const data: TaskStatus = await response.json();

            if (response.ok) {
                setStatus(data);

                // Check if task is complete
                if (data.status === 'SUCCESS') {
                    setIsComplete(true);
                    setIsPolling(false);
                    if (data.result && data.result.status !== 'failed') {
                        onSuccess?.(data.result);
                    } else if (data.result?.error) {
                        setIsError(true);
                        onError?.(data.result.error);
                    }
                } else if (data.status === 'FAILED' || data.status === 'FAILURE') {
                    setIsError(true);
                    setIsPolling(false);
                    onError?.(data.error || 'Task failed');
                }
            } else {
                setIsError(true);
                setIsPolling(false);
                onError?.(data.error || 'Failed to get task status');
            }
        } catch (error) {
            console.error('Polling error:', error);
            setIsError(true);
            setIsPolling(false);
            onError?.('Failed to poll task status');
        }
    }, [onSuccess, onError]);

    // Polling effect
    useEffect(() => {
        if (!taskId || !isPolling) return;

        // Initial fetch
        fetchStatus(taskId);

        // Set up polling interval
        const intervalId = setInterval(() => {
            if (isPolling && !isComplete && !isError) {
                fetchStatus(taskId);
            }
        }, pollInterval);

        return () => clearInterval(intervalId);
    }, [taskId, isPolling, isComplete, isError, pollInterval, fetchStatus]);

    const startPolling = useCallback((id: string) => {
        setTaskId(id);
        setStatus(null);
        setIsComplete(false);
        setIsError(false);
        setIsPolling(true);
    }, []);

    const stopPolling = useCallback(() => {
        setIsPolling(false);
    }, []);

    const cancelTask = useCallback(async () => {
        if (!taskId) return;

        try {
            await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            stopPolling();
        } catch (error) {
            console.error('Cancel error:', error);
        }
    }, [taskId, stopPolling]);

    return {
        status,
        isPolling,
        isComplete,
        isError,
        startPolling,
        stopPolling,
        cancelTask
    };
}

export default useTaskPolling;
