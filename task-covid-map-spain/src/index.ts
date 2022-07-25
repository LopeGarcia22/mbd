import * as d3 from "d3";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
const d3Composite = require("d3-composite-projections");
import { march2020data, july2021data, july2022data, ResultsEntry } from "./stats";
import { latLongCommunities } from "./communities";

const canvasSize = {width:1024, height:800};

const aProjection = d3Composite
.geoConicConformalSpain()
.scale(3300)
.translate([625, 400]);

const geoPath = d3.geoPath().projection(aProjection);

const geojson = topojson.feature(spainjson, spainjson.objects.ESP_adm1);

aProjection.fitSize([canvasSize.width, canvasSize.height], geojson);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", canvasSize.width)
  .attr("height", canvasSize.height)
  .attr("style", "background-color: #FBFAF0");

svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  // use geoPath to convert the data into the current projection
  // https://stackoverflow.com/questions/35892627/d3-map-d-attribute
  .attr("d", geoPath as any);

const calculateMaxAffected = (dataset: ResultsEntry[]) => {
  return dataset.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0
  );
};
  
const calculateAffectedRadiusScale =  (maxAffected: number) => {
  return d3.scaleLinear().domain([0, maxAffected]).range([0, 35]);
};
  
const calculateRadiusBasedOnAffectedCases = (comunidad: string, dataset: ResultsEntry[]) => 
{
  const maxAffected = calculateMaxAffected(dataset);
  const affectedRadiusScale = calculateAffectedRadiusScale(maxAffected);
  const entry = dataset.find((item) => item.name === comunidad);
  const adder = d3
    .scaleThreshold<number, number>()
    .domain([50000, 100000, 500000, 1000000, 5000000])
    .range([0.2, 0.4, 2, 4, 20]);
  
  return entry ? affectedRadiusScale(entry.value) + adder(maxAffected) : 0;
};

svg
  .selectAll("circle")
  .data(latLongCommunities)
  .enter()
  .append("circle")
  .attr("class", "affected-marker")
  .attr("cx", (d) => aProjection([d.long, d.lat])[0])
  .attr("cy", (d) => aProjection([d.long, d.lat])[1])
  .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name, march2020data));

const updateChart = (dataset: ResultsEntry[]) => {
  svg
    .selectAll("circle")
    .data(latLongCommunities)
    .attr("class", "affected-marker")
    .attr("cx", (d) => aProjection([d.long, d.lat])[0])
    .attr("cy", (d) => aProjection([d.long, d.lat])[1])
    .transition()
    .duration(1000)
    .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name, dataset));
};
  

document
.getElementById("march2020")
.addEventListener("click", function handleInitialStats() {
  updateChart(march2020data);
});

document
.getElementById("july2021")
.addEventListener("click", function handleFinalStats() {
  updateChart(july2021data);
});

document
.getElementById("july2022")
.addEventListener("click", function handleFinalStats() {
  updateChart(july2022data);
});