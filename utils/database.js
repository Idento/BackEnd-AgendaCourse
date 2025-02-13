import Database from "better-sqlite3";

export const db = new Database("database.db");


export function createTable() {
    db.prepare('CREATE TABLE IF NOT EXISTS driver (id INTEGER PRIMARY KEY, name TEXT, color TEXT, driver_id INTEGER)').run();
    db.prepare(```CREATE TABLE IF NOT EXISTS planning (
        id INTEGER PRIMARY KEY, 
        driver_id INTEGER, 
        date TEXT, 
        client_name TEXT, 
        start_time TEXT, 
        return_time TEXT, 
        note TEXT, 
        destination TEXT, 
        long_distance INTEGER,
        FOREIGN KEY(driver_id) REFERENCES driver(id)
    )```).run();
}

