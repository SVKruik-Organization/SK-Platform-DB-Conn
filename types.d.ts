// Database
export function database(profile: string): Promise<Pool>;
export function config(config: databaseConfig): void;
export function getValidDatabases(): Array<validDatabases>;

// Types
export type validDatabases = "skp" | "central" | "bots";
export type { Pool } from "mariadb";
export type databaseConfig = {
    databaseHost: string | null;
    databasePort: string | null;
    databaseUsername: string | null;
    databasePassword: string | null;
}