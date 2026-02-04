import ProductDescriptionModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const PRODUCT_DESCRIPTION_MODULE = "productDescriptionModule";

export default Module(PRODUCT_DESCRIPTION_MODULE, {
  service: ProductDescriptionModuleService,
});

export * from "./models/product-description-section";
