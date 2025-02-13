import Database from "better-sqlite3";
import { format, parse, addDays } from "date-fns";


module.exports.GetPlanning = function (req, res) {
    const week = 7
    let allWeekDays = []
    for (let i = 0; i < week; i++) {
        allWeekDays.push(format(addDays(new Date(), i), 'dd/MM/yyyy'))
    }
    const db = new Database('../Database.db');
    for (let i = 0; i < allWeekDays.length; i++) {
        try {
            const data = db.prepare('SELECT * FROM planning WHERE date = ?').all(allWeekDays[i]);
            allWeekDays[i] = { date: allWeekDays[i], data }
        } catch (err) {
            console.error('Error while fetching planning: ', err);
        }
    }
    db.close();
    res.status(200).json(allWeekDays);
}

module.exports.AddPlanning = function (req, res) {
    const { data } = req.body;
    const db = new Database('../Database.db');
    let allWeekDays = []
    let ids = []
    for (let i = 0; i < week; i++) {
        allWeekDays.push(format(addDays(new Date(), i), 'dd/MM/yyyy'))
    }
    for (let i = 0; i < allWeekDays.length; i++) {
        try {
            const data = db.prepare('SELECT * FROM planning WHERE date = ?').all(allWeekDays[i]);
            for (let j = 0; j < data.length; j++) {
                ids.push(data[j].id)
            }
        } catch (err) {
            console.error('Error while fetching planning: ', err);
        }
    }
    for (let i = 0; i < data.length; i++) {
        const { id, driver_id, client_name, start_time, return_time, note, destination, long_distance } = data[i];
        if (ids.includes(id)) {
            try {
                db.prepare(`UPDATE planning SET driver_id = ?, client_name = ?, start_time = ?, return_time = ?, note = ?, destination = ?, long_distance = ? WHERE id = ?`).run(driver_id, client_name, start_time, return_time, note, destination, long_distance, id);
            } catch (err) {
                console.error('Error while updating planning: ', err);
            }
        } else {
            try {
                db.prepare(`INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(driver_id, date, client_name, start_time, return_time, note, destination, long_distance);
            } catch (err) {
                console.error('Error while adding planning: ', err);
            }
        }
    }
    db.close();
    res.status(200).send('Planning added');
}

module.exports.DeletePlanning = function (req, res) {
    const data = req.body;
    const db = new Database('../Database.db');
    for (let i = 0; i < data.length; i++) {
        try {
            db.prepare('DELETE FROM planning WHERE id = ?').run(data[i]);
        } catch (err) {
            console.error('Error while deleting planning: ', err);
        }
    }
    db.close();
    res.status(200).send('Planning deleted');
}
