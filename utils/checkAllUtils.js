import { parse, format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export function parseDate(dateStr) {
    return startOfDay(parse(dateStr, 'dd/MM/yyyy', new Date(), { locale: fr }));
}

export function isSameDay(date1, date2) {
    return (typeof date1 !== 'string' ? format(date1, 'dd/MM/yyyy') : date1) === (typeof date2 !== 'string' ? format(date2, 'dd/MM/yyyy') : date2);
}

export function includesDay(list, target) {
    const formatted = format(target, 'dd/MM/yyyy');
    return list.some(date => format(date, 'dd/MM/yyyy') === formatted);
}

export function safeDeletePlanning(db, planning, alldates, now) {
    const parsedDate = parseDate(planning.date);
    const refDate = startOfDay(now);

    const isFuture = parsedDate > refDate;

    const isNotPlanned = !includesDay(alldates, parsedDate);

    if (isFuture && isNotPlanned) {
        console.log(`------[INFO] Suppression planning ID ${planning.id}, date ${planning.date}, client ${planning.client_name}-------`);

        try {
            db.prepare('DELETE FROM planning WHERE id = ?').run(planning.id);
        } catch (err) {
            console.error(`[ERREUR] Échec suppression planning ID ${planning.id}`, err);
        }
    }
}

export function insertIfNotExists(db, date, plannings, last, recurrenceId, excludedDates = []) {
    const formatted = format(date, 'dd/MM/yyyy', { locale: fr });
    const alreadyPlanned = plannings.some(p => p.date === formatted);

    if (
        excludedDates.includes(formatted) ||
        plannings.some(p => isSameDay(parseDate(p.date), date))
    ) {
        return;
    }

    if (!alreadyPlanned) {
        try {
            const insertToDb = db.prepare(`INSERT INTO planning
        (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .run(0, formatted, last.client_name, last.start_time, last.return_time,
                    last.note, last.destination, last.long_distance, recurrenceId);
            const id = insertToDb.lastInsertRowid;
            console.log(`[INFO] Planning inséré pour ${formatted} avec ID ${id}`);
        } catch (err) {
            console.error(`[ERREUR] Insertion planning à ${formatted} échouée`, err);
        }
    }
}