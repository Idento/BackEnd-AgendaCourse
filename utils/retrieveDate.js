import { format, parse, addDays } from "date-fns";
import { fr } from "date-fns/locale"

export function retrieveDate() {
    const week = 8
    let allWeekDays = []
    for (let i = 1; i < week; i++) {
        allWeekDays.push(format(addDays(new Date(), i), 'dd/MM/yyyy'))
    }
    return allWeekDays
}

export function retrieveDateFromDate(date) {
    const week = 7
    let allWeekDays = []
    for (let i = 0; i < week; i++) {
        allWeekDays.push(format(addDays(parse(date, 'dd/MM/yyyy', new Date()), i), 'dd/MM/yyyy', { locale: fr }))
    }
    return allWeekDays
}