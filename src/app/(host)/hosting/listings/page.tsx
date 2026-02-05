import { listingsServerService } from "@/services/listings.server";
import ListingsClient from "./ListingsClient";

export default async function HostingListingsPage() {
  const listings = await listingsServerService.getHostListings();

  return <ListingsClient initialListings={listings} />;
}
