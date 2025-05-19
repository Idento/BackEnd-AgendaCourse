import { addDays, format, parse, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday, nextDay, startOfDay } from 'date-fns';
import Database from "better-sqlite3";
import { fr, pl } from 'date-fns/locale';
import { parseDate, isSameDay, includesDay, safeDeletePlanning, insertIfNotExists } from './checkAllUtils.js';



export function checkAll() {
    console.log('[CHECK] checkAll started.');
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
        console.log('[CHECK] Aucune récurrence trouvée, désactivation de toutes les lignes associées.');
        const planningNotUpdated = db.prepare('SELECT id, recurrence_id FROM planning').all();
        planningNotUpdated.map(planning => {
            if (planning.recurrence_id !== 0) {
                db.prepare('UPDATE planning SET recurrence_id = 0 WHERE id = ?').run(planning.id);
                console.log(`[CLEAN] Réinitialisation de recurrence_id pour planning ID ${planning.id}`);
            }
        });
        db.close();
        return;
    }
    if (recurrences.length > 0) {
        for (const recurrence of recurrences) {
            console.log(`[RECUR] Traitement récurrence ID ${recurrence.id} - Fréquence: ${recurrence.frequency} - Start date: ${recurrence.start_date}`);
            const nextDate = parseDate(recurrence.next_day);
            const startDateParsed = parseDate(recurrence.start_date);
            const plannings = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(recurrence.id);
            const last = plannings[plannings.length - 1];
            const now = startOfDay(new Date());
            const isToday = format(now, 'dd/MM/yyyy', { locale: fr }) === format(nextDate, 'dd/MM/yyyy', { locale: fr });
            let frequency;
            if (typeof recurrence.frequency === 'string') {
                frequency = JSON.parse(recurrence.frequency);
            } else {
                frequency = recurrence.frequency;
            }
            if (Array.isArray(frequency) === false) {
                frequency = [frequency];
            }
            plannings.map(planning => {
                const parsedDate = parseDate(planning.date);
                const parsedStartDate = parseDate(recurrence.start_date);
                if (parsedDate < parsedStartDate) {
                    db.prepare('UPDATE planning SET recurrence_id = 0 WHERE id = ?').run(planning.id);
                    console.log(`[CLEAN] Planning ID ${planning.id} avant start_date - retiré de la récurrence ${recurrence.id}`);
                }
            });
            if (isToday) {
                console.log(`[TODAY] Update de la récurrence planifié pour aujourd’hui - récurrence ID ${recurrence.id}`);
                let newDate;
                if (frequency.length === 1) {
                    const nextDay = nextWeekDay[frequency[0]];
                    newDate = format(nextDay(now), 'dd/MM/yyyy', { locale: fr });
                    let startDateLoop = now;
                    let alldates = [];
                    for (let i = 0; i < 4; i++) {
                        const potentialNextDate = nextWeekDay[frequency[0]](startDateLoop);
                        alldates.push(startOfDay(potentialNextDate));
                        startDateLoop = potentialNextDate;
                    }
                    plannings.map(planning => {
                        const parsedDate = startOfDay(parse(planning.date, 'dd/MM/yyyy', new Date(), { locale: fr }));
                        if (parsedDate > startOfDay(nextDay(now)) && !alldates.some(date => date === parsedDate)) {
                            safeDeletePlanning(db, planning, alldates, now);
                        }
                    });
                    const isPlanned = plannings.find(planning => isSameDay(planning.date, newDate));
                    if (!isPlanned) {
                        const excludeDaysData = excludeDays?.find(exclude => exclude.recurrence_id === recurrence.id);
                        insertIfNotExists(db, nextDay(now), plannings, last, recurrence.id, excludeDaysData?.date ? JSON.parse(excludeDaysData.date) : []);
                    }
                    const checkPlanning = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(recurrence.id);
                    alldates.map(date => {
                        insertIfNotExists(db, date, checkPlanning, last, recurrence.id);
                    });
                } else if (frequency.length > 1) {
                    let nextDates = [];
                    let allNextDates = [];
                    for (const day of frequency) {
                        let currentDate = now;
                        for (let i = 0; i < 30; i++) {
                            const potentialNextDate = nextWeekDay[day](currentDate);
                            allNextDates.push(potentialNextDate);
                            const compareDate = potentialNextDate - now;
                            const difference = Math.round(compareDate / (1000 * 60 * 60 * 24));
                            nextDates.push({ [day]: difference });
                            currentDate = potentialNextDate;
                        }
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
                        insertIfNotExists(db, date, plannings, last, recurrence.id, exdate);
                    }
                    const checkPlanning = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(recurrence.id);
                    const formatedAllNextDate = allNextDates.map(date => format(date, 'dd/MM/yyyy', { locale: fr }));
                    for (const line of checkPlanning) {
                        if (parse(line.date, 'dd/MM/yyyy', new Date(), { locale: fr }) > parse(recurrence.start_date, 'dd/MM/yyyy', new Date(), { locale: fr }) && !formatedAllNextDate.includes(line.date)) {
                            safeDeletePlanning(db, line, allNextDates, recurrence.start_date);
                        }
                    }
                }
                db.prepare('UPDATE recurrence SET start_date = ?, next_day = ? WHERE id = ?').run(recurrence.next_day, newDate, recurrence.id);
            } else if (!isToday) {
                const isPlanned = plannings.find(planning => planning.date === format(nextDate, 'dd/MM/yyyy', { locale: fr }));
                const parsedStartDate = parseDate(recurrence.start_date);
                if (frequency.length === 1) {
                    const nextDay = nextWeekDay[frequency[0]]; // Utiliser plus tard dans l'insertion dans la base de donnée
                    const excludeDaysData = excludeDays?.find(exclude => exclude.recurrence_id === recurrence.id);
                    if (!isPlanned) {
                        try {
                            insertIfNotExists(db, nextDay(parsedStartDate), plannings, last, recurrence.id, excludeDaysData?.date ? JSON.parse(excludeDaysData.date) : []);
                        } catch (err) {
                            console.error('Error while adding planning: ', err);
                            if (plannings.length === 0 || plannings === undefined) {
                                db.prepare('DELETE FROM recurrence WHERE id = ?').run(recurrence.id);
                                db.prepare('DELETE FROM recurrence_excludedays WHERE recurrence_id = ?').run(recurrence.id);
                            }
                        }
                    }
                    const checkPlanning = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(recurrence.id);
                    let startDateLoop = parsedStartDate;
                    let alldates = [];
                    for (let i = 0; i < 4; i++) {
                        const potentialNextDate = nextWeekDay[frequency[0]](startDateLoop);
                        alldates.push(potentialNextDate);
                        startDateLoop = potentialNextDate;
                    }
                    checkPlanning.map(planning => {
                        const formated = format(nextDay(parsedStartDate), 'dd/MM/yyyy', { locale: fr });
                        if (parseDate(planning.date) > parseDate(recurrence.start_date) && planning.date !== formated && !alldates.some(date => format(date, 'dd/MM/yyyy', { locale: fr }) === planning.date)) {
                            safeDeletePlanning(db, planning, alldates, recurrence.start_date);
                        }
                    });
                    alldates.map(date => {
                        const formatedDate = format(date, 'dd/MM/yyyy', { locale: fr });
                        if (formatedDate !== nextDay(parsedStartDate) && !checkPlanning.some(planning => planning.date === formatedDate)) {
                            insertIfNotExists(db, date, plannings, last, recurrence.id, excludeDaysData?.date ? JSON.parse(excludeDaysData.date) : []);
                        }
                    });
                } else if (frequency.length > 1) {
                    let nextDates = [];
                    let allNextDates = [];
                    for (const day of frequency) {
                        let currentDate = parsedStartDate;
                        for (let i = 0; i < 4; i++) {
                            const potentialNextDate = nextWeekDay[day](currentDate);
                            allNextDates.push(potentialNextDate);
                            const compareDate = potentialNextDate - now;
                            const difference = Math.round(compareDate / (1000 * 60 * 60 * 24));
                            nextDates.push({ [day]: difference });
                            currentDate = potentialNextDate;
                        }
                    }
                    nextDates.sort((a, b) => a[Object.keys(a)[0]] - b[Object.keys(b)[0]]);
                    let minKey = Object.keys(nextDates[0])[0];
                    const nextDay = nextWeekDay[minKey];
                    const planningDate = plannings.map(planning => {
                        return planning.date;
                    })
                    const data = excludeDays?.find(exclude => exclude.recurrence_id === recurrence.id);
                    const exdate = JSON.parse(data?.date || "[]");
                    if (!isPlanned) {
                        try {
                            insertIfNotExists(db, nextDay(parsedStartDate), plannings, last, recurrence.id, exdate);
                        } catch (err) {
                            console.error('Error while adding planning: ', err);
                            if (plannings.length === 0 || plannings === undefined) {
                                safeDeletePlanning(db, last, allNextDates, recurrence.start_date);
                            }
                        }
                    }
                    const checkPlanning = db.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(recurrence.id);
                    for (const date of allNextDates) {
                        if (planningDate.includes(format(date, 'dd/MM/yyyy', { locale: fr })) === false && !exdate?.some(exclude => exclude === format(date, 'dd/MM/yyyy', { locale: fr })) && date > nextDate) {
                            insertIfNotExists(db, date, checkPlanning, last, recurrence.id, exdate);
                        }
                    }
                    const formatedAllNextDate = allNextDates.map(date => format(date, 'dd/MM/yyyy', { locale: fr }));
                    for (const line of plannings) {
                        if (parseDate(line.date) > parseDate(recurrence.start_date) && !formatedAllNextDate.includes(line.date)) {
                            safeDeletePlanning(db, line, allNextDates, recurrence.start_date);
                        }
                    }
                } else if (!isToday && startDateParsed < now && nextDate < now) {
                    let find = false;
                    const maxIterations = 360;
                    let iterationCount = 0;
                    if (frequency.length === 1) {
                        let nextDay = nextDate;
                        let startDay;
                        while (find === false && maxIterations > iterationCount) {
                            const searchingNextDate = nextWeekDay[frequency[0]](nextDay);
                            const compareDate = searchingNextDate - now;
                            const difference = Math.round(compareDate / (1000 * 60 * 60 * 24));
                            if (difference >= 0) {
                                find = true;
                                if (difference === 0) {
                                    startDay = searchingNextDate
                                }
                                nextDay = nextWeekDay[frequency[0]](searchingNextDate);
                            } else {
                                nextDay = searchingNextDate;
                            }
                            iterationCount++;
                        }
                        if (startDay !== undefined) {
                            db.prepare('UPDATE recurrence SET start_date = ?, next_day = ? WHERE id = ?').run(format(startDay, 'dd/MM/yyyy', { locale: fr }), format(nextDay, 'dd/MM/yyyy', { locale: fr }), recurrence.id);
                        } else {
                            db.prepare('UPDATE recurrence SET start_date = ?, next_day = ? WHERE id = ?').run(format(nextDate, 'dd/MM/yyyy', { locale: fr }), format(nextDay, 'dd/MM/yyyy', { locale: fr }), recurrence.id);
                        }
                    } else if (frequency.length > 1) {
                        let nextDay = nextDate;
                        let startDay;
                        let nextDateToSearch;
                        while (find === false && maxIterations > iterationCount) {
                            let allDifferences = [];
                            for (const day of frequency) {
                                const searchingNextDate = nextWeekDay[day](nextDay);
                                const compareDate = searchingNextDate - now;
                                const difference = Math.round(compareDate / (1000 * 60 * 60 * 24));
                                allDifferences.push({ [day]: difference });
                            }
                            allDifferences.sort((a, b) => a[Object.keys(a)[0]] - b[Object.keys(b)[0]]);
                            const minKey = Object.keys(allDifferences[0])[0];
                            const searchingNextDate = nextWeekDay[minKey](nextDay);
                            if (allDifferences[0] >= 0) {
                                find = true;
                                if (difference === 0) {
                                    startDay = searchingNextDate
                                }
                                nextDay = nextWeekDay[frequency[0]](searchingNextDate);
                            } else {
                                nextDay = searchingNextDate;
                            }
                            if (iterationCount >= maxIterations) {
                                console.error('Max iterations reached while searching for the next date.');
                            }
                            iterationCount++;
                        }
                        if (startDay !== undefined) {
                            db.prepare('UPDATE recurrence SET start_date = ?, next_day = ? WHERE id = ?').run(format(startDay, 'dd/MM/yyyy', { locale: fr }), format(nextDay, 'dd/MM/yyyy', { locale: fr }), recurrence.id);
                        } else {
                            db.prepare('UPDATE recurrence SET start_date = ?, next_day = ? WHERE id = ?').run(format(nextDate, 'dd/MM/yyyy', { locale: fr }), format(nextDay, 'dd/MM/yyyy', { locale: fr }), recurrence.id);
                        }
                    }
                }
            }
        }
        db.close();
        console.log('[CHECK] check all recurrences done');
    }
}
