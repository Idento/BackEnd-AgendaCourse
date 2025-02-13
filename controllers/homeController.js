import { format, parse } from 'date-fns';
import Database from 'better-sqlite3';

module.exports.GetHomeData = function (req, res) {
    const date = format(new Date(), 'dd/MM/yyyy');
    const db = new Database('../Database.db');
    const data = db.prepare('SELECT * FROM planning WHERE date = ?').all()
    db.close();
    res.status(200).json(data);
}

module.exports.AddData = async function (req, res) {
    const { data } = req.body;
    const db = new Database('../Database.db');
    const date = format(new Date(), 'dd/MM/yyyy');
    const plannings = db.prepare('SELECT * FROM planning WHERE date = ?').all(date);
    for (let i = 0; i < data.length; i++) {
        const { id, driver_id, client_name, start_time, return_time, note, destination, long_distance } = data[i];
        if (plannings.some(planning => planning.id === id)) {
            try {
                db.prepare(`UPDATE planning SET driver_id = ?, client_name = ?, start_time = ?, return_time = ?, note = ?, destination = ?, long_distance = ? WHERE id = ?`).run(driver_id, client_name, start_time, return_time, note, destination, long_distance, id);
            } catch (err) {
                console.error('Error while updating data: ', err);
                res.status(500).send('Internal server error');
            }
        } else {
            try {
                db.prepare(`INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(driver_id, date, client_name, start_time, return_time, note, destination, long_distance);
            }
            catch (err) {
                console.error('Error while adding data: ', err);
                res.status(500).send('Internal server error');
            }
        }
        db.close();
        res.status(200).send('Data added');
    }
}

module.exports.DeleteData = function (req, res) {
    const data = req.body;
    const db = new Database('../Database.db');
    for (let i = 0; i < data.length; i++) {
        try {
            db.prepare('DELETE FROM planning WHERE id = ?').run(data[i]);
        } catch (err) {
            console.error('Error while deleting data: ', err);
            res.status(500).send('Internal server error');
        }
    }
    db.close();
    res.status(200).send('Data deleted');
}


