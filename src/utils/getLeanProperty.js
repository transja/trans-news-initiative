import { browser } from "$app/environment";
import getValueFromCSSVar from "./getValueFromCSSVar.js";

export const leanOrder = ["left", "lean left", "center", "lean right", "right"];

export const leanColors = {
	left: "#17414C",
	"lean left": "#317F94",
	center: browser ? getValueFromCSSVar("--color-gray-300") : "#efefef",
	"lean right": "#F78686",
	right: "#E61C51",
	unknown: "#E6E6E6"
};

export const leanTextColors = {
	left: "#fff",
	"lean left": "#fff",
	center: "#000",
	"lean right": "#000",
	right: "#fff",
	unknown: "#000"
};