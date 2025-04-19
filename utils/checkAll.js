import { addDays, format, parse, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday } from 'date-fns';
import Database from "better-sqlite3";
import { fr, pl } from 'date-fns/locale';

export function checkAll() {
    console.log('checkAll');
    const db = new Database("Database.db");
    const recurrences = db.prepare('SELECT * FROM recurrence').all();
    const excludeDays = db.prepare('SELECT * FROM recurrence_excludedays').all();
    const nextWeekDay = {
        1: nextMonday,
        2: nextTuesday,
        3: nextWednesday,
        4: nextThursday,
        5: nextFriday,
        6: nextSaturday,
        0: nextSunday
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
            const plannings = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(recurrence.id);
            const last = plannings[plannings.length - 1];
            const now = new Date();
            const isToday = format(now, 'dd/MM/yyyy', { locale: fr }) === format(nextDate, 'dd/MM/yyyy', { locale: fr });
            let frequency = JSON.parse(recurrence.frequency);
            if (Array.isArray(frequency) === false) {
                frequency = [frequency];
            }
            plannings.map(planning => {
                const parsedDate = parse(planning.date, 'dd/MM/yyyy', new Date(), { locale: fr });
                const parsedStartDate = parse(recurrence.start_date, 'dd/MM/yyyy', new Date(), { locale: fr });
                if (parsedDate < parsedStartDate) {
                    db.prepare('UPDATE planning SET recurrence_id = 0 WHERE id = ?').run(planning.id);
                }
            });
            if (isToday) {
                let newDate;
                if (frequency.length === 1) {
                    const nextDay = nextWeekDay[frequency[0]];
                    newDate = format(nextDay(now), 'dd/MM/yyyy', { locale: fr });
                    console.log(newDate, frequency, recurrence.id);

                    plannings.map(planning => {
                        const parsedDate = parse(planning.date, 'dd/MM/yyyy', new Date(), { locale: fr });
                        if (parsedDate > nextDay(now)) {
                            db.prepare('DELETE FROM planning WHERE id = ?').run(planning.id);
                        }
                    });
                    const isPlanned = plannings.find(planning => planning.date === newDate);

                    if (!isPlanned) {
                        db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(0, format(nextDay(now), 'dd/MM/yyyy', { locale: fr }), last.client_name, last.start_time, last.return_time, last.note, last.destination, last.long_distance, recurrence.id);
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
                    const planningDate = plannings.map(planning => {
                        return planning.date;
                    })
                    const last = plannings[plannings.length - 1];
                    const data = excludeDays?.find(exclude => exclude.recurrence_id === recurrence.id);
                    const exdate = JSON.parse(data?.date || "[]");
                    for (const date of allNextDates) {
                        if (planningDate.includes(format(date, 'dd/MM/yyyy', { locale: fr })) === false && data && !exdate.some(exclude => exclude === format(date, 'dd/MM/yyyy', { locale: fr }))) {
                            db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(0, format(date, 'dd/MM/yyyy', { locale: fr }), last.client_name, last.start_time, last.return_time, last.note, last.destination, last.long_distance, recurrence.id);
                        }
                    }
                    const formatedAllNextDate = allNextDates.map(date => format(date, 'dd/MM/yyyy', { locale: fr }));
                    for (const line of plannings) {
                        if (parse(line.date, 'dd/MM/yyyy', new Date(), { locale: fr }) > parse(recurrence.start_date, 'dd/MM/yyyy', new Date(), { locale: fr }) && !formatedAllNextDate.includes(line.date)) {
                            db.prepare('DELETE FROM planning WHERE id = ?').run(line.id);
                        }
                    }
                }
                db.prepare('UPDATE recurrence SET start_date = ?, next_day = ? WHERE id = ?').run(recurrence.next_day, newDate, recurrence.id);
            } else if (!isToday) {
                const isPlanned = plannings.find(planning => planning.date === format(nextDate, 'dd/MM/yyyy', { locale: fr }));
                const parsedStartDate = parse(recurrence.start_date, 'dd/MM/yyyy', new Date(), { locale: fr });
                if (frequency.length === 1) {
                    console.log('one recurrence', frequency, recurrence.id);
                    const nextDay = nextWeekDay[frequency[0]];
                    if (!isPlanned) {
                        try {
                            db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(0, format(nextDay(parsedStartDate), 'dd/MM/yyyy'), plannings[0].client_name, plannings[0].start_time, plannings[0].return_time, plannings[0].note, plannings[0].destination, plannings[0].long_distance, recurrence.id);
                        } catch (err) {
                            console.error('Error while adding planning: ', err);
                            if (plannings.length === 0 || plannings === undefined) {
                                db.prepare('DELETE FROM recurrence WHERE id = ?').run(recurrence.id);
                                db.prepare('DELETE FROM recurrence_excludedays WHERE recurrence_id = ?').run(recurrence.id);
                            }
                        }
                    }
                    plannings.map(planning => {
                        const formated = format(nextDay(parsedStartDate), 'dd/MM/yyyy', { locale: fr });
                        if (planning.date > recurrence.start_date && planning.date !== formated) {
                            db.prepare('DELETE FROM planning WHERE id = ?').run(planning.id);
                        }
                    });
                } else if (frequency.length > 1) {
                    console.log('long recurrence', frequency, recurrence.id);
                    let nextDates = [];
                    let allNextDates = [];
                    for (const day of frequency) {
                        const potentialNextDate = nextWeekDay[day](parsedStartDate);
                        allNextDates.push(potentialNextDate);
                        const compareDate = potentialNextDate - now;
                        const difference = Math.round(compareDate / (1000 * 60 * 60 * 24));
                        nextDates.push({ [day]: difference });
                    }
                    nextDates.sort((a, b) => a[Object.keys(a)[0]] - b[Object.keys(b)[0]]);
                    const planningDate = plannings.map(planning => {
                        return planning.date;
                    })
                    if (!isPlanned) {
                        try {
                            console.log('insert planning > 1 today', format(nextDate, 'dd/MM/yyyy', { locale: fr }));
                            db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(0, format(nextDate, 'dd/MM/yyyy', { locale: fr }), last.client_name, last.start_time, last.return_time, last.note, last.destination, last.long_distance, recurrence.id);
                        } catch (err) {
                            console.error('Error while adding planning: ', err);
                            if (plannings.length === 0 || plannings === undefined) {
                                db.prepare('DELETE FROM recurrence WHERE id = ?').run(recurrence.id);
                            }
                        }
                        console.log('insert planning > 1 not today', format(nextDate, 'dd/MM/yyyy', { locale: fr }));
                    }
                    const data = excludeDays?.find(exclude => exclude.recurrence_id === recurrence.id);
                    const exdate = JSON.parse(data?.date || "[]");
                    for (const date of allNextDates) {
                        if (planningDate.includes(format(date, 'dd/MM/yyyy', { locale: fr })) === false && !exdate?.some(exclude => exclude === format(date, 'dd/MM/yyyy', { locale: fr })) && date > nextDate) {
                            db.prepare('INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(0, format(date, 'dd/MM/yyyy', { locale: fr }), last.client_name, last.start_time, last.return_time, last.note, last.destination, last.long_distance, recurrence.id);
                        }
                    }
                    const formatedAllNextDate = allNextDates.map(date => format(date, 'dd/MM/yyyy', { locale: fr }));
                    for (const line of plannings) {
                        if (parse(line.date, 'dd/MM/yyyy', new Date(), { locale: fr }) > parse(recurrence.start_date, 'dd/MM/yyyy', new Date(), { locale: fr }) && !formatedAllNextDate.includes(line.date)) {
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