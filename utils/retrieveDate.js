import { format, parse, addDays } from "date-fns";

export function retrieveDate() {
    const week = 8
    let allWeekDays = []
    for (let i = 1; i < week; i++) {
        allWeekDays.push(format(addDays(new Date(), i), 'dd/MM/yyyy'))
    }
    return allWeekDays
}