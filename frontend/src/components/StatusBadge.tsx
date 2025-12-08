'use client';

/**
 * Status Badge component with color coding
 */

interface StatusBadgeProps {
    status: 'PENDING' | 'ESCALATED' | 'ANSWERED';
}

const statusConfig = {
    PENDING: {
        bg: 'bg-amber-100 dark:bg-amber-900/50',
        text: 'text-amber-700 dark:text-amber-300',
        label: 'Pending',
    },
    ESCALATED: {
        bg: 'bg-red-100 dark:bg-red-900/50',
        text: 'text-red-700 dark:text-red-300',
        label: 'Escalated',
    },
    ANSWERED: {
        bg: 'bg-green-100 dark:bg-green-900/50',
        text: 'text-green-700 dark:text-green-300',
        label: 'Answered',
    },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${config.bg} ${config.text}`}
        >
            {config.label}
        </span>
    );
}
