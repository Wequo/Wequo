import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const bt = (date: string, time: string): dayjs.Dayjs => {
    let parsedDate = dayjs(date).isValid()
        ? dayjs(date).utc() 
        : dayjs(date, ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY-MM-DDTHH:mm:ss[Z]"], true).utc(); 
    if (!parsedDate.isValid()) {
        throw new Error(`La fecha proporcionada no es válida: ${date}`);
    }

    const normalizeTime = (time: string): string => {
        const parts = time.split(":");
        if (parts.length < 2 || parts.length > 3) {
            throw new Error(`El tiempo proporcionado no tiene el formato correcto: ${time}`);
        }
        const [hours, minutes] = parts.map((part) => part.padStart(2, "0")); 
        return `${hours}:${minutes}`;
    };

    const normalizedTime = normalizeTime(time);

    // Convertir hora y minutos a la fecha
    const [hours, minutes] = normalizedTime.split(":").map(Number);
    return parsedDate.set("hour", hours).set("minute", minutes);
};


export const fd = (date: string): string => {
    const parsedDate = dayjs(date).isValid()
        ? dayjs(date)
        : dayjs(date, ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY-MM-DDTHH:mm:ss[Z]"], true);

    if (!parsedDate.isValid()) {
        throw new Error(`La fecha proporcionada no es válida: ${date}`);
    }

    return parsedDate.format("DD-MM-YYYY");
};