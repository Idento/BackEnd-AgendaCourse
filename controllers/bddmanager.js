import Database from 'better-sqlite3';


export const DeleteDatabdd = function (req, res) {
    const data = req.body;
    const db = new Database('Database.db');
    let error = false
    if (data.category === 'planning') {
        db.prepare('DELETE FROM planning WHERE id = ?').run(data.id);
    } else if (data.category === 'recurrence') {
        db.prepare('DELETE FROM recurrence WHERE id = ?').run(data.id);
    } else if (data.category === 'planningAll') {
        db.prepare('DELETE FROM planning').run();
        db.prepare('DELETE FROM recurrence').run();
    }
    else {
        res.status(500).send('Internal server error');
        error = true
    }
    if (error) {
        db.close();
        return
    }
    db.close();
    res.status(200).send('Data deleted');
}