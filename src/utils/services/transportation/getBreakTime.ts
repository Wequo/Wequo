import {DRIVING_SESSION_LIMIT, REST_TIME} from "./config"
import dayjs from 'dayjs';

type BreakTimeParams = {
    driverHours: number;
    formData: any;
};

type BreakTimeReturns = {
    breakTime1:number;
    breakTime2: number;

}



const getALunch = (date:any,time:any, driverHours:any) => {

    const startDateTime = dayjs(`${date}T${time}`);
    const arrivalHour = startDateTime.add(driverHours, 'hour').hour();

    const numericTime = time.slice(0,2);

    if (numericTime < 12 && arrivalHour - 2 > 12) {
        return 2;
    }

    return 0
}



export const getBreakTime = ({ driverHours, formData}:BreakTimeParams ):BreakTimeReturns => {
    let breakTime = 0;

    const restPeriods = Math.floor(driverHours / DRIVING_SESSION_LIMIT); 
    breakTime+= restPeriods * REST_TIME;

    const breakTime1 = breakTime + getALunch(formData.startDate, formData.startTime, driverHours);
    const breakTime2 = breakTime + getALunch(formData.endDate, formData.endTime, driverHours);

    return {
        breakTime1,
        breakTime2
    };
}