import Database from "better-sqlite3";
import { addDays, format, parse } from 'date-fns';

export function checkAll() {
    console.log('checkAll');
    const db = new Database("Database.db");
    const recurrences = db.prepare('SELECT * FROM recurrence').all();

    if (recurrences.length > 0) {
        for (const recurrence of recurrences) {
            const nextDate = parse(recurrence.next_day, 'dd/MM/yyyy', new Date());
            const planning = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(recurrence.id);
            const now = new Date();
            const isToday = format(now, 'dd/MM/yyyy') === format(nextDate, 'dd/MM/yyyy');
            if (isToday) {
                const newDate = format(addDays(now, recurrence.frequency), 'dd/MM/yyyy');
                db.prepare('UPDATE recurrence SET start_date = ?, next_day = ? WHERE id = ?').run(recurrence.next_day, newDate, recurrence.id);
                db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(planning[0].driver_id, newDate, planning[0].client_name, planning[0].start_time, planning[0].return_time, planning[0].note, planning[0].destination, planning[0].long_distance, recurrence.id);
            } else if (!isToday) {
                const isPlanned = db.prepare('SELECT * FROM planning WHERE date = ? AND recurrence_id = ?').get(format(nextDate, 'dd/MM/yyyy'), recurrence.id);
                if (!isPlanned) {
                    db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(planning[0].driver_id, format(nextDate, 'dd/MM/yyyy'), planning[0].client_name, planning[0].start_time, planning[0].return_time, planning[0].note, planning[0].destination, planning[0].long_distance, recurrence.id);
                }
            }
        }
        db.close();
        console.log('check all recurrences done');
    }
}