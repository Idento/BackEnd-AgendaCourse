import Database from "better-sqlite3";
import { format } from "date-fns";

export const GetDriverData = function (req, res) {
    const db = new Database('Database.db');
    let data;
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

export const GetDriverPlanning = function (req, res) {
    const db = new Database('Database.db');
    const { id } = req.params;
    const date = format(new Date(), 'dd/MM/yyyy');
    let data = [];
    try {
        data.push(db.prepare('SELECT * FROM planning WHERE driver_id = ? AND date = ?').all(id, date));
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).json(data);
}