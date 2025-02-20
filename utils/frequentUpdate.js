import { format } from 'date-fns';
import Database from 'better-sqlite3';
import { retrieveDate } from './retrieveDate.js';


export function frequentHomeUpdate() {
    const date = format(new Date(), 'dd/MM/yyyy');
    const db = new Database('Database.db');
    let data = [];
    try {
        data = db.prepare('SELECT * FROM planning WHERE date = ?').all(date);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        db.close();
        return;
    }
    try {
        data = [...data, { drivers: db.prepare('SELECT * FROM driver').all() }];
    } catch (err) {
        console.error('Error while fetching drivers: ', err);
        db.close();
        return;
    }
    db.close();
    return data;
}

export function frequentPlanningUpdate() {
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
    return allWeekDays;
}
