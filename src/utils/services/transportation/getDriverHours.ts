import {AVERAGE_SPEED} from "./config"

export function getTotalDriverHours(distance:number | null):number {
    if(!distance) return 0
    return distance / AVERAGE_SPEED;
}