import Database from "better-sqlite3";
import { format, parse, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, getDay, nextSaturday, nextSunday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toDate } from 'date-fns-tz';


export function checkNextDate(date, recurrence, id = 0, planningId) {
    const nextDateByNumber = {
        1: nextMonday,
        2: nextTuesday,
        3: nextWednesday,
        4: nextThursday,
        5: nextFriday,
        6: nextSaturday,
        0: nextSunday
    }
    const db = new Database("Database.db");
    const parsedDate = parse(date, 'dd/MM/yyyy', new Date(), { locale: fr });
    const todayDate = toDate(parsedDate, { timeZone: 'Europe/Paris' });
    const now = new Date();

    if (id !== 0) {
        const recurrenceData = db.prepare('SELECT * FROM recurrence WHERE id = ?').get(id);
        const oldDate = db.prepare('SELECT * FROM planning WHERE recurrence_id = ? AND date = ?').get(id, recurrenceData.next_day);
        const planning = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(id);
        const parseStartDate = parse(recurrenceData.start_date, 'dd/MM/yyyy', new Date().toLocaleDateString(), { locale: fr });
        const excludedDays = db.prepare('SELECT * FROM recurrence_excludedays WHERE recurrence_id = ?').all(id);
        if (recurrence.length === 1) {
            let nextDate = nextDateByNumber[recurrence[0]](todayDate);

            const formatedNextDate = format(nextDate, 'dd/MM/yyyy', { locale: fr });
            if (parseStartDate < now && parsedDate > now) {
                db.prepare('UPDATE recurrence SET frequency = ?, start_date = ?, next_day = ? WHERE id = ?').run(JSON.stringify(recurrence), date, formatedNextDate, id);
            } else {
                db.prepare('UPDATE recurrence SET frequency = ?, next_day = ? WHERE id = ?').run(JSON.stringify(recurrence), formatedNextDate, id);
            }
            return id;
        } else if (recurrence.length > 1) {
            let nextDates = [];
            let allNextDates = [];
            for (const day of recurrence) {
                const potentialNextDate = nextDateByNumber[day](todayDate);
                allNextDates.push(potentialNextDate);
                const compareDate = potentialNextDate - todayDate;
                const difference = Math.round(compareDate / (1000 * 60 * 60 * 24));
                nextDates.push({ [day]: difference });
            }
            nextDates.sort((a, b) => a[Object.keys(a)[0]] - b[Object.keys(b)[0]]);
            let minKey = Object.keys(nextDates[0])[0];
            const dates = JSON.parse(excludedDays.length > 0 ? excludedDays[0]?.date : '[]');;
            let nextDate = nextDateByNumber[minKey](todayDate);
            let formatedNextDate = format(nextDate, 'dd/MM/yyyy', { locale: fr });
            if (dates.includes(formatedNextDate)) {
                allNextDates = [];
                nextDates = [];
                for (const day of recurrence) {
                    const potentialNextDate = nextDateByNumber[day](nextDate);
                    allNextDates.push(potentialNextDate);
                    const compareDate = potentialNextDate - nextDate;
                    const difference = Math.round(compareDate / (1000 * 60 * 60 * 24));
                    nextDates.push({ [day]: difference });
                }
                nextDates.sort((a, b) => a[Object.keys(a)[0]] - b[Object.keys(b)[0]]);
                minKey = Object.keys(nextDates[0])[0];
                nextDate = nextDateByNumber[minKey](nextDate);
                formatedNextDate = format(nextDate, 'dd/MM/yyyy', { locale: fr });
            }
            if (parseStartDate < now && parsedDate > now) {
                db.prepare('UPDATE recurrence SET frequency = ?, start_date = ?, next_day = ? WHERE id = ?').run(JSON.stringify(recurrence), date, formatedNextDate, id);
            } else {
                db.prepare('UPDATE recurrence SET frequency = ?, next_day = ? WHERE id = ?').run(JSON.stringify(recurrence), formatedNextDate, id);
            }
            return id;
        } else if (recurrence.length === 0) {
            planning.map(planning => {
                const parsedDate = parse(planning.date, 'dd/MM/yyyy', new Date(), { locale: fr });
                if (parsedDate > todayDate) {
                    if (planning.id === planningId) { return }
                    db.prepare('DELETE FROM planning WHERE id = ?').run(planning.id);
                } else {
                    db.prepare('UPDATE planning SET recurrence_id = ? WHERE id = ?').run(0, planning.id);
                }
            })
            db.prepare('DELETE FROM recurrence WHERE id = ?').run(id);
            return 0;
        }
    } else {
        if (recurrence.length === 1) {
            let reccurenceId;
            try {
                const nextDate = nextDateByNumber[recurrence[0]](parsedDate);
                const formatedNextDate = format(nextDate, 'dd/MM/yyyy', { locale: fr });
                const reccurenceInsert = db.prepare('INSERT INTO recurrence (frequency, start_date, next_day) VALUES (?, ?, ?)').run(JSON.stringify(recurrence), date, formatedNextDate);
                reccurenceId = reccurenceInsert.lastInsertRowid;
            } catch (err) {
                throw new Error(err);
            }
            return reccurenceId;
        } else if (recurrence.length > 1) {
            let recurrenceId;
            try {
                let nextDates = [];
                let allNextDates = [];
                for (const day of recurrence) {
                    const potentialNextDate = nextDateByNumber[day](todayDate);
                    allNextDates.push(potentialNextDate);
                    const compareDate = potentialNextDate - todayDate;
                    const difference = Math.round(compareDate / (1000 * 60 * 60 * 24));
                    nextDates.push({ [day]: difference });
                }
                nextDates.sort((a, b) => a[Object.keys(a)[0]] - b[Object.keys(b)[0]]);
                let minKey = Object.keys(nextDates[0])[0];
                const nextDate = nextDateByNumber[minKey](todayDate);
                const formatedNextDate = format(nextDate, 'dd/MM/yyyy', { locale: fr });
                const recurrenceInsert = db.prepare('INSERT INTO recurrence (frequency, start_date, next_day) VALUES (?, ?, ?)').run(JSON.stringify(recurrence), date, formatedNextDate);
                recurrenceId = recurrenceInsert.lastInsertRowid;
            } catch (err) {
                throw new Error(err);
            }
            return recurrenceId;
        } else if (recurrence.length === 0) {
            return 0;
        }
    }
}