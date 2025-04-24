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

export const GetPlanningNotes = function (req, res) {
    const db = new Database('Database.db');
    const { dates } = req.body;
    let data = [];
    for (const date of dates[0]) {
        try {
            const notes = db.prepare('SELECT * FROM notes WHERE date = ?').all(date);
            if (notes.length > 0) {
                data.push({ dates: date, notes: notes[0].note });
            } else {
                data.push({ dates: date, notes: '' });
            }
        } catch (err) {
            console.error('Error while fetching notes: ', err);
            res.status(500).send('Internal server error');
            db.close();
            return;
        }
    }
    db.close();
    res.status(200).json(data);
}

export const AddPlanningNotes = function (req, res) {
    const db = new Database('Database.db');
    const { date, note } = req.body;
    let error = false;
    try {
        const existingNote = db.prepare('SELECT * FROM notes WHERE date = ?').get(date);
        if (existingNote) {
            db.prepare('UPDATE notes SET note = ? WHERE date = ?').run(note, date);
        } else {
            db.prepare('INSERT INTO notes (date, note) VALUES (?, ?)').run(date, note);
        }
    }
    catch (err) {
        console.error('Error while adding notes: ', err);
        res.status(500).send('Internal server error');
        error = true
        db.close();
        return;
    }
    if (error) {
        db.close();
        return
    }
    db.close();
    res.status(200).send('Notes added');
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
            if (!oldFrequency && frequency.length > 0) {
                const formatRecurrence = recurrence_id === null ? 0 : recurrence_id;
                reccurence_id = checkNextDate(date, frequencyFormated, formatRecurrence, id);
            } else if (oldFrequency?.frequency !== frequency.toString()) {
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
    let error = false;
    for (let i = 0; i < data.length; i++) {
        try {
            console.log(data[i].id);
            const line = db.prepare('SELECT * FROM planning WHERE id = ?').all(data[i].id);
            console.log('line: ', line);
            if (line[0]?.recurrence_id && !data[i].deleteRecurrence && line[0].recurrence_id !== undefined || line[0].recurrence_id !== null || line[0].recurrence_id !== 0) {
                let recurrence
                try {
                    recurrence = db.prepare('SELECT * FROM recurrence WHERE id = ?').get(line[0].recurrence_id);
                } catch (err) {
                    recurrence = null
                    console.error('Error while fetching recurrence: ', err);
                }
                if (recurrence && line[0].date === recurrence?.next_day) {
                    const frequencyFormated = typeof recurrence.frequency === 'string' ? JSON.parse(recurrence.frequency) : typeof recurrence.frequency === 'number' ? [recurrence.frequency] : recurrence.frequency;
                    console.log('checkNextDatedelete: ', line[0].date, frequencyFormated, line[0].recurrence_id, line[0].id);
                    checkNextDate(recurrence.next_day, frequencyFormated, line[0].recurrence_id, line[0].id);
                } else if (recurrence && line[0].date !== recurrence?.next_day && line[0].date !== recurrence?.start_date) {
                    const excludeDays = db.prepare('SELECT * FROM recurrence_excludedays WHERE recurrence_id = ?').all(line[0].recurrence_id);
                    if (excludeDays.length === 0) {
                        const data = [line[0].date]
                        console.log('first log add exclude: ', data);
                        db.prepare('INSERT INTO recurrence_excludedays (recurrence_id, date) VALUES (?, ?)').run(line[0].recurrence_id, JSON.stringify(data));
                    }
                    else {
                        const data = JSON.parse(excludeDays[0].date);
                        if (!data.includes(line[0].date)) {
                            data.push(line[0].date);
                            console.log('else log add exclude: ', data);
                            db.prepare('UPDATE recurrence_excludedays SET date = ? WHERE recurrence_id = ?').run(JSON.stringify(data), line[0].recurrence_id);
                        }
                    }
                }
            }
            console.log(data[i].deleteRecurrence);
            if (data[i].deleteRecurrence) {
                const allRecurrence = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(line[0].recurrence_id)
                allRecurrence.map((planning) => {
                    console.log('delete', parse(planning.date, 'dd/MM/yyyy', new Date(), { locale: fr }) < parse(line[0].date, 'dd/MM/yyyy', new Date(), { locale: fr }));
                    if (parse(planning.date, 'dd/MM/yyyy', new Date(), { locale: fr }) < parse(line[0].date, 'dd/MM/yyyy', new Date(), { locale: fr })) {
                        db.prepare('UPDATE planning SET recurrence_id = ? WHERE id = ?').run(0, planning.id);
                    } else {
                        db.prepare('DELETE FROM planning WHERE id = ?').run(planning.id)
                    }
                })
                db.prepare('DELETE FROM recurrence WHERE id = ?').run(line[0].recurrence_id);
                db.prepare('DELETE FROM recurrence_excludedays WHERE recurrence_id = ?').run(line[0].recurrence_id);
            }
            db.prepare('DELETE FROM planning WHERE id = ?').run(data[i].id);
        } catch (err) {
            console.error('Error while deleting planning: ', err);
            res.status(500).send('Internal server error');
            error = true
            break;
        }
    }
    checkAll();
    if (error) {
        db.close();
        return
    }
    db.close();
    res.status(200).send('Planning deleted');
}