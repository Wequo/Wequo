export interface ColorScheme {
    background_color: string;
    text_color: string;
    btn_color:string;
    btn_background:string;
}

interface CompanyDetails {
  id:string;
  logo:string;
  name:string;
}
  
export interface ConfigState {
    sector_id:number;
    form_id: string;
    language: string;
    company?:CompanyDetails;
    schemes:ColorScheme;
    showPrices:boolean;
    isDialog:boolean;
}