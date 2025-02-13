import { db } from "../utils/database";


module.exports.GetDriverData = function (req, res) {
    const data = db.prepare('SELECT * FROM driver').all();
    res.status(200).json(data);
}

module.exports.GetDriverPlanning = function (req, res) {
    const { id } = req.params;
    const date = format(new Date(), 'dd/MM/yyyy');
    const data = db.prepare('SELECT * FROM planning WHERE driver_id = ? AND date = ?').all(id, date);
    res.status(200).json(data);
}