import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

const timezones = 'Europe/Madrid';

type NightServiceProps = {
    companySettings: { night_start_time: string; night_end_time: string };
    formData: { startDate: string; startTime: string; endDate: string; endTime: string };
    vehicleDetail: { night_service_surcharge: number };
    totalHoursSegment1: number;
    totalHoursSegment2: number;
};

type NightServiceBreakdown = {
    date: string;
    segment: 'departure' | 'return';
    surcharge: number;
};

type NightServiceResponseProps = {
    breakdown: NightServiceBreakdown[];
    totalNightServiceSurcharge: number;
};

export function getNightServices({
    companySettings,
    formData,
    vehicleDetail,
    totalHoursSegment1,
    totalHoursSegment2,
}: NightServiceProps): NightServiceResponseProps {
    if (!companySettings || !companySettings.night_start_time || !companySettings.night_end_time) {
        console.error('Company settings are missing night start or end times.');
        return { breakdown: [], totalNightServiceSurcharge: 0 };
    }

    const getNightTimeRange = (date: string, start_time: string, end_time: string, segmentStartTime: dayjs.Dayjs) => {
        let nightStart = dayjs.tz(`${date} ${start_time}`, 'YYYY-MM-DD HH:mm:ss', timezones);
        let nightEnd = dayjs.tz(`${date} ${end_time}`, 'YYYY-MM-DD HH:mm:ss', timezones);

        // Adjust if crossing midnight
        if (nightEnd.isBefore(nightStart)) {
            nightEnd = nightEnd.add(1, 'day');
        }

        // Adjust start and end time based on segment start time
        if (segmentStartTime.isBefore(dayjs.tz(`${date} ${start_time}`, timezones)) && segmentStartTime.hour() < 6) {
            // If the segment starts early in the morning, we consider the night time of the previous day
            nightStart = nightStart.subtract(1, 'day');
            nightEnd = nightEnd.subtract(1, 'day');
        }

        console.log(`Adjusted night start for ${segmentStartTime.format('YYYY-MM-DD HH:mm:ss')}: ${nightStart.format()}`);
        console.log(`Adjusted night end for ${segmentStartTime.format('YYYY-MM-DD HH:mm:ss')}: ${nightEnd.format()}`);

        return { nightStart, nightEnd };
    };

    const startTimeSegment1 = dayjs.tz(`${formData.startDate} ${formData.startTime}`, 'YYYY-MM-DD HH:mm:ss', timezones);
    const endTimeSegment1 = startTimeSegment1.add(totalHoursSegment1, 'hour');
    const startTimeSegment2 = dayjs.tz(`${formData.endDate} ${formData.endTime}`, 'YYYY-MM-DD HH:mm:ss', timezones);
    const endTimeSegment2 = startTimeSegment2.add(totalHoursSegment2, 'hour');

    const { nightStart: nightStart1, nightEnd: nightEnd1 } = getNightTimeRange(formData.startDate, companySettings.night_start_time, companySettings.night_end_time, startTimeSegment1);
    const { nightStart: nightStart2, nightEnd: nightEnd2 } = getNightTimeRange(formData.endDate, companySettings.night_start_time, companySettings.night_end_time, startTimeSegment2);

    const isNightIncluded = (start: dayjs.Dayjs, end: dayjs.Dayjs, nightStart: dayjs.Dayjs, nightEnd: dayjs.Dayjs): boolean => {
        return start.isBetween(nightStart, nightEnd, null, '[)') || end.isBetween(nightStart, nightEnd, null, '(]') || (start.isBefore(nightStart) && end.isAfter(nightEnd));
    };

    const hasNightService1 = isNightIncluded(startTimeSegment1, endTimeSegment1, nightStart1, nightEnd1);
    const hasNightService2 = isNightIncluded(startTimeSegment2, endTimeSegment2, nightStart2, nightEnd2);

    console.log(`Night service charge for segment 1: ${hasNightService1 ? 'Applies' : 'Does not apply'}`);
    console.log(`Night service charge for segment 2: ${hasNightService2 ? 'Applies' : 'Does not apply'}`);

    const breakdown: NightServiceBreakdown[] = [];
    if (hasNightService1) {
        breakdown.push({
            date: formData.startDate,
            segment: 'departure',
            surcharge: vehicleDetail.night_service_surcharge,
        });
    }
    if (hasNightService2) {
        breakdown.push({
            date: formData.endDate,
            segment: 'return',
            surcharge: vehicleDetail.night_service_surcharge,
        });
    }

    const totalNightServiceSurcharge = breakdown.reduce((sum, item) => sum + item.surcharge, 0);

    return {
        breakdown,
        totalNightServiceSurcharge,
    };
}
