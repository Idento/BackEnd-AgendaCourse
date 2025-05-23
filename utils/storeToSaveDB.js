import Database from "better-sqlite3";
import { differenceInCalendarDays, parse } from "date-fns";

export function savePlanning() {
    const archiveDB = new Database("archive.db");
    const db = new Database("Database.db");
    const allPlannings = db.prepare('SELECT * FROM planning').all();

    for (const planning of allPlannings) {
        const planningDate = parse(planning.date, 'dd/MM/yyyy', new Date());
        const todayPlanning = new Date();
        if (differenceInCalendarDays(todayPlanning, planningDate) > 30) {
            try {
                archiveDB.prepare(`INSERT INTO saved_planning (id, driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                    .run(planning.id, planning.driver_id, planning.date, planning.client_name, planning.start_time, planning.return_time, planning.note, planning.destination, planning.long_distance, planning.recurrence_id);
                console.log(`------- [INFO] Planning ID:${planning.id},Date ${planning.date}, Client ${planning.client_name} archived successfully.-------`);
                db.prepare('DELETE FROM planning WHERE id = ?').run(planning.id);
            } catch (error) {
                console.error("Error archiving planning:", error);
            }
        }
    }
    archiveDB.close();
    db.close();
    console.log("Plannings older than 30 days have been archived.");
}