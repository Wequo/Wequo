import { bt } from '@/utils/dates';

type IdleProps = {
    vehicleDetail: any;
    formData: any;
    totalHours:number;
};

export function getIdlePrice({ vehicleDetail, formData, totalHours }: IdleProps): number {
    const { startDate, startTime, endDate, endTime } = formData;

    const idlePriceCost = vehicleDetail.idle_day_price;
    const startDateTime = bt(startDate,startTime).add(totalHours, 'hour');
    const endDateTime = bt(endDate,endTime).add(totalHours, 'hour');


    const daysDifference = endDateTime.diff(startDateTime, 'day', true); 
    const fullDays = Math.floor(daysDifference);
    return fullDays > 0 ? fullDays * idlePriceCost : 0;
}
