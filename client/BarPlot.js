// another stolen, medium-ugly, a bit polished code

function BarPlot({data, xAxis, yAxis, containerId, title  }) {
  const margin = { top: 24, right: 8, bottom: 16, left: 24 },
    width = window.innerWidth / 2 - 50 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

  const svg = d3.select(`#${containerId}`).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  const x = d3.scaleBand()
    .domain([0, Math.max(...(data.map(item => item[xAxis])))])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([Math.min(...(data.map(item => item[yAxis]))), Math.max(...(data.map(item => item[yAxis]))) + 10])
    .range([height, 0]);


  x.domain(data.map(item => item[xAxis]));
  y.domain([-1, d3.max(data, item => item[yAxis])]);

  svg.append("text")
    .attr("x", (width / 2))
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text(title ? `${title}` : `${xAxis} X ${yAxis}`);

  const g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))

  g.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end");

  g.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", item => x(item[xAxis]))
    .attr("y", item => y(item[yAxis]))
    .attr("width", x.bandwidth())
    .attr("height", item => height - y(item[yAxis]))
    // .append('g')
    .append('text')
    .attr("class", "bar-tooltip")
    .style("opacity", 1)
    .attr("text-anchor", "left")
    .attr("alignment-baseline", "middle")
    .style('font-size', 12)

  // const bisect = d3.bisector(function (d) { return d[xAxis]; }).left;
  //
  // const focus = svg
  //   .append('g')
  //   .append('circle')
  //   .style("fill", "black")
  //   .attr("stroke", "black")
  //   .attr('r', 2)
  //   .style("opacity", 0)
  //
  // // Create the text that travels along the curve of chart
  // const focusText = svg
  //   .append('g')
  //   .append('text')
  //   .style("opacity", 0)
  //   .attr("text-anchor", "left")
  //   .attr("alignment-baseline", "middle")
  //   .style('font-size', 12)
  // // Create a rect on top of the svg area: this rectangle recovers mouse position
  // svg
  //   .append('rect')
  //   .style("fill", "none")
  //   .style("pointer-events", "all")
  //   .attr('width', width)
  //   .attr('height', height)
  //   .on('mouseover', mouseover)
  //   .on('mousemove', mousemove)
  //   .on('mouseout', mouseout);
  //
  //
  // // What happens when the mouse move -> show the annotations at the right positions.
  // function mouseover() {
  //   focus.style("opacity", 1)
  //   focusText.style("opacity", 1)
  // }
  //
  // function mousemove(event) {
  //   // recover coordinate we need
  //   // const x0 = console.logd3.pointer(event)[0]);
  //   // const i = bisect(data, x0, 1);
  //   console.log(d3.pointer(event)[0]);
  //   selectedData = data[10]
  //   focus
  //     .attr("cx", x(selectedData[xAxis]))
  //     .attr("cy", y(selectedData[yAxis]))
  //   focusText
  //     .html(`(${selectedData[xAxis]}, ${selectedData[yAxis]})`)
  //     .attr("x", x(selectedData[xAxis]))
  //     .attr("y", y(selectedData[yAxis]) - 10)
  // }
  //
  // function mouseout() {
  //   focus.style("opacity", 0)
  //   focusText.style("opacity", 0)
  // }
}
