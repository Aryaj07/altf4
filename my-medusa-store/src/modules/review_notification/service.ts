import {
  AbstractNotificationProviderService
} from "@medusajs/framework/utils"
import Mailjet from "node-mailjet"

import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO
} from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger;
};

// Initialize Mailjet client
const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC!,
  process.env.MJ_APIKEY_PRIVATE!
);

class EmailNotificationProvider extends AbstractNotificationProviderService {
  static identifier = "email-provider";
  protected logger_: Logger;

  constructor({ logger }: InjectedDependencies) {
    super()
    this.logger_ = logger;
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const messages = (notification as any)?.data?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      this.logger_.info("Email provider: no messages to send.");
      return {};
    }

    await mailjet.post("send", { version: "v3.1" }).request({
      Messages: messages,
    });

    this.logger_.info(`Email provider: sent ${messages.length} message(s).`);
    return {};
  }
}

export default EmailNotificationProvider;