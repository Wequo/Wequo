import dayjs from 'dayjs';
import { MAX_WORK_HOURS } from './config';
import { bt } from '@/utils/dates';


type ExtraSuplementProps = {
    companySettings:any;
    distanceDetails:any;
    formData:any;
    pricingRules: any;
    distance:number | null;
    vehicleDetail:any;
    totalHours2:number;
};

export function getExtraHourSupplement({companySettings,  distanceDetails, formData, distance,  totalHours2}:ExtraSuplementProps) {
    if(distance) {
        if(distanceDetails.totalKm < distanceDetails.toKm) {
            const startDateTime = bt(formData.startDate, formData.startTime);
            const endDateTime = bt(formData.endDate,formData.endTime);

            const endArrivalTime = endDateTime.add(totalHours2, 'hour');


        
            const hoursDifference = endArrivalTime.diff(startDateTime, 'hour', true);
            console.log('is over hours and below maxWorking hours?', hoursDifference > distanceDetails.maxServicesHours && hoursDifference <= MAX_WORK_HOURS);
            console.log(hoursDifference)
            if(hoursDifference > distanceDetails.maxServicesHours && hoursDifference <= MAX_WORK_HOURS) {
                const costPerHour = (distanceDetails.total*companySettings.supplement_per_extra_hour)/100;
                const extraHours = Math.ceil(hoursDifference-distanceDetails.maxServicesHours);
                const maxExtraHours = MAX_WORK_HOURS - distanceDetails.maxServicesHours;
                const finalHours = extraHours > maxExtraHours ? maxExtraHours : extraHours;
                return finalHours * costPerHour;
            }
            else {
                return 0
            }
        }    
        else {
            return 0
        }
    }
 }