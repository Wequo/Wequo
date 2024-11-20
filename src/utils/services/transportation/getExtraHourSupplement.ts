import dayjs from 'dayjs';
import { MAX_WORK_HOURS } from './config';


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
        console.log('ADENTRO DE SUPLEMENTO EXTRA HORAS')
        console.log(distanceDetails)
        if(distanceDetails.totalKm < distanceDetails.toKm) {
            const startDateTime = dayjs(`${formData.startDate}T${formData.startTime}`);
            const endDateTime = dayjs(`${formData.endDate}T${formData.endTime}`)
            const endArrivalTime = endDateTime.add(totalHours2, 'hour');


        
            const hoursDifference = endArrivalTime.diff(startDateTime, 'hour', true);

            console.log('inicio', startDateTime.toString())
            console.log('regreso',  endDateTime.toString())
            console.log('llegada a la vuelta', endArrivalTime.toString())
            console.log('horas de diferencia', hoursDifference)
            if(hoursDifference > distanceDetails.maxServicesHours) {
                const costPerHour = (distanceDetails.total*companySettings.supplement_per_extra_hour)/100;
                console.log('COSTO POR HORA', costPerHour)
                const extraHours = Math.ceil(hoursDifference-distanceDetails.maxServicesHours);
                console.log('extraHours', extraHours)

                const maxExtraHours = MAX_WORK_HOURS - distanceDetails.maxServicesHours;

                console.log('maxExtraHours', maxExtraHours)

                const finalHours = extraHours > maxExtraHours ? maxExtraHours : extraHours;

                console.log('finalHours', finalHours)

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