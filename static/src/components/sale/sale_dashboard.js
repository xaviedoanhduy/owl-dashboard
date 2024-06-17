/** @odoo-module */

import { registry } from "@web/core/registry";
import { KpiCard } from "./kpi_card/kpi_card";
import { ChartRenderer } from "./chart_renderer/chart_renderer";
import { useService } from "@web/core/utils/hooks";
import { formatMonetary } from "@web/views/fields/formatters";
const { Component, onWillStart, useRef, onMounted, useState } = owl;
const { DateTime } = luxon;

export class OwlSaleDashboard extends Component {
    setup() {
        this.resModel = "sale.order";

        this.state = useState({
            period: 30,
        });

        this.currentCompany = useService("company").currentCompany
        this.orm = useService("orm");
        onWillStart(async () => {
            await this.onChangePeriod();
        });
    }

    async onChangePeriod() {
        this.getDate();
        await this.getQuotationsCount();
        await this.getOrders();
    }

    getDate() {
        this.state.currentDate = DateTime.now().minus({ days: this.state.period }).toISODate()
        this.state.prevDate = DateTime.now().minus({ days: (this.state.period * 2) }).toISODate()
    }

    async getQuotationsCount() {
        const currentDomain = [["state", "in", ["draft", "sent"]]];
        if (this.state.period > 0) 
            currentDomain.push(["date_order", ">", this.state.currentDate]);
        
        const saleOrderCurrentCount = await this.orm.searchCount(this.resModel, currentDomain);
        
        let prevDomain = [["state", "in", ["draft", "sent"]]];
        let saleOrderPrevCount = 0;
        if (this.state.period > 0) {
            prevDomain.push(
                ["date_order", ">", this.state.prevDate],
                ["date_order", "<=", this.state.currentDate]
            )
            saleOrderPrevCount = await this.orm.searchCount(this.resModel, prevDomain);
        }
        const percentage = ((saleOrderCurrentCount - saleOrderPrevCount) / saleOrderPrevCount) * 100;
        this.state.quotations = {
            value: saleOrderCurrentCount,
            percentage: percentage.toFixed(2)
        }
    }

    async getOrders() {
        const currentDomain = [["state", "in", ["sale", "done"]]];
        
        if (this.state.period > 0) 
            currentDomain.push(["date_order", ">", this.state.currentDate]);
        const saleOrderCurrentCount = await this.orm.searchCount(this.resModel, currentDomain);
        
        let prevDomain = [["state", "in", ["sale", "done"]]];
        let saleOrderPrevCount = 0;
        if (this.state.period > 0) {
            prevDomain.push(
                ["date_order", ">", this.state.prevDate],
                ["date_order", "<=", this.state.currentDate]
            )
            saleOrderPrevCount = await this.orm.searchCount(this.resModel, prevDomain);
        }
        const percentage = ((saleOrderCurrentCount - saleOrderPrevCount) / saleOrderPrevCount) * 100;

        const currentRevenue = await this.orm.readGroup(
            this.resModel, 
            currentDomain,
            ["amount_total:sum"],
            []
        )
        const prevRevenue = await this.orm.readGroup(
            this.resModel, 
            prevDomain,
            ["amount_total:sum"],
            []
        )
        const revenuePercentage = (
            (currentRevenue[0]["amount_total"] - prevRevenue[0]["amount_total"])
            / prevRevenue[0]["amount_total"]
        ) * 100
        
        this.state.orders = {
            value: saleOrderCurrentCount,
            percentage: percentage.toFixed(2),
            revenue: `$${formatMonetary(currentRevenue[0]["amount_total"] / 1_000)}K`,
            revenuePercentage: revenuePercentage.toFixed(2),
        }
    }
}

OwlSaleDashboard.template = "owl_dashboard.OwlSaleDashboardTemplate";
OwlSaleDashboard.components = { KpiCard, ChartRenderer };

registry
    .category("actions")
    .add("owl_dashboard.sale_dashboard_action", OwlSaleDashboard);
