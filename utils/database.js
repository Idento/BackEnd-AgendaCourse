import Database from "better-sqlite3";

export const db = new Database("Database.db");


export function createTable() {
    db.prepare('CREATE TABLE IF NOT EXISTS driver (id INTEGER PRIMARY KEY, name TEXT, color TEXT)').run();
    db.prepare(`CREATE TABLE IF NOT EXISTS planning (
        id INTEGER PRIMARY KEY, 
        driver_id INTEGER, 
        date TEXT, 
        client_name TEXT, 
        start_time TEXT, 
        return_time TEXT, 
        note TEXT, 
        destination TEXT, 
        long_distance TEXT,
        recurrence_id INTEGER
    )`).run();
    db.prepare(`CREATE TABLE IF NOT EXISTS recurrence (
        id INTEGER PRIMARY KEY, 
        frequency INTEGER,
        start_date TEXT,
        next_day TEXT
        )`).run();
    db.close();
}