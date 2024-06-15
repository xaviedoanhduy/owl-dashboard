/** @odoo-module */

import { registry } from "@web/core/registry";
import { KpiCard } from "./kpi_card/kpi_card";
import { ChartRenderer } from "./chart_renderer/chart_renderer";
import { useService } from "@web/core/utils/hooks";

const { Component, onWillStart, useRef, onMounted, useState } = owl;
const { DateTime } = luxon;

export class OwlSaleDashboard extends Component {
    setup() {
        this.state = useState({
            quotations: {
                value: 10,
                percentage: 30,
            },
            period: "all",
            currentDate: DateTime.now(),
            prevDate: null
        });

        this.orm = useService("orm");

        onWillStart(async () => {
            await this.onchagePeriod();
        });
    }

    async onchagePeriod() {
        this.getDate();
        await this.getQuotationsCount();
    }

    getDate() {
        switch (this.state.period) {
            case "today":
                this.state.prevDate = this.state.currentDate.startOf("day");
                break;
            case "sevenDays":
                this.state.prevDate = this.state.currentDate.minus({ days: 7 });
                break;
            case "thisMonth":
                this.state.prevDate = this.state.currentDate.startOf("month");
                break;
            case "thisYear":
                this.state.prevDate = this.state.currentDate.startOf("year");
                break;
            case "threeMonth":
                this.state.prevDate = this.state.currentDate.minus({ months: 3 });
                break;
            default:
                this.state.prevDate = null;
                return;
        }
    }

    async getQuotationsCount() {
        const currentDomain = [["state", "in", ["draft", "sent"]]];
        if (this.state.period !== "all" && this.state.prevDate) {
            currentDomain.push(
                ["date_order", ">=", this.state.prevDate.toISODate()],
                ["date_order", "<", this.state.currentDate.toISODate()]
            );
        }
        const saleOrderCurrentCount = await this.orm.searchCount("sale.order", currentDomain);
        this.state.quotations.value = saleOrderCurrentCount;
        
        let saleOrderPrevCount = 0;
        if (this.state.period !== "all" && this.state.prevDate) {
            const prevDomain = [
                ["state", "in", ["draft", "sent"]],
                ["date_order", "<", this.state.prevDate.toISODate()]
            ];
            saleOrderPrevCount = await this.orm.searchCount("sale.order", prevDomain);
        }

        if (saleOrderPrevCount > 0) {
            const percentage = ((saleOrderCurrentCount - saleOrderPrevCount) / saleOrderPrevCount) * 100;
            this.state.quotations.percentage = percentage;
        } else {
            this.state.quotations.percentage = 0;
        }
    }
}

OwlSaleDashboard.template = "owl_dashboard.OwlSaleDashboardTemplate";
OwlSaleDashboard.components = { KpiCard, ChartRenderer };

registry
    .category("actions")
    .add("owl_dashboard.sale_dashboard_action", OwlSaleDashboard);
