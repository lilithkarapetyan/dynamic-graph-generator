// another stolen, medium-ugly, a bit polished code

const duration = 200;
function BarPlot(data) {
  const svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 30, left: 30},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  const x = d3.scaleBand().rangeRound([0, width]).padding(0.15),
    y = d3.scaleLinear().rangeRound([height, 0]);

  const g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(data.map(item => item.index));
    y.domain([0, d3.max(data, item => item.value)]);

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
    .attr("x", item => x(item.index))
    .attr("y", item => y(item.value))
    .attr("width", x.bandwidth())
    .attr("height", item => height - y(item.value));

  function applyFilter(newData) {
    y.domain([0, d3.max(newData, item => item.value)]);

    svg.selectAll("g.axis--y")
      .transition().duration(duration)
      .call(d3.axisLeft(y));

    d3.selectAll(".bar")
      .data(newData)
      .transition().duration(duration)
      .attr("x", item => x(item.index))
      .attr("y", item => y(item.value))
      .attr("height", item => height - y(item.value));

  }

  return applyFilter;
}
