import { NextResponse } from 'next/server';
import { findBestMatch } from '@/utils/calculations/transportation/bestMatch';
import { getVehicles } from '@/utils/services/transportation/getVehicles';
import { getPricingRules } from '@/utils/services/transportation/getPricingRules';
import { getVehicleDetail } from '@/utils/services/transportation/getVehicleDetail';
import { getCompanySettings } from '@/utils/services/transportation/getCompanySettings';
import { getCompany } from '@/utils/services/transportation/getCompany';
import { getFormData } from '@/utils/services/transportation/getFormData';

import { getLocationFee } from '@/utils/services/transportation/getLocationId';
import { getDistance } from "@/utils/calculations/transportation/distance";


import { getTotalDriverHours } from "@/utils/services/transportation/getDriverHours";
import { getBreakTime } from "@/utils/services/transportation/getBreakTime";
import { getSecondDriverPrice } from "@/utils/services/transportation/getSecondDriver";
import { getExtraHourSupplement } from "@/utils/services/transportation/getExtraHourSupplement";
import {getNightServices} from "@/utils/services/transportation/getNightService";
import {getDistancePrice} from "@/utils/services/transportation/getDistancePrice";
import {getIdlePrice} from "@/utils/services/transportation/getIdlePrice";
import { getIdleDriver } from "@/utils/services/transportation/getIdleDriver";


import { sendEmail } from '@/utils/notification/emailService';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import { bt, fd } from '@/utils/dates';


import { v4 as uuidv4 } from 'uuid'; // Para generar el ID único
import {storingQuoteOnDb} from "@/utils/services/transportation/storingData";

dayjs.extend(isBetween);

export async function POST(request: Request) {

  if (request.method !== 'POST') {
    return NextResponse.json({ success: false, error: 'Método no permitido' }, { status: 405 });
  }
  
  const { formId, formData:form } = await request.json();

  const formData = form;

  if (!formId) {
    return NextResponse.json({ success: false, error: 'Form id es requerido' }, { status: 400 });
  }

  if (!formData || formData.length === 0) {
    return NextResponse.json({ success: false, error: 'formData es requerido' }, { status: 400 });
  }


  const errors: Record<string, string> = {};


  const {departureAddress, arrivalAddress} = formData || {};

  const {company_id:companyId, show_prices:showPrices} = await getFormData(formId);

  if (!companyId) {
    return NextResponse.json({ success: false, error: 'Company id es requerido' }, { status: 400 });
  }

  const company = await getCompany(companyId);
  const companySettings = await getCompanySettings(companyId);

  const distances = await getDistance(departureAddress, arrivalAddress);
  const distance = distances?.distance;

  const parkingCities = distances?.cities;


  if (!distance) {
    return NextResponse.json({ success: false, error: 'Distance no encontrado' }, { status: 400 });
  }

  if(!parkingCities) {
    return NextResponse.json({ success: false, error: 'No hay ciudades para parking' }, { status: 400 });
  }
  

  const driverHours = getTotalDriverHours(distance);

  if (formData.tripType === 'oneWay') {
    const gap = 1;
    const startDateTime = bt(formData.startDate,formData.startTime);
    const calculatedEndDateTime = startDateTime.add(driverHours + gap, 'hour');

    formData.endDate = calculatedEndDateTime.toISOString()
    formData.endTime = calculatedEndDateTime.format('HH:mm');
  }


  const parkingFee = await getLocationFee(parkingCities,companyId);
  const vehicles = await getVehicles(companyId);
  const bestMatch = vehicles ? findBestMatch(vehicles, formData) : null;
  const pricingRules = await getPricingRules(bestMatch.vehicle_type_id);
  const vehicleDetail = await getVehicleDetail(bestMatch.vehicle_type_id);


  const {breakTime1, breakTime2} =  getBreakTime({driverHours, formData});



  const totalHours1 = driverHours + breakTime1;
  const totalHours2 = driverHours + breakTime2;

  const secondDriverPrice = getSecondDriverPrice({ totalHoursDriving: driverHours, totalWorkHours: totalHours1, formData, vehicleDetail});




  const nightSupplement = getNightServices({companySettings,formData, vehicleDetail, totalHoursSegment1:totalHours1, totalHoursSegment2:totalHours2})
  
  const distancePrice = getDistancePrice({pricingRules, distance, vehicleDetail})
  const idlePrice = getIdlePrice({vehicleDetail, formData, totalHours:totalHours1});

  const hoursSupplement = getExtraHourSupplement({companySettings, distanceDetails:distancePrice, formData, pricingRules, distance, vehicleDetail, totalHours2})


  const IdleDriver = getIdleDriver({company:companySettings, formData, drivers:secondDriverPrice.price, breakdown:nightSupplement.breakdown})

  let bathroomCharge = 0;
  if(formData.equipments.includes('bathroom') && bestMatch.bathroom) {
    bathroomCharge = vehicleDetail.bathroom_surcharge;
  }

  const totalCost = distancePrice?.total + secondDriverPrice.price + hoursSupplement + nightSupplement.totalNightServiceSurcharge + idlePrice + parkingFee.arrival + IdleDriver + bathroomCharge;

  const uniqueId = uuidv4();
  const quotationId = `${companyId}-${uniqueId}`;



  const responseData = {
    success: true,
    vehicle: bestMatch,
    quotation: {
      id: quotationId,
      total: totalCost + (totalCost * company.tax_value / 100),
      totalWithoutTaxes:totalCost,
      details: {
        distancePrice,
        secondDriver:secondDriverPrice.price, 
        hoursSupplement:hoursSupplement,
        nightDetails:nightSupplement.breakdown,
        idlePrice,
        cityParkingPrice:parkingFee
      }
    },
    data: {
      distance:distance,
      driverHours:driverHours, 
      breakTime1,
      breakTime2, 
      totalHours1,
      totalHours2, 
      secondDriverPrice,
      IdleDriver: {
        price:IdleDriver
      },
      parkingDetail: [
        {
          arrivalCity: parkingCities.arrival,
          arrivalFee: parkingFee.arrival
        },
        {
          departureCity: parkingCities.departure,
          departureFees: parkingFee.departure
        },
      ]
    },
    priceInternal: {
      total:totalCost + (totalCost * company.tax_value / 100),
      totalWithoutTaxes:  totalCost,
      details: {
        secondDriverPrice:secondDriverPrice.price,
        distancePrice:distancePrice?.total,
        hoursSupplement:hoursSupplement,
        NightSuplement:nightSupplement.totalNightServiceSurcharge,
        parkingFee:parkingFee.arrival,
        idlePrice: idlePrice,
        IdleDriver: IdleDriver,
        bathroomCharge
      } 
    },

    
    errors: Object.keys(errors).length > 0 ? errors : null,
  }





  const equipmentsList:any = {
      mic: "Microfono",
      pmr_accessory: "Accesor para PMR",
      electric_outlets: "Enchufes eléctricos",
      video: "Video",
      bathroom: "Baño"
  };

  const luggage:any = {
    none: "Sin Equipaje",
    classic:"Maletas clásicas",
    large: "Maletas grandes",
    bulky: "Equipaje voluminoso"
  };

  const travel_purpose:any = {
      wedding: "Boda o ceremonia",
      bachelor_party: "Despedida de soltero/a",
      sports_trip: "Viajes deportivos",
      business_trip: "Viajes de empresa",
      cultural_trip: "Viajes culturales o de ocio (turismo)",
      airport_transfer: "Transferencia a aeropuerto/tren",
      school_group: "Grupo escolar",
      seniors_group: "Grupo de personas mayores",
      musicians_group: "Grupos de músicos"
  };

  const generateEquipmentList = (equipments:any) => {
    if (!equipments || equipments.length === 0) {
      return '<p style="margin: 0;"><span style="font-size: 15px;">Sin equipo especificado.</span></p>';
    }
    return `<ul style="margin: 0; padding: 0; list-style: none;">
      ${equipments.map((item:any) => `<li><p style="margin: 0;"><span style="font-size: 15px;">${equipmentsList[item]}</span></p></li>`).join('')}
    </ul>`;
  };

  const notes = formData.additionalNotes ? formData.additionalNotes.trim() : "Sin detalles del viaje.";

  const companyEmailBody = `
        <div>
        <p style="margin: 0;">
            <span style="font-size: 15px;"><strong>N° de Solicitud</strong>: ${quotationId}</span>
        </p>
        ${formData.phone && formData.phone.trim() ? `
            <p style="margin: 0;">
              <span style="font-size: 15px;"><strong>Teléfono</strong>: ${formData.phone}</span>
            </p>` : ''
        }<p style="margin: 0;"></p>

        
        <p style="margin: 0;"><span style="font-size: 15px;"><strong>Mail</strong>: ${formData.email}</span></p><p style="margin: 0;"></p>
        <p style="margin: 0;"><span style="font-size: 15px;"><strong>Tipo de Viaje</strong>: ${formData.tripType ==='oneWay' ? "Viaje de Ida" : "Viaje de Ida y Vuelta"}</span></p><p style="margin: 0;"></p>

        <p style="margin: 0;"></p>
            <p style="margin: 0;">
                <span style="font-size: 15px;">
                    <strong>Fecha de salida</strong>: ${fd(formData.startDate)} 
                    ${formData.tripType !== 'oneWay' ? `- <strong>Fecha de Regreso:</strong> ${fd(formData.endDate)}` : ''}
                </span>
            </p>
            <p style="margin: 0;"></p>
            <p style="margin: 0;">
              <span style="font-size: 15px;">
                  <strong>Hora de Salida</strong>: ${formData.startTime} 
                  ${formData.tripType !== 'oneWay' ? `- <strong>Hora de regreso:</strong> ${formData.endTime}` : ''}
              </span>
        </p>
        <p style="margin: 0;"><span style="font-size: 15px;"><strong>Dirección de orígen</strong>: ${formData.arrivalAddress}</span></p><p style="margin: 0;"></p>
        <p style="margin: 0;"><span style="font-size: 15px;"><strong>Dirección de destino</strong>: ${formData.departureAddress}</span></p><p style="margin: 0;"></p>
        <p style="margin: 0;"><span style="font-size: 15px;"><strong>Cantidad de pasajeros</strong>: ${formData.passengers}</span></p><p style="margin: 0;"></p>
        <p style="margin: 0;"><span style="font-size: 15px;"><strong>Necesita Autocar en destino</strong>: ${formData.needsVehicle ? 'Si' : 'No'}</span></p><p style="margin: 0;"></p>
        <p style="margin: 0;"><span style="font-size: 15px;"><strong>Tipo de equipaje</strong>: ${luggage[formData.luggage]}</span></p><p style="margin: 0;"></p>
        <p style="margin: 0;"><span style="font-size: 15px;"><strong>Propósito del viaje</strong>: ${travel_purpose[formData.travelPurpose]}</span></p><p style="margin: 0;"></p>
        <p style="margin: 0;"><span style="font-size: 15px;"><strong>Equipo que desearías (opcional)</strong>:</span></p> <p style="margin: 0;"></p>
        ${generateEquipmentList(formData.equipments)}
        <p style="margin: 0;"></p>
        <p style="margin: 0;"><span style="font-size: 15px;"><strong>Detalle del viaje</strong>: ${notes}</span></p>
        <p style="margin: 0;"></p>
        <p style="margin: 0;"></p>
        <p style="margin: 0;"></p>
        <p style="margin: 0;">
            <span style="font-size: 17px;"><strong>Presupuesto</strong>: ${Number(responseData.quotation.total?.toFixed(2)).toLocaleString('es-ES')} €</span>
        </p>
    </div>
  `

  const PriceDetails = () => {
    return showPrices ? (`<p style="margin: 0;">
      <span style="font-size: 17px;"><strong>Presupuesto</strong>: ${Number(responseData.quotation.total?.toFixed(2)).toLocaleString('es-ES')} €</span>
  </p>`) : (`<span></span>`)
  }

  const clientEmailBody = `<div>
    <p style="margin: 0;">
        <span style="font-size: 15px;"><strong>N° </strong>: ${quotationId}</span>
    </p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;"></p>
    ${formData.phone && formData.phone.trim() ? `
      <p style="margin: 0;">
        <span style="font-size: 15px;"><strong>Teléfono</strong>: ${formData.phone}</span>
      </p>` : ''
    }
    <p style="margin: 0;"></p>
    <p style="margin: 0;">
        <span style="font-size: 15px;"><strong>Mail</strong>: ${formData.email}</span>
    </p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;">
        <span style="font-size: 15px;">
            <strong>Fecha de salida</strong>: ${fd(formData.startDate)} 
            ${formData.tripType !== 'oneWay' ? `- <strong>Fecha de Regreso:</strong> ${fd(formData.endDate)}` : ''}
        </span>
    </p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;">
        <span style="font-size: 15px;">
            <strong>Hora de Salida</strong>: ${formData.startTime} 
            ${formData.tripType !== 'oneWay' ? `- <strong>Hora de regreso:</strong> ${formData.startTime}` : ''}
        </span>
    </p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;">
        <span style="font-size: 15px;"><strong>Dirección de destino</strong>: ${formData.departureAddress}</span>
    </p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;">
        <span style="font-size: 15px;"><strong>Cantidad de pasajeros</strong>: ${formData.passengers}</span>
    </p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;">
        <span style="font-size: 15px;"><strong>Necesita Autocar en destino</strong>: ${formData.needsVehicle ? 'Si' : 'No'}</span>
    </p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;">
        <span style="font-size: 15px;"><strong>Tipo de equipaje</strong>: ${luggage[formData.luggage]}</span>
    </p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;">
        <span style="font-size: 15px;"><strong>Propósito del viaje</strong>:  ${travel_purpose[formData.travelPurpose]}</span>
    </p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;"><span style="font-size: 15px;"><strong>Equipo que desearías (opcional)</strong>:</span></p> <p style="margin: 0;"></p>
    ${generateEquipmentList(formData.equipments)}
    <p style="margin: 0;"></p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;">
        <span style="font-size: 15px;"><strong>Detalle del viaje</strong>: ${notes}</span>
    </p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;"></p>
    <p style="margin: 0;"></p>
    ${PriceDetails()}
  </div>`

  const companyEmail = {
    to: company.admin_email,
    subject: 'Cotización Para empresa',
    body: `<!doctypehtml><html xmlns=http://www.w3.org/1999/xhtml xmlns:o=urn:schemas-microsoft-com:office:office xmlns:v=urn:schemas-microsoft-com:vml><meta content="text/html; charset=utf-8"http-equiv=Content-Type><meta content="IE=edge"http-equiv=X-UA-Compatible><meta content="telephone=no"name=format-detection><meta content="width=device-width,initial-scale=1"name=viewport><title>Nueva solicitud de servicio</title><style emogrify=no>#outlook a{padding:0}.ExternalClass{width:100%}.ExternalClass,.ExternalClass div,.ExternalClass font,.ExternalClass p,.ExternalClass span,.ExternalClass td{line-height:100%}table td{border-collapse:collapse;mso-line-height-rule:exactly}.editable.image{font-size:0!important;line-height:0!important}.nl2go_preheader{display:none!important;mso-hide:all!important;mso-line-height-rule:exactly;visibility:hidden!important;line-height:0!important;font-size:0!important}body{width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;margin:0;padding:0}img{outline:0;text-decoration:none;-ms-interpolation-mode:bicubic}a img{border:none}table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}th{font-weight:400;text-align:left}[class=gmail-fix]{display:none!important}</style><style emogrify=no>@media (max-width:600px){.gmx-killpill{content:"\u03D1";}}</style><style emogrify=no>@media (max-width:600px){.gmx-killpill{content:"\u03D1";}.r0-o{border-style:solid!important;margin:0 auto 0 auto!important;width:100%!important}.r1-i{background-color:transparent!important}.r2-c{box-sizing:border-box!important;text-align:center!important;valign:top!important;width:320px!important}.r3-o{border-style:solid!important;margin:0 auto 0 auto!important;width:320px!important}.r4-i{padding-bottom:5px!important;padding-top:5px!important}.r5-c{box-sizing:border-box!important;display:block!important;valign:top!important;width:100%!important}.r6-o{border-style:solid!important;width:100%!important}.r7-i{padding-left:0!important;padding-right:0!important}.r8-c{box-sizing:border-box!important;text-align:center!important;width:100%!important}.r9-i{background-color:#fff!important}.r10-c{box-sizing:border-box!important;text-align:center!important;valign:top!important;width:100%!important}.r11-i{background-color:#8224e3!important;padding-bottom:20px!important;padding-left:15px!important;padding-right:15px!important;padding-top:20px!important}.r12-c{display:none!important}.r13-c{border:0!important;box-sizing:border-box!important;height:auto!important;text-align:center!important;valign:top!important;visibility:visible!important;width:100%!important}.r14-o{border:0!important;border-bottom-width:0!important;border-left-width:0!important;border-right-width:0!important;border-style:solid!important;border-top-width:0!important;display:table!important;height:auto!important;margin:0 auto 0 auto!important;visibility:visible!important;width:100%!important}.r15-i{width:100%!important}.r16-i{padding-left:20px!important;padding-right:20px!important;padding-top:20px!important}.r17-c{border:0!important;box-sizing:border-box!important;height:auto!important;text-align:left!important;valign:top!important;visibility:visible!important;width:100%!important}.r18-o{border:0!important;border-style:solid!important;display:table!important;height:auto!important;margin:0 auto 0 0!important;visibility:visible!important;width:100%!important}.r19-i{padding-top:10px!important;text-align:left!important;width:100%!important}.r20-i{padding-left:20px!important;padding-right:20px!important;padding-top:30px!important}.r21-i{text-align:left!important;width:100%!important}.r22-i{padding-top:15px!important;text-align:left!important;width:100%!important}.r23-o{border-style:solid!important;margin:0 auto 0 auto!important;margin-top:40px!important;width:100%!important}.r24-i{background-color:#8224e3!important}.r25-i{padding-bottom:20px!important;padding-left:10px!important;padding-right:10px!important;padding-top:20px!important}.r26-o{border-style:solid!important;margin-left:0!important;width:100%!important}.r27-c{box-sizing:border-box!important;text-align:left!important;valign:top!important;width:100%!important}body{-webkit-text-size-adjust:none}.nl2go-responsive-hide{display:none}.nl2go-body-table{min-width:unset!important}.mobshow{height:auto!important;overflow:visible!important;max-height:unset!important;visibility:visible!important}.resp-table{display:inline-table!important}.magic-resp{display:table-cell!important}}</style><style>h1,h2,h3,h4,li,ol,p,ul{margin:0}.default-button{color:#000;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;font-style:normal;font-weight:700;line-height:1.15;text-decoration:none;word-break:break-word}.nl2go-default-textstyle{color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word}a,a:link{color:#ffae02;text-decoration:none}.default-heading3{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:26px;word-break:break-word}.sib_class_16_black_reg{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;word-break:break-word}.sib_class_16_black_b{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;word-break:break-word}.nl2go_class_impressum{color:#999;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:12px;font-style:italic;word-break:break-word}.sib_class_26_black_b{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;word-break:break-word}.sib_class_35_black_b{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:35px;font-weight:700;word-break:break-word}.default-heading4{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:18px;word-break:break-word}.sib_class_50_black_b{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:50px;font-weight:700;word-break:break-word}.sib_class_70_black_reg{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:70px;word-break:break-word}.default-heading1{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:50px;word-break:break-word}.default-heading2{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:35px;word-break:break-word}.sib_class_20_white_b{color:#fff;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;word-break:break-word}.sib_class_28_black_reg{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:28px;word-break:break-word}a[x-apple-data-detectors]{color:inherit!important;text-decoration:inherit!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}.no-show-for-you{border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0}</style><!--[if mso]><xml><o:officedocumentsettings><o:allowpng><o:pixelsperinch>96</o:pixelsperinch></o:officedocumentsettings></xml><![endif]--><style>a:link{color:#ffae02;text-decoration:none}</style><body bgcolor=#ffffff link=#ffae02 style=background-color:#fff text=#3f3d56 yahoo=fix><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=background-color:#fff;width:100% class=nl2go-body-table><tr><td><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r1-i style=background-color:transparent valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=600 style=table-layout:fixed class=r3-o align=center><tr><td class=r4-i style=padding-bottom:5px;padding-top:5px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i style=padding-left:10px;padding-right:10px valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class="nl2go-default-textstyle r8-c"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;word-break:break-word;line-height:16px;text-align:center align=center><div><p style=margin:0><a href="{{ mirror }}"style=color:#ffae02;text-decoration:none><span style=font-family:arial,helvetica,sans-serif;font-size:12px><u>Ver en navegador</u></span></a></div></table></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=600 style=table-layout:fixed;width:600px class=r3-o align=center><tr><td class=r9-i style=background-color:#fff valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r11-i style=background-color:#8224e3;padding-bottom:20px;padding-top:20px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i style=padding-left:10px;padding-right:10px valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class=r12-c align=center><table border=0 cellpadding=0 cellspacing=0 role=presentation width=200 style=table-layout:fixed;width:200px><tr><td style=font-size:0;line-height:0><img border=0 src=https://img.mailinblue.com/8209610/images/content_library/original/6707e5e18fb0584df6b13591.png style=display:block;width:100% width=200></table></tr><!--[if !mso]><!-- --><tr><td class=r13-c align=center><table border=0 cellpadding=0 cellspacing=0 role=presentation width=80 style=border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0 class="mobshow r14-o"><tr><td class="mobshow resp-table magic-resp r15-i"style=font-size:0;line-height:0><img border=0 src=https://img.mailinblue.com/8209610/images/content_library/original/6707e5e18fb0584df6b13591.png style=border:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;display:block;width:100% width=80 class="mobshow resp-table no-show-for-you"></table></tr><!--<![endif]--></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r16-i style=padding-top:55px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class="nl2go-default-textstyle r12-c"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;word-break:break-word;line-height:1.3;padding-top:10px;text-align:left;valign:top align=left><div><h2 class=default-heading2 style=margin:0;color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:35px;word-break:break-word;text-align:center><span style=font-size:28px>¡Tienes una nueva solicitud de servicio!</span></h2></div></tr><!--[if !mso]><!-- --><tr><td class=r17-c align=left><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0 class="mobshow r18-o"><tr><td class="mobshow resp-table magic-resp nl2go-default-textstyle r19-i"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;word-break:break-word;line-height:1.3;padding-top:10px;text-align:left valign=top align=left><div><h2 class=default-heading2 style=margin:0;color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:35px;word-break:break-word><span style=font-size:24px>¡Nueva solicitud de servicio!</span></h2></div></table></tr><!--<![endif]--></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r16-i style=padding-top:50px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=500 style=table-layout:fixed;width:500px class=r0-o align=center><tr><td class=r7-i style=font-size:0;line-height:0><img border=0 src=http://img-st2.mailinblue.com/2037886/images/rnb/original/5e8b17962b8ec7020d7c2f85.png style=display:block;width:100% width=500></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r20-i style=padding-top:60px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class="nl2go-default-textstyle r12-c"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;text-align:left;valign:top align=left><div><h3 class=default-heading3 style=margin:0;color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:26px;word-break:break-word><span style=font-size:22px>Detalles de la solicitud:</span></h3></div></tr><!--[if !mso]><!-- --><tr><td class=r17-c align=left><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0 class="mobshow r18-o"><tr><td class="mobshow resp-table magic-resp nl2go-default-textstyle r21-i"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;text-align:left valign=top align=left><div><h3 class=default-heading3 style=margin:0;color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:26px;word-break:break-word><span style=font-size:19px>Detalles de la solicitud:</span></h3></div></table></tr><!--<![endif]--><tr><td class="nl2go-default-textstyle r12-c"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;padding-top:15px;text-align:left;valign:top align=left>${companyEmailBody}</tr><!--[if !mso]><!-- --><tr><td class=r17-c align=left><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0 class="mobshow r18-o"><tr><td class="mobshow resp-table magic-resp nl2go-default-textstyle r22-i"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;padding-top:15px;text-align:left valign=top align=left>${companyEmailBody}</table></tr><!--<![endif]--></table></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r23-o align=center><tr class=nl2go-responsive-hide><td style=font-size:120px;line-height:120px height=120>­<tr><td class=r24-i style=background-color:#8224e3 valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=600 style=table-layout:fixed;width:600px class=r3-o align=center><tr><td class=r25-i style=padding-bottom:55px;padding-left:65px;padding-right:40px;padding-top:70px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r26-o><tr><td class=r7-i style=padding-left:10px;padding-right:10px valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class="nl2go-default-textstyle r27-c"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;word-break:break-word;line-height:1.6;text-align:left;valign:top align=left><div><div class=sib_class_16_black_reg style=color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;word-break:break-word><span style=color:#fff><strong>Busiter</strong></span></div><div class=sib_class_16_black_reg style=color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;word-break:break-word><span style=color:#fff>Parc TecnoCampus Mataró-Maresme, Carrer d'Ernest Lluch, 32</span><br><span style=color:#fff>08302 Mataró</span><br><a href=http:// style=color:#ffae02;text-decoration:none>hello@busiter.com</a></div></div></table></table></table></table></table></table>`,
  };

  const companyLogo = company.logo;
  const clientEmail = {
    to: formData.email,
    subject: 'Cotización Para cliente',
    body: `<!doctypehtml><html xmlns=http://www.w3.org/1999/xhtml xmlns:o=urn:schemas-microsoft-com:office:office xmlns:v=urn:schemas-microsoft-com:vml><meta content="text/html; charset=utf-8"http-equiv=Content-Type><meta content="IE=edge"http-equiv=X-UA-Compatible><meta content="telephone=no"name=format-detection><meta content="width=device-width,initial-scale=1"name=viewport><title>Solicitud Recibida</title><style emogrify=no>#outlook a{padding:0}.ExternalClass{width:100%}.ExternalClass,.ExternalClass div,.ExternalClass font,.ExternalClass p,.ExternalClass span,.ExternalClass td{line-height:100%}table td{border-collapse:collapse;mso-line-height-rule:exactly}.editable.image{font-size:0!important;line-height:0!important}.nl2go_preheader{display:none!important;mso-hide:all!important;mso-line-height-rule:exactly;visibility:hidden!important;line-height:0!important;font-size:0!important}body{width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;margin:0;padding:0}img{outline:0;text-decoration:none;-ms-interpolation-mode:bicubic}a img{border:none}table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}th{font-weight:400;text-align:left}[class=gmail-fix]{display:none!important}</style><style emogrify=no>@media (max-width:600px){.gmx-killpill{content:"\u03D1"}}</style><style emogrify=no>@media (max-width:600px){.gmx-killpill{content:"\u03D1"}.r0-o{border-style:solid!important;margin:0 auto 0 auto!important;width:100%!important}.r1-i{background-color:transparent!important}.r2-c{box-sizing:border-box!important;text-align:center!important;valign:top!important;width:320px!important}.r3-o{border-style:solid!important;margin:0 auto 0 auto!important;width:320px!important}.r4-i{padding-bottom:5px!important;padding-top:5px!important}.r5-c{box-sizing:border-box!important;display:block!important;valign:top!important;width:100%!important}.r6-o{border-style:solid!important;width:100%!important}.r7-i{padding-left:0!important;padding-right:0!important}.r8-c{box-sizing:border-box!important;text-align:center!important;width:100%!important}.r9-i{background-color:#fff!important}.r10-c{box-sizing:border-box!important;text-align:center!important;valign:top!important;width:100%!important}.r11-i{padding-bottom:0!important;padding-left:15px!important;padding-right:15px!important;padding-top:20px!important}.r12-i{padding-bottom:15px!important;padding-top:15px!important}.r13-i{padding-left:20px!important;padding-right:20px!important;padding-top:20px!important}.r14-c{display:none!important}.r15-c{border:0!important;box-sizing:border-box!important;height:auto!important;text-align:left!important;valign:top!important;visibility:visible!important;width:100%!important}.r16-o{border:0!important;border-style:solid!important;display:table!important;height:auto!important;margin:0 auto 0 0!important;visibility:visible!important;width:100%!important}.r17-i{padding-top:10px!important;text-align:center!important;width:100%!important}.r18-i{padding-left:20px!important;padding-right:20px!important;padding-top:30px!important}.r19-c{box-sizing:border-box!important;valign:top!important;width:100%!important}.r20-i{padding-right:0!important;padding-top:15px!important}.r21-i{text-align:left!important;width:100%!important}.r22-i{padding-top:15px!important;text-align:left!important;width:100%!important}.r23-i{padding-bottom:20px!important;padding-left:15px!important;padding-right:15px!important;padding-top:20px!important}.r24-c{background-color:transparent!important;box-sizing:border-box!important;text-align:center!important;width:100%!important}.r25-o{border:0!important;border-style:solid!important;display:table!important;height:auto!important;margin:0 auto 0 0!important;margin-top:14px!important;visibility:visible!important;width:100%!important}.r26-i{padding-left:20px!important;padding-right:20px!important;padding-top:0!important}.r27-c{border:0!important;box-sizing:border-box!important;height:auto!important;text-align:center!important;valign:top!important;visibility:visible!important;width:100%!important}.r28-o{border:0!important;border-style:solid!important;display:table!important;height:auto!important;margin:0 auto 0 auto!important;visibility:visible!important;width:100%!important}.r29-i{text-align:center!important;width:100%!important}.r30-r{background-color:#e41670!important;border-radius:25px!important;box-sizing:border-box;height:initial!important;padding-bottom:15px!important;padding-top:15px!important;text-align:center!important;width:100%!important}.r31-o{border-style:solid!important;margin:0 auto 0 auto!important;margin-top:40px!important;width:100%!important}.r32-i{background-color:#e41670!important}.r33-i{color:#3f3d56!important;padding-bottom:20px!important;padding-left:10px!important;padding-right:10px!important;padding-top:20px!important}.r34-o{border-style:solid!important;margin-left:0!important;width:100%!important}.r35-i{color:#3f3d56!important;padding-left:0!important;padding-right:0!important}.r36-c{box-sizing:border-box!important;color:#3f3d56!important;text-align:left!important;valign:top!important;width:100%!important}body{-webkit-text-size-adjust:none}.nl2go-responsive-hide{display:none}.nl2go-body-table{min-width:unset!important}.mobshow{height:auto!important;overflow:visible!important;max-height:unset!important;visibility:visible!important}.resp-table{display:inline-table!important}.magic-resp{display:table-cell!important}}</style><!--[if !mso]><!--><style emogrify=no>@import url(https://fonts.googleapis.com/css2?family=Montserrat);</style><!--<![endif]--><style>h1,h2,h3,h4,li,ol,p,ul{margin:0}.nl2go-default-textstyle{color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word}.default-button{color:#000;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;font-style:normal;font-weight:700;line-height:1.15;text-decoration:none;word-break:break-word}a,a:link{color:#ffae02;text-decoration:none}.default-heading2{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:35px;word-break:break-word}.default-heading3{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:26px;word-break:break-word}.sib_class_20_white_b{color:#fff;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;word-break:break-word}.sib_class_16_black_reg{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;word-break:break-word}.nl2go_class_impressum{color:#999;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:12px;font-style:italic;word-break:break-word}.default-heading4{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:18px;word-break:break-word}.sib_class_28_black_reg{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:28px;word-break:break-word}.sib_class_35_black_b{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:35px;font-weight:700;word-break:break-word}.default-heading1{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:50px;word-break:break-word}.sib_class_16_black_b{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;word-break:break-word}.sib_class_50_black_b{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:50px;font-weight:700;word-break:break-word}.sib_class_26_black_b{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;word-break:break-word}.sib_class_70_black_reg{color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:70px;word-break:break-word}a[x-apple-data-detectors]{color:inherit!important;text-decoration:inherit!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}.no-show-for-you{border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0}</style><!--[if mso]><xml><o:officedocumentsettings><o:allowpng><o:pixelsperinch>96</o:pixelsperinch></o:officedocumentsettings></xml><![endif]--><style>a:link{color:#ffae02;text-decoration:none}</style><body bgcolor=#ffffff link=#ffae02 style=background-color:#fff text=#3f3d56 yahoo=fix><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=background-color:#fff;width:100% class=nl2go-body-table><tr><td><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r1-i style=background-color:transparent valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=600 style=table-layout:fixed class=r3-o align=center><tr><td class=r4-i style=padding-bottom:5px;padding-top:5px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i style=padding-left:10px;padding-right:10px valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class="nl2go-default-textstyle r8-c"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;word-break:break-word;line-height:16px;text-align:center align=center><div><a href="{{ mirror }}"style=color:#ffae02;text-decoration:none><span style=font-family:arial,helvetica,sans-serif;font-size:12px;text-decoration:underline>Ver en navegador</span></a></div></table></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=600 style=table-layout:fixed;width:600px class=r3-o align=center><tr><td class=r9-i style=background-color:#fff valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r11-i style=padding-top:20px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i style=padding-left:15px;padding-right:15px valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class=r10-c align=center><table border=0 cellpadding=0 cellspacing=0 role=presentation width=150 style=table-layout:fixed;width:150px class=r0-o><tr><td class=r12-i style=font-size:0;line-height:0;padding-bottom:15px;padding-top:15px><img border=0 src=${companyLogo} style=display:block;width:100% width=150></table></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r13-i style=padding-top:55px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class="nl2go-default-textstyle r14-c"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;word-break:break-word;line-height:1.3;padding-top:10px;text-align:left;valign:top align=left><div><h2 class=default-heading2 style=margin:0;color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:35px;word-break:break-word;text-align:center><span style=font-size:28px>¡Gracias por tu solicitud!</span></h2></div></tr><!--[if !mso]><!-- --><tr><td class=r15-c align=left><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0 class="mobshow r16-o"><tr><td class="nl2go-default-textstyle magic-resp mobshow resp-table r17-i"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;word-break:break-word;line-height:1.3;padding-top:10px;text-align:center valign=top align=center><div><h2 class=default-heading2 style=margin:0;color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:35px;word-break:break-word><span style=font-size:24px>¡Gracias por tu solicitud!</span></h2></div></table></tr><!--<![endif]--></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r13-i style=padding-top:50px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=500 style=table-layout:fixed;width:500px class=r0-o align=center><tr><td class=r7-i style=font-size:0;line-height:0><img border=0 src=https://img.mailinblue.com/8209610/images/content_library/original/6709137d4db549d17c660402.jpg style=display:block;width:100% width=500></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r18-i><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r20-i style=padding-right:24px;padding-top:15px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r19-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class="nl2go-default-textstyle r14-c"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;text-align:left;valign:top align=left>${!showPrices && (`<div><p style=margin:0>Estamos comprobando nuestra disponibilidad. Nos pondremos en contacto contigo en breve.</div>`)}</tr><!--[if !mso]><!-- --><tr><td class=r15-c align=left><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0 class="mobshow r16-o"><tr><td class="nl2go-default-textstyle magic-resp mobshow resp-table r21-i"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;text-align:left valign=top align=left><div><p style=margin:0>${!showPrices && (`<span style=font-size:18px> Estamos comprobando nuestra disponibilidad. Nos pondremos en contacto contigo en breve.) </span>`)}</div></table></tr><!--<![endif]--></table></table></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r18-i style=padding-top:60px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class="nl2go-default-textstyle r14-c"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;text-align:left;valign:top align=left><div><h3 class=default-heading3 style=margin:0;color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:26px;word-break:break-word><span style=font-size:22px>Detalles de la solicitud:</span></h3></div></tr><!--[if !mso]><!-- --><tr><td class=r15-c align=left><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0 class="mobshow r16-o"><tr><td class="nl2go-default-textstyle magic-resp mobshow resp-table r21-i"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;text-align:left valign=top align=left><div><h3 class=default-heading3 style=margin:0;color:#434343;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:26px;word-break:break-word><span style=font-size:19px>Detalles de la solicitud:</span></h3></div></table></tr><!--<![endif]--><tr><td class="nl2go-default-textstyle r14-c"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;padding-top:15px;text-align:left;valign:top align=left>${clientEmailBody}</tr><!--[if !mso]><!-- --><tr><td class=r15-c align=left><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0 class="mobshow r16-o"><tr><td class="nl2go-default-textstyle magic-resp mobshow resp-table r22-i"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;padding-top:15px;text-align:left valign=top align=left>${clientEmailBody}</table></tr><!--<![endif]--></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r23-i style=padding-bottom:20px;padding-top:20px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i style=padding-left:15px;padding-right:15px valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class=r24-c style=font-size:15px;line-height:15px;background-color:transparent align=center height=15>­</table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r23-i style=padding-bottom:20px;padding-top:20px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i style=padding-left:15px;padding-right:15px valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class=r14-c align=left><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100%><tr class=nl2go-responsive-hide><td style=font-size:15px;line-height:15px height=15>­<tr><td class=nl2go-default-textstyle style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;text-align:left valign=top align=left><div><p style=margin:0;text-align:center><strong>¿Necesitas Ayuda?</strong></div></table></tr><!--[if !mso]><!-- --><tr><td class=r15-c align=left><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0 class="mobshow r25-o"><tr class=nl2go-responsive-hide><td style=font-size:14px;line-height:14px height=14>­<tr><td class="nl2go-default-textstyle magic-resp mobshow resp-table r21-i"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word;text-align:left valign=top align=left><div><p style=margin:0;text-align:center><span style=font-size:18px><strong>¿Necesitas Ayuda?</strong></span></div></table></tr><!--<![endif]--></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r0-o align=center><tr><td class=r26-i><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r6-o><tr><td class=r7-i valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class=r14-c align=center><table border=0 cellpadding=0 cellspacing=0 role=presentation width=318 style=table-layout:fixed;width:318px><tr><td class=nl2go-default-textstyle style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word valign=top align=center height=22><!--[if mso]><v:roundrect xmlns:v=urn:schemas-microsoft-com:vml xmlns:w=urn:schemas-microsoft-com:office:word href=tel:689499023 style=v-text-anchor:middle;height:51px;width:317px arcsize=49% fillcolor=#e41670 strokecolor=#e41670 strokeweight=1px data-btn=1><w:anchorlock></w:anchorlock><v:textbox inset=0,0,0,0><div style=display:none><center class=default-button><span><span style=color:#fff>Contáctanos</span></span></center></div></v:textbox></v:roundrect><![endif]--><!--[if !mso]><!-- --> <a href=tel:689499023 style=font-style:normal;font-weight:700;line-height:1.15;text-decoration:none;word-break:break-word;border-style:solid;word-wrap:break-word;display:block;-webkit-text-size-adjust:none;background-color:#e41670;border-bottom-width:0;border-color:#e41670;border-left-width:0;border-radius:25px;border-right-width:0;border-top-width:0;color:#000;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;height:22px;mso-hide:all;padding-bottom:15px;padding-top:15px;width:318px class=default-button data-btn=1 target=_blank title="Help Busiter"><span><span style=color:#fff>Contáctanos</span></span> </a><!--<![endif]--></table></tr><!--[if !mso]><!-- --><tr><td class=r27-c align=center><table border=0 cellpadding=0 cellspacing=0 role=presentation width=318 style=border:none;display:none;float:none;font-size:0;height:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;table-layout:fixed;visibility:hidden;width:0 class=r28-o><tr><td class="nl2go-default-textstyle r29-i"style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;word-break:break-word valign=top align=center height=22><!--[if mso]><v:roundrect xmlns:v=urn:schemas-microsoft-com:vml xmlns:w=urn:schemas-microsoft-com:office:word href=tel:689499023 style=v-text-anchor:middle;height:51px;width:317px arcsize=49% fillcolor=#e41670 strokecolor=#e41670 strokeweight=1px data-btn=2><w:anchorlock></w:anchorlock><v:textbox inset=0,0,0,0><div style=display:none><center class=default-button><span><span style=color:#fff;font-size:17px>Contáctanos</span></span></center></div></v:textbox></v:roundrect><![endif]--><!--[if !mso]><!-- --> <a href=tel:689499023 style=font-style:normal;font-weight:700;line-height:1.15;text-decoration:none;word-break:break-word;border-style:solid;word-wrap:break-word;display:block;-webkit-text-size-adjust:none;background-color:#e41670;border-bottom-width:0;border-color:#e41670;border-left-width:0;border-radius:25px;border-right-width:0;border-top-width:0;color:#000;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;height:22px;mso-hide:all;padding-bottom:15px;padding-top:15px;width:318px class="default-button r30-r"data-btn=2 target=_blank title="Help Busiter"><span><span style=color:#fff;font-size:17px>Contáctanos</span></span> </a><!--<![endif]--></table></tr><!--<![endif]--></table></table></table></table></table><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r31-o align=center><tr class=nl2go-responsive-hide><td style=font-size:120px;line-height:120px height=120>­<tr><td class=r32-i style=background-color:#e41670 valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=600 style=table-layout:fixed;width:600px class=r3-o align=center><tr><td class=r33-i style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;padding-bottom:55px;padding-left:65px;padding-right:40px;padding-top:70px><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><th class=r5-c style=font-weight:400 valign=top width=100%><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100% style=table-layout:fixed;width:100% class=r34-o><tr><td class=r35-i style=color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;padding-left:10px;padding-right:10px valign=top><table border=0 cellpadding=0 cellspacing=0 role=presentation width=100%><tr><td class="nl2go-default-textstyle r36-c"style=word-break:break-word;color:#3f3d56;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.6;text-align:left;valign:top align=left><div><div style=color:#434343;font-size:16px><span style=color:#fff><strong>Torres Bus</strong></span></div><div style=color:#434343;font-size:16px><span style=color:#fff>Calle fundidores, 79, 28906 Getafe, (Madrid)</span><br><span style=color:#fff>info@torresbus.es</span></div></div></table></table></table></table></table></table>`
  };



  try {
    await sendEmail(clientEmail).catch(console.error);
    await sendEmail(companyEmail).catch(console.error);
    await storingQuoteOnDb(quotationId, companyId, formData, responseData);
   
  } catch (error) {
    console.error('Error storing quote:', error);
    return NextResponse.json({ success: false, error: 'Error storing quote in the database' }, { status: 500 });
  }

  


  return NextResponse.json(responseData);




}
