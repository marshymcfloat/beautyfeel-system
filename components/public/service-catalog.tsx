import { ServiceExplorer } from "@/components/public/service-explorer";
import { getPublicServices } from "@/features/services/queries";

export async function ServiceCatalog() {
  const services = await getPublicServices();
  return <ServiceExplorer services={services} />;
}
