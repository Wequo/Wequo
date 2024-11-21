import dayjs from 'dayjs';
import { bt } from '@/utils/dates';

type IdleProps = {
    formData: {
        startDate: string;
        startTime: string;
        endDate: string;
        endTime: string;
    };
    company: {
        overnight_supplement_per_driver: number;
        night_end_time: string; 
    };
    drivers: number;
    breakdown: any[];
};

export function getIdleDriver({ company, formData, drivers, breakdown }: IdleProps): number {
    // la primera parte incluye tramo nocturno?
    const Segment1NightIncluded = breakdown.some((breaks:any) => breaks.segment === 'departure');

    const pricePerDriver = company.overnight_supplement_per_driver;

    const { startDate, startTime, endDate, endTime } = formData;
    const startDateTime = bt(startDate,startTime);
    const endDateTime = bt(endDate,endTime);

    const nextDayNightEndTime = dayjs(`${startDate}T${company.night_end_time}`).add(1, 'day');

    if (!startDateTime.isValid() || !endDateTime.isValid()) {
        console.error('Fechas de inicio o fin no son válidas');
        return 0;
    }

    const hoursDifference = endDateTime.diff(startDateTime, 'hour', true);
    const driverMultiplier = drivers > 0 ? 2 : 1;

    // Verificar si la finalización es posterior al night_end_time del día siguiente
    if (!Segment1NightIncluded && endDateTime.isAfter(nextDayNightEndTime)) {
        // Si la hora de finalización es después del night_end_time, se aplicará el recargo
        const daysDifference = Math.ceil(hoursDifference / 24);
        const price = daysDifference * pricePerDriver;
        return price * driverMultiplier;
    } else if (Segment1NightIncluded && hoursDifference > 8) {
        // Si el segmento incluye una noche y la diferencia de horas es mayor a 8, se calcula el recargo
        const daysDifference = Math.ceil(hoursDifference / 24);
        const price = daysDifference * pricePerDriver;
        return price * driverMultiplier;
    }

    return 0;
}



