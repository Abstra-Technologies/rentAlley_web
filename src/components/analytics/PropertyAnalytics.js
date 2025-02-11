import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const PropertyAnalytics = ({ data }) => {
    const barChartRef = useRef(null);
    const [propertyData, setPropertyData] = useState([]);

    useEffect(() => {
        fetch("/api/analytics/getPropertyTypes") // Fetch data from API
            .then(res => res.json())
            .then(data => {
                setPropertyData(data.propertyTypes);
                drawBarChart(data.propertyTypes);
            })
            .catch(error => console.error("Error fetching data:", error));
    }, []);


    const drawBarChart = (data) => {
        const svg = d3.select(barChartRef.current)
            .attr("width", 500)
            .attr("height", 300);

        const margin = { top: 20, right: 20, bottom: 50, left: 50 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        svg.selectAll("*").remove();

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand()
            .domain(data.map(d => d.type))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .range([height, 0]);

        chart.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.type))
            .attr("y", d => yScale(d.count))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.count))
            .attr("fill", "#4CAF50");

        chart.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        chart.append("g")
            .call(d3.axisLeft(yScale));
    };

    return (
        <div>
            <h2>Property Listings by Type</h2>
            <svg ref={barChartRef}></svg>
        </div>
    );
};

export default PropertyAnalytics;
