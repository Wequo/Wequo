import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import { bt } from '@/utils/dates';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);


type NightServiceProps = {
    companySettings: { night_start_time: string; night_end_time: string };
    formData: { startDate: string; startTime: string; endDate: string; endTime: string };
    vehicleDetail: { night_service_surcharge: number };
    totalHoursSegment1: number;
    totalHoursSegment2: number;
};

type NightServiceBreakdown = {
    date: any;
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
        let nightStart = bt(date, start_time);
        let nightEnd = bt(date, end_time);

        if (nightEnd.isBefore(nightStart)) {
            nightEnd = nightEnd.add(1, 'day');
        }

        if (segmentStartTime.isBefore(bt(date, start_time)) && segmentStartTime.hour() < 6) {
            nightStart = nightStart.subtract(1, 'day');
            nightEnd = nightEnd.subtract(1, 'day');
        }

        return { nightStart, nightEnd };
    };

    const startTimeSegment1 = bt(formData.startDate, formData.startTime);
    const endTimeSegment1 = startTimeSegment1.add(totalHoursSegment1, 'hour');
    const startTimeSegment2 = bt(formData.endDate, formData.endTime);
    const endTimeSegment2 = startTimeSegment2.add(totalHoursSegment2, 'hour');

    const { nightStart: nightStart1, nightEnd: nightEnd1 } = getNightTimeRange(
        formData.startDate,
        companySettings.night_start_time,
        companySettings.night_end_time,
        startTimeSegment1
    );
    const { nightStart: nightStart2, nightEnd: nightEnd2 } = getNightTimeRange(
        formData.endDate,
        companySettings.night_start_time,
        companySettings.night_end_time,
        startTimeSegment2
    );

    const isNightIncluded = (
        start: dayjs.Dayjs,
        end: dayjs.Dayjs,
        nightStart: dayjs.Dayjs,
        nightEnd: dayjs.Dayjs
    ): boolean => {
        return (
            start.isBetween(nightStart, nightEnd, null, '[)') ||
            end.isBetween(nightStart, nightEnd, null, '(]') ||
            (start.isBefore(nightStart) && end.isAfter(nightEnd))
        );
    };

    const hasNightService1 = isNightIncluded(
        startTimeSegment1,
        endTimeSegment1,
        nightStart1,
        nightEnd1
    );
    const hasNightService2 = isNightIncluded(
        startTimeSegment2,
        endTimeSegment2,
        nightStart2,
        nightEnd2
    );

    const differenceBetweenSegments = startTimeSegment2.diff(endTimeSegment1, 'hour');

    const breakdown: NightServiceBreakdown[] = [];
    if (differenceBetweenSegments >= 14) {
        if (hasNightService1) {
            breakdown.push({
                date: bt(formData.startDate, formData.startTime),
                segment: 'departure',
                surcharge: vehicleDetail.night_service_surcharge,
            });
        }
        if (hasNightService2) {
            breakdown.push({
                date: bt(formData.endDate, formData.endTime),
                segment: 'return',
                surcharge: vehicleDetail.night_service_surcharge,
            });
        }
    } else {
        // Prioritize the first segment (departure) if both qualify
        if (hasNightService1) {
            breakdown.push({
                date: bt(formData.startDate, formData.startTime),
                segment: 'departure',
                surcharge: vehicleDetail.night_service_surcharge,
            });
        } else if (hasNightService2) {
            breakdown.push({
                date: bt(formData.endDate, formData.endTime),
                segment: 'return',
                surcharge: vehicleDetail.night_service_surcharge,
            });
        }
    }

    const totalNightServiceSurcharge = breakdown.reduce((sum, item) => sum + item.surcharge, 0);

    return {
        breakdown,
        totalNightServiceSurcharge,
    };
}
