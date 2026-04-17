import { env } from "../config/env.js";
import { httpRequest } from "./http-client.js";

type SendEmailResponse = {
  success?: boolean;
  data?: {
    accepted?: boolean;
    messageId?: string;
  };
};

export interface NotificationClient {
  sendEmail(params: { serviceToken: string; to: string; subject: string; text: string }): Promise<boolean>;
}

export function createNotificationClient(): NotificationClient {
  return {
    async sendEmail(params: {
      serviceToken: string;
      to: string;
      subject: string;
      text: string;
    }): Promise<boolean> {
      const data = await httpRequest<SendEmailResponse>({
        baseUrl: env.notificationServiceUrl,
        path: "/internal/send-email",
        method: "POST",
        token: params.serviceToken,
        body: {
          to: params.to,
          subject: params.subject,
          text: params.text,
          meta: {
            scenario: "jury-demo",
            source: "gateway"
          }
        }
      });

      return Boolean(data.data?.accepted);
    }
  };
}

