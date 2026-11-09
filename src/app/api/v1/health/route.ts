import { ok } from "@/lib/api/http"
import { PRODUCT_DISPLAY_NAME, PRODUCT_NAME_IS_PROVISIONAL } from "@/lib/config/product"

export async function GET() {
  return ok({
    status: "ok",
    api: "v1",
    productDisplayName: PRODUCT_DISPLAY_NAME,
    productNameIsProvisional: PRODUCT_NAME_IS_PROVISIONAL,
    timestamp: new Date().toISOString(),
  })
}
