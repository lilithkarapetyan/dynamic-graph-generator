// set the dimensions and margins of the graph
const margin = { top: 24, right: 8, bottom: 16, left: 24 },
    width = 260 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

function drawLineChart({ data, containerId, xAxis, yAxis, title }) {

    // append the svg object to the body of the page
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleLinear()
        .domain([0, Math.max(...(data.map(item => item[xAxis])))])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    const y = d3.scaleLinear()
        .domain([Math.min(...(data.map(item => item[yAxis]))), Math.max(...(data.map(item => item[yAxis]))) + 10])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));
    svg.append("text")
      .attr("x", (width / 2))
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(title ? `${title}` : `${xAxis} X ${yAxis}`);

    const bisect = d3.bisector(function (d) { return d[xAxis]; }).left;

    const focus = svg
        .append('g')
        .append('circle')
        .style("fill", "black")
        .attr("stroke", "black")
        .attr('r', 2)
        .style("opacity", 0)


    // Create the text that travels along the curve of chart
    const focusText = svg
        .append('g')
        .append('text')
        .style("opacity", 0)
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle")
        .style('font-size', 12)

    // Add the line
    svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return x(d[xAxis]) })
            .y(function (d) { return y(d[yAxis]) })
        )
        .style('cursor', 'pointer')

    // Create a rect on top of the svg area: this rectangle recovers mouse position
    svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);


    // What happens when the mouse move -> show the annotations at the right positions.
    function mouseover() {
        focus.style("opacity", 1)
        focusText.style("opacity", 1)
    }

    function mousemove(event) {
        // recover coordinate we need
        const x0 = x.invert(d3.pointer(event)[0]);
        const i = bisect(data, x0, 1);
        selectedData = data[i]
        focus
            .attr("cx", x(selectedData[xAxis]))
            .attr("cy", y(selectedData[yAxis]))
        focusText
            .html(`(${selectedData[xAxis]}, ${selectedData[yAxis]})`)
            .attr("x", x(selectedData[xAxis]))
            .attr("y", y(selectedData[yAxis]) - 10)
    }

    function mouseout() {
        focus.style("opacity", 0)
        focusText.style("opacity", 0)
    }
}
