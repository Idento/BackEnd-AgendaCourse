import Database from "better-sqlite3";

export const GetDrivers = function (req, res) {
    const db = new Database('Database.db');
    let data = [];
    try {
        data = db.prepare('SELECT * FROM driver').all();
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).json(data);
}

export const AddDrivers = function (req, res) {
    const { name, color } = req.body;
    const db = new Database('Database.db');
    try {
        db.prepare('INSERT INTO driver (name, color) VALUES (?, ?)').run(name, color);
    } catch (err) {
        console.error('Error while adding driver: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).send('Driver added');
}

export const ModifyDrivers = function (req, res) {
    const { id, name, color } = req.body;
    const db = new Database('Database.db');
    try {
        db.prepare('UPDATE driver SET name = ?, color = ? WHERE id = ?').run(name, color, id);
    } catch (err) {
        console.error('Error while modifying driver: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).send('Driver modified');
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