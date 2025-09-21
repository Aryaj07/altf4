import {
    AbstractNotificationProviderService
} from "@medusajs/framework/utils"
import Mailjet from "node-mailjet"

import {
    Logger,
    ProviderSendNotificationDTO,
    ProviderSendNotificationResultsDTO
} from "@medusajs/framework/types"
import ReviewModuleService from "../auto_mail/service"; // Assuming correct path for type
import Handlebars from "handlebars";
import reviewTemplate from "./reviewTemplate"; // imports string directly
import { REVIEW_MODULE } from "../auto_mail";
const emailTemplate = Handlebars.compile(reviewTemplate);


type InjectedDependencies = {
    logger: Logger;
    [REVIEW_MODULE]: ReviewModuleService;
};

// Initialize Mailjet client
const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC!,
    process.env.MJ_APIKEY_PRIVATE!
);

class EmailNotificationProvider extends AbstractNotificationProviderService {
    static identifier = "email-provider";
    protected logger_: Logger;
    protected reviewService_: ReviewModuleService;

    constructor(
        { logger, [REVIEW_MODULE]: reviewService }: InjectedDependencies,
    ) {
        super()
        this.logger_ = logger;
        this.reviewService_ = reviewService;
    }

    async send(
        notification: ProviderSendNotificationDTO
    ): Promise<ProviderSendNotificationResultsDTO> {
        const targetOrderIds = Array.isArray((notification as any)?.data?.order_ids)
          ? ((notification as any).data.order_ids as string[])
          : undefined;

        const pendingReviews = await this.reviewService_.listReviews({ is_mail_sent: false });

        // If order IDs were provided, only send for those orders
        const relevantReviews = targetOrderIds?.length
          ? pendingReviews.filter((r: any) => targetOrderIds.includes(r.order_id))
          : pendingReviews;

        if (!relevantReviews.length) {
            this.logger_.info("No pending review requests to send.");
            return {};
        }

        const reviewsByOrder = new Map<string, any[]>();
        for (const review of relevantReviews) {
            if (!reviewsByOrder.has(review.order_id)) {
                reviewsByOrder.set(review.order_id, []);
            }
            reviewsByOrder.get(review.order_id)!.push(review);
        }

        for (const [orderId, reviewItems] of reviewsByOrder.entries()) {
            try {
                const firstItem = reviewItems[0];
                const customerEmail = firstItem.customer_email;
                const customerFirstName = firstItem.customer_first_name || "Valued Customer";

                const htmlBody = emailTemplate({
                    customerFirstName,
                    products: reviewItems,
                    year: new Date().getFullYear()
                });

                await mailjet.post("send", { version: "v3.1" }).request({
                    Messages: [
                        {
                            From: { Email: "arya@altf4gear.com", Name: "Altf4gear Team" },
                            To: [{ Email: customerEmail, Name: customerFirstName }],
                            Subject: `How did we do? Share your feedback!`,
                            // TextPart: `Hi ${customerFirstName}, please take a moment to review the products from your recent order.`,
                            HTMLPart: htmlBody,
                            TrackOpens: "disabled",
                            TrackClicks: "disabled"
                        }
                    ]
                });

                this.logger_.info(`Review request email sent successfully for order ${orderId}`);
                const reviewIdsToUpdate = reviewItems.map((item: any) => ({ id: item.id, is_mail_sent: true }));
                await this.reviewService_.updateReviews(reviewIdsToUpdate);
            } catch (err: any) {
                this.logger_.error(`Failed to send email for order ${orderId}. Error: ${err.message}`);
            }
        }

        return {};
    }
}

export default EmailNotificationProvider;