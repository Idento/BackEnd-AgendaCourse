import Database from "better-sqlite3";
import { format, parse, addDays } from "date-fns";
import { retrieveDate } from "../utils/retrieveDate.js";
import { checkAll } from "../utils/checkAll.js";


export const GetPlanning = function (req, res) {
    let allWeekDays = retrieveDate();
    const db = new Database('Database.db');
    let error = false
    for (let i = 0; i < allWeekDays.length; i++) {
        try {
            const data = db.prepare('SELECT * FROM planning WHERE date = ?').all(allWeekDays[i]);
            allWeekDays[i] = { date: allWeekDays[i], data }
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
    console.log('alldata: ', alldata);
    const db = new Database('Database.db');
    let allWeekDays = retrieveDate();
    let ids = [];
    let error = false;
    let datadb = [];
    for (let i = 0; i < allWeekDays.length; i++) { // Fetch all the data from the database
        try {
            const data = db.prepare('SELECT * FROM planning WHERE date = ?').all(allWeekDays[i]);
            datadb = [...datadb, ...data]
            for (let j = 0; j < data.length; j++) {
                ids.push(data[j].id)
            }
        } catch (err) {
            console.error('Error while fetching planning: ', err);
        }
    }
    for (let i = 0; i < alldata.length; i++) {
        const { id, driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_frequency } = alldata[i]; // Destructure the data
        let reccurence_id = null; // Initialize the recurrence id
        if (ids.includes(id)) { // If the id is already existing
            const actualLine = datadb.filter((item) => item.id === id); // Get the actual line
            const isExisting = db.prepare('SELECT * FROM recurrence WHERE id = ?').all(actualLine[0].recurrence_id);
            if (isExisting.length > 0 && recurrence_frequency !== isExisting.frequency && recurrence_frequency > 0) { // If the recurrence is not existing
                try { // Add the new recurrence
                    const date = actualLine[0].date;
                    db.prepare('DELETE FROM planning WHERE recurrence_id = ? AND date = ?').run(isExisting[0].id, isExisting[0].next_day);
                    const nextDate = addDays(parse(date, 'dd/MM/yyyy', new Date()), recurrence_frequency);
                    db.prepare('UPDATE recurrence SET frequency = ?, start_date = ?, next_day = ? WHERE id= ?').run(recurrence_frequency, date, format(nextDate, 'dd/MM/yyyy'), isExisting[0].id);
                    reccurence_id = isExisting[0].id;
                } catch (err) {
                    console.error('Error while adding recurrence: ', err);
                    res.status(500).send('Internal server error');
                    break;
                }
            } else if (isExisting.length > 0 && recurrence_frequency === 0) { // If the recurrence is existing
                db.prepare('DELETE FROM recurrence WHERE id = ?').run(actualLine[0].recurrence_id);
                db.prepare('DELETE FROM planning WHERE recurrence_id = ? AND date = ?').run(isExisting[0].id, isExisting[0].next_day);
                reccurence_id = 0;
            } else if (isExisting.length === 0) {
                const nextDate = addDays(parse(date, 'dd/MM/yyyy', new Date()), recurrence_frequency);
                const newReccurence = db.prepare('INSERT INTO recurrence (frequency, start_date, next_day) VALUES (?, ?, ?)').run(recurrence_frequency, date, format(nextDate, 'dd/MM/yyyy'));
                reccurence_id = newReccurence.lastInsertRowid;
            }
            try {
                if (!reccurence_id) {
                    db.prepare(`UPDATE planning SET driver_id = ?, date = ?, client_name = ?, start_time = ?, return_time = ?, note = ?, destination = ?, long_distance = ? WHERE id = ?`).run(driver_id, date, client_name, start_time, return_time, note, destination, long_distance, id);
                } else {
                    db.prepare(`UPDATE planning SET driver_id = ?, date = ?, client_name = ?, start_time = ?, return_time = ?, note = ?, destination = ?, long_distance = ?, recurrence_id = ? WHERE id = ?`).run(driver_id, date, client_name, start_time, return_time, note, destination, long_distance, reccurence_id, id);
                }
            } catch (err) {
                console.error('Error while updating planning: ', err);
                res.status(500).send('Internal server error');
                error = true
                break;
            }
        } else {
            let reccurence_id;
            console.log('recurrence_frequency: ', recurrence_frequency);
            if (recurrence_frequency > 0) {
                try {
                    const nextDate = addDays(parse(date, 'dd/MM/yyyy', new Date()), recurrence_frequency);
                    const recurrence = db.prepare('INSERT INTO recurrence (frequency, start_date, next_day) VALUES (?, ?, ?)').run(recurrence_frequency, date, format(nextDate, 'dd/MM/yyyy'));
                    reccurence_id = recurrence.lastInsertRowid;
                } catch (err) {
                    console.error('Error while adding recurrence: ', err);
                    res.status(500).send('Internal server error');
                    error = true
                    break;
                }
            }
            try {
                if (reccurence_id) {
                    db.prepare(`INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(driver_id, date, client_name, start_time, return_time, note, destination, long_distance, reccurence_id);
                } else {
                    db.prepare(`INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(driver_id, date, client_name, start_time, return_time, note, destination, long_distance);
                }
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
    const data = req.body;
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