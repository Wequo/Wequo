import {MAX_DRIVING_HOURS, MAX_WORK_HOURS} from "./config"
import { bt } from '@/utils/dates';

type DriverParams = {
    totalHoursDriving: number;
    totalWorkHours: number;
    formData:any;
    vehicleDetail:any;
};

type SecondDriverResponse = {
    isSameDay:boolean;
    tripDurationInHours:number;
    price:number;
}

export function getSecondDriverPrice({ totalHoursDriving, totalWorkHours, formData, vehicleDetail }: DriverParams): SecondDriverResponse {

    const {startDate, startTime, endDate, endTime} = formData;

    const secondDriverCost = vehicleDetail.second_driver_surcharge; 
    const startDateTime = bt(startDate,startTime);
    const endDateTime = bt(endDate,endTime);

    const endEndDate = endDateTime.add(totalHoursDriving, 'hour');

    const tripDurationInHours = endEndDate.diff(startDateTime, "minutes") / 60;


    
    if (totalHoursDriving > MAX_DRIVING_HOURS || totalWorkHours > MAX_WORK_HOURS) { 
        return {
            isSameDay: true,
            tripDurationInHours,
            price:secondDriverCost
        }
    }

    
    if (tripDurationInHours < 24 && tripDurationInHours > 15) {
        return {
            isSameDay: true,
            tripDurationInHours,
            price:secondDriverCost
        };
    }

    return {
        isSameDay: false,
        tripDurationInHours,
        price:0
    };
}