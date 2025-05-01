import Database from "better-sqlite3";
import generatePassword from "../utils/generatePassword.js";
import bcrypt from "bcrypt";

export const GetDrivers = function (req, res) {
    const db = new Database('Database.db');
    const userdb = new Database('user.db');
    let data = [];
    try {
        const driver = db.prepare('SELECT * FROM driver').all();
        driver.map(item => {
            const user = userdb.prepare('SELECT * FROM user WHERE username = ?').get(item.name);
            data.push({ ...item, account: user ? true : false, role: user ? user.role : 'none' });
        });
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).json(data);
}

export const GetHistoryData = function (req, res) {
    const { date } = req.body;
    const db = new Database('Database.db');
    let data;
    let drivers;
    try {
        data = db.prepare('SELECT * FROM planning WHERE date = ?').all(date);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        db.close();
    }
    try {
        drivers = db.prepare('SELECT * FROM driver').all();
    } catch (err) {
        console.error('Error while fetching drivers: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).json({ data, drivers });
}

export const AddDrivers = async function (req, res) {
    const { name, color, account, role } = req.body;
    const db = new Database('Database.db');
    let userdb;
    let randomChar
    if (account) {
        userdb = new Database('user.db');
    }
    try {
        db.prepare('INSERT INTO driver (name, color) VALUES (?, ?)').run(name, color);
        if (account) {
            randomChar = generatePassword()
            const password = await bcrypt.hash(randomChar, 10);
            userdb.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run(name, password, role);
        }
    } catch (err) {
        console.error('Error while adding driver: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    if (account) {
        res.status(200).send(randomChar);
        return;
    } else {
        res.status(200).send('Driver added');
    }
}

export const AddAccount = async function (req, res) {
    const { name, role } = req.body;
    const userdb = new Database('user.db');
    let randomChar = generatePassword();
    const password = await bcrypt.hash(randomChar, 10);

    try {
        userdb.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run(name, password, role);
    } catch (err) {
        console.error('Error while adding account: ', err);
        res.status(500).send('Internal server error');
        userdb.close();
        return;
    }
    userdb.close();
    res.status(200).send(randomChar);
}



export const ModifyDrivers = async function (req, res) {
    const { id, name, color, account, role } = req.body;
    const db = new Database('Database.db');
    const userdb = new Database('user.db');
    let user = false;
    let randomChar = false;
    try {
        user = userdb.prepare('SELECT * FROM user WHERE username = ?').get(name);
    } catch (err) {
        user = false;
        console.error('Error while fetching user: ', err);
    }
    if (account && !user) {
        randomChar = generatePassword()
        const password = await bcrypt.hash(randomChar, 10);
        userdb.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run(name, password, role);
    } else if (!account && user) {
        userdb.prepare('DELETE FROM user WHERE username = ?').run(name);
    } else if (account && user) {
        userdb.prepare('UPDATE user SET role = ? WHERE username = ?').run(role, name);
    }
    try {
        db.prepare('UPDATE driver SET name = ?, color = ? WHERE id = ?').run(name, color, id);
    } catch (err) {
        console.error('Error while modifying driver: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    if (randomChar.length > 0) {
        res.status(200).json({ message: 'Driver modified', password: randomChar });
        return;
    } else {
        res.status(200).json({ message: 'Driver modified' });
    }
}

export const ModifyAccount = async function (req, res) {
    const { name, role } = req.body;
    const userdb = new Database('user.db');
    try {
        userdb.prepare('UPDATE user SET role = ? WHERE username = ?').run(role, name);
    } catch (err) {
        console.error('Error while modifying account: ', err);
        res.status(500).send('Internal server error');
        userdb.close();
        return;
    }
    userdb.close();
    res.status(200).send('Account modified');
}

export const DeleteDrivers = function (req, res) {
    const { id } = req.body;
    const db = new Database('Database.db');
    try {
        db.prepare('DELETE FROM driver WHERE id = ?').run(id);
    } catch (err) {
        console.error('Error while deleting driver: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).send('Driver deleted');
}

export const DeleteAccount = function (req, res) {
    const { name } = req.body;
    const db = new Database('user.db');
    try {
        db.prepare('DELETE FROM user WHERE username = ?').run(name);
    } catch (err) {
        console.error('Error while deleting account: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).send('Account deleted');
}