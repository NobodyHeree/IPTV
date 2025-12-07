/**
 * Error utility - Maps technical errors to user-friendly messages
 */

const errorMessages = {
    // Network errors
    'NETWORK_ERROR': {
        title: 'Connexion perdue',
        message: 'Vérifiez votre connexion internet et réessayez.',
        icon: 'wifi-off'
    },
    'TIMEOUT': {
        title: 'Délai dépassé',
        message: 'Le serveur met trop de temps à répondre. Réessayez.',
        icon: 'clock'
    },

    // HTTP errors
    '502': {
        title: 'Serveur indisponible',
        message: 'Le serveur est temporairement surchargé. Patientez quelques secondes.',
        icon: 'server'
    },
    '503': {
        title: 'Service indisponible',
        message: 'Le service est en maintenance. Réessayez plus tard.',
        icon: 'server'
    },
    '509': {
        title: 'Limite atteinte',
        message: 'Trop de requêtes. Patientez 30 secondes avant de réessayer.',
        icon: 'alert-triangle'
    },
    '403': {
        title: 'Accès refusé',
        message: 'Vous n\'avez pas accès à ce contenu.',
        icon: 'lock'
    },
    '404': {
        title: 'Introuvable',
        message: 'Le contenu demandé n\'existe pas ou a été supprimé.',
        icon: 'search'
    },

    // Stream errors
    'STREAM_ERROR': {
        title: 'Erreur de lecture',
        message: 'Impossible de lire le flux. Essayez une autre chaîne.',
        icon: 'tv'
    },
    'MEDIA_ERROR': {
        title: 'Format non supporté',
        message: 'Ce format vidéo n\'est pas compatible.',
        icon: 'film'
    },

    // Auth errors
    'AUTH_FAILED': {
        title: 'Connexion échouée',
        message: 'Vérifiez votre adresse MAC et l\'URL du portail.',
        icon: 'user-x'
    },
    'SESSION_EXPIRED': {
        title: 'Session expirée',
        message: 'Veuillez vous reconnecter.',
        icon: 'log-out'
    },

    // Default
    'UNKNOWN': {
        title: 'Erreur inattendue',
        message: 'Une erreur est survenue. Veuillez réessayer.',
        icon: 'alert-circle'
    }
};

/**
 * @typedef {Object} ParsedError
 * @property {string} title - User-friendly error title
 * @property {string} message - Detailed error message
 * @property {string} icon - Lucide icon name
 */

/**
 * Parse an error and return a user-friendly message
 * @param {string|Error|{response?: {status: number}}} error - The error to parse
 * @returns {ParsedError} Parsed error with user-friendly message
 */
export function parseError(error) {
    // If error is a string, try to match it
    if (typeof error === 'string') {
        // Check for HTTP status codes
        const statusMatch = error.match(/(\d{3})/);
        if (statusMatch && errorMessages[statusMatch[1]]) {
            return errorMessages[statusMatch[1]];
        }

        // Check for network errors
        if (error.toLowerCase().includes('network')) {
            return errorMessages['NETWORK_ERROR'];
        }
        if (error.toLowerCase().includes('timeout')) {
            return errorMessages['TIMEOUT'];
        }
    }

    // If error is an Error object
    if (error instanceof Error) {
        const msg = error.message;

        // Check for axios network error
        if (msg.includes('Network Error')) {
            return errorMessages['NETWORK_ERROR'];
        }

        // Check for HTTP status codes in message
        const statusMatch = msg.match(/status code (\d{3})/);
        if (statusMatch && errorMessages[statusMatch[1]]) {
            return errorMessages[statusMatch[1]];
        }
    }

    // If error has a response (axios error)
    if (error?.response?.status) {
        const status = String(error.response.status);
        if (errorMessages[status]) {
            return errorMessages[status];
        }
    }

    return errorMessages['UNKNOWN'];
}

/**
 * Get a simple friendly message from any error
 */
export function getFriendlyMessage(error) {
    const parsed = parseError(error);
    return `${parsed.title}: ${parsed.message}`;
}

export default { parseError, getFriendlyMessage };
