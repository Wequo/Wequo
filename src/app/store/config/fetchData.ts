export async function fetchFormDetails(formId: string) {
    const response = await fetch(`/api/forms/${formId}`);
    if (!response.ok) {
      throw new Error(`Error fetching form details: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  }
  
export async function fetchCompanyConfig(companyId: number) {
    const response = await fetch(`/api/config?companyId=${companyId}`);
    if (!response.ok) {
        throw new Error(`Error fetching company config: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}