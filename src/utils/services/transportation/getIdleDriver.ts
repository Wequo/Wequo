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
    const Segment1NightIncluded = breakdown.some((breaks: any) => breaks.segment === 'departure');

    const pricePerDriver = company.overnight_supplement_per_driver;

    const { startDate, startTime, endDate, endTime } = formData;
    const startDateTime = bt(startDate, startTime);
    const endDateTime = bt(endDate, endTime);

    const nextDayNightEndTime = bt(startDate, company.night_end_time).add(1, 'day');

    if (!startDateTime.isValid() || !endDateTime.isValid()) {
        console.error('Fechas de inicio o fin no son válidas');
        return 0;
    }

    const minutesDifference = endDateTime.diff(startDateTime, 'minute');
    const driverMultiplier = drivers > 0 ? 2 : 1;

    const fullDays = Math.floor(minutesDifference / 1440); // 1440 minutos = 24 horas
    const remainingMinutes = minutesDifference % 1440;

    const daysDifference = fullDays + (remainingMinutes > 480 ? 1 : 0);

    if (!Segment1NightIncluded && endDateTime.isAfter(nextDayNightEndTime)) {
        const price = daysDifference * pricePerDriver;
        return price * driverMultiplier;
    } else if (Segment1NightIncluded && minutesDifference > 480) {
        const price = daysDifference * pricePerDriver;
        return price * driverMultiplier;
    }

    return 0;
}
