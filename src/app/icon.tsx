import { createSiteAppIcon } from "@/lib/site-app-icon";

export const dynamic = "force-static";
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return createSiteAppIcon(size.width);
}
