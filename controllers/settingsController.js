import Database from "better-sqlite3";

module.exports.GetDrivers = function (req, res) {
    const db = new Database('../database.db');
    const data = db.prepare('SELECT * FROM drivers').all();
    db.close();
    res.status(200).json(data);
}

module.exports.ModifyDrivers = function (req, res) {
    const { id, name, color } = req.body;
    const db = new Database('../database.db');
    db.prepare('UPDATE drivers SET name = ?, color = ? WHERE id = ?').run(name, color, id);
    db.close();
    res.status(200).send('Driver modified');
}

module.exports.DeleteDrivers = function (req, res) {
    const { id } = req.body;
    const db = new Database('../database.db');
    db.prepare('DELETE FROM drivers WHERE id = ?').run(id);
    db.close();
    res.status(200).send('Driver deleted');
}