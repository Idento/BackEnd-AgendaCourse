import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";

export const login = async (req, res) => {
    res.json({ message: 'Logged in successfully', session: req.session });
}

export const logout = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error while destroying session: ', err);
            res.status(500).send('Internal server error');
            return;
        }
    });
    res.json({ message: 'Logged out successfully' });
}

export const sessionInfo = async (req, res) => {
    res.json({ session: req.session.user.username, role: req.session.user.role });
}

