import { addDays, format, parse } from 'date-fns';
import Database from 'better-sqlite3';
import { frequentHomeUpdate } from '../utils/frequentUpdate.js';
import { checkAll } from '../utils/checkAll.js';
import { fr } from 'date-fns/locale';
import { json } from 'express';
import { checkNextDate } from '../utils/checkNextDate.js';


export const GetHomeData = function (req, res) {
    const data = frequentHomeUpdate();
    if (data.length === 0) {
        res.status(200).json([]);
    } else {
        res.status(200).json(data);
    }
}

export const GetHomeNotes = function (req, res) {
    const db = new Database('Database.db');
    const { date } = req.body;
    try {
        const data = db.prepare('SELECT * FROM notes WHERE date = ?').all(date);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    if (data.length === 0) {
        res.status(200).json([]);
    } else {
        res.status(200).json(data);
    }
}

export const AddHomeNote = function (req, res) {
    const db = new Database('Database.db');
    const { date, note } = req.body;
    try {
        const data = db.prepare('SELECT * FROM notes WHERE date = ?').all(date);
        if (data.length === 0) {
            db.prepare('INSERT INTO notes (date, note) VALUES (?, ?)').run(date, note);
        } else {
            db.prepare('UPDATE notes SET note = ? WHERE date = ?').run(note, date);
        }
    } catch (err) {
        console.error('Error while adding data: ', err);
        res.status(500).send('Internal server error');
        db.close();
        return;
    }
    db.close();
    res.status(200).send('Data added');
}

export const DataToAdd = async function (req, res) {
    const { data } = req.body;
    const db = new Database('Database.db');
    const date = format(new Date(), 'dd/MM/yyyy', { locale: fr });
    let plannings = [];
    let error = false;
    let lastID = [];
    try { // Fetch the already existing data
        plannings = db.prepare('SELECT * FROM planning WHERE date = ?').all(date);
    } catch (err) {
        console.error('Error while fetching data: ', err);
    }
    for (let i = 0; i < data.length; i++) {
        const { id, driver_id, client_name, start_time, return_time, note, destination, long_distance, frequency } = data[i];
        if (plannings.some(planning => planning.id === id)) {
            const line = plannings.find(planning => planning.id === id);
            console.log('beforeCheckNextDate: ', date, frequency, line.recurrence_id, id);
            const reccurence_id = checkNextDate(date, frequency, line.recurrence_id === null ? 0 : line.recurrence_id, id);
            console.log('reccurence_id: ', reccurence_id);
            try {
                db.prepare(`UPDATE planning SET driver_id = ?, client_name = ?, start_time = ?, return_time = ?, note = ?, destination = ?, long_distance = ?, recurrence_id = ? WHERE id = ?`).run(parseInt(driver_id), client_name, start_time, return_time, note, destination, `${long_distance}`, reccurence_id, id);
            } catch (err) {
                console.error('Error while updating data: ', err);
                res.status(500).send('Internal server error');
                break;
            }
        } else {
            console.log('beforeCheckNextDate else: ', date, frequency, 0, 0);
            const reccurence_id = checkNextDate(date, frequency, 0, 0);
            try {
                if (frequency.length === 0) {
                    const addTransaction = db.prepare(`INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(parseInt(driver_id), date, client_name, start_time, return_time, note, destination, `${long_distance}`);
                    lastID.push(addTransaction.lastInsertRowid);
                } else {
                    const addTransaction = db.prepare(`INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(parseInt(driver_id), date, client_name, start_time, return_time, note, destination, `${long_distance}`, reccurence_id);
                    lastID.push(addTransaction.lastInsertRowid);
                }
            }
            catch (err) {
                console.error('Error while adding data: ', err);
                res.status(500).send('Internal server error');
                error = true;
                break;
            }
        }
    }
    if (error) {
        db.close();
        return;
    }
    checkAll();
    db.close();
    console.log('Data added');
    if (lastID && !error) {
        res.status(200).json({ id: lastID });
    } else {
        if (!error) {
            res.status(200).send('Data added');
        }
    }
}

export const DeleteData = function (req, res) {
    const { data } = req.body;
    console.log(data);
    const db = new Database('Database.db');
    let error = false;
    for (let i = 0; i < data.length; i++) {
        try {
            const line = db.prepare('SELECT * FROM planning WHERE id = ?').all(data[i].id);
            if (data[i].deleteRecurrence) {
                const allDatesRecurrence = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(line[0].recurrence_id);
                allDatesRecurrence.map((planning) => {
                    const parsedDate = parse(planning.date, 'dd/MM/yyyy', new Date(), { locale: fr });
                    if (parsedDate > parse(line[0].date, 'dd/MM/yyyy', new Date(), { locale: fr })) {
                        db.prepare('DELETE FROM planning WHERE id = ?').run(planning.id);
                    } else {
                        db.prepare('UPDATE planning SET recurrence_id = ? WHERE id = ?').run(0, planning.id);
                    }
                });
                db.prepare('DELETE FROM recurrence WHERE id = ?').run(line[0].recurrence_id);
                try {
                    db.prepare('DELETE FROM excluded_days WHERE recurrence_id = ?').run(line[0].recurrence_id);
                } catch (err) {
                    console.error('Error while deleting excluded days: ', err);
                }
            }
            db.prepare('DELETE FROM planning WHERE id = ?').run(data[i].id);
        } catch (err) {
            console.error('Error while deleting data: ', err);
            res.status(500).send('Internal server error');
            break;
        }
    }
    if (error) {
        db.close();
        return;
    }
    db.close();
    res.status(200).send('Data deleted');
}


