import Database from "better-sqlite3";
import { addDays, format, parse, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday } from 'date-fns';
import { fr, pl } from 'date-fns/locale';

export function checkAll() {
    console.log('checkAll');
    const db = new Database("Database.db");
    const recurrences = db.prepare('SELECT * FROM recurrence').all();
    const nextWeekDay = {
        1: nextMonday,
        2: nextTuesday,
        3: nextWednesday,
        4: nextThursday,
        5: nextFriday,
    }
    if (recurrences.length === 0) {
        const planningNotUpdated = db.prepare('SELECT id, recurrence_id FROM planning').all();
        planningNotUpdated.map(planning => {
            if (planning.recurrence_id !== 0) {
                db.prepare('UPDATE planning SET recurrence_id = 0 WHERE id = ?').run(planning.id);
            }
        });
        db.close();
        return;
    }
    if (recurrences.length > 0) {
        for (const recurrence of recurrences) {
            const nextDate = parse(recurrence.next_day, 'dd/MM/yyyy', new Date(), { locale: fr });
            const planning = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(recurrence.id);
            const last = planning[planning.length - 1];
            const now = new Date();
            const isToday = format(now, 'dd/MM/yyyy', { locale: fr }) === format(nextDate, 'dd/MM/yyyy', { locale: fr });
            let frequency = JSON.parse(recurrence.frequency);
            if (Array.isArray(frequency) === false) {
                frequency = [frequency];
            }
            if (isToday) {
                let newDate;
                if (frequency.length === 1) {
                    const nextDay = nextWeekDay[frequency[0]];
                    newDate = format(nextDay(now), 'dd/MM/yyyy', { locale: fr });
                    const afterNext = db.prepare('SELECT id, date FROM planning WHERE recurrence_id = ?').all(recurrence.id);
                    afterNext.map(planning => {
                        const parsedDate = parse(planning.date, 'dd/MM/yyyy', new Date(), { locale: fr });
                        if (parsedDate > nextDay(now)) {
                            db.prepare('DELETE FROM planning WHERE id = ?').run(planning.id);
                        }
                    });
                    const isPlanned = planning.find(planning => planning.date === newDate);
                    if (!isPlanned) {
                        db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(last.driver_id, format(nextDay(now), 'dd/MM/yyyy', { locale: fr }), last.client_name, last.start_time, last.return_time, last.note, last.destination, last.long_distance, recurrence.id);
                    }
                } else if (frequency.length > 1) {
                    let nextDates = [];
                    let allNextDates = [];
                    for (const day of frequency) {
                        const potentialNextDate = nextWeekDay[day](now);
                        allNextDates.push(potentialNextDate);
                        const compareDate = potentialNextDate - now;
                        const difference = Math.round(compareDate / (1000 * 60 * 60 * 24));
                        nextDates.push({ [day]: difference });
                    }
                    nextDates.sort((a, b) => a[Object.keys(a)[0]] - b[Object.keys(b)[0]]);
                    let minKey = Object.keys(nextDates[0])[0];
                    const nextDay = nextWeekDay[minKey];
                    newDate = format(nextDay(now), 'dd/MM/yyyy', { locale: fr });
                    const planningDate = planning.map(planning => {
                        return planning.date;
                    })
                    const last = planning[planning.length - 1];
                    for (const date of allNextDates) {
                        if (planningDate.includes(format(date, 'dd/MM/yyyy', { locale: fr })) === false) {
                            db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(last.driver_id, format(date, 'dd/MM/yyyy', { locale: fr }), last.client_name, last.start_time, last.return_time, last.note, last.destination, last.long_distance, recurrence.id);
                        }
                    }
                    for (const line of planning) {
                        const nextDatesFormated = allNextDates.map(date => format(date, 'dd/MM/yyyy', { locale: fr }));
                        if (nextDatesFormated.includes(line.date) === false && line.date !== recurrence.next_day && line.date > recurrence.next_day) {
                            db.prepare('DELETE FROM planning WHERE id = ?').run(line.id);
                        }
                    }
                }
                db.prepare('UPDATE recurrence SET start_date = ?, next_day = ? WHERE id = ?').run(recurrence.next_day, newDate, recurrence.id);
            } else if (!isToday) {
                const isPlanned = planning.find(planning => planning.date === format(nextDate, 'dd/MM/yyyy', { locale: fr }));
                const parsedStartDate = parse(recurrence.start_date, 'dd/MM/yyyy', new Date(), { locale: fr });
                if (frequency.length === 1) {
                    const nextDay = nextWeekDay[frequency[0]];
                    if (!isPlanned || isPlanned.date !== format(nextDay(parsedStartDate), 'dd/MM/yyyy', { locale: fr })) {
                        try {
                            db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(planning[0].driver_id, format(nextDay(now), 'dd/MM/yyyy'), planning[0].client_name, planning[0].start_time, planning[0].return_time, planning[0].note, planning[0].destination, planning[0].long_distance, recurrence.id);
                        } catch (err) {
                            console.error('Error while adding planning: ', err);
                        }
                    }
                    const afterNext = db.prepare('SELECT id, date FROM planning WHERE recurrence_id = ?').all(recurrence.id);
                    afterNext.map(planning => {
                        const formated = format(nextDay(parsedStartDate), 'dd/MM/yyyy', { locale: fr });
                        if (planning.date > recurrence.start_date && planning.date !== formated) {
                            db.prepare('DELETE FROM planning WHERE id = ?').run(planning.id);
                        }
                    });
                } else if (frequency.length > 1) {
                    let nextDates = [];
                    let allNextDates = [];
                    for (const day of frequency) {
                        const potentialNextDate = nextWeekDay[day](now);
                        allNextDates.push(potentialNextDate);
                        const compareDate = potentialNextDate - now;
                        const difference = Math.round(compareDate / (1000 * 60 * 60 * 24));
                        nextDates.push({ [day]: difference });
                    }
                    nextDates.sort((a, b) => a[Object.keys(a)[0]] - b[Object.keys(b)[0]]);
                    let minKey = Object.keys(nextDates[0])[0];
                    const nextDay = nextWeekDay[minKey];
                    const newDate = format(nextDay(now), 'dd/MM/yyyy', { locale: fr });
                    const planningDate = planning.map(planning => {
                        return planning.date;
                    })
                    for (const date of allNextDates) {
                        if (planningDate.includes(format(date, 'dd/MM/yyyy', { locale: fr })) === false) {
                            db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(last.driver_id, format(date, 'dd/MM/yyyy', { locale: fr }), last.client_name, last.start_time, last.return_time, last.note, last.destination, last.long_distance, recurrence.id);
                        }
                    }
                    for (const line of planning) {
                        const nextDatesFormated = allNextDates.map(date => format(date, 'dd/MM/yyyy', { locale: fr }));

                        if (nextDatesFormated.includes(line.date) === false && line.date !== recurrence.start_date) {
                            db.prepare('DELETE FROM planning WHERE id = ?').run(line.id);
                        }
                    }
                }
            }
        }
        db.close();
        console.log('check all recurrences done');
    }
}