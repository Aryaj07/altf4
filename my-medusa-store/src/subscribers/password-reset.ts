import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/medusa"

import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Handlebars from "handlebars"
import passwordResetTemplate from "../modules/review_notification/passwordResetTemplate"

export default async function handlePasswordReset({
  event: {
    data: { entity_id: email, token, actor_type },
  },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  logger.info(`password-reset: received reset request for ${email} (${actor_type})`)

  // Determine the reset URL based on actor type
  let resetUrl: string

  if (actor_type === "customer") {
    const storefrontUrl = (process.env.STOREFRONT_URL || "http://localhost:3000").replace(/\/$/, "")
    resetUrl = `${storefrontUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
  } else {
    // Admin users - redirect to Medusa admin reset page
    const backendUrl = (process.env.BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
    resetUrl = `${backendUrl}/app/reset-password?token=${token}&email=${encodeURIComponent(email)}`
  }

  // Compile the email template
  const html = Handlebars.compile(passwordResetTemplate)({
    email,
    resetUrl,
    year: new Date().getFullYear(),
  })

  const fromEmail = process.env.MJ_FROM_EMAIL || "info@altf4gear.com"
  const fromName = process.env.MJ_FROM_NAME || "Altf4gear"

  try {
    await notificationModuleService.createNotifications({
      to: email,
      channel: "email",
      template: "password-reset",
      data: {
        messages: [
          {
            From: { Email: fromEmail, Name: fromName },
            To: [{ Email: email }],
            Subject: "Reset Your Password - Altf4gear",
            HTMLPart: html,
            TrackOpens: "disabled",
            TrackClicks: "disabled",
          },
        ],
      },
    })

    logger.info(`password-reset: email sent to ${email}`)
  } catch (error: any) {
    logger.error(`password-reset: failed to send email -> ${error?.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
