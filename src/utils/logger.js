/**
 * Centralized logging utility for AURA IPTV
 * Provides consistent logging across main process and renderer
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Current log level (can be changed via settings)
let currentLevel = LOG_LEVELS.INFO;

// Color codes for console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Format timestamp
const timestamp = () => {
    const now = new Date();
    return now.toISOString().substring(11, 23); // HH:MM:SS.mmm
};

// Format log message
const formatMessage = (level, module, message, data) => {
    const time = timestamp();
    const prefix = `[${time}] [${level}] [${module}]`;

    if (data !== undefined) {
        return { prefix, message, data };
    }
    return { prefix, message };
};

// Logger class
class Logger {
    constructor(moduleName = 'App') {
        this.module = moduleName;
    }

    // Create a child logger with a sub-module name
    child(subModule) {
        return new Logger(`${this.module}:${subModule}`);
    }

    debug(message, data) {
        if (currentLevel <= LOG_LEVELS.DEBUG) {
            const formatted = formatMessage('DEBUG', this.module, message, data);
            console.log(`${colors.dim}${formatted.prefix}${colors.reset} ${message}`, data || '');
        }
    }

    info(message, data) {
        if (currentLevel <= LOG_LEVELS.INFO) {
            const formatted = formatMessage('INFO', this.module, message, data);
            console.log(`${colors.cyan}${formatted.prefix}${colors.reset} ${message}`, data || '');
        }
    }

    warn(message, data) {
        if (currentLevel <= LOG_LEVELS.WARN) {
            const formatted = formatMessage('WARN', this.module, message, data);
            console.warn(`${colors.yellow}${formatted.prefix}${colors.reset} ${message}`, data || '');
        }
    }

    error(message, error) {
        if (currentLevel <= LOG_LEVELS.ERROR) {
            const formatted = formatMessage('ERROR', this.module, message);
            console.error(`${colors.red}${formatted.prefix}${colors.reset} ${message}`);

            if (error) {
                if (error instanceof Error) {
                    console.error(`${colors.red}  → ${error.message}${colors.reset}`);
                    if (error.stack) {
                        console.error(`${colors.dim}${error.stack}${colors.reset}`);
                    }
                } else {
                    console.error(`${colors.red}  → ${JSON.stringify(error)}${colors.reset}`);
                }
            }
        }
    }

    // Log stream/playback events
    stream(event, data) {
        this.info(`🎬 ${event}`, data);
    }

    // Log network events
    network(event, data) {
        this.debug(`🌐 ${event}`, data);
    }

    // Log user actions
    action(event, data) {
        this.info(`👆 ${event}`, data);
    }
}

// Set log level
export const setLogLevel = (level) => {
    if (typeof level === 'string') {
        currentLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
    } else {
        currentLevel = level;
    }
};

// Create default loggers for different modules
export const logger = new Logger('AURA');
export const playerLogger = new Logger('Player');
export const stalkerLogger = new Logger('Stalker');
export const proxyLogger = new Logger('HLSProxy');
export const settingsLogger = new Logger('Settings');

// Export Logger class for custom instances
export { Logger, LOG_LEVELS };

export default logger;
