import { MedusaService } from "@medusajs/framework/utils";
import { ProductDescriptionSection } from "./models/product-description-section";

export default class ProductDescriptionModuleService extends MedusaService({
  ProductDescriptionSection,
}) {}
