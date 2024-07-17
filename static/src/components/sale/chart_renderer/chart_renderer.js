/** @odoo-module */

import { loadJS } from "@web/core/assets";
import { useService } from "@web/core/utils/hooks";
const { Component, onWillStart, useRef, onMounted } = owl;
const { DateTime } = luxon;


export class ChartRenderer extends Component {
    setup() {
        this.chartRef = useRef("chart");
        this.actionService = useService("action");

        onWillStart(async () => {
            await loadJS(
                "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"
            );
        });

        onMounted(() => this.rendererChart());
    }

    rendererChart() {
        new Chart(this.chartRef.el, {
            type: this.props.type,
            data: this.props.config.data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom",
                    },
                    title: {
                        display: true,
                        text: `${this.props.type.charAt(0).toUpperCase() + this.props.type.slice(1)} ${this.props.title} report`,
                        position: "bottom",
                    },
                },
                scales: "scales" in this.props.config ? this.props.config.scales : {},
                onClick: (e) => {
                    const active = e.chart.getActiveElements();
                    
                    if (active) {
                        const label = e.chart.data.labels[active[0].index];
                        // const dataset = e.chart.data.datatsets[active[0]].label;
                        const { label_field, domain } = this.props.config;
                        const currentDomain = domain ? domain : [];

                        if (label_field) {
                            if (label_field.includes("date")) {
                                const selectedMonth = DateTime.fromISO(label);
                                const monthStart = selectedMonth.startOf("month").toISODate();
                                const monthEnd = selectedMonth.endOf("month").toISODate();
                                currentDomain.push(
                                    ["date", ">=", monthStart],
                                    ["date", "<=", monthEnd],
                                )
                            } else
                                currentDomain.push([label_field, "=", label])
                        }

                        // if (dataset === "Quotations") 
                        //     currentDomain.push(["state", "in", ["draft", "sent"]])
                        // if (dataset === "orders") 
                        //     currentDomain.push(["state", "not in", ["draft", "sent", "cancel"]])

                        this.actionService.doAction({
                            type: "ir.actions.act_window",
                            name: `${this.props.title} for "${label_field} = ${label}"`,
                            res_model: "sale.report",
                            domain: currentDomain,
                            views: [
                                [false, "list"],
                                [false, "form"],
                            ],
                        });
                    }
                }
            },
        });
    }
}

ChartRenderer.template = "owl_dashboard.ChartRenderer";
