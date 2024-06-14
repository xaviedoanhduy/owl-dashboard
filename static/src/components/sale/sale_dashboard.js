/** @odoo-module */

import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";

import { KpiCard } from "./kpi_card/kpi_card";
import { ChartRenderer } from "./chart_renderer/chart_renderer";

const { Component, onWillStart, useRef, onMounted } = owl;

export class OwlSaleDashboard extends Component {
    setup() {
        this.chartRef = useRef("chart");

        onWillStart(async () => {
            await loadJS(
                "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"
            );
        });

        onMounted(() => {
            const data = [
                { year: 2010, count: 10 },
                { year: 2011, count: 20 },
                { year: 2012, count: 15 },
                { year: 2013, count: 25 },
                { year: 2014, count: 22 },
                { year: 2015, count: 30 },
                { year: 2016, count: 28 },
            ];
            new Chart(this.chartRef.el, {
                type: "doughnut",
                data: {
                    labels: ["Red", "Blue", "Yellow"],
                    datasets: [
                        {
                            label: "My First Dataset",
                            data: [300, 50, 100],
                            backgroundColor: [
                                "rgb(255, 99, 132)",
                                "rgb(54, 162, 235)",
                                "rgb(255, 205, 86)",
                            ],
                            hoverOffset: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: "top",
                        },
                        title: {
                            display: true,
                            text: "Chart.js Doughnut Chart",
                        },
                    },
                },
            });
        });
    }
}

OwlSaleDashboard.template = "owl_dashboard.OwlSaleDashboardTemplate";

OwlSaleDashboard.components = { KpiCard, ChartRenderer };

registry
    .category("actions")
    .add("owl_dashboard.sale_dashboard_action", OwlSaleDashboard);
