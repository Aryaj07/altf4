import OrderModule from "@medusajs/medusa/order";
import ReviewModule from "../modules/auto_mail";
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  // The entity we are adding the relationship TO (your review)
  {
    linkable: ReviewModule.linkable.review,
    field: "order_id",
  },
  // The entity we are linking FROM (the core order)
  OrderModule.linkable.order,{
    
    readOnly: true,
  }
);