import { logData, logError } from "@svkruik/sk-platform-formatters";
import mariadb from "mariadb";
import type { Pool } from "mariadb";
import { databaseConfig, validDatabases } from "./types";

const databaseNames: Array<validDatabases> = ["skp", "central", "bots"];
declare global {
    var __db_pools__: Record<string, Pool> | undefined;
}

let retries: 0 | 1 = 0;
let connectionConfig: databaseConfig = {
    "databaseHost": null,
    "databasePort": null,
    "databaseUsername": null,
    "databasePassword": null,
}

/**
 * Creates or returns a connection to the database using the runtime configuration.
 * 
 * @param profile The database name/profile to connect to. Not all credentials allow access to all databases.
 * @returns The database connection pool.
 */
export async function database(profile: validDatabases): Promise<Pool> {
    try {
        // Validate configuration
        if (!connectionConfig.databaseHost
            || !connectionConfig.databasePort
            || !connectionConfig.databaseUsername
            || !connectionConfig.databasePassword) {
            if (retries < 1) {
                retries++;
                logData("[DB] Database connection not configured. Retrying with directly accessing .env variables.", "warn");
                config({
                    databaseHost: process.env.NUXT_DATABASE_HOST || process.env.DATABASE_HOST || null,
                    databasePort: process.env.NUXT_DATABASE_PORT || process.env.DATABASE_PORT || null,
                    databaseUsername: process.env.NUXT_DATABASE_USERNAME || process.env.DATABASE_USERNAME || null,
                    databasePassword: process.env.NUXT_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD || null,
                });
                return database(profile);
            }
            throw new Error("Database connection is not properly configured.");
        }
        if (!databaseNames.includes(profile)) throw new Error("Invalid database profile specified.");

        // Retry logging
        if (retries > 0) logData("[DB] Database connection configured successfully after retry.", "info");
        retries = 0;

        // Init and check cache container
        if (!globalThis.__db_pools__) globalThis.__db_pools__ = {};
        if (globalThis.__db_pools__[profile]) return globalThis.__db_pools__[profile];

        // Create and cache new pool
        return globalThis.__db_pools__[profile] = mariadb.createPool({
            host: connectionConfig.databaseHost,
            port: Number(connectionConfig.databasePort),
            user: connectionConfig.databaseUsername,
            password: connectionConfig.databasePassword,
            database: profile,
            multipleStatements: true,
            connectionLimit: 10,
        });
    } catch (error: any) {
        logError(error);
        throw error;
    }
}

/**
 * Configures the database connection settings.
 * 
 * @param config The database configuration settings.
 */
export function config(config: databaseConfig): void {
    connectionConfig = config;
}

/**
 * Returns the list of valid database profiles.
 * 
 * @returns An array of valid database profile names.
 */
export function getValidDatabases(): Array<validDatabases> {
    return databaseNames;
}