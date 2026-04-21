import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { BillingService } from "./billing.service";
import { WalletService } from "./wallet.service";
import { UsageService } from "./usage.service";
import { PlansService, SubscriptionTier } from "./plans.service";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../auth/decorators/current-user.decorator";
import { PrismaService } from "../../shared/database";

@ApiTags("billing")
@Controller("billing")
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly walletService: WalletService,
    private readonly usageService: UsageService,
    private readonly plansService: PlansService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveUserId(clerkId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true },
    });
    if (!user) throw new BadRequestException("User not found");
    return user.id;
  }

  private async resolveUser(
    clerkId: string,
  ): Promise<{ id: string; email: string }> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true },
    });
    if (!user) throw new BadRequestException("User not found");
    return user;
  }

  private getBaseUrl(req: any): string {
    const origin = req.headers?.origin;
    if (origin) return origin;
    return process.env.WEB_URL || "https://myconsilium.xyz";
  }

  @Get("subscription")
  async getSubscription(@CurrentUser() currentUser: CurrentUserData) {
    const user = await this.resolveUser(currentUser.userId);
    return this.billingService.getSubscriptionWithDetails(user.id);
  }

  @Get("usage")
  async getUsage(@CurrentUser() currentUser: CurrentUserData) {
    const userId = await this.resolveUserId(currentUser.userId);
    return this.usageService.getUsageSummary(userId);
  }

  @Get("wallet")
  async getWallet(
    @CurrentUser() currentUser: CurrentUserData,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const userId = await this.resolveUserId(currentUser.userId);
    const [balance, transactions] = await Promise.all([
      this.walletService.getBalance(userId),
      this.walletService.getTransactions(
        userId,
        limit ? parseInt(limit, 10) : 20,
        offset ? parseInt(offset, 10) : 0,
      ),
    ]);
    return { ...balance, transactions };
  }

  @Get("plans")
  getPlans() {
    return this.plansService.getAllPlans();
  }

  @Post("checkout")
  @HttpCode(HttpStatus.OK)
  async createCheckout(
    @CurrentUser() currentUser: CurrentUserData,
    @Body() body: { tier: SubscriptionTier },
    @Req() req: any,
  ) {
    const user = await this.resolveUser(currentUser.userId);
    const url = await this.billingService.createCheckoutSession(
      user.id,
      user.email,
      body.tier,
      this.getBaseUrl(req),
    );
    return { url };
  }

  @Post("wallet/topup")
  @HttpCode(HttpStatus.OK)
  async createWalletTopUp(
    @CurrentUser() currentUser: CurrentUserData,
    @Body() body: { amountCents: number },
    @Req() req: any,
  ) {
    const user = await this.resolveUser(currentUser.userId);
    const url = await this.billingService.createWalletTopUp(
      user.id,
      body.amountCents,
      user.email,
      this.getBaseUrl(req),
    );
    return { url };
  }

  @Post("portal")
  @HttpCode(HttpStatus.OK)
  async createPortal(
    @CurrentUser() currentUser: CurrentUserData,
    @Req() req: any,
  ) {
    const userId = await this.resolveUserId(currentUser.userId);
    const url = await this.billingService.createPortalSession(
      userId,
      this.getBaseUrl(req),
    );
    return { url };
  }

  @Post("cancel")
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@CurrentUser() currentUser: CurrentUserData) {
    const userId = await this.resolveUserId(currentUser.userId);
    await this.billingService.cancelSubscription(userId);
    return { canceled: true };
  }
}
