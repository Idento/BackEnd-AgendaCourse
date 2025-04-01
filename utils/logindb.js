import Database from "better-sqlite3";
import generatePassword from "./generatePassword.js";
import bcrypt from "bcrypt";

export const db = new Database("user.db");

export async function createUserTable() {
    db.prepare(`CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'utilisateur'
        )`).run();
    const user = db.prepare('SELECT * FROM user WHERE username = ?').get('admin');
    let password;
    if (!user) {
        password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'administrateur');
        console.log(password);
    }
    db.close();
}