/** @odoo-module */

import { registry } from "@web/core/registry";
import { KpiCard } from "./kpi_card/kpi_card";
import { ChartRenderer } from "./chart_renderer/chart_renderer";
import { useService } from "@web/core/utils/hooks";
import { formatMonetary } from "@web/views/fields/formatters";
import { getColor } from "@web/core/colors/colors";
const { Component, onWillStart, useRef, onMounted, useState } = owl;
const { DateTime } = luxon;


export class OwlSaleDashboard extends Component {

    // Top products
    async getTopProducts() {
        const domain = [["state", "not in", ["draft", "cancel", "sent"]]];
        if (this.state.period > 0) 
            domain.push(["date", ">", this.state.currentDate]);

        const data = await this.orm.readGroup(
            "sale.report", 
            domain, 
            ["product_id", "price_total"], 
            ["product_id"],
            {limit: 5, orderby: "price_total DESC"}
        )
        this.state.topProducts = {
            data: {
                labels: data.map(p => p.product_id[1]),
                datasets: [
                    {
                        label: "Total",
                        data: data.map(p => p.price_total),
                        hoverOffset: 4,
                        backgroundColor: data.map(
                            (_, i) => getColor(i)
                        ),
                    },
                    {
                        label: "Count",
                        data: data.map(p => p.product_id_count),
                        hoverOffset: 4,
                        backgroundColor: data.map(
                            (_, i) => getColor(i)
                        ),
                    },
                ],
            },
            domain: domain,
            label_field: "product_id",
        }
    }

    // Top Salespeople
    async getTopSalespeople() {
        const domain = [["state", "not in", ["draft", "cancel", "sent"]]];
        if (this.state.period > 0) 
            domain.push(["date", ">", this.state.currentDate]);

        const data = await this.orm.readGroup(
            "sale.report", 
            domain, 
            ["user_id", "price_total"], 
            ["user_id"],
            {limit: 5, orderby: "price_total DESC"}
        )
        this.state.topSalespeople = {
            data: {
                labels: data.map(p => p.user_id[1]),
                datasets: [
                    {
                        label: "Total",
                        data: data.map(p => p.price_total),
                        hoverOffset: 4,
                        backgroundColor: data.map(
                            (_, i) => getColor(i)
                        ),
                    },
                ],
            },
            domain: domain,
            label_field: "user_id",
        };
    }

    // Monthly sales
    async getMonthlySales() {
        const domain = [["state", "not in", ["cancel"]]];
        if (this.state.period > 0) 
            domain.push(["date", ">", this.state.currentDate]);

        const data = await this.orm.readGroup(
            "sale.report", 
            domain, 
            ["product_id", "price_total", "date"], 
            ["date", "state"],
            {orderby: "date ASC", lazy: false}
        )
        this.state.monthlySales = {
            data: {
                labels: [... new Set(data.map(p => p.date))],
                datasets: [
                    {
                        label: "Quotations",
                        data: data.filter(
                            d => d.state === "draft" || d.state === "sent"
                        ).map(p => p.price_total),
                        hoverOffset: 4,
                        backgroundColor: "lightGreen",
                    },
                    {
                        label: "Orders",
                        data: data.filter(
                            d => ["sale", "done"].includes(d.state)
                        ).map(p => p.price_total),
                        hoverOffset: 4,
                        backgroundColor: "green",
                    },
                ],
            },
            domain: domain,
            label_field: "date",
        };
    }

    // Partners Orders
   async getPartnersOrders() {
    const domain = [["state", "not in", ["draft", "cancel", "sent"]]];
        if (this.state.period > 0) 
            domain.push(["date", ">", this.state.currentDate]);

        const data = await this.orm.readGroup(
            "sale.report", 
            domain, 
            ["partner_id", "price_total", "product_uom_qty"], 
            ["partner_id"],
            {orderby: "price_total DESC", lazy: false}
        )
        this.state.partnersOrders = {
            data: {
                labels: data.map(p => p.partner_id[1]),
                datasets: [
                    {
                        label: "Total Amount",
                        data: data.map(p => p.price_total),
                        hoverOffset: 4,
                        backgroundColor: "orange",
                        yAxisID: "total",
                        order: 1,
                    },
                    {
                        label: "Ordered Quantities",
                        data: data.map(p => p.product_uom_qty),
                        hoverOffset: 4,
                        backgroundColor: "rgb(75, 192, 192)",
                        type: "line",
                        borderColor: "rgb(75, 192, 192)",
                        yAxisID: "Quantity",
                        order: 0,
                    },
                ],
            },
            scales: {
                Quantity: {
                    position: "right",
                }
            },
            domain: domain,
            label_field: "partner_id",
        };
    }

    setup() {
        this.resModel = "sale.order";

        this.state = useState({
            period: 90,
        });

        this.currentCompany = useService("company").currentCompany;
        this.orm = useService("orm");
        this.actionService = useService("action")

        onWillStart(async () => {
            await this.onChangePeriod();
            await this.getTopProducts();
            await this.getTopSalespeople();
            await this.getMonthlySales();
            await this.getPartnersOrders();
        });
    }

    async onChangePeriod() {
        this.getDate();
        await this.getQuotationsCount();
        await this.getOrders();
        await this.getRevenue();
        await this.getAverage();
    }

    getDate() {
        this.state.currentDate = DateTime.now().minus({ days: this.state.period }).toISODate()
        this.state.prevDate = DateTime.now().minus({ days: (this.state.period * 2) }).toISODate()
    }

    async getQuotationsCount() {
        // Quotations block
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
        const currentDomain = [["state", "not in", ["draft", "cancel", "sent"]]];
        
        // Orders block
        if (this.state.period > 0) 
            currentDomain.push(["date_order", ">", this.state.currentDate]);
        const saleOrderCurrentCount = await this.orm.searchCount(this.resModel, currentDomain);
        
        let prevDomain = [["state", "not in", ["draft", "cancel", "sent"]]];
        let saleOrderPrevCount = 0;
        if (this.state.period > 0) {
            prevDomain.push(
                ["date_order", ">", this.state.prevDate],
                ["date_order", "<=", this.state.currentDate]
            )
            saleOrderPrevCount = await this.orm.searchCount(this.resModel, prevDomain);
        }
        const percentage = ((saleOrderCurrentCount - saleOrderPrevCount) / saleOrderPrevCount) * 100;

        this.state.orders = {
            value: saleOrderCurrentCount,
            percentage: percentage.toFixed(2),
        }
    }

    async getRevenue() {
        // Revenue block
        const currentDomain = [["state", "not in", ["draft", "cancel", "sent"]]];
        if (this.state.period > 0) 
            currentDomain.push(["date_order", ">", this.state.currentDate]);

        let prevDomain = [["state", "not in", ["draft", "cancel", "sent"]]];
        if (this.state.period > 0) {
            prevDomain.push(
                ["date_order", ">", this.state.prevDate],
                ["date_order", "<=", this.state.currentDate]
            )
        }
        const currentRevenue = await this.orm.readGroup(
            this.resModel, 
            currentDomain,
            ["amount_total:sum", "amount_tax:sum"],
            []
        )
        const prevRevenue = await this.orm.readGroup(
            this.resModel, 
            prevDomain,
            ["amount_total:sum", "amount_tax:sum"],
            []
        )
        const revenuePercentage = (
            (
                (currentRevenue[0]["amount_total"] - currentRevenue[0]["amount_tax"]) 
                - (prevRevenue[0]["amount_total"] - prevRevenue[0]["amount_tax"])
            ) / prevRevenue[0]["amount_total"]
        ) * 100
        
        this.state.revenue = {
            value: `$${formatMonetary(
                (currentRevenue[0]["amount_total"] - currentRevenue[0]["amount_tax"]) 
                / 1_000
            )}K`,
            percentage: revenuePercentage.toFixed(2),
        }
    }  
    
    async getAverage() {
        // Average block
        const currentDomain = [["state", "not in", ["draft", "cancel", "sent"]]];
        if (this.state.period > 0) 
            currentDomain.push(["date_order", ">", this.state.currentDate]);

        let prevDomain = [["state", "not in", ["draft", "cancel", "sent"]]];
        if (this.state.period > 0) {
            prevDomain.push(
                ["date_order", ">", this.state.prevDate],
                ["date_order", "<=", this.state.currentDate]
            )
        }
        const currenAvg = await this.orm.readGroup(
            this.resModel, 
            currentDomain,
            ["amount_total:avg", "amount_tax:avg"],
            []
        )
        const prevAvg = await this.orm.readGroup(
            this.resModel, 
            prevDomain,
            ["amount_total:avg", "amount_tax:avg"],
            []
        )
        const avgPercentage = (
            (currenAvg[0]["amount_total"] - prevAvg[0]["amount_total"])
            / prevAvg[0]["amount_total"]
        ) * 100

        this.state.average = {
            value: `$${formatMonetary(
                (currenAvg[0]["amount_total"] - currenAvg[0]["amount_tax"])
                / 1_000
                )}K`,
            percentage: avgPercentage.toFixed(2),
        }
    }

    async viewQuotations() {
        const domain = [["state", "in", ["draft", "sent"]]];
        if (this.state.period > 0) 
            domain.push(["date_order", ">", this.state.currentDate]);

        const listView = await this.orm.searchRead(
            "ir.model.data",
            [["name", "=", "view_quotation_tree_with_onboarding"]],
            ["res_id"]
        )
        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Quotations",
            res_model: this.resModel,
            domain: domain,
            views: [
                [listView.length > 0 ? listView[0].res_id : false, "list"],
                [false, "form"],
                [false, "graph"],
                [false, "pivot"],
                [false, "kanban"],
            ]
        });
    }

    viewOrders() {
        const domain = [["state", "not in", ["draft", "sent", "cancel"]]];
        if (this.state.period > 0) 
            domain.push(["date_order", ">", this.state.currentDate]);

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Orders",
            res_model: this.resModel,
            domain: domain,
            context: {
                group_by: ["date_order"]
            },
            views: [
                [false, "list"],
                [false, "form"],
                [false, "graph"],
                [false, "pivot"],
                [false, "kanban"],
            ]
        });
    }

    async viewRevenues() {
        const domain = [["state", "not in", ["draft", "sent", "cancel"]]];
        if (this.state.period > 0) 
            domain.push(["date_order", ">", this.state.currentDate]);
        const pivotView = await this.orm.searchRead(
            "ir.model.data",
            [["name", "=", "owl_sale_order_revenue_pivot"]],
            ["res_id"]
        )
        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Revenues",
            res_model: this.resModel,
            domain: domain,
            views: [
                [pivotView.length > 0 ? pivotView[0].res_id : false, "pivot"],
            ]
        });
    }

    async viewAverage() {
        this.actionService.doAction("spreadsheet_dashboard.ir_actions_dashboard_action", {})
    }

}

OwlSaleDashboard.template = "owl_dashboard.OwlSaleDashboardTemplate";
OwlSaleDashboard.components = { KpiCard, ChartRenderer };

registry
    .category("actions")
    .add("owl_dashboard.sale_dashboard_action", OwlSaleDashboard);
