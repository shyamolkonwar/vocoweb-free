'use client';

interface TaskProgressProps {
    language: 'en' | 'hi';
    status: string;
    step?: string;
    message?: string;
    progress?: number;
    onCancel?: () => void;
}

const content = {
    en: {
        title: "Creating Your Website",
        cancel: "Cancel",
        steps: {
            pending: "Waiting to start...",
            started: "Starting...",
            transcribing: "Converting voice to text...",
            normalizing: "Understanding your message...",
            parsing: "Analyzing your business...",
            designing: "Choosing the perfect design...",
            building: "Building your website...",
            scraping: "Fetching content...",
            extracting: "Extracting information...",
            complete: "Complete!"
        }
    },
    hi: {
        title: "आपकी Website बन रही है",
        cancel: "Cancel करें",
        steps: {
            pending: "शुरू होने का इंतज़ार...",
            started: "शुरू हो रहा है...",
            transcribing: "Voice को text में convert कर रहे हैं...",
            normalizing: "आपका message समझ रहे हैं...",
            parsing: "Business analyze कर रहे हैं...",
            designing: "Perfect design चुन रहे हैं...",
            building: "Website बना रहे हैं...",
            scraping: "Content fetch कर रहे हैं...",
            extracting: "Information निकाल रहे हैं...",
            complete: "हो गया!"
        }
    }
};

export default function TaskProgress({
    language,
    status,
    step,
    message,
    progress = 0,
    onCancel
}: TaskProgressProps) {
    const t = content[language];

    // Get display message
    const getDisplayMessage = () => {
        if (message) return message;
        if (step && t.steps[step as keyof typeof t.steps]) {
            return t.steps[step as keyof typeof t.steps];
        }
        if (status === 'PENDING') return t.steps.pending;
        if (status === 'STARTED') return t.steps.started;
        if (status === 'SUCCESS') return t.steps.complete;
        return t.steps.started;
    };

    // Get progress percentage
    const getProgress = () => {
        if (progress > 0) return progress;
        if (status === 'PENDING') return 5;
        if (status === 'STARTED') return 10;
        if (status === 'SUCCESS') return 100;
        return 50;
    };

    const progressValue = getProgress();

    return (
        <div className="task-progress">
            <h3 className="task-progress-title">{t.title}</h3>

            {/* Progress Bar */}
            <div className="progress-bar-container">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progressValue}%` }}
                />
            </div>

            {/* Status Message */}
            <div className="progress-status">
                <span className="progress-spinner"></span>
                <span className="progress-message">{getDisplayMessage()}</span>
            </div>

            {/* Progress Percentage */}
            <div className="progress-percentage">
                {progressValue}%
            </div>

            {/* Cancel Button */}
            {onCancel && status !== 'SUCCESS' && (
                <button onClick={onCancel} className="btn-text cancel-btn">
                    {t.cancel}
                </button>
            )}
        </div>
    );
}
