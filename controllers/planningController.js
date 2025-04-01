import Database from "better-sqlite3";
import { format, parse, addDays } from "date-fns";
import { retrieveDate } from "../utils/retrieveDate.js";
import { checkAll } from "../utils/checkAll.js";
import { fr } from "date-fns/locale";
import { checkNextDate } from "../utils/checkNextDate.js";


export const GetPlanning = function (req, res) {
    let allWeekDays = retrieveDate();
    const db = new Database('Database.db');
    let error = false
    let drivers;
    try {
        drivers = { drivers: db.prepare('SELECT * FROM driver').all() };
    } catch (err) {
        console.error('Error while fetching drivers: ', err);
        db.close();
        res.status(500).send('Internal server error');
        return;
    }
    for (let i = 0; i < allWeekDays.length; i++) {
        try {
            const data = db.prepare(`SELECT p.*, r.frequency
                            FROM planning p
                            LEFT JOIN recurrence r ON p.recurrence_id = r.id
                            WHERE p.date = ?`).all(allWeekDays[i]);
            allWeekDays[i] = { date: allWeekDays[i], data: [...data, drivers] }
        } catch (err) {
            console.error('Error while fetching planning: ', err);
            res.status(500).send('Internal server error');
            error = true
            break;
        }
    }
    if (error) {
        db.close();
        return
    }
    db.close();
    res.status(200).json(allWeekDays);
}

export const AddPlanning = function (req, res) {
    const { alldata } = req.body;
    const db = new Database('Database.db');
    let allWeekDays = retrieveDate();
    let ids = [];
    let error = false;
    let datadb = [];
    try {
        const data = db.prepare('SELECT * FROM planning WHERE date IN (' + allWeekDays.map(() => '?').join(',') + ')').all(...allWeekDays);
        datadb = [...datadb, ...data];
        ids = data.map(item => item.id);
    } catch (err) {
        console.error('Error while fetching planning: ', err);
        error = true;
    }
    for (let i = 0; i < alldata.length; i++) {
        const { id, driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id, frequency } = alldata[i]; // Destructure the data
        const frequencyFormated = typeof frequency === 'string' ? JSON.parse(frequency) : typeof frequency === 'number' ? [frequency] : frequency; // Parse the frequency
        let reccurence_id = null; // Initialize the recurrence id
        if (ids.includes(id)) { // If the id is already existing
            const actualLine = datadb.filter((item) => item.id === id); // Get the actual line
            console.log('actualLine: ', actualLine);
            console.log(date);
            const oldFrequency = db.prepare('SELECT frequency FROM recurrence WHERE id = ?').get(actualLine[0].recurrence_id);
            console.log('oldFrequency: ', oldFrequency);
            if (oldFrequency && oldFrequency.frequency !== frequency.toString()) {
                const formatRecurrence = recurrence_id === null ? 0 : recurrence_id;
                reccurence_id = checkNextDate(date, frequencyFormated, formatRecurrence, id);
            }
            try {
                db.prepare(`UPDATE planning SET driver_id = ?, date = ?, client_name = ?, start_time = ?, return_time = ?, note = ?, destination = ?, long_distance = ?, recurrence_id = ? WHERE id = ?`).run(parseInt(driver_id), date, client_name, start_time, return_time, note, destination, `${long_distance}`, reccurence_id, id);
            } catch (err) {
                console.error('Error while updating planning: ', err);
                res.status(500).send('Internal server error');
                error = true
                break;
            }
        } else {
            let reccurence_id;
            console.log('date: ', date);

            reccurence_id = checkNextDate(date, frequencyFormated, 0, 0);
            try {

                db.prepare(`INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(parseInt(driver_id), date, client_name, start_time, return_time, note, destination, `${long_distance}`, reccurence_id);

            } catch (err) {
                console.error('Error while adding planning: ', err);
                res.status(500).send('Internal server error');
                error = true
                break;
            }
        }
    }
    checkAll();
    if (error) {
        db.close();
        return
    }
    db.close();
    res.status(200).send('Planning added');
}

export const DeletePlanning = function (req, res) {
    const { data } = req.body;
    const db = new Database('Database.db');
    let error = false
    for (let i = 0; i < data.length; i++) {
        try {
            console.log(data[i].id);
            const line = db.prepare('SELECT * FROM planning WHERE id = ?').all(data[i].id);
            db.prepare('DELETE FROM planning WHERE id = ?').run(data[i].id);
            if (data[i].deleteRecurrence) {
                db.prepare('DELETE FROM recurrence WHERE id = ?').run(line[0].recurrence_id);
                db.prepare('DELETE FROM planning WHERE recurrence_id = ?').run(line[0].recurrence_id);
            }
        } catch (err) {
            console.error('Error while deleting planning: ', err);
            res.status(500).send('Internal server error');
            error = true
            break;
        }
    }
    if (error) {
        db.close();
        return
    }
    db.close();
    res.status(200).send('Planning deleted');
}