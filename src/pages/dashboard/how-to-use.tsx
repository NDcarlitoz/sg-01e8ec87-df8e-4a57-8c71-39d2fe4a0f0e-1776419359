import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SEO } from "@/components/SEO";
import { useI18n } from "@/contexts/I18nContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookOpen,
  Rocket,
  Users,
  Send,
  Zap,
  Shield,
  DollarSign,
  BarChart3,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";

export default function HowToUsePage() {
  const { t } = useI18n();

  return (
    <>
      <SEO
        title={t("guide.title")}
        description={t("guide.subtitle")}
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("guide.title")}</h1>
                <p className="text-sm text-muted-foreground">{t("guide.subtitle")}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <Card className="p-6">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {/* Getting Started */}
              <AccordionItem value="getting-started" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Rocket className="h-5 w-5 text-primary" />
                    {t("guide.gettingStarted.title")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Bot Token */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 justify-center">1</Badge>
                      {t("guide.gettingStarted.botToken.title")}
                    </h3>
                    <ul className="space-y-2 pl-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.gettingStarted.botToken.step1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.gettingStarted.botToken.step2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.gettingStarted.botToken.step3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.gettingStarted.botToken.step4")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.gettingStarted.botToken.step5")}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Webhook */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 justify-center">2</Badge>
                      {t("guide.gettingStarted.webhook.title")}
                    </h3>
                    <ul className="space-y-2 pl-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.gettingStarted.webhook.step1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.gettingStarted.webhook.step2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.gettingStarted.webhook.step3")}</span>
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Adding Bot */}
              <AccordionItem value="adding-bot" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    {t("guide.addingBot.title")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Groups */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base">{t("guide.addingBot.groups.title")}</h3>
                    <ul className="space-y-2 pl-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.addingBot.groups.step1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.addingBot.groups.step2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.addingBot.groups.step3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.addingBot.groups.step4")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.addingBot.groups.step5")}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Channels */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base">{t("guide.addingBot.channels.title")}</h3>
                    <ul className="space-y-2 pl-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.addingBot.channels.step1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.addingBot.channels.step2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.addingBot.channels.step3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.addingBot.channels.step4")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.addingBot.channels.step5")}</span>
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Broadcast */}
              <AccordionItem value="broadcast" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-primary" />
                    {t("guide.broadcast.title")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-4">
                  <ul className="space-y-2 pl-8">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.broadcast.step1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.broadcast.step2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.broadcast.step3")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.broadcast.step4")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.broadcast.step5")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.broadcast.step6")}</span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Auto Reply */}
              <AccordionItem value="auto-reply" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary" />
                    {t("guide.autoReply.title")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-4">
                  <ul className="space-y-2 pl-8">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.autoReply.step1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.autoReply.step2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.autoReply.step3")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.autoReply.step4")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.autoReply.step5")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.autoReply.step6")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.autoReply.step7")}</span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Moderation */}
              <AccordionItem value="moderation" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    {t("guide.moderation.title")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Banned Words */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base">{t("guide.moderation.bannedWords.title")}</h3>
                    <ul className="space-y-2 pl-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.moderation.bannedWords.step1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.moderation.bannedWords.step2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.moderation.bannedWords.step3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.moderation.bannedWords.step4")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.moderation.bannedWords.step5")}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Auto Kick/Ban */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base">{t("guide.moderation.autoKickBan.title")}</h3>
                    <ul className="space-y-2 pl-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.moderation.autoKickBan.step1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.moderation.autoKickBan.step2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.moderation.autoKickBan.step3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.moderation.autoKickBan.step4")}</span>
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Affiliates */}
              <AccordionItem value="affiliates" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    {t("guide.affiliates.title")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Setup */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base">{t("guide.affiliates.setup.title")}</h3>
                    <ul className="space-y-2 pl-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.affiliates.setup.step1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.affiliates.setup.step2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.affiliates.setup.step3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.affiliates.setup.step4")}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Usage */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base">{t("guide.affiliates.usage.title")}</h3>
                    <ul className="space-y-2 pl-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.affiliates.usage.step1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.affiliates.usage.step2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.affiliates.usage.step3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{t("guide.affiliates.usage.step4")}</span>
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Analytics */}
              <AccordionItem value="analytics" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {t("guide.analytics.title")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-4">
                  <ul className="space-y-2 pl-8">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.analytics.step1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.analytics.step2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.analytics.step3")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{t("guide.analytics.step4")}</span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Tips & Best Practices */}
              <AccordionItem value="tips" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    {t("guide.tips.title")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-4">
                  <Alert className="border-warning/50 bg-warning/10">
                    <Lightbulb className="h-4 w-4 text-warning" />
                    <AlertDescription className="space-y-2">
                      <ul className="space-y-2 pl-4">
                        <li className="text-sm">• {t("guide.tips.tip1")}</li>
                        <li className="text-sm">• {t("guide.tips.tip2")}</li>
                        <li className="text-sm">• {t("guide.tips.tip3")}</li>
                        <li className="text-sm">• {t("guide.tips.tip4")}</li>
                        <li className="text-sm">• {t("guide.tips.tip5")}</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}