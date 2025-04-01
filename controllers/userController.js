import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import generatePassword from '../utils/generatePassword.js';


export const getUsers = async (req, res) => {
    const db = new Database('user.db');
    const db2 = new Database('Database.db');
    let users;
    let drivers;
    try {
        drivers = db2.prepare('SELECT * FROM driver').all();
        users = db.prepare('SELECT username, role FROM user').all();
    } catch (err) {
        console.error('Error while fetching users: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    let result = users.filter(user => {
        return drivers.every(driver => driver.name !== user.username);
    })
    db.close();
    res.status(200).json(result);
};

export const CheckUserName = async (req, res) => {
    const { username } = req.body;
    const db = new Database('user.db');
    let user;
    try {
        user = db.prepare('SELECT * FROM user WHERE username = ?').get(username);
    } catch (err) {
        console.error('Error while checking username: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    if (user) {
        res.status(200).json({ exists: true });
    } else {
        res.status(200).json({ exists: false });
    }
}

export const createUser = async (req, res) => {
    const { username, role } = req.body;
    const db = new Database('user.db');
    let randomChar
    try {
        randomChar = generatePassword();
        const hashedPassword = await bcrypt.hash(randomChar, 10);
        db.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run(username, hashedPassword, role);
    } catch (err) {
        console.error('Error while creating user: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).send(randomChar);
}

export const regenPassword = async (req, res) => {
    const { username } = req.body;
    const db = new Database('user.db');
    let randomChar;
    try {
        randomChar = generatePassword();
        const password = await bcrypt.hash(randomChar, 10);
        db.prepare('UPDATE user SET password = ? WHERE username = ?').run(password, username);
    } catch (err) {
        console.error('Error while regenerating password: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).send(randomChar);
}

export const changePassword = async (req, res) => {
    const { username, newPassword } = req.body;
    const db = new Database('user.db');
    let user;
    try {
        user = db.prepare('SELECT * FROM user WHERE username = ?').get(username);
    } catch (err) {
        console.error('Error while fetching user: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    try {
        const password = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE user SET password = ? WHERE username = ?').run(password, username);
    } catch (err) {
        console.error('Error while changing password: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).send('Password changed');
}