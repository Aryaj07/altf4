import CheckoutInsightsModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const CHECKOUT_INSIGHTS_MODULE = "checkout_insights"

export default Module(CHECKOUT_INSIGHTS_MODULE, {
  service: CheckoutInsightsModuleService,
})
