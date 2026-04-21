import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { StripeWebhookController } from "./stripe-webhook.controller";
import { BillingService } from "./billing.service";
import { StripeService } from "./stripe.service";
import { WalletService } from "./wallet.service";
import { UsageService } from "./usage.service";
import { PlansService } from "./plans.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [
    BillingService,
    StripeService,
    WalletService,
    UsageService,
    PlansService,
  ],
  exports: [BillingService, UsageService, PlansService],
})
export class BillingModule {}
